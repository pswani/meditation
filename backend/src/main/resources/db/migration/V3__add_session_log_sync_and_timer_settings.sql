alter table session_log
  add column start_sound varchar(100) not null default 'None';

alter table session_log
  add column end_sound varchar(100) not null default 'None';

alter table session_log
  add column interval_enabled boolean not null default false;

alter table session_log
  add column interval_minutes integer not null default 0;

alter table session_log
  add column interval_sound varchar(100) not null default 'None';

alter table session_log
  add column playlist_name varchar(160);

create table timer_settings (
  id varchar(64) primary key,
  duration_minutes integer not null,
  meditation_type_code varchar(32),
  start_sound varchar(100) not null,
  end_sound varchar(100) not null,
  interval_enabled boolean not null,
  interval_minutes integer not null,
  interval_sound varchar(100) not null,
  updated_at timestamp with time zone not null,
  constraint fk_timer_settings_meditation_type
    foreign key (meditation_type_code) references meditation_type_ref (code),
  constraint chk_timer_settings_duration
    check (duration_minutes > 0),
  constraint chk_timer_settings_interval
    check (interval_minutes >= 0)
);

insert into timer_settings (
  id,
  duration_minutes,
  meditation_type_code,
  start_sound,
  end_sound,
  interval_enabled,
  interval_minutes,
  interval_sound,
  updated_at
)
values (
  'default',
  20,
  null,
  'None',
  'Temple Bell',
  false,
  5,
  'Temple Bell',
  current_timestamp
);
