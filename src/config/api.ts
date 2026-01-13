// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Convert HTTP URL to WebSocket URL
export const getWebSocketUrl = (path: string): string => {
  const url = new URL(API_URL)
  if (url.protocol === 'https:') {
    url.protocol = 'wss:'
  } else {
    url.protocol = 'ws:'
  }
  url.pathname = path
  return url.toString()
}

export const getApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${API_URL}/${cleanPath}`
}

export default API_URL
