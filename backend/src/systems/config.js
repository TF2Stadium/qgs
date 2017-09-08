import {createService} from 'ineedthis';
import {compose, propOr} from 'ramda';

const strEnv = (name, def) =>
    propOr(propOr(def, name, process.env), `QGS_${name}`, process.env),
  int = s => parseInt(s, 10),
  intEnv = compose(int, strEnv);

const nodeEnv = strEnv('NODE_ENV', 'development'),
  publicHostname = strEnv('PUBLIC_HOSTNAME', 'http://localhost:3000');

export default createService('qgs/configuration', {
  dependencies: [],
  start: () => () => ({
    nodeEnv,
    isProd: nodeEnv === 'production',
    isDev: nodeEnv === 'development',
    port: intEnv('PORT', 8080),
    jwt: {
      issuer: strEnv('JWT_ISSUER', publicHostname),
      secret: new Buffer(strEnv('JWT_SECRET', 'AAAAAAAAA'), 'base64'),
      cookieName: strEnv('JWT_COOKIE_NAME', 'auth-jwt'),
    },
    publicHostname,
    steamApiKey: strEnv('STEAM_API_KEY', ''),
    postgres: {
      // Compare to the config options here:
      //  https://node-postgres.com/api/pool
      host: strEnv('PG_HOST', 'localhost'),
      port: intEnv('PG_PORT', 5432),
      database: strEnv('PG_DB', 'qgs'),
      user: strEnv('PG_USER', 'admin'),
      password: strEnv('PG_PASSWORD', ''),
      max: intEnv('PG_CONNECTIONS', 10),
      idleTimeoutMillis: intEnv('PG_IDLE_TIMEOUT', 0),
    },
  }),
});
