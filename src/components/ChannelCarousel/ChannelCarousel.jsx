import { useEffect, useRef, useState } from 'react'
import './ChannelCarousel.css'
import { loadDecorationAsset } from '../../services/decorations'
import { STATIC_DECORATION_URLS } from '../../services/staticUrls'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'

// ─── fallback estático ────────────────────────────────────────────────────────

const STATIC_CHANNELS = [
  {
    channelUrl: 'https://www.youtube.com/@cherryrar',
    subscribers: '5M',
    works: [
      { videoUrl: 'https://youtu.be/CKV9ypw_J0g?si=whbpNwMh15OQIL3Q' },
      { videoUrl: 'https://youtu.be/XCPrZd1TIR0?si=2BT87rlk7S5yZ-cA' },
    ],
  },
  {
    channelUrl: 'https://www.youtube.com/@PACtariik',
    subscribers: '1.44M',
    works: [{ videoUrl: 'https://youtu.be/5iecaGW8mVw?si=f8rfepjJAwsPzCAx' }],
  },
  {
    channelUrl: 'https://www.youtube.com/@Himaru',
    subscribers: '1.07M',
    works: [{ label: 'Teste A/B' }],
  },
  {
    channelUrl: 'https://www.youtube.com/@Febatista',
    subscribers: '4.98M',
    works: [{ videoUrl: 'https://youtu.be/f6G1Mag1px8?si=7QT_svaQaW-hNgQu' }],
  },
  {
    channelUrl: 'https://www.youtube.com/@FerrazJogando',
    subscribers: '39.7K',
    works: [
      { videoUrl: 'https://youtu.be/qAwds24C_-I?si=gEFDtoOZ1gk5lg0_' },
      { videoUrl: 'https://youtu.be/Y5dODL0QfwM?si=girGgnEHG9IPS3-0' },
      { videoUrl: 'https://youtu.be/JciovbtYlA0?si=osKOwwP4FJ2sf4cX' },
    ],
  },
  {
    channelUrl: 'https://www.youtube.com/@LifeboatNetwork',
    subscribers: '123K',
    works: [
      { videoUrl: 'https://youtu.be/vmWKyq5U0-w?si=Jd_yM-pHeNUviKTX' },
      { videoUrl: 'https://youtu.be/7UIs_eVkqYA?si=Np1URcxlLNpdX9nK' },
      { videoUrl: 'https://youtu.be/_ZAEtDEkptg?si=fuKS_WJsMQSLJbwl' },
      { videoUrl: 'https://youtu.be/24d0-OElGY8?si=JiKr1gSqGRYVG4PW' },
      { videoUrl: 'https://youtu.be/mlP0O-jaX5s?si=JdWR27k3b1lHHlKi' },
    ],
  },
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractHandle(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts[0] === 'channel') return { type: 'id', value: parts[1] }
    if (parts[0]?.startsWith('@')) return { type: 'handle', value: parts[0] }
    if (parts[0]) return { type: 'handle', value: '@' + parts[0] }
  } catch (_) {}
  return null
}

function extractVideoId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    return u.searchParams.get('v')
  } catch (_) {
    return null
  }
}

function getAvatarUrl(channelUrl) {
  const handle = extractHandle(channelUrl)
  if (!handle) return ''
  return `https://unavatar.io/youtube/${handle.value.replace('@', '')}`
}

function fetchChannelName(channelUrl) {
  const handle = extractHandle(channelUrl)
  if (!handle) return 'Unknown'
  return handle.value.replace('@', '')
}

// ─── ChannelCard ──────────────────────────────────────────────────────────────

