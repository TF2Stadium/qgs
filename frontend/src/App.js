import React from 'react';
import styled from 'styled-components';
import AppDrawer from './AppDrawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import ServerCreate from './ServerCreate';
import Server from './Server';
import {Switch, Route, Redirect} from 'react-router-dom';
import {Content, LoginButton} from './Components';

const Title = styled(Typography)`
flex: 1;
`;

const AppContainer = styled.div`
width: 100%;
`;

const Main = () => (
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
);

const About = () => (
  <Content>
    <Typography type='display2'>
      Contact Quick Game Servers
    </Typography>
    <br/>
    <Typography type='headline'>
      Email us:
    </Typography>
    <br/>
    <Typography type='headline'>
      Or chat on the TF2Stadium discord:
    </Typography>
  </Content>
);

export default function App({isLoading, user}) {
  return (
    <AppContainer>
      <AppBar>
        <Toolbar>
          <Title type='title' color='inherit'>Quick Game Servers</Title>
          {user ? null : LoginButton}
        </Toolbar>
      </AppBar>
      {user ? <AppDrawer user={user}/> : null}

      {user ? (
        <Switch>
          <Route path='/server/create'><ServerCreate user={user}/></Route>
          <Route path='/server/:id' children={({match}) => (
            <Server id={match.params.id}/>
          )}/>
          <Route path='/about' component={About}/>
          <Route path='/' exact={true} component={Main}/>
          <Redirect to='/'/>
        </Switch>
      ) : (
        <Switch>
          <Route path='/about' component={About}/>
          <Route path='/' exact={true} component={Main}/>
          <Redirect to='/'/>
        </Switch>
      )}
    </AppContainer>
  );
}
