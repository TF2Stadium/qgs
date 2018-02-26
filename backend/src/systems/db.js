/* @flow */
import {createService} from 'ineedthis';
import configuration from './config';
import {Pool} from 'pg';
import debugLib from 'debug';
const debug = debugLib('db');
const listenerDebug = debugLib('db-listener');

const clientsKey = Symbol('qgs-db-clients');

const dbService = createService('qgs/db', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {postgres: postgresConfig},
  }) => {
    debug('Starting...');
    const pool = new Pool(postgresConfig);
    const clients = [];

    pool.on('connect', client => clients.push(client));

    // Test connection + get 1 client connected
    await pool.query('SELECT 1+1;');

    debug('Started');
    return {pool, clients};
  },
  async stop(pool) {
    debug('Stopping...');
    await Promise.all(pool[clientsKey].map(c => {
      var e = new Promise(
        (resolve, reject) => c.end(err => err ? reject(err) : resolve())
      );
      return e;
    }));

    await new Promise(resolve => pool.pool.destroyAllNow(resolve));
    debug('Stopped');
  }
});
export default dbService;

export const dbListenerService = createService('qgs/db-listener', {
  dependencies: [dbService],
  start: () => async ({
    [dbService.serviceName]: {pool},
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
