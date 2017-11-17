/* @flow */
import {indexBy, prop} from 'ramda';
import {createService} from 'ineedthis';
import dbService from './db';
import configuration from './config';
import gceService from './gce';
import {statuses, locationsByName} from '../constants';
import {getServer} from '../queries/server';
import debugLib from 'debug';
const debug = debugLib('monitor');

const getStartingServers = `select id, instance
from server
where status='running' and hostname is null;`;

async function monitorServers({
  [dbService.serviceName]: pool,
  [gceService.serviceName]: gce,
}) {
  debug('Checking servers');
  const [{rows: startingServers}, [instances]] = await Promise.all([
    pool.query(getStartingServers),
    gce.getVMs()
  ]);

  debug(indexBy(prop('instance'), startingServers));
  for (const i of instances) {
    debug(i.name, i.id, i.zone.name);
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

    const state = {};

    function createTimer() {
      state.timer = setTimeout(async () => {
        debug('run...');
        try {
          state.currentPromise = monitorServers(system);
          await state.currentPromise;
        } catch (e) {
          console.error(e);
        }
        debug('done');

        createTimer();
      }, config.cloudMonitorPeriod);
    }

    createTimer();

    debug('Started');
    return state;
  },
  async stop(state) {
    debug('Stopping...');
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
