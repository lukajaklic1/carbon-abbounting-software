-- ============================================
-- Emission Factors Seed Data – DEFRA 2025
-- ============================================

-- Scope 1 – Stationary Combustion
INSERT INTO emission_factors (name, scope, category, subcategory, unit, factor_kg_co2e, source, valid_year) VALUES
('Natural Gas', 'scope1', 'stationary_combustion', 'natural_gas', 'kWh (Gross CV)', 0.18296, 'DEFRA', 2025),
('Natural Gas', 'scope1', 'stationary_combustion', 'natural_gas', 'kWh (Net CV)', 0.20270, 'DEFRA', 2025),
('Natural Gas', 'scope1', 'stationary_combustion', 'natural_gas', 'cubic metres', 2.06672, 'DEFRA', 2025),
('LPG', 'scope1', 'stationary_combustion', 'lpg', 'litres', 1.55713, 'DEFRA', 2025),
('LPG', 'scope1', 'stationary_combustion', 'lpg', 'kWh (Net CV)', 0.23032, 'DEFRA', 2025),
('Diesel', 'scope1', 'stationary_combustion', 'diesel', 'litres', 2.51637, 'DEFRA', 2025),
('Diesel', 'scope1', 'stationary_combustion', 'diesel', 'kWh (Net CV)', 0.24720, 'DEFRA', 2025),
('Petrol', 'scope1', 'stationary_combustion', 'petrol', 'litres', 2.12219, 'DEFRA', 2025),
('Petrol', 'scope1', 'stationary_combustion', 'petrol', 'kWh (Net CV)', 0.22070, 'DEFRA', 2025),
('Fuel Oil', 'scope1', 'stationary_combustion', 'fuel_oil', 'litres', 2.54477, 'DEFRA', 2025),
('Coal (industrial)', 'scope1', 'stationary_combustion', 'coal', 'tonnes', 2230.88, 'DEFRA', 2025);

-- Scope 1 – Mobile Combustion
INSERT INTO emission_factors (name, scope, category, subcategory, unit, factor_kg_co2e, source, valid_year) VALUES
('Car - Diesel (average)', 'scope1', 'mobile_combustion', 'car_diesel', 'km', 0.16844, 'DEFRA', 2025),
('Car - Petrol (average)', 'scope1', 'mobile_combustion', 'car_petrol', 'km', 0.17360, 'DEFRA', 2025),
('Car - Hybrid (average)', 'scope1', 'mobile_combustion', 'car_hybrid', 'km', 0.11800, 'DEFRA', 2025),
('Car - Unknown fuel', 'scope1', 'mobile_combustion', 'car_unknown', 'km', 0.17074, 'DEFRA', 2025),
('Car - Battery Electric', 'scope1', 'mobile_combustion', 'car_electric', 'km', 0.00000, 'DEFRA', 2025),
('Van - Diesel (average)', 'scope1', 'mobile_combustion', 'van_diesel', 'km', 0.24776, 'DEFRA', 2025),
('Van - Petrol (average)', 'scope1', 'mobile_combustion', 'van_petrol', 'km', 0.25920, 'DEFRA', 2025),
('HGV - Rigid (average)', 'scope1', 'mobile_combustion', 'hgv_rigid', 'km', 0.89400, 'DEFRA', 2025),
('HGV - Articulated (average)', 'scope1', 'mobile_combustion', 'hgv_artic', 'km', 0.93200, 'DEFRA', 2025),
('Motorcycle (average)', 'scope1', 'mobile_combustion', 'motorcycle', 'km', 0.11340, 'DEFRA', 2025);

-- Scope 1 – Refrigerants
INSERT INTO emission_factors (name, scope, category, subcategory, unit, factor_kg_co2e, source, valid_year) VALUES
('HFC-23', 'scope1', 'refrigerants', 'HFC-23', 'kg', 12400, 'DEFRA', 2025),
('HFC-32', 'scope1', 'refrigerants', 'HFC-32', 'kg', 677, 'DEFRA', 2025),
('HFC-125', 'scope1', 'refrigerants', 'HFC-125', 'kg', 3170, 'DEFRA', 2025),
('HFC-134a', 'scope1', 'refrigerants', 'HFC-134a', 'kg', 1300, 'DEFRA', 2025),
('HFC-143a', 'scope1', 'refrigerants', 'HFC-143a', 'kg', 4800, 'DEFRA', 2025),
('HFC-152a', 'scope1', 'refrigerants', 'HFC-152a', 'kg', 138, 'DEFRA', 2025),
('HFC-227ea', 'scope1', 'refrigerants', 'HFC-227ea', 'kg', 3350, 'DEFRA', 2025),
('HFC-245fa', 'scope1', 'refrigerants', 'HFC-245fa', 'kg', 858, 'DEFRA', 2025),
('R-404A', 'scope1', 'refrigerants', 'R-404A', 'kg', 3922, 'DEFRA', 2025),
('R-407C', 'scope1', 'refrigerants', 'R-407C', 'kg', 1774, 'DEFRA', 2025),
('R-410A', 'scope1', 'refrigerants', 'R-410A', 'kg', 2088, 'DEFRA', 2025),
('R-507A', 'scope1', 'refrigerants', 'R-507A', 'kg', 3985, 'DEFRA', 2025),
('Sulphur hexafluoride (SF6)', 'scope1', 'refrigerants', 'SF6', 'kg', 23500, 'DEFRA', 2025);

-- Scope 1 – Industrial Gases
INSERT INTO emission_factors (name, scope, category, subcategory, unit, factor_kg_co2e, source, valid_year) VALUES
('Carbon dioxide (CO2)', 'scope1', 'industrial_gases', 'CO2', 'kg', 1, 'DEFRA', 2025),
('Nitrous oxide (N2O)', 'scope1', 'industrial_gases', 'N2O', 'kg', 265, 'DEFRA', 2025),
('Methane (CH4)', 'scope1', 'industrial_gases', 'CH4', 'kg', 28, 'DEFRA', 2025),
('HFC-236fa (fire suppression)', 'scope1', 'industrial_gases', 'HFC-236fa', 'kg', 8060, 'DEFRA', 2025);

-- Scope 2 – Electricity
INSERT INTO emission_factors (name, scope, category, subcategory, unit, factor_kg_co2e, source, valid_year, country_code) VALUES
('Electricity - UK Grid', 'scope2', 'electricity', 'grid_electricity', 'kWh', 0.17700, 'DEFRA', 2025, 'GB'),
('Electricity - Slovenia Grid', 'scope2', 'electricity', 'grid_electricity', 'kWh', 0.24600, 'IEA', 2025, 'SI'),
('Electricity - Germany Grid', 'scope2', 'electricity', 'grid_electricity', 'kWh', 0.38400, 'IEA', 2025, 'DE'),
('Electricity - Austria Grid', 'scope2', 'electricity', 'grid_electricity', 'kWh', 0.10600, 'IEA', 2025, 'AT'),
('Electricity - Italy Grid', 'scope2', 'electricity', 'grid_electricity', 'kWh', 0.37100, 'IEA', 2025, 'IT'),
('Electricity - Croatia Grid', 'scope2', 'electricity', 'grid_electricity', 'kWh', 0.19800, 'IEA', 2025, 'HR'),
('Electricity - Renewable (market-based)', 'scope2', 'electricity', 'renewable', 'kWh', 0.00000, 'GHG_PROTOCOL', 2025, NULL);
