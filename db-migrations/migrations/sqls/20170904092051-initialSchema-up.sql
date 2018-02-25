create or replace function table_update_notify() returns trigger as $$
declare
  id bigint;
begin
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    id = new.id;
  else
    id = old.id;
  end if;
  perform pg_notify('table_update', json_build_object('table', tg_table_name, 'id', id, 'type', tg_op, 'new', NEW)::text);
  return new;
end;
$$ language plpgsql;


create table person (
  id serial primary key,
  steamid numeric(20) not null unique,
  profile json,
  created_at timestamp default now()
);

comment on table person is 'A user.';
comment on column person.id is 'The primary unique identifier for the person';
comment on column person.steamid is 'This user’s SteamID64';
comment on column person.profile is 'This userf’s profile data blob';
comment on column person.created_at is 'The time this person was created';

create type server_status as enum (
  'stopped',
  'starting',
  'running',
  'adjusting',
  'stopping'
);

create type server_location as enum (
  'gce/us-central1',
  'gce/us-west1',
  'gce/us-east4',
  'gce/us-east1',
  'gce/europe-west1',
  'gce/europe-west2',
  'gce/europe-west3',
  'gce/asia-southeast1',
  'gce/asia-east1',
  'gce/asia-northeast1',
  'gce/australia-southeast1'
);

create table server (
  id serial primary key,
  status server_status not null default 'stopped',
  location server_location not null,
  instance varchar(512) unique,
  owner_id integer not null references person(id),
  title varchar(80) not null,
  hostname varchar(512) unique,
  rcon_password varchar(32),
  password varchar(32),
  created_at timestamp default now(),
  unique(owner_id, title)
);

comment on table server is 'A server.';
comment on column server.id is 'The primary unique identifier for the server';
comment on column server.location is 'The desired location for a server';
comment on column server.instance is 'The actual server where a server is running, as provider:zone/instance-id#slot-number';
comment on column server.title is 'Friendly name to refer to this server. Unique per-user.';
comment on column server.hostname is 'Hostname where this server can be reached at';
comment on column server.rcon_password is 'The rcon password of this server';
comment on column server.password is 'The password to connect to this server';
comment on column server.created_at is 'The time this server was created';

create trigger server_notify_update after update on server
  for each row execute procedure table_update_notify();
create trigger server_notify_insert after insert on server
  for each row execute procedure table_update_notify();


create type server_actions as enum (
  'launch',
  'shutdown',
  'reconfigure',
  'user_cmd'
);

CREATE TABLE server_log (
  id serial primary key,
  server_id integer not null references server(id),
  actor_id integer references person(id),
  action_type server_actions not null,
  message text,
  created_at timestamp default now()
);

create trigger server_log_notify_update after update on server_log
  for each row execute procedure table_update_notify();
create trigger server_log_notify_insert after insert on server_log
  for each row execute procedure table_update_notify();

--- Procedures
create function start_server() returns server_status
as $$ select 'starting'::server_status; $$
language sql;
