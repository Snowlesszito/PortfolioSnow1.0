import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

let profileSrc = null
try {
  const profileImg = readFileSync(join(root, 'src/assets/images/outros/about/perfil.jpg'))
  profileSrc = `data:image/jpeg;base64,${profileImg.toString('base64')}`
} catch (e) {
  // local image missing — try to fetch the static URL used by the app
  try {
    const fallback = 'https://i.postimg.cc/zGwN7NKz/Perfil_About.png'
    const res = await fetch(fallback)
    if (res.ok) {
      const ab = await res.arrayBuffer()
      profileSrc = `data:image/png;base64,${Buffer.from(ab).toString('base64')}`
    }
  } catch (err) {
    // ignore, we'll render without a profile image
  }
}

const fontData = readFileSync('C:/Windows/Fonts/segoeui.ttf')
const fontBold = readFileSync('C:/Windows/Fonts/segoeuib.ttf')

// Try to read the About bio from the React component to keep OG in sync
let aboutBio = ''
try {
  const aboutSrc = readFileSync(join(root, 'src/components/About/About.jsx'), 'utf8')
  const m = aboutSrc.match(/<p className="about-bio">([\s\S]*?)<\/p>/)
  if (m) aboutBio = m[1].replace(/\s+/g, ' ').trim()
} catch (e) {
  // ignore, fall back to default below
}

let ogTagline = ''
if (aboutBio) {
  const aMatch = aboutBio.match(/A\s+([^\.]+)\./)
  if (aMatch) ogTagline = aMatch[1].trim()
  else ogTagline = (aboutBio.split('.').map(s => s.trim()).find(s => /thumbmaker|keyartist|thumbnail|thumbnails/i.test(s)) || aboutBio.split('.')[0]).trim()
}
if (!ogTagline) ogTagline = 'Minecraft & Roblox thumbmaker and keyartist'

function el(tag, props, ...children) {
  return { type: tag, props: { ...props, children: children.length === 1 ? children[0] : children.flat() } }
}

const stats = [
  { num: '+2',  label: 'YEARS OF\nEXPERIENCE' },
  { num: '+40', label: 'COMPLETED\nARTWORKS' },
  { num: '+13', label: 'SATISFIED\nCLIENTS' },
]

// If a local snapshot exists (downloaded from Admin > Export snapshot), use it to update stats
try {
  // First, try to read Firestore directly via REST using values from .env
  try {
    const envRaw = readFileSync(join(root, '.env'), 'utf8')
    const env = Object.fromEntries(envRaw.split(/\r?\n/).map(l => l.split('=').map(s => s && s.trim())).filter(Boolean))
    const apiKey = env['VITE_FIREBASE_API_KEY']?.replace(/"/g, '').trim()
    const projectId = env['VITE_FIREBASE_PROJECT_ID']?.replace(/"/g, '').trim()
    if (apiKey && projectId) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/commissions/status?key=${apiKey}`
      const res = await fetch(url)
      if (res.ok) {
        const doc = await res.json()
        const f = doc.fields || {}
        const completed = (f.concluidos && f.concluidos.arrayValue && Array.isArray(f.concluidos.arrayValue.values)) ? f.concluidos.arrayValue.values.length : undefined
        const clients = (f.clients && f.clients.arrayValue && Array.isArray(f.clients.arrayValue.values)) ? f.clients.arrayValue.values.length : undefined
        if (typeof completed === 'number') stats[1].num = `+${completed}`
        if (typeof clients === 'number')   stats[2].num = `+${clients}`
      }
    }
  } catch (e) {
    // ignore Firestore fetch errors and fall back to snapshot/defaults
  }

  const snapshotPath = join(root, 'commissions-snapshot.json')
  const raw = readFileSync(snapshotPath, 'utf8')
  const snap = JSON.parse(raw)
  const completed = Array.isArray(snap.concluidos) ? snap.concluidos.length : (snap.concluded?.length || 0)
  const clients = Array.isArray(snap.clients) ? snap.clients.length : 0
  stats[1].num = `+${completed}`
  stats[2].num = `+${clients}`
} catch (e) {
  // no snapshot present — keep defaults
}

const image = el('div', {
  style: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center',
    background: 'linear-gradient(135deg, #ddeef9 0%, #f2f7fb 60%, #e8f4ff 100%)',
    padding: '52px 60px',
    gap: '52px',
    fontFamily: 'Inter',
    position: 'relative',
  }
},
  profileSrc ? el('img', {
    src: profileSrc,
    style: {
      width: 280, height: 280,
      borderRadius: 24,
      border: '6px solid #66a4db',
      objectFit: 'cover',
      flexShrink: 0,
      boxShadow: '0 12px 40px rgba(102,164,219,0.3)',
    }
  }) : el('div', {
    style: {
      width: 280, height: 280,
      borderRadius: 24,
      background: '#e9f2fb',
      border: '6px solid #66a4db',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#66a4db', fontSize: 64, fontWeight: 800,
      flexShrink: 0,
    }
  }, 'S'),

  el('div', { style: { display: 'flex', flexDirection: 'column', gap: 18, flex: 1 } },
    el('div', { style: { fontSize: 96, fontWeight: 800, color: '#66a4db', lineHeight: 1 } }, 'Snowless'),

    el('div', { style: { fontSize: 26, color: '#555', lineHeight: 1.55 } },
      ogTagline
    ),

    el('div', { style: { display: 'flex', gap: 16, marginTop: 12 } },
      ...stats.map(s =>
        el('div', {
          style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '16px 34px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 16,
            border: '2px solid rgba(102,164,219,0.3)',
            boxShadow: '0 4px 20px rgba(102,164,219,0.1)',
          }
        },
          el('span', { style: { fontSize: 52, fontWeight: 800, color: '#66a4db', lineHeight: 1 } }, s.num),
          el('span', { style: { fontSize: 14, color: '#888', letterSpacing: '0.1em', textAlign: 'center', marginTop: 8, whiteSpace: 'pre' } }, s.label)
        )
      )
    )
  )
)

console.log('Gerando imagem...')
const svg = await satori(image, {
  width: 1200,
  height: 630,
  fonts: [
    { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
    { name: 'Inter', data: fontBold, weight: 800, style: 'normal' },
  ],
})

const png = new Resvg(svg).render().asPng()
writeFileSync(join(root, 'public/og-preview.png'), png)
console.log('✓ public/og-preview.png gerado com sucesso!')
