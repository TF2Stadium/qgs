/* @flow */
import {createService} from 'ineedthis';
import configuration from './config';
import {Pool} from 'pg';
import debugLib from 'debug';
const debug = debugLib('db');
const listenerDebug = debugLib('db-listener');

const dbService = createService('qgs/db', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {postgres: postgresConfig},
  }) => {
    debug('Starting...');
    const pool = new Pool(postgresConfig);

    // Test connection + get 1 client connected
    await pool.query('SELECT 1+1;');

    debug('Started');
    return pool;
  },
  async stop(pool) {
    debug('Stopping...');
    await pool.end();
    debug('Stopped');
  }
});
export default dbService;

export const dbListenerService = createService('qgs/db-listener', {
  dependencies: [dbService],
  start: () => async ({
    [dbService.serviceName]: pool,
  }) => {
    listenerDebug('Starting...');
    const dbListener = await pool.connect();
    listenerDebug('Started');
    return dbListener;
  },
  async stop(listener) {
    listenerDebug('Stopping...');
    await listener.end();
    listenerDebug('Stopped');
  }
});
