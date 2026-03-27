drop index if exists ux_playlist_item_external_id;

create unique index if not exists ux_playlist_item_playlist_external_id
  on playlist_item (playlist_id, external_id);
