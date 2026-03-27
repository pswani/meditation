alter table custom_play
  add column start_sound varchar(100) not null default 'None';

alter table custom_play
  add column end_sound varchar(100) not null default 'Temple Bell';
