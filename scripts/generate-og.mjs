import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

const profilePath = join(root, 'public/site-assets/profile/Perfil-About.png')
const profileSrc = existsSync(profilePath)
  ? `data:image/png;base64,${readFileSync(profilePath).toString('base64')}`
  : null

const fontPaths = process.platform === 'win32'
  ? ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/segoeuib.ttf']
  : ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']
const [fontPath, fontBoldPath] = fontPaths
if (!existsSync(fontPath) || !existsSync(fontBoldPath)) {
  throw new Error(`Open Graph fonts not found: ${fontPath}, ${fontBoldPath}`)
}
const fontData = readFileSync(fontPath)
const fontBold = readFileSync(fontBoldPath)

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

const envPath = join(root, '.env')
const envRaw = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const localEnv = Object.fromEntries(
  envRaw.split(/\r?\n/)
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=')
      return separator < 0
        ? [line.trim(), '']
        : [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')]
    })
)
const apiKey = process.env.VITE_FIREBASE_API_KEY || localEnv.VITE_FIREBASE_API_KEY
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || localEnv.VITE_FIREBASE_PROJECT_ID

if (process.env.GITHUB_ACTIONS === 'true' && (!apiKey || !projectId)) {
  throw new Error('Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in GitHub Actions secrets')
}

if (apiKey && projectId) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/commissions/status?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Firestore request failed: ${response.status} ${response.statusText}`)
  }
  const { fields = {} } = await response.json()
  const completed = fields.concluidos?.arrayValue?.values
  const clients = fields.clients?.arrayValue?.values
  if (Array.isArray(completed)) stats[1].num = `+${completed.length}`
  if (Array.isArray(clients)) stats[2].num = `+${clients.length}`
} else {
  const snapshotPath = join(root, 'commissions-snapshot.json')
  if (existsSync(snapshotPath)) {
    const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'))
    const completed = Array.isArray(snapshot.concluidos) ? snapshot.concluidos.length : (snapshot.concluded?.length || 0)
    const clients = Array.isArray(snapshot.clients) ? snapshot.clients.length : 0
    stats[1].num = `+${completed}`
    stats[2].num = `+${clients}`
  }
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
const indexPath = join(root, 'index.html')
const cacheVersion = `${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-1`
const indexHtml = readFileSync(indexPath, 'utf8')
const cacheVersionPattern = /((?:property="og:image"|name="twitter:image")\s+content="https:\/\/snowlesszito\.com\/og-preview\.png\?v=)[^"]+(")/g
if ([...indexHtml.matchAll(cacheVersionPattern)].length !== 2) {
  throw new Error('Expected Open Graph and Twitter image URLs in index.html')
}
const updatedHtml = indexHtml.replace(
  cacheVersionPattern,
  `$1${cacheVersion}$2`
)
writeFileSync(indexPath, updatedHtml)
console.log('✓ public/og-preview.png gerado com sucesso!')
