import '../GalleryPage/GalleryPage.css'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { loadGalleryItems, getStaticGalleryItems } from '../../services/gallery'

const initialWorks = getStaticGalleryItems('profiles')

export default function ProfilePage() {
  const [works, setWorks] = useState(initialWorks)
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    loadGalleryItems('profiles').then(items => {
      if (!active) return
      if (items.length) setWorks(items)
    })
    return () => { active = false }
  }, [])

  return (
    <div className="gallery-page">
      <button className="gallery-back" onClick={() => navigate('/')}>← Back</button>
      <h1 className="gallery-title">Profile Picture Art</h1>

      <div className="gallery-grid">
        {works.map((w, i) => (
          <div key={w.id} className="gallery-item" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => setSelected(w)}>
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