export const getStatus = (db, serverId) => db.query(`
SELECT status FROM server WHERE id=$1
`, [serverId]);
