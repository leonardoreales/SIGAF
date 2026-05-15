interface Props {
  cols: number[]
  rows?: number
}

export default function SkeletonTable({ cols, rows = 6 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row}>
          {cols.map((w, col) => (
            <td key={col} style={{ padding: '14px 16px' }}>
              {w > 0 && (
                <div className="skeleton" style={{ height: 13, width: w, maxWidth: '100%' }} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
