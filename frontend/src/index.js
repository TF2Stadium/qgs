import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {MuiThemeProvider} from 'material-ui/styles';
import theme from './theme';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render((
  <MuiThemeProvider theme={theme}>
    <App />
  </MuiThemeProvider>
), document.getElementById('root'));
registerServiceWorker();
