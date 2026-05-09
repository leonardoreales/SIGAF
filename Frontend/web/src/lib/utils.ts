import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtCOP(raw: string | number | null | undefined): string {
  const n = Number(raw)
  if (isNaN(n) || n === 0) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

export function fmtNum(n: number): string {
  return n.toLocaleString('es-CO')
}
