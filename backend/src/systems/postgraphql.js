/* @flow */
import {createService} from 'ineedthis';
import dbService from './db';
import configuration from './config';
import {postgraphql} from 'postgraphql';
import {createPostGraphQLSchema} from 'postgraphql';
import debugLib from 'debug';
const debug = debugLib('postgraphql');
const schemaDebug = debugLib('postgraphql-schema');

const postgraphqlService = createService('qgs/postgraphql', {
  dependencies: [dbService, configuration],
  start: () => async ({
    [dbService.serviceName]: {pool},
    [configuration.serviceName]: {isDev},
  }) => {
    debug('Starting...');
    const psql = await postgraphql(pool, 'public', {
      graphqlRoute: '/api/graphql',
      graphiql: isDev,
      graphiqlRoute: '/api/graphiql',
    });

    debug('Started');
    return psql;
  },
});
export default postgraphqlService;

export const schemaService = createService('qgs/postgraphql-schema', {
  dependencies: [dbService],
  start: () => async ({
    [dbService.serviceName]: {pool},
  }) => {
    schemaDebug('Starting...');
    const schema = await createPostGraphQLSchema(pool);
    schemaDebug('Started');
    return schema;
  },
});
