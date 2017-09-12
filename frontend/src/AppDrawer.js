import React from 'react';
import styled from 'styled-components';
import MuiDrawer from 'material-ui/Drawer';
import List, {ListItem, ListItemText} from 'material-ui/List';
import theme from './theme';
import Divider from 'material-ui/Divider';
import Collapse from 'material-ui/transitions/Collapse';
import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import {compose, withState} from 'recompose';
import {Link, NavLink} from 'react-router-dom';
import Add from 'material-ui-icons/Add';
import {gql, graphql} from 'react-apollo';
import {pathOr, isEmpty} from 'ramda';
import {withRouter} from 'react-router-dom';
import {withStyles} from 'material-ui/styles';

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
word-break: break-word;
`;

const styles = {
  activeLink: {
    color: theme.palette.primary[800],
  },
};

function AppDrawer({classes, location, data, collapsed, setCollapsed}) {
  const servers = pathOr([], ['user', 'servers', 'nodes'], data),
    serverButtons = servers.map(s => {
      const url = `/server/${s.id}`,
        isActive = location.pathname.startsWith(url);

      return (
        <ListItem
          key={s.id}
          button
          component={Link}
          style={!isActive ? {} : {
            backgroundColor: theme.palette.grey[300],
          }}
          to={url}>
          <NestedItemText
            classes={{
              text: isActive ? classes.activeLink : '',
            }}
            primary={s.title} />
        </ListItem>
      );
    });

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
          <ListItem
            button
            disabled={isEmpty(servers)}
            onClick={() => setCollapsed(!collapsed)}>
            <ListItemText primary='Servers' />
            {collapsed ? <ExpandMore/> : <ExpandLess/>}
          </ListItem>
          <Collapse in={collapsed}>
            <List>
              {serverButtons}
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

const enhance = compose(
  withRouter,

  withStyles(styles),

  graphql(gql`
query user($id: Int!) {
  user: personById(id: $id) {
    id
    steamid
    profile
    servers: serversByOwnerId {
      nodes {
        id
        title
        hostname
      }
    }
  }
}
`, {
  options: ({user}) => ({variables: {id: user.id}}),
}),

  withState('collapsed', 'setCollapsed', true),
);

export default enhance(AppDrawer);
