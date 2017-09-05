import React from 'react';
import Button from 'material-ui/Button';
import InputLabel from 'material-ui/Input/InputLabel';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import {Content} from './Components';
import {compose, withHandlers, withState} from 'recompose';
import {gql, graphql} from 'react-apollo';
import {locations} from './constants';
import {withRouter} from 'react-router-dom'

const defaultName = 'My new server';

/*eslint-disable react/jsx-no-duplicate-props */
function ServerCreate({formData, updateForm, createServer}) {
  const RegionSelect = (
    <select onChange={updateForm('location')}>
      {locations.map(({name, db}, idx) => (
        <option key={idx} value={db}>{name}</option>
      ))}
    </select>
  );

  return (
    <Content>
      <Typography type='display2'>
        Create a Server
      </Typography>
      <br/>

      <TextField
        label='Server Name'
        defaultValue={defaultName}
        onChange={updateForm('title')}
        inputProps={{maxLength: 80}}
        InputProps={{placeholder: 'Server Name'}}
        helperText={`Name you'll use to manage the server on this site`}/>

      <br/>
      <br/>

      <InputLabel>Server Location</InputLabel>
      <br/>
      {RegionSelect}

      <br/>
      <br/>
      <Button
        raised
        disabled={!formData.location || !formData.title}
        onClick={createServer}
        color='primary'>
        Create Server
      </Button>
    </Content>
  );
}

const enhance = compose(
  withRouter,
  graphql(gql`
mutation ($ownerId: Int!, $title: String!, $location: ServerLocation!) {
  createServer(input: {server: {
    ownerId: $ownerId,
    title: $title,
    location: $location,
    status: STOPPED
  }}) {
    server {
      id
    }
    user: personByOwnerId {
      servers: serversByOwnerId {
        nodes {
          id
          title
          hostname
        }
      }
    }
  }
}
`, {
  props: ({ mutate }) => ({
    submit: (formData) => mutate({ variables: formData })
  })
}),
  withState('formData', 'setForm', {
    title: defaultName,
    location: locations[0].db
  }),
  withHandlers({
    updateForm: ({setForm, formData}) => (name) => ({target}) => {
      setForm(Object.assign({}, formData, {[name]: target.value}));
    },
    createServer: ({history, user, submit, formData}) => (async () => {
      const {data} = await submit({ownerId: user.id, ...formData});
      history.push(`/server/${data.createServer.server.id}`)
    }),
  })
);

export default enhance(ServerCreate);
