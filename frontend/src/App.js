import React from 'react';
import styled from 'styled-components';
import AppDrawer from './Drawer';
import Button from 'material-ui/Button';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import theme from './theme';

const Title = styled(Typography)`
flex: 1
`;

const AppContainer = styled.div`
width: 100%;
`;

const Content = styled.main`
margin: 75px 20px 20px ${theme.drawerWidth}px;
`;

export default function App() {
  return (
    <AppContainer>
      <AppBar>
        <Toolbar>
          <Title type='title' color='inherit'>Quick Game Servers</Title>
          <Button color='contrast'>Login</Button>
        </Toolbar>
      </AppBar>
      <AppDrawer/>
      <Content>
        <h2>Welcome to React</h2>
      </Content>
    </AppContainer>
  );
}
