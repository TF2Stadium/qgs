import {createMuiTheme} from 'material-ui/styles';

const theme = createMuiTheme({
  drawerWidth: 200,
  zIndex: {
    mobileStepper: 900,
    menu: 1000,
    drawerOverlay: 1100,
    navDrawer: 1200,
    appBar: 1300,
    dialogOverlay: 1400,
    dialog: 1500,
    layer: 2000,
    popover: 2100,
    snackbar: 2900,
    tooltip: 3000
  }
});

export default theme;
