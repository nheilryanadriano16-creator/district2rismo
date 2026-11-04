export function normalizeRole(role) {
  return String(role || 'customer').trim().toLowerCase()
}

export function getDashboardPath(role) {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return '/admin'
  if (normalized === 'host') return '/host'
  return '/'
}
