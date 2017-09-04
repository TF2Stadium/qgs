import React from 'react';
import Button from 'material-ui/Button';
import InputLabel from 'material-ui/Input/InputLabel';
import Typography from 'material-ui/Typography';
import TextField from 'material-ui/TextField';
import {Content} from './Components';
import {compose, withHandlers, withState} from 'recompose';
import {always} from 'ramda';
const noop = always(undefined);

const regions = [
  'us-west',
  'us-central',
  'us-east',
  'eu-west',
  'asia-east',
  'asia-northeast',
  'asia-southeast',
  'australia-southeast',
];

const defaultName = 'My new server';

function ServerCreate({formData, updateForm, onSubmit=noop}) {
  const RegionSelect = (
    <select onChange={updateForm('region')}>
      {regions.map((name, idx) => (
        <option key={idx} value={name}>{name}</option>
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
        onChange={updateForm('name')}
        InputProps={{ placeholder: 'Server Name' }}
        helperText={`Name you'll use to manage the server on this site`}
        maxLength={80}/>

      <br/>
      <br/>

      <InputLabel>Server Location</InputLabel>
      <br/>
      {RegionSelect}

      <br/>
      <br/>
      <Button
        raised
        disabled={!formData.region || !formData.name}
        color='primary'>
        Create Server
      </Button>
    </Content>
  );
}

const enhance = compose(
  withState('formData', 'setForm', {
    name: defaultName,
    region: regions[0]
  }),
  withHandlers({
    updateForm: ({setForm, formData}) => (name) => ({target}) => {
      setForm(Object.assign({}, formData, {[name]: target.value}));
    }
  })
);

export default enhance(ServerCreate);
