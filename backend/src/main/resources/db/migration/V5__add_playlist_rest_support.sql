alter table playlist_item
  add column external_id varchar(64);

update playlist_item
set external_id = concat('playlist-item-', cast(id as varchar));

alter table playlist_item
  alter column external_id set not null;

create unique index ux_playlist_item_external_id on playlist_item (external_id);

alter table session_log
  drop constraint fk_session_log_playlist;

alter table session_log
  add constraint fk_session_log_playlist
    foreign key (playlist_id) references playlist (id) on delete set null;
