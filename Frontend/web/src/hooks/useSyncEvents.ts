import { useEffect, useRef } from 'react'
import type { SyncEvent }   from '../lib/api'
import { supabase }         from '../lib/supabase'

export function useSyncEvents(onSync: (event: SyncEvent) => void): void {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  useEffect(() => {
    const channel = supabase
      .channel('sync_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sync_log' },
        (payload) => {
          const row = payload.new as {
            id:               number
            source_sheet:     string
            insertados:       number
            fallidos:         number
            placas_generadas: string[]
            created_at:       string
          }
          onSyncRef.current({
            id:              row.id,
            sourceSheet:     row.source_sheet,
            insertados:      row.insertados,
            fallidos:        row.fallidos,
            placasGeneradas: row.placas_generadas ?? [],
            createdAt:       row.created_at,
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}
