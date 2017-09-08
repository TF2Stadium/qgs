import {createService} from 'ineedthis';
import {isEmpty} from 'ramda';
import dbService from './db';
import postgraphqlService from './postgraphql';
import ms from 'ms';
import configurationService from './config';
import {tx, oneOrNone} from '../dbHelpers';
import express, {Router} from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import createDebug from 'debug';
import cookieParser from 'cookie-parser';
import WebSocket from 'ws';
import http from 'http';
import url from 'url';
import jwtMiddleware from 'express-jwt';
import jwt from 'jsonwebtoken';
import {Passport} from 'passport';
import {Strategy as SteamStrategy} from 'passport-steam';
import {startServer, stopServer} from '../routes/server';
import * as most from 'most';
const debug = createDebug('backend');

import { graphql } from 'graphql';
import {parse, print} from 'graphql/language';
import {createPostGraphQLSchema, withPostGraphQLContext} from 'postgraphql';

const withDb = pool => async (req, res, next) => {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    next(e);
  }

  try {
    req.db = client;
    next();
  } finally {
    client.release();
  }
};

// simple wrapper for routes using promises/async/await
const p = routeFn => (req, res, next) => routeFn(req, res, next).catch(next);

export default createService('qgs/server', {
  dependencies: [dbService, configurationService, postgraphqlService],
  start: () => ({
    [dbService.serviceName]: pool,
    [configurationService.serviceName]: env,
    [postgraphqlService.serviceName]: postgraphql,
  }) => createServer(pool, env, postgraphql),
  stop: listener => new Promise(resolve => listener.close(resolve)),
});

async function createServer(pool, env, postgraphql) {
  const schema = await createPostGraphQLSchema(pool);
  function dographql(query, variables) {
    return withPostGraphQLContext({pgPool: pool}, (context) => {
      return graphql(schema, query, null, context, variables);
    });
  }

  const app = express();

  const strat = new SteamStrategy({
    returnURL: `${env.publicHostname}/api/authorize/return`,
    realm: env.publicHostname,
    apiKey: env.steamApiKey
  }, (identifier, profile, done) => done(null, {identifier, profile}));
  const passport = new Passport();
  passport.use('steam', strat);
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(morgan('dev'));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(jwtMiddleware({
    issuer: env.jwt.issuer,
    secret: env.jwt.secret,
    getToken: req => req.cookies[env.jwt.cookieName],
  }).unless({
    path: [
      '/api/authorize',
      '/api/authorize/return',
      '/api/authorize/mock',
      '/api/graphiql',
      '/api/graphql',
      '/api/graph2',
      /\/_postgraphql\/.*/,
      /\/api\/pql\/.*/
    ]
  }));
  app.use(passport.initialize());

  app.use((req, res, next) => {
    if (req.url.startsWith('/api/graph2')) {
      req.url = req.url.replace(/^\/api\/graph2/, '/api/graphql');

      let {query} = req.body;
      if (query) {
        query = parse(query);

        console.log(query);
        query.definitions.forEach(q => {
          if (q.operation === 'mutation' && q.name) {
            const {value: name} = q.name;
            console.log('mutation: ', name);
          } else if (q.operation === 'subscription') {
            q.operation = 'query';
            if (isEmpty(q.variableDefinitions)) {
              q.variableDefinitions= null;
            }
          }
        });

        req.body.query = print(query);
      }
    }
    next();
  });
  app.use(postgraphql);

  app.use('/api', createRouter(pool, env, passport));

  if (env.isProd) {
    app.use((err, req, res, next) => {
      res.status(403).send('Forbidden');
      next();
    });
  }

  const dbListener = await pool.connect();
  const s1 = most.fromEvent('notification', dbListener);
  s1.forEach(notif => {
    debug('db notif', notif);
  });
  const s = s1.map(notif => JSON.parse(notif.payload));
  await dbListener.query('LISTEN table_update;');

  const server = http.createServer(app);
  const wss = new WebSocket.Server({server});

  wss.on('connection', function connection(ws, req) {
    const location = url.parse(req.url, true),
      interests = {};

    ws.on('message', message => {
      let req;
      try {
        req = JSON.parse(message);
      } catch (e) {
        return; // meh
      }
      console.log('received: %s', req);
      if (req.listenTable) {
        interests[req.uuid] = {
          filter: row => {
            return true;
          },
          query: req.query,
          uuid: req.uuid,
          variables: req.variables,
        };
      } else if (req.stopListening) {
        delete interests[req.uuid];
      }
    });

    const sub = s.subscribe({
      next(val) {
        Promise.all(
          Object
            .values(interests)
            .filter(({filter}) => filter(val))
            .map(async ({query, uuid, variables}) => {
              const result = await dographql(query, variables);
              ws.send(JSON.stringify({
                uuid, result
              }));
            })
        );
      },
    });

    ws.on('close', () => {debug('ws closed'); sub.unsubscribe();});
  });

  const listener = await new Promise(resolve => {
    const s = server.listen(env.port, () => resolve(s));
  });
  debug(`Listening on ${env.port}`);
  return listener;
}

function createRouter(pool, env, passport) {
  const router = Router({mergeParams: true});

  router.get('/authorize', passport.authenticate('steam'));

  router.get(
    '/authorize/return',
    passport.authenticate('steam', { failureRedirect: '/login' }),
    withDb(pool),
    p(async (req, res) => {
      const {db} = req,
        profile = req.user.profile._json,
        {steamid} = profile;

      const user = await tx(db, async () => {
        const user = await oneOrNone(db.query(`
SELECT * FROM person WHERE steamid=$1
`, [steamid]));

        if (!user) {
          const newUser = await oneOrNone(db.query(`
INSERT INTO person (steamid, profile) VALUES ($1, $2) RETURNING *
`, [steamid, JSON.stringify(profile)]));
          return newUser;
        }

        return user;
      });

      if (!user) {
        throw new Error('Error signing up', steamid, profile);
      }

      res.cookie('qgs-logged-in', 'true', {maxAge: ms('3 days')});
      res.cookie(
        env.jwt.cookieName,
        jwt.sign({id: user.id}, env.jwt.secret, {
          expiresIn: '3 days',
          issuer: env.jwt.issuer
        }),
        { maxAge: ms('3 days'), httpOnly: true }
      );

      res.redirect('/');
    })
  );

  if (env.isDev) {
    router.get('/authorize/mock', p(async (req, res) => {
      const uid = parseInt(req.query.id, 10);

      res.cookie('qgs-logged-in', 'true', {maxAge: ms('3 days')});
      res.cookie(
        env.jwt.cookieName,
        jwt.sign({id: uid}, env.jwt.secret, {
          expiresIn: '3 days',
          issuer: env.jwt.issuer
        }),
        {maxAge: ms('3 days'), httpOnly: true}
      );

      res.redirect('/');
    }));
  }

  router.get('/authorize/logout', (req, res) => {
    res.clearCookie('qgs-logged-in');
    res.clearCookie(env.jwt.cookieName);
    res.redirect('/');
  });

  router.post('/server/:id/start', withDb(pool), p(startServer));
  router.post('/server/:id/stop', withDb(pool), p(stopServer));

  router.use('/user', ({user}, res) => res.send(user));

  router.use((req, res) => res.status(404).send('Not found'));

  return router;
}
