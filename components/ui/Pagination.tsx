import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPage: (p: number) => void
  labelSl?: string
  labelEn?: string
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPage }: PaginationProps) {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[#ececec] bg-white">
      <p className="text-xs text-[#767676]">
        {from}–{to} od {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-[#767676] hover:text-[#031f18] hover:bg-[#fafafa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '...')[]>((acc, p, i, arr) => {
            if (i > 0 && (arr[i - 1] as number) + 1 < p) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-300">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`min-w-[28px] h-7 px-1 text-xs rounded-lg font-medium transition-colors ${
                  p === page
                    ? 'bg-[#26a552] text-white'
                    : 'text-[#767676] hover:bg-[#fafafa]'
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-[#767676] hover:text-[#031f18] hover:bg-[#fafafa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
