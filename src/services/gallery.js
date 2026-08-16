/**
 * gallery.js — sistema unificado de galeria
 *
 * Estrutura no Firestore:
 *   galleries/{category}  →  { platforms: { minecraft: [...], roblox: [...] } }
 *
 * Cada item salvo tem a forma:  { id, url, label }
 *
 * Thumbnails agora vivem AQUI também (migração automática da coleção velha
 * `thumbnails/{cat}` na primeira leitura).
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { STATIC_GALLERY_URLS } from './staticUrls'

export const GALLERY_CATEGORIES = ['thumbnails', 'keyarts', 'promocional', 'profiles']
export const GALLERY_PLATFORMS   = ['minecraft', 'roblox']

// ─── helpers estáticos ────────────────────────────────────────────────────────

/**
 * Retorna a lista estática de uma categoria/plataforma como objetos
 * { id, src, url, label }.
 */
export function getStaticGalleryItems(category, platform) {
  const cat = STATIC_GALLERY_URLS[category]
  if (!cat) return []

  if (platform) {
    const map = cat[platform] ?? {}
    return Object.entries(map).map(([name, src], i) => ({
      id:    `static_${category}_${platform}_${i}`,
      src,
      url:   src,
      label: name,
    }))
  }

  // sem plataforma: retorna tudo em sequência
  return GALLERY_PLATFORMS.flatMap((plt) => getStaticGalleryItems(category, plt))
}

// ─── serialização / desserialização ──────────────────────────────────────────

/** Converte um item do Firestore (ou legado) para { id, src, url, label }. */
function deserializeItem(raw, index, category, platform) {
  if (!raw) return null

  // item já no formato novo
  const url =
    raw.url  ??
    raw.src  ??
    raw.image ??
    raw.link  ??
    raw.path  ??
    (typeof raw === 'string' ? raw : null)

  if (!url) {
    // tentativa: item estático referenciado por nome
    if (raw.name) {
      const staticUrl =
        STATIC_GALLERY_URLS[category]?.[platform]?.[raw.name] ?? null
      if (staticUrl) {
        return {
          id:    raw.id ?? `static_${category}_${platform}_${index}`,
          src:   staticUrl,
          url:   staticUrl,
          label: raw.label ?? raw.name,
        }
      }
    }
    return null
  }

  return {
    id:    raw.id ?? raw.name ?? url ?? `${category}_${platform}_${index}`,
    src:   url,
    url,
    label: raw.label ?? raw.name ?? url.split('/').pop() ?? `Item ${index + 1}`,
  }
}

/** Converte um item de volta para o formato mínimo a ser salvo. */
function serializeItem(item, index, category, platform) {
  const url = item.url ?? item.src ?? null
  if (!url) return null
  return {
    id:    item.id ?? `${category}_${platform}_${index}`,
    url,
    label: item.label ?? url.split('/').pop() ?? `Item ${index + 1}`,
  }
}

// ─── migração legado ──────────────────────────────────────────────────────────

/**
 * Lê a coleção antiga `thumbnails/{platform}` e retorna itens deserializados.
 * Retorna [] se não existir.
 */
async function migrateOldThumbnails(platform) {
  try {
    const snap = await getDoc(doc(db, 'thumbnails', platform))
    if (!snap.exists()) return []

    const stored =
      snap.data().order ??
      snap.data().images?.map((img) => ({ ...img })) ??
      []

    const staticMap = STATIC_GALLERY_URLS.thumbnails?.[platform] ?? {}

    return stored
      .map((raw, i) => {
        // item estático legado: { name, isStatic: true }
        if (raw.isStatic && raw.name) {
          const url = staticMap[raw.name]
          if (!url) return null
          return { id: `static_thumbnails_${platform}_${i}`, src: url, url, label: raw.name }
        }
        return deserializeItem(raw, i, 'thumbnails', platform)
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

// ─── leitura ─────────────────────────────────────────────────────────────────

/**
 * Carrega itens de uma categoria/plataforma.
 *
 * Prioridade:
 *   1. Firestore `galleries/{category}.platforms.{platform}`
 *   2. Migração da coleção antiga `thumbnails/{platform}` (só para thumbnails)
 *   3. Fallback estático de staticUrls.js
 *
 * @param {string} category
 * @param {string|undefined} platform  — se omitido, retorna todas as plataformas
 */
export async function loadGalleryItems(category, platform) {
  // sem plataforma: retorna todas em sequência
  if (!platform) {
    const results = await Promise.all(
      GALLERY_PLATFORMS.map((plt) => loadGalleryItems(category, plt))
    )
    return results.flat()
  }

  const plt      = platform.toLowerCase()
  const fallback = getStaticGalleryItems(category, plt)

  try {
    const snap = await getDoc(doc(db, 'galleries', category))

    if (snap.exists()) {
      // ── lê do sistema novo ──
      const raw = snap.data()?.platforms?.[plt]

      // garante que só usamos o campo da plataforma certa
      if (!Array.isArray(raw) || raw.length === 0) return fallback

      const items = raw
        .map((item, i) => deserializeItem(item, i, category, plt))
        .filter(Boolean)

      return items.length ? items : fallback
    }

    // ── doc não existe: tenta migração legada (thumbnails) ──
    if (category === 'thumbnails') {
      const migrated = await migrateOldThumbnails(plt)
      if (migrated.length) return migrated
    }

    return fallback
  } catch (err) {
    console.warn('[gallery] loadGalleryItems error', category, plt, err)
    return fallback
  }
}

// ─── escrita ──────────────────────────────────────────────────────────────────

/**
 * Salva itens de uma plataforma específica sem sobrescrever a outra.
 *
 * @param {string} category
 * @param {string} platform
 * @param {Array}  items    — itens com pelo menos { url } ou { src }
 */
export async function saveGalleryItems(category, platform, items) {
  const plt       = platform.toLowerCase()
  const sanitized = items
    .map((item, i) => serializeItem(item, i, category, plt))
    .filter(Boolean)

  await setDoc(
    doc(db, 'galleries', category),
    { platforms: { [plt]: sanitized } },
    { merge: true }
  )
}