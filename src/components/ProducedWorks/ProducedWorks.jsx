import { useState } from 'react'
import './ProducedWorks.css'

const imageModules = import.meta.glob(
  '../assets/images/{thumbnails,Keyart,promocionais}/minecraft/*.{jpg,JPG,jpeg,png,webp,PNG}',
  { eager: true }
)

const works = Object.entries(imageModules).map(([path, mod], i) => ({
  id: i,
  src: mod.default,
  label: path.split('/').pop(),
}))

const PAGE_SIZE = 10

function ProducedWorks() {
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState(1)

  const visible = works.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < works.length

  return (
    <section className="pw-section">
      <h2 className="pw-title">Produced Works</h2>

      <div className="pw-grid">
        {visible.map((work) => (
          <div key={work.id} className="pw-item" onClick={() => setSelected(work)}>
            <img src={work.src} alt={work.label} draggable={false} />
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="pw-load-more" onClick={() => setPage(p => p + 1)}>
          Ver mais
        </button>
      )}

      {selected && (
        <div className="pw-lightbox" onClick={() => setSelected(null)}>
          <div className="pw-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={selected.src} alt={selected.label} />
            <button className="pw-lightbox-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProducedWorks