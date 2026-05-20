import { AlertTriangle } from 'lucide-react'

export default function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertTriangle size={16} className="shrink-0" />
      {message}
    </div>
  )
}
