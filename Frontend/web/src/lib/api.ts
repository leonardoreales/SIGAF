// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email:   string
  name:    string
  picture: string
}

export interface Asset {
  id:              number
  plate:           string | null
  plateStatus:     string
  name:            string
  description:     string | null
  assetTypeCode:   string | null
  assetTypeName:   string | null
  pucAccount:      string | null
  brand:           string | null
  model:           string | null
  serial:          string | null
  quantity:        number
  referenceValue:  string | null
  buildingId:      number | null
  buildingCode:    string | null
  buildingName:    string | null
  floor:           string | null
  block:           string | null
  location:        string | null
  areaId:          number | null
  areaName:        string | null
  personId:        number | null
  responsableRaw:  string | null
  status:          string
  incorporationYear: number | null
  notes:           string | null
  createdAt:       string
  updatedAt:       string
}

export interface AssetListResponse {
  data: Asset[]
  meta: { total: number; page: number; limit: number; pages: number }
}

export interface Building  { id: number; cityCode: string; code: string; name: string; active: boolean }
export interface AssetType { code: string; name: string; active: boolean }
export interface Area      { id: number; name: string; active: boolean }
export interface Person    { id: number; fullName: string; email: string | null; areaId: number | null; active: boolean }

// ── Client ────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sigaf_token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? 'Error', body.error)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── API namespaces ────────────────────────────────────────────────────────────

export const apiAuth = {
  loginWithGoogle: (idToken: string) =>
    request<{ token: string; user: AuthUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
}

export const apiAssets = {
  list: (params: Record<string, string | number | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string>
    const qs = new URLSearchParams(clean).toString()
    return request<AssetListResponse>(`/assets${qs ? `?${qs}` : ''}`)
  },
  get:    (id: number) => request<Asset>(`/assets/${id}`),
  create: (data: unknown) =>
    request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: unknown) =>
    request<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/assets/${id}`, { method: 'DELETE' }),
}

export const apiCatalogs = {
  buildings:  () => request<Building[]>('/catalogs/buildings'),
  assetTypes: () => request<AssetType[]>('/catalogs/asset-types'),
  areas:      () => request<Area[]>('/catalogs/areas'),
  people:     () => request<Person[]>('/catalogs/people'),
}
