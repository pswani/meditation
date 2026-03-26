insert into meditation_type_ref (code, display_name, sort_order, active)
values
  ('Vipassana', 'Vipassana', 1, true),
  ('Ajapa', 'Ajapa', 2, true),
  ('Tratak', 'Tratak', 3, true),
  ('Kriya', 'Kriya', 4, true),
  ('Sahaj', 'Sahaj', 5, true);

insert into media_asset (
  id,
  asset_kind,
  label,
  meditation_type_code,
  relative_path,
  duration_seconds,
  mime_type,
  size_bytes,
  active,
  updated_at
)
values
  (
    'media-vipassana-sit-20',
    'custom-play',
    'Vipassana Sit (20 min)',
    'Vipassana',
    'custom-plays/vipassana-sit-20.mp3',
    1200,
    'audio/mpeg',
    9200000,
    true,
    timestamp with time zone '2026-03-24 08:00:00+00:00'
  ),
  (
    'media-ajapa-breath-15',
    'custom-play',
    'Ajapa Breath Cycle (15 min)',
    'Ajapa',
    'custom-plays/ajapa-breath-15.mp3',
    900,
    'audio/mpeg',
    6900000,
    true,
    timestamp with time zone '2026-03-24 08:00:00+00:00'
  ),
  (
    'media-tratak-focus-10',
    'custom-play',
    'Tratak Focus Bellset (10 min)',
    'Tratak',
    'custom-plays/tratak-focus-10.mp3',
    600,
    'audio/mpeg',
    4500000,
    true,
    timestamp with time zone '2026-03-24 08:00:00+00:00'
  );
