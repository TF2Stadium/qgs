export async function startServer(req, res) {
  const {db, user, params} = req;

  await db.query(`UPDATE server SET status = 'starting'
WHERE id=$1 AND owner_id=$2;
`, [params.id, user.id]);

  await db.query(`INSERT INTO server_log
(server_id, actor_id, action_type, message)
VALUES
($1, $2, $3, $4);`, [
  params.id, user.id, 'launch', null
]);

  res.sendStatus(200);
}

export async function stopServer(req, res) {
  const {db, user, params} = req;

  await db.query(`UPDATE server SET status = 'stopped'
WHERE id=$1 AND owner_id=$2;
`, [params.id, user.id]);

  await db.query(`INSERT INTO server_log
(server_id, actor_id, action_type, message)
VALUES
($1, $2, $3, $4);`, [
  params.id, user.id, 'shutdown', null
]);

  res.sendStatus(200);
}
