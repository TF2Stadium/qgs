import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {MuiThemeProvider} from 'material-ui/styles';
import theme from './theme';
import registerServiceWorker from './registerServiceWorker';
import {parse} from 'cookie';
import {BrowserRouter} from 'react-router-dom';
import {start, createService} from 'ineedthis';
import {has} from 'ramda';
import {
  ApolloClient, createNetworkInterface, ApolloProvider
} from 'react-apollo';

const UserService = createService('qgs/client/user', {
  start: () => (async () => {
    const cookies = parse(document.cookie);
    if (cookies['qgs-logged-in'] === 'true') {
      return (await fetch('/api/user', {credentials: 'same-origin'})).json();
    }
    return null;
  })
});

export async function startServer(serverId, {}) {

}
