interface Blob {
  exists: boolean
  base64: string | null
  size: number
  mime: string | null
}

type Key = string

function makeKey(path: string, file: string, ref: string | null): Key {
  return `${path}::${ref ?? 'WD'}::${file}`
}

const cache = new Map<Key, Blob>()
const inflight = new Map<Key, Promise<Blob>>()

export function getCached(path: string, file: string, ref: string | null): Blob | undefined {
  return cache.get(makeKey(path, file, ref))
}

export async function fetchBlob(
  path: string,
  file: string,
  ref: string | null
): Promise<Blob> {
  const key = makeKey(path, file, ref)
  const cached = cache.get(key)
  if (cached) return cached
  const pending = inflight.get(key)
  if (pending) return pending

  const req: { path: string; file: string; ref?: string } = { path, file }
  if (ref) req.ref = ref
  const p = window.api
    .invoke('repository:fileBlob', req)
    .then((r: Blob) => {
      cache.set(key, r)
      inflight.delete(key)
      return r
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })
  inflight.set(key, p)
  return p
}

export function prefetchBlob(path: string, file: string, ref: string | null): void {
  fetchBlob(path, file, ref).catch(() => {})
}

export function clearCacheFor(path: string): void {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith(`${path}::`)) cache.delete(k)
  }
  for (const k of Array.from(inflight.keys())) {
    if (k.startsWith(`${path}::`)) inflight.delete(k)
  }
}

const MAX_ENTRIES = 80
export function trimCache(): void {
  if (cache.size <= MAX_ENTRIES) return
  const excess = cache.size - MAX_ENTRIES
  let removed = 0
  for (const k of cache.keys()) {
    if (removed >= excess) break
    cache.delete(k)
    removed++
  }
}
