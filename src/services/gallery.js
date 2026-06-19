import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { STATIC_GALLERY_URLS } from './staticUrls'

export const GALLERY_CATEGORIES = ['thumbnails', 'keyarts', 'promocional', 'profiles']
export const GALLERY_PLATFORMS = ['minecraft', 'roblox']

const staticSrcMap = STATIC_GALLERY_URLS

const staticGalleryItems = Object.fromEntries(
  Object.entries(staticSrcMap).map(([category, platformMap]) => [
    category,
    Object.fromEntries(
      Object.entries(platformMap).map(([platform, map]) => [
        platform,
        Object.entries(map).map(([name, src], index) => ({
          id: `static_${category}_${platform}_${index}`,
          src,
          label: name,
        })),
      ])
    ),
  ])
)

export function getStaticGalleryItems(category, platform) {
  if (platform) {
    return staticGalleryItems[category]?.[platform] ?? []
  }

  if (category === 'thumbnails' || category === 'profiles') {
    return [
      ...(staticGalleryItems[category]?.minecraft ?? []),
      ...(staticGalleryItems[category]?.roblox ?? []),
    ]
  }

  return staticGalleryItems[category]?.minecraft ?? []
}

function resolveItemUrl(item, category, platform) {
  if (!item) return null
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    const candidates = [item.url, item.src, item.image, item.link, item.path]
    const found = candidates.find(value => typeof value === 'string' && value.trim().length > 0)
    if (found) return found

    if (item.name && typeof item.name === 'string') {
      if (!platform) {
        const sourceMap = staticSrcMap[category]
        if (!sourceMap) return null
        return sourceMap.minecraft?.[item.name] ?? sourceMap.roblox?.[item.name] ?? null
      }
      return staticSrcMap[category]?.[platform]?.[item.name] ?? null
    }
  }
  return null
}

function mergeWithFallback(items, fallback) {
  if (!fallback || !fallback.length) return items
  const remoteBySrc = new Map(
    items
      .filter(item => item.src)
      .map(item => [item.src.trim(), item])
  )

  const result = fallback.map(item => {
    const src = item.src?.trim()
    return src && remoteBySrc.has(src)
      ? remoteBySrc.get(src)
      : item
  })

  const fallbackSrcs = new Set(result.map(item => item.src?.trim()).filter(Boolean))
  const extra = items.filter(item => {
    const src = item.src?.trim()
    return src && !fallbackSrcs.has(src)
  })

  return [...result, ...extra]
}

export async function loadGalleryItems(category, platform) {
  if (!platform) {
    if (category === 'thumbnails' || category === 'profiles') {
      const [minecraft, roblox] = await Promise.all([
        loadGalleryItems(category, 'minecraft'),
        loadGalleryItems(category, 'roblox'),
      ])
      return [...minecraft, ...roblox]
    }

    return loadGalleryItems(category, 'minecraft')
  }

  const normalizedPlatform = platform.toLowerCase()
  const fallback = getStaticGalleryItems(category, normalizedPlatform)

  try {
    const snap = await getDoc(doc(db, 'galleries', category))
    if (!snap.exists()) {
      if (category === 'thumbnails') {
        const oldSnap = await getDoc(doc(db, 'thumbnails', normalizedPlatform))
        if (oldSnap.exists()) {
          const stored = oldSnap.data().order ?? oldSnap.data().images?.map(img => ({ ...img, isStatic: false })) ?? []
          const resolvedOld = stored
            .map((item, index) => ({
              id: item?.id ?? item?.name ?? item?.url ?? (typeof item === 'string' ? item : `${category}_${normalizedPlatform}_${index}`),
              src: resolveItemUrl(item, category, normalizedPlatform),
              label: item?.label ?? item?.name ?? (typeof item === 'string' ? item : `Item ${index + 1}`),
            }))
            .filter(item => item.src)
          const mergedOld = mergeWithFallback(resolvedOld, fallback)
          return mergedOld.length ? mergedOld : fallback
        }
      }
      return fallback
    }

    const data = snap.data()
    const rawItems = data.platforms?.[normalizedPlatform]
      ?? data[normalizedPlatform]
      ?? data.order
      ?? data.images
      ?? data.items
      ?? data.urls
      ?? Object.values(data).find(value => Array.isArray(value))
      ?? []

    if (!Array.isArray(rawItems) || rawItems.length === 0) return fallback

    const resolvedItems = rawItems
      .map((item, index) => {
        const resolved = resolveItemUrl(item, category, normalizedPlatform)
        return {
          id: item?.id ?? item?.name ?? item?.url ?? (typeof item === 'string' ? item : null) ?? `${category}_${normalizedPlatform}_${index}`,
          url: resolved,
          src: resolved,
          label: item?.label ?? item?.name ?? (typeof item === 'string' ? item : `Item ${index + 1}`),
        }
      })
      .filter(item => item.src)

    if (category === 'thumbnails') {
      const merged = mergeWithFallback(resolvedItems, fallback)
      return merged.length ? merged : fallback
    }

    return resolvedItems.length ? resolvedItems : fallback
  } catch (error) {
    console.warn('[gallery] loadGalleryItems failed for', category, platform, error)
    return fallback
  }
}

export async function loadGalleryPlatform(category, platform) {
  try {
    const snap = await getDoc(doc(db, 'galleries', category))
    if (!snap.exists()) return []

    const rawItems = snap.data().platforms?.[platform] ?? []
    if (!Array.isArray(rawItems) || rawItems.length === 0) return []

    return rawItems
      .map((item, index) => ({
        id: item.id ?? item.name ?? item.url ?? `${category}_${platform}_${index}`,
        url: item.url ?? item.src ?? null,
        label: item.label ?? item.name ?? `Item ${index + 1}`,
      }))
      .filter(item => item.url)
  } catch (error) {
    console.warn('[gallery] loadGalleryPlatform failed for', category, platform, error)
    return []
  }
}

export async function saveGalleryItems(category, platform, items) {
  const sanitized = items.map((item, index) => {
    const url = item.url ?? item.src ?? item.path ?? null
    return {
      id: item.id ?? `${category}_${platform}_${index}`,
      url,
      label: item.label ?? (url ? url.split('/').pop() : `Item ${index + 1}`),
    }
  }).filter(item => item.url)
  await setDoc(doc(db, 'galleries', category), { platforms: { [platform]: sanitized } }, { merge: true })
}