function ChannelCard({ channel }) {
  const [name, setName] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const avatarUrl = getAvatarUrl(channel.channelUrl)

  useEffect(() => {
    setName(fetchChannelName(channel.channelUrl))
  }, [channel.channelUrl])

  const initials   = name ? name.slice(0, 2).toUpperCase() : '?'
  const validWorks = (channel.works ?? []).filter(w => w.videoUrl || w.label)

  return (
    <div className="cc-card">
      <a href={channel.channelUrl} target="_blank" rel="noreferrer" className="cc-channel-link">
        <div className="cc-avatar-wrap">
          {!avatarError ? (
            <img src={avatarUrl} alt={name} className="cc-avatar" onError={() => setAvatarError(true)} />
          ) : (
            <div className="cc-avatar-fallback">{initials}</div>
          )}
        </div>
        <div className="cc-info">
          <span className="cc-name">{name}</span>
          <span className="cc-subscribers">
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {channel.subscribers} subscribers
          </span>
        </div>
      </a>

      {validWorks.length > 0 ? (
        <div className="cc-works">
          {validWorks.map((work, i) => {
            if (!work.videoUrl) {
              return <div key={i} className="cc-work-badge"><span>{work.label}</span></div>
            }
            const vid   = extractVideoId(work.videoUrl)
            const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null
            return (
              <a key={i} href={work.videoUrl} target="_blank" rel="noreferrer"
                className="cc-work-link" title={work.label ?? 'Watch video'}>
                {thumb ? (
                  <img src={thumb} alt={work.label ?? `Work ${i + 1}`} className="cc-thumb" />
                ) : (
                  <div className="cc-thumb cc-thumb-placeholder">▶</div>
                )}
                {work.label && <span className="cc-work-label">{work.label}</span>}
                <div className="cc-play-overlay">
                  <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </a>
            )
          })}
        </div>
      ) : (
        <p className="cc-empty">Thumbnails coming soon</p>
      )}
    </div>
  )
}

// ─── ChannelCarousel ──────────────────────────────────────────────────────────

export default function ChannelCarousel() {
  const trackRef = useRef(null)
  const [canLeft,     setCanLeft]     = useState(false)
  const [canRight,    setCanRight]    = useState(true)
  const [channels,    setChannels]    = useState(STATIC_CHANNELS)
  const [sentadoSrc,  setSentadoSrc]  = useState(
    STATIC_DECORATION_URLS['outros/decoracoes/sentado.png'] || ''
  )

  // carrega decoration
  useEffect(() => {
    let active = true
    loadDecorationAsset('outros/decoracoes/sentado.png')
      .then(src => { if (active && src) setSentadoSrc(src) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  // carrega canais do Firestore
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'channels', 'list'))
        if (!snap.exists()) return
        const data = snap.data().channels
        if (active && Array.isArray(data) && data.length > 0) {
          setChannels(data)
        }
      } catch (err) {
        console.warn('[ChannelCarousel] failed to load from Firestore', err)
      }
    }
    load()
    return () => { active = false }
  }, [])

  function scroll(dir) {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }

  function updateArrows() {
    const t = trackRef.current
    if (!t) return
    setCanLeft(t.scrollLeft > 8)
    setCanRight(t.scrollLeft + t.clientWidth < t.scrollWidth - 8)
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', updateArrows, { passive: true })
    updateArrows()
    return () => track.removeEventListener('scroll', updateArrows)
  }, [])

  return (
    <section className="cc-section">
      <img src={sentadoSrc} alt="" className="cc-render-left" aria-hidden="true" />
      <h2 className="cc-title">Content creators I've worked with!</h2>
      <p className="cc-subtitle">Thumbnails for your favorite minecraft videos!</p>

      <div className="cc-wrapper">
        <button
          className={`cc-arrow cc-arrow-left ${!canLeft ? 'cc-arrow-hidden' : ''}`}
          onClick={() => scroll(-1)} aria-label="Previous"
        >◀</button>

        <div className="cc-track" ref={trackRef}>
          {channels.map((channel, i) => (
            <ChannelCard key={channel.channelUrl ?? i} channel={channel} />
          ))}
        </div>

        <button
          className={`cc-arrow cc-arrow-right ${!canRight ? 'cc-arrow-hidden' : ''}`}
          onClick={() => scroll(1)} aria-label="Next"
        >▶</button>
      </div>
    </section>
  )
}
