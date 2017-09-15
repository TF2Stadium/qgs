import {createService} from 'ineedthis';
import dbService from './db';
import configuration from './config';
import gceService from './gce';
import PgBoss from 'pg-boss';
import {txPool} from '../dbHelpers';
import {getStatus} from '../queries/server';
import debugLib from 'debug';
const debug = debugLib('jobqueue');

const setStatus = `UPDATE server SET status=$1
WHERE owner_id=$2 and id=$3`;

export default createService('qgs/jobqueue', {
  dependencies: [dbService, configuration, gceService],
  start: () => async ({
    [configuration.serviceName]: {jobqueuePostgres: postgresConfig},
    [gceService.serviceName]: gce,
    [dbService.serviceName]: pool,
  }) => {
    debug('Starting...');
    const queue = new PgBoss(postgresConfig);
    await queue.start();

    await queue.subscribe('server/start', {}, async (job) => {
      await db.query(setStatus, ['starting', by, serverId]);

      const {by, serverId} = job.data;
      await db.query(setStatus, ['starting', by, serverId]);

          await new Promise(r=>setTimeout(()=>r(), 10000));
          await db.query(setStatus, ['running', by, serverId]);
        } catch (e) {
          console.error(e);
        }
        job.done();
      });
    });

    await queue.subscribe('server/stop', {}, job => {
      txPool(pool, async (db) => {
        try {
          const {by, serverId} = job.data;
          await db.query(setStatus, ['stopping', by, serverId]);
          await new Promise(r=>setTimeout(()=>r(), 10000));
          await db.query(setStatus, ['stopped', by, serverId]);
        } catch (e) {
          console.error(e);
        }
        job.done();
      });
    });

    debug('Started');
    return queue;
  },
  async stop(queue) {
    debug('Stopping...');
    await queue.disconnect();
    debug('Stopped');
  }
});

export const setup = createService('qgs/jobqueue-setup', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {jobqueuePostgres: postgresConfig},
  }) => {
    const queue = new PgBoss(postgresConfig);
    return queue.start();
  },
  stop: (queue) => queue.stop(),
});
