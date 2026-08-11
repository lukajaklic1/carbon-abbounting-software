'use client'

import { X, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Potrdi', cancelLabel = 'Prekliči',
  destructive = true, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4">
          {destructive && (
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#031f18]">{title}</h3>
            <p className="text-sm text-[#455451] mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="p-1 text-[#455451] hover:text-[#455451] rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-[#031f18] bg-white border border-[#e2e2e4] rounded-xl hover:bg-[#f9f9f9] transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#26a552] hover:bg-[#1e8a43]'
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
