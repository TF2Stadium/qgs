/* @flow */
import {createService} from 'ineedthis';
import configuration from './config';
import {Pool} from 'pg';
import debugLib from 'debug';
const debug = debugLib('db');

export default createService('qgs/db', {
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
