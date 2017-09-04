import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {MuiThemeProvider} from 'material-ui/styles';
import theme from './theme';
import registerServiceWorker from './registerServiceWorker';
import {parse} from 'cookie';
import {start, createService} from 'ineedthis';

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
      console.log('initd', sys);
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

const ServicedApp = useServices(
  App, {user: UserService}, {delayRender: true}
);

ReactDOM.render((
  <MuiThemeProvider theme={theme}>
    <ServicedApp />
  </MuiThemeProvider>
), document.getElementById('root'));
registerServiceWorker();
