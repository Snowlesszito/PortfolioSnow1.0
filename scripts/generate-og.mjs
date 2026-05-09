import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = join(__dir, '..')

const profileImg = readFileSync(join(root, 'src/assets/images/outros/about/perfil.jpg'))
const profileSrc = `data:image/jpeg;base64,${profileImg.toString('base64')}`

const fontData = readFileSync('C:/Windows/Fonts/segoeui.ttf')
const fontBold = readFileSync('C:/Windows/Fonts/segoeuib.ttf')

function el(tag, props, ...children) {
  return { type: tag, props: { ...props, children: children.length === 1 ? children[0] : children.flat() } }
}

const stats = [
  { num: '+2',  label: 'YEARS OF\nEXPERIENCE' },
  { num: '+40', label: 'COMPLETED\nARTWORKS' },
  { num: '+13', label: 'SATISFIED\nCLIENTS' },
]

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
  el('img', {
    src: profileSrc,
    style: {
      width: 280, height: 280,
      borderRadius: 24,
      border: '6px solid #66a4db',
      objectFit: 'cover',
      flexShrink: 0,
      boxShadow: '0 12px 40px rgba(102,164,219,0.3)',
    }
  }),

  el('div', { style: { display: 'flex', flexDirection: 'column', gap: 18, flex: 1 } },
    el('div', { style: { fontSize: 96, fontWeight: 800, color: '#66a4db', lineHeight: 1 } }, 'Snowless'),

    el('div', { style: { fontSize: 26, color: '#555', lineHeight: 1.55 } },
      'Minecraft & Roblox thumbmaker and keyartist · Thumbnails, Key Art, banners and more'
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
