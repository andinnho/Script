// Dynamic API base resolution for Dev (Vite port 5173) and Production/Portable environments
export const API_BASE = typeof window !== 'undefined' && window.location.origin.includes(':5173')
  ? 'http://localhost:3001'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
