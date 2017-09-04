import {createService} from 'ineedthis';
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
import * as most from 'most';
const debug = createDebug('backend');

// simple wrapper for routes using promises/async/await
const p = routeFn => (req, res, next) => routeFn(req, res, next).catch(next);

export default createService('qgs/server', {
  dependencies: [dbService, configurationService, postgraphqlService],
  start: () => ({
    [dbService.serviceName]: db,
    [configurationService.serviceName]: env,
    [postgraphqlService.serviceName]: postgraphql,
  }) => createServer(db, env, postgraphql),
  stop: listener => new Promise(resolve => listener.close(resolve)),
});

async function createServer(db, env, postgraphql) {
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
      '/api/graphiql',
      '/api/graphql',
      /\/_postgraphql\/.*/,
      /\/api\/pql\/.*/
    ]
  }));
  app.use(passport.initialize());
  app.use(postgraphql);
  app.use('/api', createRouter(db, env, passport));

  if (env.isProd) {
    app.use((err, req, res, next) => {
      res.status(403).send('Forbidden');
      next();
    });
  }

  const s = most.fromEvent('notification', db);
  s.forEach(notif => {
    debug('db notif', notif);
  });
  await db.query('LISTEN watchers');

  const server = http.createServer(app);
  const wss = new WebSocket.Server({server});

  wss.on('connection', function connection(ws, req) {
    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    const sub = s.subscribe({
      next(val) {
        ws.send(JSON.stringify(val));
      },
    });

    ws.send('something');

    ws.on('close', () => {debug('ws closed'); sub.unsubscribe();});
  });

  const listener = await new Promise(resolve => {
    const s = server.listen(env.port, () => resolve(s));
  });
  debug(`Listening on ${env.port}`);
  return listener;
}

function createRouter(db, env, passport) {
  const router = Router({mergeParams: true});

  router.get('/authorize', passport.authenticate('steam'));

  router.get(
    '/authorize/return',
    passport.authenticate('steam', { failureRedirect: '/login' }),
    p(async (req, res) => {
      const profile = req.user.profile._json,
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
        jwt.sign({
          uid: 1,
          profile: req.user.profile._json.steamid
        }, env.jwt.secret, {
          expiresIn: '3 days',
          issuer: env.jwt.issuer
        }),
        { maxAge: ms('3 days'), httpOnly: true }
      );

      res.redirect('/');
    })
  );

  router.get('/authorize/logout', (req, res) => {
    res.clearCookie('qgs-logged-in');
    res.clearCookie(env.jwt.cookieName);
    res.redirect('/');
  });

  router.use('/user', ({user}, res) => res.send(user));

  router.use((req, res) => res.status(404).send('Not found'));

  return router;
}
