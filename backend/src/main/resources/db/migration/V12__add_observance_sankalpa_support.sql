alter table sankalpa_goal
  add column observance_label varchar(120);

create table sankalpa_observance_entry (
  sankalpa_id varchar(64) not null,
  observance_date date not null,
  status varchar(16) not null,
  updated_at timestamp with time zone not null,
  primary key (sankalpa_id, observance_date),
  constraint fk_sankalpa_observance_entry_goal
    foreign key (sankalpa_id) references sankalpa_goal (id),
  constraint chk_sankalpa_observance_entry_status
    check (status in ('observed', 'missed'))
);

create index ix_sankalpa_observance_entry_sankalpa_id
  on sankalpa_observance_entry (sankalpa_id);
