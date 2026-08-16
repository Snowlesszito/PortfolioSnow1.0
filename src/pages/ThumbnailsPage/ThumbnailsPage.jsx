import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../GalleryPage/GalleryPage.css'
import { loadGalleryItems, getStaticGalleryItems } from '../../services/gallery'

export default function ThumbnailsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('minecraft')
  const [selected, setSelected] = useState(null)
  const [items, setItems] = useState({
    minecraft: getStaticGalleryItems('thumbnails', 'minecraft'),
    roblox:    getStaticGalleryItems('thumbnails', 'roblox'),
  })

  // carrega cada plataforma separadamente — sem mistura
  useEffect(() => {
    let active = true

    async function load(platform) {
      const loaded = await loadGalleryItems('thumbnails', platform)
      if (!active || !loaded.length) return
      setItems(prev => ({ ...prev, [platform]: loaded }))
    }

    load('minecraft')
    load('roblox')

    return () => { active = false }
  }, [])

  const works = items[tab] ?? []

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
            width={18} height={18} alt=""
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
            width={18} height={18} alt=""
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
          />
          Roblox
        </button>
      </div>

      <div className="gallery-grid" key={tab}>
        {works.map((w, i) => (
          <div
            key={w.id ?? i}
            className="gallery-item"
            style={{ animationDelay: `${i * 0.04}s` }}
            onClick={() => setSelected(w)}
          >
            <img src={w.src ?? w.url} alt={w.label} draggable={false} loading="lazy" />
          </div>
        ))}
      </div>

      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <div className="gallery-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={selected.src ?? selected.url} alt={selected.label} />
            <button className="gallery-lightbox-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
