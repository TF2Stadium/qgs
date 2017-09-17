import {createService} from 'ineedthis';
import configuration from './config';
import path from 'path';
import gceCompute from '@google-cloud/compute';

export default createService('qgs/gce', {
  dependencies: [configuration],
  start: () => async ({
    [configuration.serviceName]: {gce: {projectId, keyFilename}},
  }) => {
    const gce = gceCompute({
      projectId,
      keyFilename: path.resolve(keyFilename)
    });
    return gce;
  }
});
