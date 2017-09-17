import {one} from '../dbHelpers';

export const getServer = (db, serverId) => one(db.query(`
SELECT * FROM server WHERE id=$1
`, [serverId]));

export const getStatus = (db, serverId) => one(db.query(`
SELECT status FROM server WHERE id=$1
`, [serverId]));
