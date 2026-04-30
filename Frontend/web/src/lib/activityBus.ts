export type ActivityType =
  | 'sync'
  | 'asset_created'
  | 'asset_updated'
  | 'asset_deleted'
  | 'export'

export interface ActivityEntry {
  id:        string
  type:      ActivityType
  message:   string
  detail?:   string
  createdAt: string
}

type Listener = (entry: ActivityEntry) => void

const STORAGE_KEY = 'sigaf_activity'
const MAX_ENTRIES = 50

function loadEntries(): ActivityEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ActivityEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: ActivityEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

class ActivityBus {
  private readonly listeners = new Set<Listener>()

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  emit(entry: Omit<ActivityEntry, 'id' | 'createdAt'>): void {
    const full: ActivityEntry = {
      ...entry,
      id:        crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    const updated = [full, ...loadEntries()].slice(0, MAX_ENTRIES)
    saveEntries(updated)
    this.listeners.forEach(fn => fn(full))
  }
}

export const activityBus = new ActivityBus()
export { loadEntries as loadActivityLog }
