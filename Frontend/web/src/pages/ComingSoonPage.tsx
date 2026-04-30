import { Construction } from 'lucide-react'

interface Props {
  title: string
}

export default function ComingSoonPage({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 select-none">
      <Construction
        size={48}
        className="text-gray-300 dark:text-mi-600"
        strokeWidth={1.5}
      />
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-mi-200">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-400 dark:text-mi-400">
          Módulo en desarrollo — próximamente disponible
        </p>
      </div>
    </div>
  )
}
