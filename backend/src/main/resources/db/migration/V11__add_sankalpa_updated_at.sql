alter table sankalpa_goal
  add column updated_at timestamp with time zone;

update sankalpa_goal
set updated_at = coalesce(completed_at, created_at);

alter table sankalpa_goal
  alter column updated_at set not null;
