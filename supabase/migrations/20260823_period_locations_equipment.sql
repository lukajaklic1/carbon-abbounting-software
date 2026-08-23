-- Junction: locations added to a specific reporting period + scope
create table if not exists period_locations (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references reporting_periods(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  scope_type text not null, -- 'stationary','electricity','heat','steam','cooling'
  created_at timestamptz default now(),
  unique(reporting_period_id, location_id, scope_type)
);
alter table period_locations enable row level security;
create policy "period_locations_owner" on period_locations for all using (
  organization_id in (select id from organizations where owner_id = auth.uid())
);

-- Junction: equipment added to a specific reporting period + scope
create table if not exists period_equipment (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references reporting_periods(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  scope_type text not null, -- 'fuel','refrigerants','industrial_gases'
  created_at timestamptz default now(),
  unique(reporting_period_id, equipment_id, scope_type)
);
alter table period_equipment enable row level security;
create policy "period_equipment_owner" on period_equipment for all using (
  organization_id in (select id from organizations where owner_id = auth.uid())
);
