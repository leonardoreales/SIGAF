import type { LucideIcon } from 'lucide-react'

interface Props {
  icon:     LucideIcon
  title:    string
  desc?:    string
  cta?:     React.ReactNode
  variant?: 'default' | 'compact'
}

export default function EmptyState({ icon: Icon, title, desc, cta, variant = 'default' }: Props) {
  if (variant === 'compact') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 16px', gap: 8, textAlign: 'center',
      }}>
        <Icon size={18} style={{ color: 'var(--tbl-text-sub)', opacity: 0.5 }} />
        <p style={{ color: 'var(--tbl-text-sub)', fontSize: 12.5, margin: 0 }}>{title}</p>
      </div>
    )
  }

  return (
    <div style={{
      border: '1.5px dashed var(--tbl-border)',
      borderRadius: 12,
      padding: '52px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 10, textAlign: 'center',
    }}>
      <Icon size={28} style={{ color: 'var(--tbl-text-sub)', opacity: 0.45 }} />
      <p style={{ color: 'var(--tbl-text)', fontWeight: 600, fontSize: 14, margin: 0 }}>{title}</p>
      {desc && (
        <p style={{ color: 'var(--tbl-text-sub)', fontSize: 12.5, margin: 0, maxWidth: 320 }}>{desc}</p>
      )}
      {cta && <div style={{ marginTop: 8 }}>{cta}</div>}
    </div>
  )
}
