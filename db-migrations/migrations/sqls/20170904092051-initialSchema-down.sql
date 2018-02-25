drop trigger if exists server_notify_update on server;
drop trigger if exists server_notify_insert on server;
drop trigger if exists server_log_notify_update on server_log;
drop trigger if exists server_log_notify_insert on server_log;
drop function if exists table_update_notify();

drop function start_server();
drop table server_log;
drop type server_actions;
drop table server;
drop type server_status;
drop type server_location;
drop table person;
