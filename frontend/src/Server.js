import React from 'react';
import styled from 'styled-components';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import {CircularProgress} from 'material-ui/Progress';
import {Content} from './Components';
import {compose, withHandlers} from 'recompose';
import subscribe from './subscribe';
import {gql, graphql} from 'react-apollo';
import {locationsByDb} from './constants';
import {withRouter} from 'react-router-dom';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';

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

function Server({
  server: {loading, server},
  log: {loading: logsLoading, allServerLogs = {}},
  startServer,
  stopServer
}
) {
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


      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
      {(allServerLogs.nodes || []).map(({id, createdAt, actionType, message}) => {
              return (
                <TableRow key={id}>
                  <TableCell>{createdAt}</TableCell>
                  <TableCell>{actionType}</TableCell>
                  <TableCell>{message}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Content>
  );
}

const enhance = compose(
  withRouter,

  subscribe(`
query server($id: Int!) {
  server: serverById(id: $id) {
    __typename
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
  watchProps: ['id'],
  listenTable: 'server',
  listenIds: ({id}) => ({id: [parseInt(id, 10)]}),
  variables: ({id}) => ({id})
}),

  // TODO: Yeah we refetch the entire visible log on every single-line
  // change. But this is just a hacky fill-in for future
  // postgraphql/apollo feature
  subscribe(`
query log($id: Int!) {
 	allServerLogs(first: 10, orderBy: ID_DESC, condition: {serverId: $id}) {
    __typename
    nodes {
      __typename
      id
      serverId
      actor: personByActorId {
        __typename
        id
      }
      actionType
      message
      createdAt
    }
  }
}
`, {
  watchProps: ['id'],
  listenTable: 'server_log',
  listenIds: ({id}) => ({server_id: [parseInt(id, 10)]}),
  variables: ({id}) => ({id})
}),

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
  name: 'server',
  options: ({id}) => ({
    fetchPolicy: 'network-only',
    variables: {id},
  }),
}),

  graphql(gql`
query log($id: Int!) {
 	allServerLogs(first: 10, orderBy: ID_DESC, condition: {serverId: $id}) {
    nodes {
      id
      serverId
      personByActorId {
        id
      }
      actionType
      message
      createdAt
    }
  }
}
`, {
  name: 'log',
  options: ({id}) => ({
    fetchPolicy: 'network-only',
    variables: {id},
  }),
}),

  graphql(gql`
mutation {
  startServer(input:{}) {
    serverStatus
  }
}
`, {
  name: 'startServer'
}),

  withHandlers({
    startServer: ({server: {server}}) => () => {
      if (server && server.id) {
        fetch(`/api/server/${server.id}/start`, {
          method: 'POST',
          credentials: 'same-origin'
        });
      }
    },

    stopServer: ({server: {server}}) => () => {
      if (server && server.id) {
        fetch(`/api/server/${server.id}/stop`, {
          method: 'POST',
          credentials: 'same-origin'
        });
      }
    }
  })
);

export default enhance(Server);
