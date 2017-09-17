/* @flow */
import {one} from '../dbHelpers';
import type {Queryable, ServerId, Server} from '../types';

export async function getServer(
  db: Queryable, serverId: ServerId
): Promise<Server> {
  const server: Server = ((await one((db.query(`
SELECT * FROM server WHERE id=$1
`, [serverId])))): any);

  return server;
}

export const getStatus = (db: Queryable, serverId: ServerId) => one(db.query(`
SELECT status FROM server WHERE id=$1
`, [serverId]));
