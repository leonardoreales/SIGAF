export interface SyncEvent {
  id:              number
  sourceSheet:     string
  insertados:      number
  fallidos:        number
  placasGeneradas: string[]
  createdAt:       string
}

export interface SyncNotifyPayload {
  source_sheet:      string
  insertados:        number
  fallidos:          number
  placas_generadas:  string[]
}
