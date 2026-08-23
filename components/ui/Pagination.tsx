import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPage }: PaginationProps) {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-xs font-medium text-gray-500">
        Prikazano <span className="text-gray-900">{from}–{to}</span> od <span className="text-gray-900">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => { onPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#f6f6f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPages().map((p, i) =>
          p === '...'
            ? <span key={`e-${i}`} className="w-8 text-center text-xs text-gray-400">…</span>
            : (
              <button
                key={p}
                onClick={() => { onPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                  p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-[#f6f6f6]',
                )}
              >
                {p}
              </button>
            )
        )}
        <button
          onClick={() => { onPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#f6f6f6] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
