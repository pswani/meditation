alter table timer_settings
  add column timer_mode varchar(32) not null default 'fixed';

alter table session_log
  add column timer_mode varchar(32) not null default 'fixed';
