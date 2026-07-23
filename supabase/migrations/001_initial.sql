-- ============================================
-- Carbon Accounting SaaS – Initial Migration
-- ============================================

-- organizations
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  industry        TEXT NOT NULL CHECK (industry IN (
                    'manufacturing','retail','transport','energy',
                    'finance','construction','agriculture','other'
                  )),
  country_code    TEXT NOT NULL DEFAULT 'SI',
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN (
                    'free','starter','professional','enterprise'
                  )),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON organizations
  USING (owner_id = auth.uid());

-- locations
CREATE TABLE locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  country_code    TEXT NOT NULL DEFAULT 'SI',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON locations
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- vehicles
CREATE TABLE vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  vehicle_type    TEXT NOT NULL CHECK (vehicle_type IN (
                    'car','van','truck','motorcycle','other'
                  )),
  fuel_type       TEXT NOT NULL CHECK (fuel_type IN (
                    'diesel','petrol','hybrid','electric','lpg','cng','unknown'
                  )),
  size_category   TEXT CHECK (size_category IN (
                    'small','medium','large','average'
                  )),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON vehicles
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- equipment
CREATE TABLE equipment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  equipment_type  TEXT NOT NULL CHECK (equipment_type IN (
                    'boiler','generator','oven','compressor',
                    'air_conditioning','fire_suppression',
                    'refrigeration','industrial_process','other'
                  )),
  location_id     UUID REFERENCES locations(id) ON DELETE SET NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON equipment
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- reporting_periods
CREATE TABLE reporting_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                    'draft','in_progress','completed','verified'
                  )),
  total_co2e_kg   DECIMAL(15,4) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, year)
);

ALTER TABLE reporting_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON reporting_periods
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- emission_factors (global seed table, no RLS – public read)
CREATE TABLE emission_factors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  scope           TEXT NOT NULL CHECK (scope IN ('scope1','scope2')),
  category        TEXT NOT NULL CHECK (category IN (
                    'stationary_combustion','mobile_combustion',
                    'refrigerants','industrial_gases','electricity'
                  )),
  subcategory     TEXT NOT NULL,
  unit            TEXT NOT NULL,
  factor_kg_co2e  DECIMAL(15,8) NOT NULL,
  source          TEXT NOT NULL DEFAULT 'DEFRA',
  valid_year      INTEGER NOT NULL,
  country_code    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- scope1_stationary
CREATE TABLE scope1_stationary (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  location_id           UUID NOT NULL REFERENCES locations(id),
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL,
  co2e_kg               DECIMAL(15,4) NOT NULL,
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scope1_stationary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope1_stationary
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- scope1_mobile
CREATE TABLE scope1_mobile (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  vehicle_id            UUID NOT NULL REFERENCES vehicles(id),
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL,
  co2e_kg               DECIMAL(15,4) NOT NULL,
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scope1_mobile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope1_mobile
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- scope1_equipment_fuel
CREATE TABLE scope1_equipment_fuel (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  equipment_id          UUID NOT NULL REFERENCES equipment(id),
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL,
  co2e_kg               DECIMAL(15,4) NOT NULL,
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scope1_equipment_fuel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope1_equipment_fuel
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- scope1_refrigerants
CREATE TABLE scope1_refrigerants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  equipment_id          UUID NOT NULL REFERENCES equipment(id),
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 'kg',
  co2e_kg               DECIMAL(15,4) NOT NULL,
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scope1_refrigerants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope1_refrigerants
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- scope1_industrial_gases
CREATE TABLE scope1_industrial_gases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  equipment_id          UUID NOT NULL REFERENCES equipment(id),
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL,
  co2e_kg               DECIMAL(15,4) NOT NULL,
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scope1_industrial_gases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope1_industrial_gases
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- scope2_electricity
CREATE TABLE scope2_electricity (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporting_period_id   UUID NOT NULL REFERENCES reporting_periods(id) ON DELETE CASCADE,
  location_id           UUID NOT NULL REFERENCES locations(id),
  method                TEXT NOT NULL DEFAULT 'location_based' CHECK (method IN (
                          'location_based','market_based'
                        )),
  emission_factor_id    UUID NOT NULL REFERENCES emission_factors(id),
  quantity              DECIMAL(15,4) NOT NULL,
  unit                  TEXT NOT NULL DEFAULT 'kWh',
  co2e_kg               DECIMAL(15,4) NOT NULL,
  supplier_name         TEXT,
  has_renewable_cert    BOOLEAN DEFAULT FALSE,
  data_source           TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scope2_electricity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON scope2_electricity
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- reduction_targets
CREATE TABLE reduction_targets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  baseline_year       INTEGER NOT NULL,
  target_year         INTEGER NOT NULL,
  reduction_pct       DECIMAL(5,2) NOT NULL,
  scope               TEXT NOT NULL CHECK (scope IN ('scope1','scope2','both')),
  type                TEXT NOT NULL DEFAULT 'absolute' CHECK (type IN ('absolute','intensity')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','achieved','missed')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reduction_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON reduction_targets
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- audit_log
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  old_values      JSONB,
  new_values      JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON audit_log
  USING (organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  ));

-- Helper function: update total CO2e on reporting period
CREATE OR REPLACE FUNCTION update_period_total(period_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reporting_periods SET total_co2e_kg = (
    SELECT COALESCE(SUM(co2e_kg), 0) FROM scope1_stationary
    WHERE reporting_period_id = period_id
  ) + (
    SELECT COALESCE(SUM(co2e_kg), 0) FROM scope1_mobile
    WHERE reporting_period_id = period_id
  ) + (
    SELECT COALESCE(SUM(co2e_kg), 0) FROM scope1_equipment_fuel
    WHERE reporting_period_id = period_id
  ) + (
    SELECT COALESCE(SUM(co2e_kg), 0) FROM scope1_refrigerants
    WHERE reporting_period_id = period_id
  ) + (
    SELECT COALESCE(SUM(co2e_kg), 0) FROM scope1_industrial_gases
    WHERE reporting_period_id = period_id
  ) + (
    SELECT COALESCE(SUM(co2e_kg), 0) FROM scope2_electricity
    WHERE reporting_period_id = period_id
  )
  WHERE id = period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
