import configuration from './config';
import {createService} from 'ineedthis';
import {gql} from 'react-apollo';
import ReconnectingWebSocket from 'reconnectingwebsocket';

export default (apollo) => createService('qgs/websocket', {
  dependencies: [configuration],
  start: () => ({
    [configuration.serviceName]: {apiHost},
  }) => {
    const ws = new ReconnectingWebSocket(`ws://${apiHost}/api/`),
      subscriptions = {};

    ws.onmessage = e => {
      const {uuid, result: {data}} = JSON.parse(e.data),
        {query, variables} = subscriptions[uuid];
      apollo.writeQuery({query, data, variables});
    };

    function subscribe({query, listenTable, listenIds, variables} = {}) {
      const uuid = `${Date.now()}.${Math.random()}`;

      subscriptions[uuid] = {query: gql(query), variables};

      function listen() {
        ws.send(JSON.stringify({
          listenTable,
          listenIds,
          uuid,
          variables,
          query
        }));
      }

      if (ws.readyState === WebSocket.OPEN) {
        listen();
      } else {
        ws.addEventListener('open', () => {
          listen();
        });
      }

      const unsubscribe = () => {
        ws.send(JSON.stringify({stopListening: true, uuid}));
      };

      return unsubscribe;
    }

    return {ws, subscribe};
  },

  stop: ({ws}) => ws.close(),
});
