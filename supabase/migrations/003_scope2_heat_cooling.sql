CREATE TABLE IF NOT EXISTS scope2_heat_steam (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  location_id           UUID NOT NULL REFERENCES locations(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 'kWh',
  country_code          TEXT,
  co2e_kg               DECIMAL(15,4) NOT NULL,
  factor_kg_co2e_per_kwh DECIMAL(15,8),
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scope2_heat_steam ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope2_heat_steam
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS scope2_cooling (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  location_id           UUID NOT NULL REFERENCES locations(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 'kWh',
  method                TEXT,
  co2e_kg               DECIMAL(15,4) NOT NULL,
  factor_kg_co2e_per_kwh DECIMAL(15,8),
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scope2_cooling ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope2_cooling
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));
