import React from 'react';
import Button from 'material-ui/Button';
import InputLabel from 'material-ui/Input/InputLabel';
import Typography from 'material-ui/Typography';
import {CircularProgress} from 'material-ui/Progress';
import TextField from 'material-ui/TextField';
import {Content} from './Components';
import {compose, withHandlers, withState} from 'recompose';
import {gql, graphql} from 'react-apollo';
import {locations} from './constants';
import {withRouter} from 'react-router-dom';

function Server({data: {loading, server}}) {
  if (loading) {
    return <CircularProgress/>;
  }

  return (
    <Content>
      <Typography type='display2'>
        {server.title}
      </Typography>

      <Typography type='body'>
        <ul>
          {['status', 'location', 'hostname', 'rconPassword', 'password'].map(k => (
            <li key={k}>
              <b>{k}</b>: {server[k]}
            </li>
          ))}
        </ul>
      </Typography>

      {<Button></Button>}
    </Content>
  );
}

const enhance = compose(
  withRouter,
  graphql(gql`
query server($id: Int!) {
  server: serverById(id: $id) {
    id
    title
    status
    location
    hostname
    rconPassword
    password
  }
}
`, {
  options: ({id}) => ({variables: {id}}),
}),
  withHandlers({})
);

export default enhance(Server);
