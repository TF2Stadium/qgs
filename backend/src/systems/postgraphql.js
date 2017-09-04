import {createService} from 'ineedthis';
import configuration from './config';
import db from './db';
import {postgraphql} from 'postgraphql';

export default createService('qgs/postgraphql', {
  dependencies: [configuration, db],
  start: () => async ({
    [configuration.serviceName]: {isDev, postgres: postgresConfig},
    [db.serviceName]: postgres,
  }) => {
    return postgraphql(postgresConfig, 'public', {
      graphqlRoute: '/api/graphql',
      graphiql: isDev,
      graphiqlRoute: '/api/graphiql',
    });
  },
});
