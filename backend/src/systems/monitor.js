/* @flow */
import {indexBy, prop} from 'ramda';
import {createService} from 'ineedthis';
import dbService from './db';
import configuration from './config';
import gceService from './gce';
import debugLib from 'debug';
const debug = debugLib('monitor');

const getStartingServers = `select id, instance
from server
where status='starting' and hostname is null;`;

const updateHostname = `UPDATE server
SET status='running', hostname=$2
WHERE id=$1;`;

async function monitorServers({
  [dbService.serviceName]: pool,
  [gceService.serviceName]: gce,
}) {
  debug('Checking servers');
  const [{rows: startingServers}, [instances]] = await Promise.all([
    pool.query(getStartingServers),
    gce.getVMs()
  ]);

  const servers = indexBy(prop('instance'), startingServers);
  debug(servers);
  for (const i of instances) {
    const s = servers[`gce:${i.zone.name}/${i.name}#1`];
    debug(i.name, i.id, i.zone.name, s);
    const ip = i.metadata.networkInterfaces[0].accessConfigs[0].natIP;
    if (s && ip) {
      debug('Found: ', ip, 'for server', s.id);
      await pool.query(updateHostname, [s.id, ip]);
    }
  }

  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Periodically monitor cloud servers
 */
export default createService('qgs/monitor', {
  dependencies: [dbService, configuration, gceService],
  start: () => async (system) => {
    debug('Starting...');

    const {
      [configuration.serviceName]: config,
    } = system;

    const state = {
      running: true
    };

    function createTimer() {
      state.timer = setTimeout(async () => {
        debug('Run...');
        try {
          state.currentPromise = monitorServers(system);
          await state.currentPromise;
        } catch (e) {
          console.error(e); //eslint-disable-line no-console
        }
        debug('Done');

        if (state.running) {
          createTimer();
        }
      }, config.cloudMonitorPeriod);
    }

    createTimer();

    debug('Started');
    return state;
  },
  async stop(state) {
    debug('Stopping...');
    state.running = false;
    if (state.timer) {
      clearTimeout(state.timer);
    }
    if (state.currentPromise) {
      try {
        await state.currentPromise;
      } catch (e) {
        // will be logged by the catch in createTimer
      }
    }
    debug('Stopped');
  }
});
