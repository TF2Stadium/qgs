import {createService} from 'ineedthis';
import {propOr} from 'ramda';

const strEnv = (name, def) =>
    propOr(propOr(def, name, process.env), `REACT_APP_${name}`, process.env);

export default createService('qgs/configuration', {
  dependencies: [],
  start: () => () => ({
    apiHost: strEnv('API_HOST', 'localhost:8082'),
  }),
});
