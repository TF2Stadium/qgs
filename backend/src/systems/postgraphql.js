/* @flow */
import {createService} from 'ineedthis';
import db from './db';
import configuration from './config';
import {postgraphql} from 'postgraphql';
import {createPostGraphQLSchema} from 'postgraphql';

const postgraphqlService = createService('qgs/postgraphql', {
  dependencies: [db, configuration],
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
export default postgraphqlService;

export const schemaService = createService('qgs/postgraphql-schema', {
  dependencies: [db],
  start: () => async ({
    [db.serviceName]: pool,
  }) => {
    return createPostGraphQLSchema(pool);
  },
});
