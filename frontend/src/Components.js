import React from 'react';
import styled from 'styled-components';
import Button from 'material-ui/Button';
import signin from './sign-in-through-steam.png';
import theme from './theme';

export const Content = styled.main`
margin: 75px 20px 20px ${theme.drawerWidth + 10}px;
`;

export const LoginButton = (
  <Button color='contrast' href='/api/authorize'>
    <img src={signin} alt='Login'/>
  </Button>
);
