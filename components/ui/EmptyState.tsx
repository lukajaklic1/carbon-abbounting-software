'use client'

import React from 'react'

interface EmptyStateProps {
  icon?: React.ElementType
  iconNode?: React.ReactNode
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, iconNode, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center border-b border-gray-200">
      {iconNode
        ? <div className="mb-4" style={{ color: '#e4e4e8' }}>{iconNode}</div>
        : Icon
          ? <Icon className="h-8 w-8 mb-4" style={{ color: '#e4e4e8' }} />
          : null
      }

      <p className="text-[15px] font-medium text-gray-900 mb-2">{title}</p>

      {subtitle && (
        <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed">{subtitle}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}
