import axios from 'axios'

export const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:8001'
export const API_BASE_URL = `${API_ORIGIN}/api`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export type EmployeeCard = {
  employee_id: string
  name: string
  preview_image_url?: string | null
  sample_count: number
  last_seen_location?: string | null
  last_seen_time?: string | null
}

export type CameraStatus = {
  camera_id: string
  display_name: string
  location: string
  source_type: string
  source_url?: string | null
  notes?: string | null
  is_active: boolean
  latest_preview?: string | null
  processed_at?: string | null
  face_detected: boolean
  similarity?: number | null
  highlighted: boolean
}

export type FindResponse = {
  found: boolean
  employee_id: string
  employee_name?: string | null
  location?: string | null
  camera_id?: string | null
  similarity?: number | null
  message: string
  cameras: CameraStatus[]
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http') || path.startsWith('data:')) return path
  return `${API_ORIGIN}${path}`
}

export const authApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  register: (username: string, password: string) => api.post('/auth/register', { username, password }),
}

export const employeeApi = {
  add: (payload: { name: string; employee_id: string; samples: string[] }) => api.post('/employee/add', payload),
  list: () => api.get<{ employees: EmployeeCard[] }>('/employees'),
  search: (query: string) => api.get<{ employees: EmployeeCard[] }>(`/employees/search?q=${encodeURIComponent(query)}`),
}

export const cameraApi = {
  list: () => api.get<{ cameras: CameraStatus[] }>('/cameras'),
  create: (payload: {
    camera_id: string
    display_name: string
    location: string
    source_type: string
    source_url?: string | null
    notes?: string | null
    is_active: boolean
  }) => api.post('/cameras', payload),
  update: (
    cameraId: string,
    payload: {
      display_name: string
      location: string
      source_type: string
      source_url?: string | null
      notes?: string | null
      is_active: boolean
    }
  ) => api.put(`/cameras/${encodeURIComponent(cameraId)}`, payload),
  sync: (frames: { camera_id: string; image: string }[]) => api.post('/cameras/sync', { frames }),
}

export const findApi = {
  find: (employee_id: string) => api.post<FindResponse>('/find', { employee_id }),
}

export const healthApi = {
  get: () => api.get('/health'),
}
