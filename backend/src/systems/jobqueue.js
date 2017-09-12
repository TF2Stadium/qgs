import {createService} from 'ineedthis';
import configuration from './config';
import PgBoss from 'pg-boss';

export default createService('qgs/jobqueue', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {jobqueuePostgres: postgresConfig},
  }) => {
    const queue = new PgBoss(postgresConfig);
    return queue.connect();
  },
  stop: (queue) => queue.disconnect(),
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
