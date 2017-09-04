import React from 'react';
import styled from 'styled-components';
import MuiDrawer from 'material-ui/Drawer';
import List, {ListItem, ListItemText} from 'material-ui/List';
import theme from './theme';
import Divider from 'material-ui/Divider';
import Collapse from 'material-ui/transitions/Collapse';
import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import {withState} from 'recompose';
import {Link} from 'react-router-dom';
import Add from 'material-ui-icons/Add';

const DrawerInner = styled.div`
// Make the items inside not wrap when transitioning:
width: ${theme.drawerWidth}px;
margin-top: 54px;
${theme.breakpoints.up('sm')} {
  margin-top: 64px;
}
`;

const Drawer = styled(MuiDrawer)`
position: relative;
z-index: ${theme.zIndex.navDrawer - 1};
height: auto;
width: ${theme.drawerWidth}px;
`;

const NestedItemText = styled(ListItemText)`
text-indent: 20px;
`;

function AppDrawer({collapsed, setCollapsed}) {
  return (
    <Drawer type='permanent' open={true}>
      <DrawerInner>
        <List>
          <ListItem
            button
            component={Link}
            to='/server/create'>
            <ListItemText primary='Launch Server' />
            <Add/>
          </ListItem>
          <ListItem button onClick={() => setCollapsed(!collapsed)}>
            <ListItemText primary='Servers' />
            {collapsed ? <ExpandMore/> : <ExpandLess/>}
          </ListItem>
          <Collapse in={collapsed}>
            <List>
              <ListItem button>
                <NestedItemText primary='Server 1' />
              </ListItem>
              <ListItem button>
                <NestedItemText primary='Server 2 (long text long text)' />
              </ListItem>
              <ListItem button>
                <NestedItemText primary='Server 3' />
              </ListItem>
            </List>
          </Collapse>

          <ListItem button>
            <ListItemText primary='Balance' />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            component={Link}
            to='/about'>
            <ListItemText primary='About' />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            component='a'
            href='/api/authorize/logout'>
            <ListItemText primary='Logout' />
          </ListItem>
        </List>
      </DrawerInner>
    </Drawer>
  );
}

export default withState('collapsed', 'setCollapsed', false)(AppDrawer);
