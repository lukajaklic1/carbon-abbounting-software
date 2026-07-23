export const mockOrg = {
  id: 'mock-org-1',
  name: 'Acme Corp d.o.o.',
  slug: 'acme-corp',
  industry: 'manufacturing',
  country_code: 'SI',
  plan: 'free' as const,
  owner_id: 'mock-user-1',
  created_at: '2025-01-01',
}

export const mockLocations = [
  { id: 'loc-1', organization_id: 'mock-org-1', name: 'Glavna pisarna Ljubljana', address: 'Dunajska cesta 1, Ljubljana', country_code: 'SI', is_active: true, created_at: '2025-01-01' },
  { id: 'loc-2', organization_id: 'mock-org-1', name: 'Skladišče Koper', address: 'Industrijska ulica 5, Koper', country_code: 'SI', is_active: true, created_at: '2025-01-02' },
]

export const mockVehicles = [
  { id: 'veh-1', organization_id: 'mock-org-1', name: 'VW Golf – LJ 123 AB', vehicle_type: 'car', fuel_type: 'diesel', size_category: 'medium', is_active: true, created_at: '2025-01-01' },
  { id: 'veh-2', organization_id: 'mock-org-1', name: 'Ford Transit – LJ 456 CD', vehicle_type: 'van', fuel_type: 'diesel', size_category: 'large', is_active: true, created_at: '2025-01-02' },
  { id: 'veh-3', organization_id: 'mock-org-1', name: 'Toyota Yaris – LJ 789 EF', vehicle_type: 'car', fuel_type: 'petrol', size_category: 'small', is_active: true, created_at: '2025-01-03' },
]

export const mockEquipment = [
  { id: 'eq-1', organization_id: 'mock-org-1', name: 'Plinski kotel – Ljubljana', equipment_type: 'boiler', location_id: 'loc-1', locations: { name: 'Glavna pisarna Ljubljana' }, is_active: true, created_at: '2025-01-01' },
  { id: 'eq-2', organization_id: 'mock-org-1', name: 'Klimatska naprava', equipment_type: 'air_conditioning', location_id: 'loc-1', locations: { name: 'Glavna pisarna Ljubljana' }, is_active: true, created_at: '2025-01-02' },
  { id: 'eq-3', organization_id: 'mock-org-1', name: 'Hladilna komora', equipment_type: 'refrigeration', location_id: 'loc-2', locations: { name: 'Skladišče Koper' }, is_active: true, created_at: '2025-01-03' },
]

export const mockPeriod = {
  id: 'period-1',
  organization_id: 'mock-org-1',
  year: 2025,
  status: 'in_progress' as const,
  total_co2e_kg: 48320.5,
  created_at: '2025-01-01',
}

export const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL
