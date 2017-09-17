/* @flow */
import {createService} from 'ineedthis';
import {compose, propOr} from 'ramda';

const strEnv = (name, def) =>
    propOr(propOr(def, name, process.env), `QGS_${name}`, process.env),
  int = s => parseInt(s, 10),
  intEnv = compose(int, strEnv);

const nodeEnv = strEnv('NODE_ENV', 'development'),
  publicHostname = strEnv('PUBLIC_HOSTNAME', 'http://localhost:3000'),
  postgres = {
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
  jobqueuePostgres = {
    // Compare to the config options here:
    //  https://node-postgres.com/api/pool
    host: strEnv('PG_JOBS_HOST', postgres.host),
    port: intEnv('PG_JOBS_PORT', postgres.port),
    database: strEnv('PG_JOBS_DB', postgres.database),
    user: strEnv('PG_JOBS_USER', postgres.user),
    password: strEnv('PG_JOBS_PASSWORD', postgres.password),
    max: intEnv('PG_JOBS_CONNECTIONS', postgres.max),
    idleTimeoutMillis: intEnv('PG_JOBS_IDLE_TIMEOUT', postgres.idleTimeoutMillis),
  },
  gce = {
    projectId: strEnv('GCE_PROJECT_ID', ''),
    keyFilename: strEnv('GCE_KEY_FILENAME', ''),
    tf2Image: strEnv('GCE_TF2_IMAGE', ''),
  };

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
    postgres,
    jobqueuePostgres,
    gce,
  }),
});
