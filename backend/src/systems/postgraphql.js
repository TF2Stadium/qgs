import {createService} from 'ineedthis';
import db from './db';
import configuration from './config';
import {postgraphql} from 'postgraphql';

export default createService('qgs/postgraphql', {
  dependencies: [db],
  start: () => async ({
    [db.serviceName]: pool,
    [configuration.serviceName]: {isDev},
  }) => {
    return postgraphql(pool, 'public', {
      graphqlRoute: '/api/graphql',
      graphiql: isDev,
      graphiqlRoute: '/api/graphiql',
    });
  },
});
