const insertServerLog = `INSERT INTO server_log
(server_id, actor_id, action_type, message)
VALUES
($1, $2, $3, $4);`;

export async function startServer(req, res) {
  const {db, user, params} = req,
    serverId = parseInt(params.id, 10);

  await db.query(insertServerLog, [
    serverId, user.id, 'launch', null
  ]);

  await req.jobqueue.publish('server/start', {
    serverId,
    by: user.id,
  }, {
    singletonKey: `server:${serverId}`,
    expireIn: '3 minutes',
  });

  res.sendStatus(200);
}

export async function stopServer(req, res) {
  const {db, user, params} = req,
    serverId = parseInt(params.id, 10);

  await db.query(insertServerLog, [
    serverId, user.id, 'shutdown', null
  ]);

  await req.jobqueue.publish('server/stop', {
    serverId,
    by: user.id,
  }, {
    singletonKey: `server:${serverId}`,
    expireIn: '3 minutes',
  });

  res.sendStatus(200);
}
