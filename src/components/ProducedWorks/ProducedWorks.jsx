import { useState } from 'react'
import './ProducedWorks.css'
import { STATIC_GALLERY_URLS } from '../../services/staticUrls'

const works = [
  ...Object.entries(STATIC_GALLERY_URLS.thumbnails.minecraft),
  ...Object.entries(STATIC_GALLERY_URLS.keyarts.minecraft),
  ...Object.entries(STATIC_GALLERY_URLS.promocional.minecraft),
].map(([name, src], i) => ({
  id: i,
  src,
  label: name,
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