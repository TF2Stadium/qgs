import React from 'react';
import Button from 'material-ui/Button';
import InputLabel from 'material-ui/Input/InputLabel';
import Typography from 'material-ui/Typography';
import {CircularProgress} from 'material-ui/Progress';
import TextField from 'material-ui/TextField';
import {Content} from './Components';
import {compose, withHandlers, withState} from 'recompose';
import {gql, graphql} from 'react-apollo';
import {locationsByDb} from './constants';
import {withRouter} from 'react-router-dom';

const Title = styled(Typography)`
  word-break: break-word;
`;

const stateDescriptions = {
  STOPPED: 'not running',
  STARTING: 'starting up',
  RUNNING: 'ready to use',
  ADJUSTING: 'changing configuration',
  STOPPING: 'shutting down'
};

function Server({data: {loading, server}, startServer, stopServer}) {
  if (loading) {
    return <CircularProgress/>;
  }
  if (!server) {
    return <h3>Server Doesn't Exist!</h3>;
  }

  let StateButton;
  if (server.status === 'STOPPED' || server.status === 'STOPPING') {
    StateButton = (
      <Button onClick={startServer} raised color='primary'>
        Turn it on!
      </Button>
    );
  } else {
    StateButton = (
      <Button onClick={stopServer} raised color='accent'>
        Turn it off
      </Button>
    );
  }

  return (
    <Content>
      <Title type='headline'>{server.title}</Title>
      <br/>
      <Typography type='subheading'>
        This server is in <b>{locationsByDb[server.location].human}</b>
        {' '}and it is <b>{stateDescriptions[server.status]}</b>.
      </Typography>

      {StateButton}

      <Typography type='body2'>
        <ul>
          {['hostname', 'rconPassword', 'password'].map(k => (
            <li key={k}>
              <b>{k}</b>: {server[k]}
            </li>
          ))}
        </ul>
      </Typography>

      <Typography type='headline'>Action Log</Typography>
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
