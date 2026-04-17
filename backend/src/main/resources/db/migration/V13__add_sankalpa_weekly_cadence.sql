alter table sankalpa_goal
  add column qualifying_days_per_week integer;

alter table sankalpa_goal
  add constraint chk_sankalpa_goal_qualifying_days_per_week
    check (
      qualifying_days_per_week is null
      or (qualifying_days_per_week >= 1 and qualifying_days_per_week <= 7)
    );
