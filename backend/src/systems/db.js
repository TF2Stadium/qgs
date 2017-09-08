import {createService} from 'ineedthis';
import configuration from './config';
import {Pool} from 'pg';

export default createService('qgs/db', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {postgres: postgresConfig},
  }) => {
    const pool = new Pool(postgresConfig);

    // Test connection + get 1 client connected
    await pool.query('SELECT 1+1;');

    return pool;
  },
  stop: (pool) => pool.end(),
});
