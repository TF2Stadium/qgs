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
  {name: 'gce/us-central1', db: 'GCE_US_CENTRAL1', human: 'Iowa',
   zones: ['us-central1-a']},
  {name: 'gce/us-west1', db: 'GCE_US_WEST1', human: 'Oregon',
   zones: ['us-west1-a']},
  {name: 'gce/us-east1', db: 'GCE_US_EAST1', human: 'South Carolina',
   zones: ['us-east1-a']},
  {name: 'gce/us-east4', db: 'GCE_US_EAST4', human: 'Virginia',
   zones: ['us-east4-a']},
  {name: 'gce/europe-west1', db: 'GCE_EUROPE_WEST1', human: 'Belgium',
   zones: ['europe-west1-a']},
  {name: 'gce/europe-west2', db: 'GCE_EUROPE_WEST2', human: 'London',
   zones: ['europe-west2-a']},
  {name: 'gce/europe-west3', db: 'GCE_EUROPE_WEST3', human: 'Frankfurt',
   zones: ['europe-west3-a']},
  {name: 'gce/asia-southeast1', db: 'GCE_ASIA_SOUTHEAST1', human: 'Singapore',
   zones: ['asia-southeast1-a']},
  {name: 'gce/asia-east1', db: 'GCE_ASIA_EAST1', human: 'Taiwan',
   zones: ['asia-east1-a']},
  {name: 'gce/asia-northeast1', db: 'GCE_ASIA_NORTHEAST1', human: 'Tokyo',
   zones: ['asia-northeast1-a']},
  {name: 'gce/australia-southeast1', db: 'GCE_AUSTRALIA_SOUTHEAST1', human: 'Syndey',
   zones: ['australia-southeast1-a']},
];

export const locationsByDb = indexBy(prop('db'), locations),
         locationsByName = indexBy(prop('name'), locations);
