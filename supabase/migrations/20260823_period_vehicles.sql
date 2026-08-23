-- Junction table: vehicles added to a specific reporting period
create table if not exists period_vehicles (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references reporting_periods(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  created_at timestamptz default now(),
  unique(reporting_period_id, vehicle_id)
);

alter table period_vehicles enable row level security;

create policy "period_vehicles_owner" on period_vehicles
  for all using (
    organization_id in (
      select id from organizations where owner_id = auth.uid()
    )
  );
