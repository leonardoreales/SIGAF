import { useState, useEffect } from 'react'
import { activityBus, loadActivityLog, type ActivityEntry } from '../lib/activityBus'

export type { ActivityEntry }

export function useActivityLog(): ActivityEntry[] {
  const [entries, setEntries] = useState<ActivityEntry[]>(loadActivityLog)

  useEffect(() => {
    return activityBus.subscribe(entry => {
      setEntries(prev => [entry, ...prev].slice(0, 50))
    })
  }, [])

  return entries
}
