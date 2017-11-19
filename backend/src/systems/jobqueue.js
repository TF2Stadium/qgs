/* @flow */
import {sample} from 'lodash';
import {take} from 'ramda';
import {createService} from 'ineedthis';
import dbService from './db';
import configuration from './config';
import gceService from './gce';
import PgBoss from 'pg-boss';
import type {ConnectionOptions} from 'pg-boss';
import {statuses, locationsByName} from '../constants';
import {getServer} from '../queries/server';
import debugLib from 'debug';
const debug = debugLib('jobqueue');

const setStatus = `UPDATE server SET status=$1
WHERE owner_id=$2 and id=$3`;

const startup = `UPDATE server
SET status='starting', instance=$1
WHERE owner_id=$2 and id=$3`;

const stop = `UPDATE server
SET status='stopping', instance=null, hostname=null
WHERE owner_id=$1 and id=$2`;

function job(fn) {
  return async (job) => {
    let result,
      error;
    try {
      result = await fn(job);
    } catch (e) {
      console.error(e);
      error = e;
    }
    job.done(error, result);
  };
}

export default createService('qgs/jobqueue', {
  dependencies: [dbService, configuration, gceService],
  start: () => async ({
    [configuration.serviceName]: config,
    [gceService.serviceName]: gce,
    [dbService.serviceName]: pool,
  }) => {
    debug('Starting...');
    const {
      jobqueuePostgres: postgresConfig,
      gce: {tf2Image},
    } = config;

    const queue = new PgBoss(((postgresConfig: any): ConnectionOptions));
    await queue.start();

    await queue.subscribe('server/start', {}, job(async (job) => {
      const {by, serverId} = job.data,
        server = await getServer(pool, serverId);

      if (server.status !== statuses.stopped) {
        throw new Error('Only stopped servers can be started');
      }

      const name = `tf2-server-${take(8, (Math.random()+'').split('.')[1])}`,
        zoneName = sample(locationsByName[server.location].zones),
        zone = gce.zone(zoneName);

      await pool.query(startup, [`gce:${zoneName}/${name}#1`, by, serverId]);

      debug(`Launching VM ${name} in ${zoneName} with ${tf2Image}`);

      try {
        await zone.createVM(name, {
          machineType: 'n1-standard-2',
          disks: [
            {
              boot: true,
              initializeParams: {
                sourceImage: tf2Image
              }
            }
          ],
          networkInterfaces: [{
            accessConfigs: [{
              type: "ONE_TO_ONE_NAT",
              name: "External NAT"
            }],
            network: 'global/networks/default'
          }]
        });
      } catch (e) {
        await pool.query(setStatus, ['stopped', null, serverId]);
        throw e;
      }

      await new Promise(r=>setTimeout(()=>r(), 10000));
    }));

    await queue.subscribe('server/stop', {}, job(async (job) => {
      const {by, serverId} = job.data,
        server = await getServer(pool, serverId);

      if (server.status !== statuses.running) {
        throw new Error('Only running servers can be stopped');
      }

      const [provider, loc] = server.instance.split(':'),
        [zoneName, serverName] = loc.split('/'),
        [instanceId, slot=1] = serverName.split('#');

      const zone = gce.zone(zoneName),
        vm = zone.vm(instanceId);
      debug(`Killing VM ${instanceId} in ${zoneName}`);

      let exists = false;
      try {
        await vm.get();
        exists = true;
      } catch (e) {
        // Server already gone! (possibly a retry of this event)
      }
      if (exists) {
        await vm.delete();
      }

      await pool.query(stop, [by, serverId]);
      await new Promise(r=>setTimeout(()=>r(), 1000));
      await pool.query(setStatus, ['stopped', by, serverId]);
    }));

    debug('Started');
    return queue;
  },
  async stop(queue) {
    debug('Stopping...');
    await queue.stop();
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
