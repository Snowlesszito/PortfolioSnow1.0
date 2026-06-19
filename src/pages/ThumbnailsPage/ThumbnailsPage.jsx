import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../GalleryPage/GalleryPage.css'
import { loadGalleryItems } from '../../services/gallery'
import { STATIC_GALLERY_URLS } from '../../services/staticUrls'

const staticMinecraft = Object.entries(STATIC_GALLERY_URLS.thumbnails.minecraft).map(([name, src], i) => ({
  id: `static_mc_${i}`,
  src,
  label: name,
}))

const staticRoblox = Object.entries(STATIC_GALLERY_URLS.thumbnails.roblox).map(([name, src], i) => ({
  id: `static_rb_${i}`,
  src,
  label: name,
}))

export default function ThumbnailsPage() {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('minecraft')
  const [orderedWorks, setOrderedWorks] = useState({ minecraft: staticMinecraft, roblox: staticRoblox })

  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function loadOrder() {
      for (const cat of ['minecraft', 'roblox']) {
        const items = await loadGalleryItems('thumbnails', cat)
        if (!active) return
        const staticList = cat === 'minecraft' ? staticMinecraft : staticRoblox
        if (items.length >= staticList.length) {
          setOrderedWorks(prev => ({ ...prev, [cat]: items }))
        }
      }
    }
    loadOrder()

    return () => { active = false }
  }, [])

  const works = tab === 'minecraft'
    ? orderedWorks.minecraft
    : orderedWorks.roblox

  return (
    <div className="gallery-page">

      <button className="gallery-back" onClick={() => navigate('/')}>← Back</button>

      <h1 className="gallery-title">Thumbnails</h1>

      <div className="gallery-tabs">

        <button
          className={`gallery-tab ${tab === 'minecraft' ? 'gallery-tab-active' : ''}`}
          onClick={() => setTab('minecraft')}
        >
          <img
            src={`${import.meta.env.BASE_URL}minecraft.svg`}
            width={18}
            height={18}
            alt=""
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
          />
          Minecraft
        </button>

        <button
          className={`gallery-tab ${tab === 'roblox' ? 'gallery-tab-active' : ''}`}
          onClick={() => setTab('roblox')}
        >
          <img
            src={`${import.meta.env.BASE_URL}roblox.svg`}
            width={18}
            height={18}
            alt=""
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
          />
          Roblox
        </button>

      </div>

      <div className="gallery-grid" key={tab}>
        {works.map((w, i) => (
          <div
            key={w.id}
            className="gallery-item"
            style={{ animationDelay: `${i * 0.04}s` }}
            onClick={() => setSelected(w)}
          >
            <img src={w.src} alt={w.label} draggable={false} loading="lazy" />
          </div>
        ))}
      </div>

      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <div className="gallery-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={selected.src} alt={selected.label} />
            <button className="gallery-lightbox-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}

    </div>
  )
}
