export const PLAN_LIMITS = {
  free: {
    reporting_periods: 1,
    locations: 1,
    vehicles: 2,
    equipment: 3,
    pdf_export: false,
    csrd_report: false,
    analytics: 'basic' as const,
  },
  starter: {
    reporting_periods: 3,
    locations: 5,
    vehicles: 10,
    equipment: 15,
    pdf_export: true,
    csrd_report: false,
    analytics: 'full' as const,
  },
  professional: {
    reporting_periods: Infinity,
    locations: Infinity,
    vehicles: Infinity,
    equipment: Infinity,
    pdf_export: true,
    csrd_report: true,
    analytics: 'full' as const,
  },
  enterprise: {
    reporting_periods: Infinity,
    locations: Infinity,
    vehicles: Infinity,
    equipment: Infinity,
    pdf_export: true,
    csrd_report: true,
    analytics: 'full' as const,
  },
} as const

export type Plan = keyof typeof PLAN_LIMITS

export function getPlanLimit(plan: Plan, key: keyof (typeof PLAN_LIMITS)['free']) {
  return PLAN_LIMITS[plan][key]
}
