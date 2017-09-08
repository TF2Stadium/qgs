export async function startServer(req, res) {
  const {db, user, params} = req;

  await db.query(`UPDATE server SET status = 'starting'
WHERE id=$1 AND owner_id=$2;
`, [params.id, user.id]);

  res.sendStatus(200);
}

export async function stopServer(req, res) {
  const {db, user, params} = req;

  await db.query(`UPDATE server SET status = 'stopped'
WHERE id=$1 AND owner_id=$2;
`, [params.id, user.id]);

  res.sendStatus(200);
}
