import { KpiWidget, type KpiWidgetProps } from '../../components/ui/KpiWidget'

// Re-export KpiWidget as KpiCard (full variant) for backward compatibility.
// New code should import KpiWidget directly.

type CardColor = 'default' | 'emerald' | 'red' | 'amber' | 'gold' | 'blue' | 'violet'

type Props = Omit<KpiWidgetProps, 'variant' | 'color'> & { color?: CardColor }

export default function KpiCard(props: Props) {
  return <KpiWidget variant="full" {...props} />
}
