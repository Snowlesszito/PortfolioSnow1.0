import '../GalleryPage/GalleryPage.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const imageModules = import.meta.glob(
  '../../assets/images/keyart/**/*.{jpg,JPG,jpeg,png,webp,PNG}',
  { eager: true }
)

const works = Object.entries(imageModules).map(([path, mod], i) => ({
  id: i, src: mod.default, label: path.split('/').pop(),
}))

export default function KeyArtsPage() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  return (
    <div className="gallery-page">
      <button className="gallery-back" onClick={() => navigate('/')}>← Back</button>
      <h1 className="gallery-title">Key Arts</h1>

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