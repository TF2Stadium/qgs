import {parse} from 'cookie';
import {createService} from 'ineedthis';

export default createService('qgs/client/user', {
  start: () => (async () => {
    const cookies = parse(document.cookie);
    if (cookies['qgs-logged-in'] === 'true') {
      return (await fetch('/api/user', {credentials: 'same-origin'})).json();
    }
    return null;
  })
});
