import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { STATIC_DECORATION_URLS } from './staticUrls'

function getStaticDecorationAsset(key) {
  const basename = key.split('/').pop()
  return STATIC_DECORATION_URLS[key] || STATIC_DECORATION_URLS[basename] || ''
}

export async function loadDecorationAsset(key) {
  try {
    const snap = await getDoc(doc(db, 'decorations', 'assets'))
    const basename = key.split('/').pop()
    const data = snap.exists() ? snap.data() : {}
    return data[key] || data[basename] || getStaticDecorationAsset(key)
  } catch (error) {
    console.warn('[decorations] loadDecorationAsset failed for', key, error)
    return getStaticDecorationAsset(key)
  }
}

export async function loadDecorationAssets(keys) {
  try {
    const snap = await getDoc(doc(db, 'decorations', 'assets'))
    const data = snap.exists() ? snap.data() : {}
    return Object.fromEntries(
      keys.map(key => {
        const basename = key.split('/').pop()
        return [key, data[key] || data[basename] || getStaticDecorationAsset(key)]
      })
    )
  } catch (error) {
    console.warn('[decorations] loadDecorationAssets failed', error)
    return Object.fromEntries(keys.map(key => [key, getStaticDecorationAsset(key)]))
  }
}
