import React from 'react';
import styled from 'styled-components';
import AppDrawer from './Drawer';
import Button from 'material-ui/Button';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import theme from './theme';
import signin from './sign-in-through-steam.png';

const Title = styled(Typography)`
flex: 1;
`;

const AppContainer = styled.div`
width: 100%;
`;

const Content = styled.main`
margin: 75px 20px 20px ${theme.drawerWidth}px;
`;

const LoginButton = (
  <Button color='contrast' href='/authorize'>
    <img src={signin} alt='Login'/>
  </Button>
);

export default function App() {
  return (
    <AppContainer>
      <AppBar>
        <Toolbar>
          <Title type='title' color='inherit'>Quick Game Servers</Title>
          {LoginButton}
        </Toolbar>
      </AppBar>
      <AppDrawer/>
      <Content>
        <Typography type='display3'>
          Quick Game Servers
        </Typography>
        <br/>
        <Typography type='headline'>
          Quickly and cheaply launch temporary TF2 servers anywhere in
          the world!
        </Typography>
        <br/>
        <Typography type='headline'>
          {LoginButton}
          Login now to get started with 3$ of free credit
          (about 30 hours of 6v6 server time).
        </Typography>
      </Content>
    </AppContainer>
  );
}
