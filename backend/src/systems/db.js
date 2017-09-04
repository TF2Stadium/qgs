import {createService} from 'ineedthis';
import configuration from './config';
import {Client} from 'pg';

export default createService('qgs/db', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {postgres: postgresConfig},
  }) => {
    const client = new Client(postgresConfig);
    await client.connect();
    return client;
  },
  stop: (client) => client.end(),
});
