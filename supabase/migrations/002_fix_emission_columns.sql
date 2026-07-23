-- Make emission_factor_id nullable (we store factors inline, not via FK)
ALTER TABLE scope1_stationary     ALTER COLUMN emission_factor_id DROP NOT NULL;
ALTER TABLE scope1_mobile         ALTER COLUMN emission_factor_id DROP NOT NULL;
ALTER TABLE scope1_equipment_fuel ALTER COLUMN emission_factor_id DROP NOT NULL;
ALTER TABLE scope1_refrigerants   ALTER COLUMN emission_factor_id DROP NOT NULL;
ALTER TABLE scope1_industrial_gases ALTER COLUMN emission_factor_id DROP NOT NULL;
ALTER TABLE scope2_electricity    ALTER COLUMN emission_factor_id DROP NOT NULL;

-- scope1_stationary: add fuel_type and factor
ALTER TABLE scope1_stationary ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE scope1_stationary ADD COLUMN IF NOT EXISTS factor_kg_co2e_per_unit DECIMAL(15,8);

-- scope1_mobile: add fuel_type and factor
ALTER TABLE scope1_mobile ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE scope1_mobile ADD COLUMN IF NOT EXISTS factor_kg_co2e_per_unit DECIMAL(15,8);

-- scope1_equipment_fuel: add fuel_type and factor
ALTER TABLE scope1_equipment_fuel ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE scope1_equipment_fuel ADD COLUMN IF NOT EXISTS factor_kg_co2e_per_unit DECIMAL(15,8);

-- scope1_refrigerants: add refrigerant_type
ALTER TABLE scope1_refrigerants ADD COLUMN IF NOT EXISTS refrigerant_type TEXT;

-- scope1_industrial_gases: add gas_type, make unit have default
ALTER TABLE scope1_industrial_gases ADD COLUMN IF NOT EXISTS gas_type TEXT;
ALTER TABLE scope1_industrial_gases ALTER COLUMN unit SET DEFAULT 'kg';

-- scope2_electricity: add country_code and factor; rename kwh → quantity already correct (schema uses quantity)
ALTER TABLE scope2_electricity ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE scope2_electricity ADD COLUMN IF NOT EXISTS factor_kg_co2e_per_kwh DECIMAL(15,8);
