import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import App from './App';
import {MuiThemeProvider} from 'material-ui/styles';
import theme from './theme';
//import registerServiceWorker from './registerServiceWorker';
import {BrowserRouter} from 'react-router-dom';
import UserService from './services/user';
import WebsocketService from './services/websocket';
import withServices from './services/withServices';
import {compose, withContext} from 'recompose';
import {has} from 'ramda';
import {
  ApolloClient, createNetworkInterface, ApolloProvider
} from 'react-apollo';

const apolloClient = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: '/api/graphql',
    credentials: 'same-origin',
  }),
  dataIdFromObject: o => {
    // Default behavior:
    if (has('id', o) && has('__typename', o)) {
      return `${o.__typename}:${o.id}`;
    }
    // Also, ServersConnection (`nodes` under a serverByOwnerId)
    // should be cache together
    if (o.__typename === 'ServersConnection') {
      return `${o.__typename}:none`;
    }
    if (o.__typename === 'ServerLogsConnection') {
      return `${o.__typename}:none`;
    }
  }
});

const ServicedApp = compose(
  withServices({
    user: UserService,
    ws: WebsocketService(apolloClient),
  }, {delayRender: true}),
  withContext({
    user: PropTypes.object,
    ws: PropTypes.object,
  }, ({user, ws}) => ({user, ws}))
)(App);

ReactDOM.render((
  <MuiThemeProvider theme={theme}>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <ServicedApp/>
      </BrowserRouter>
    </ApolloProvider>
  </MuiThemeProvider>
), document.getElementById('root'));
//registerServiceWorker();
