/**
 * Backend timestamps are UTC but may lack the "Z" suffix.
 * This normalizes them before conversion so JavaScript correctly
 * applies the user's local timezone offset.
 */
function ensureUTC(ts: string): string {
  if (!ts) return ts
  const trimmed = ts.trim()
  if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) return trimmed
  return trimmed + 'Z'
}

export function toLocalTime(ts: string | undefined | null): string {
  if (!ts) return ''
  try {
    return new Date(ensureUTC(ts)).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return ts }
}

export function toLocalDate(ts: string | undefined | null): string {
  if (!ts) return ''
  try {
    return new Date(ensureUTC(ts)).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return ts }
}

export function toLocalShort(ts: string | undefined | null): string {
  if (!ts) return ''
  try {
    return new Date(ensureUTC(ts)).toLocaleTimeString(undefined, {
      hour12: false, hour: '2-digit', minute: '2-digit',
    })
  } catch { return ts }
}
