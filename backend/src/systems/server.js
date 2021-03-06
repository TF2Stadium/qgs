import {createService} from 'ineedthis';
import {isEmpty} from 'ramda';
import dbService, {dbListenerService} from './db';
import postgraphqlService, {schemaService} from './postgraphql';
import ms from 'ms';
import configurationService from './config';
import jobqueueService from './jobqueue';
import gceService from './gce';
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
import {graphql} from 'graphql';
import {parse, print} from 'graphql/language';
import {withPostGraphQLContext} from 'postgraphql';
import * as most from 'most';
import killable from 'killable';
const debug = createDebug('backend');

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
  dependencies: [
    configurationService,
    dbService, dbListenerService,
    postgraphqlService, schemaService,
    gceService, jobqueueService
  ],
  start: () => async ({
    [dbService.serviceName]: {pool},
    [dbListenerService.serviceName]: listener,
    [configurationService.serviceName]: env,
    [postgraphqlService.serviceName]: postgraphql,
    [jobqueueService.serviceName]: jobqueue,
    [gceService.serviceName]: gce,
    [schemaService.serviceName]: postgraphqlSchema
  }) => createServer(pool, env, postgraphql, jobqueue, gce, postgraphqlSchema, listener),
  async stop({server, closeWSS}) {
    debug('Stopping...');
    closeWSS();
    debug('Stopped WS...');
    await new Promise(resolve => {
      server.kill(() => {
        resolve();
      });
    });
    debug('Stopped');
  }
});

async function createServer(
  pool, env, postgraphql, jobqueue, gce, schema, dbListener
) {
  debug('Starting...');
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

        query.definitions.forEach(q => {
          if (q.operation === 'mutation' && q.name) {
            const {value: name} = q.name;
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

  app.use('/api', createRouter(pool, env, passport, jobqueue, gce));

  if (env.isProd) {
    app.use((err, req, res, next) => {
      res.status(403).send('Forbidden');
      next();
    });
  }

  debug('connecting to pool...');
  const s1 = most.fromEvent('notification', dbListener);
  s1.forEach(notif => {
    debug('db notif', notif);
  });
  const s = s1.map(notif => JSON.parse(notif.payload));
  await dbListener.query('LISTEN table_update;');

  const server = http.createServer(app);
  const wss = new WebSocket.Server({server});
  const clients = new Set();
  function closeWSS() {
    clients.forEach(c => c.close(1012, 'Server shutting down'));
  }

  function createFilter(listenTable, listenIds) {
    return ({table, id, new: newRow}) => {
      if (table !== listenTable) {
        return false;
      }

      if (Array.isArray(listenIds) && listenIds.includes(id)) {
        return true;
      }

      if (!Array.isArray(listenIds)) {
        for (const k of Object.keys(listenIds)) {
          if (Array.isArray(listenIds[k]) && listenIds[k].includes(newRow[k])) {
            return true;
          }
        }
      }

      return false;
    };
  }

  wss.on('connection', function connection(ws, req) {
    const location = url.parse(req.url, true),
      interests = {};

    clients.add(ws);

    ws.on('message', message => {
      let req;
      try {
        req = JSON.parse(message);
      } catch (e) {
        return; // meh
      }
      if (req.listenTable) {
        interests[req.uuid] = {
          filter: createFilter(req.listenTable, req.listenIds),
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
              ws.send(JSON.stringify({uuid, result}));
            })
        );
      },
    });

    ws.on('close', () => {
      debug('ws closed');
      clients.delete(ws);
      sub.unsubscribe();
    });
  });

  await new Promise(resolve => {
    server.listen(env.port, () => resolve());
  });
  debug(`Listening on ${env.port}`);
  return {server: killable(server), closeWSS};
}

function createRouter(pool, env, passport, jobqueue, gce) {
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

  router.use((req, res, next) => {
    req.jobqueue = jobqueue;
    req.gce = gce;
    next();
  });

  router.post('/server/:id/start', withDb(pool), p(startServer));
  router.post('/server/:id/stop', withDb(pool), p(stopServer));

  router.use('/user', ({user}, res) => res.send(user));

  router.use((req, res) => res.status(404).send('Not found'));

  return router;
}
