'use client'

import React from 'react'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Icon container */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: '#f4f4f5' }}>
        <Icon className="h-6 w-6" style={{ color: '#a1a1aa' }} />
      </div>

      {/* Title */}
      <p className="text-[15px] font-semibold text-[#0f0f10] mb-2">{title}</p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[13px] text-[#767676] max-w-[280px] leading-relaxed">{subtitle}</p>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0f0f10] bg-white border border-[#ececec] hover:bg-[#fafafa] px-4 py-2 rounded-xl transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}
