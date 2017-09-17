/* @flow */
import type {PgBoss} from 'pg-boss';
import type {Pool, Client, PoolClient} from 'pg';

export type JobQueue = PgBoss;
export type Queryable = Pool | Client | PoolClient;

export type ServerId = number;
export type Server = {
  id: ServerId;
  location: string;
  instance: string;
};

export type UserId = number;
export type User = {id: UserId}
