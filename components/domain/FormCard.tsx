import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function FormCard({ title, subtitle, backHref, children }: {
  title: string
  subtitle?: string
  backHref: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <div className="mb-5">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-xl">
        {children}
      </div>
    </div>
  )
}

export function FormField({ label, children, hint }: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export function FormInput({ name, placeholder, defaultValue, required, maxLength }: {
  name: string
  placeholder?: string
  defaultValue?: string
  required?: boolean
  maxLength?: number
}) {
  return (
    <input
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      maxLength={maxLength}
      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-gray-300"
    />
  )
}

export function FormSelect({ name, defaultValue, children }: {
  name: string
  defaultValue?: string
  children: React.ReactNode
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
    >
      {children}
    </select>
  )
}
