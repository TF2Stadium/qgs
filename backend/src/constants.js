import {prop, indexBy} from 'ramda';

export const statuses = {
  stopped: 'stopped',
  starting: 'starting',
  running: 'running',
  adjusting: 'adjusting',
  stopping: 'stopping'
};

// name: raw db name, and also the name to show people
// db: constant name to use for postgraphql queries
export const locations = [
  {name: 'gce/us-central1', db: 'GCE_US_CENTRAL1', human: 'Iowa'},
  {name: 'gce/us-west1', db: 'GCE_US_WEST1', human: 'Oregon'},
  {name: 'gce/us-east1', db: 'GCE_US_EAST1', human: 'South Carolina'},
  {name: 'gce/us-east4', db: 'GCE_US_EAST4', human: 'Virginia'},
  {name: 'gce/europe-west1', db: 'GCE_EUROPE_WEST1', human: 'Belgium'},
  {name: 'gce/europe-west2', db: 'GCE_EUROPE_WEST2', human: 'London'},
  {name: 'gce/europe-west3', db: 'GCE_EUROPE_WEST3', human: 'Frankfurt'},
  {name: 'gce/asia-southeast1', db: 'GCE_ASIA_SOUTHEAST1', human: 'Singapore'},
  {name: 'gce/asia-east1', db: 'GCE_ASIA_EAST1', human: 'Taiwan'},
  {name: 'gce/asia-northeast1', db: 'GCE_ASIA_NORTHEAST1', human: 'Tokyo'},
  {name: 'gce/australia-southeast1', db: 'GCE_AUSTRALIA_SOUTHEAST1', human: 'Syndey'},
];

export const locationsByDb = indexBy(prop('db'), locations);
