import React from 'react';
import styled from 'styled-components';
import MuiDrawer from 'material-ui/Drawer';
import List, {ListItem, ListItemText} from 'material-ui/List';
import theme from './theme';
import Divider from 'material-ui/Divider';

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

export default function AppDrawer({open}) {
  return (
    <Drawer type='permanent' open={true}>
      <DrawerInner>
        <List>
          <ListItem button>
            <ListItemText primary='Trash' />
          </ListItem>
          <ListItem button>
            <ListItemText primary='Trash' />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button>
            <ListItemText primary='Trash' />
          </ListItem>
          <ListItem button>
            <ListItemText primary='Trash' />
          </ListItem>
        </List>
      </DrawerInner>
    </Drawer>
  );
}
