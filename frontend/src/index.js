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

function useServices(
  WrappedComponent,
  servicesMap,
  {loadingProp='isLoading', delayRender=false} = {}
) {
  return class extends Component {
    constructor() {
      super();
      const childProps = {};
      for (const k of Object.keys(servicesMap)) {
        childProps[k] = null;
      }
      childProps[loadingProp] = true;
      this.state = {childProps};
    }

    async componentWillMount() {
      const sys = await start(Object.values(servicesMap));
      const newChildProps = {};
      for (const [prop, s] of Object.entries(servicesMap)) {
        newChildProps[prop] = sys[s.serviceName];
      }
      newChildProps[loadingProp] = false;
      this.setState(() => ({childProps: newChildProps}));
    }

    render() {
      if (delayRender && this.state.childProps[loadingProp]) {
        return null;
      }
      return <WrappedComponent {...this.props} {...this.state.childProps}/>
    }
  };
}

const apolloClient = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: '/api/graphql',
    credentials: 'same-origin',
  }),
  dataIdFromObject: o => {
    // Default behavior:
    if (has(o, 'id') && has(o, '__typename')) {
      return `${o.__typename}:${o.id}`;
    }
    // Also, ServersConnection (`nodes` under a serverByOwnerId)
    // should be cache together
    if (o.__typename === 'ServersConnection') {
      return `${o.__typename}:none`;
    }
  }
});

const ServicedApp = useServices(
  App, {user: UserService}, {delayRender: true}
);

ReactDOM.render((
  <MuiThemeProvider theme={theme}>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <ServicedApp/>
      </BrowserRouter>
    </ApolloProvider>
  </MuiThemeProvider>
), document.getElementById('root'));
registerServiceWorker();
