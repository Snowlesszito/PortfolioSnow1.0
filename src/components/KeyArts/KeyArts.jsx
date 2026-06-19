import { useState } from 'react'
import './KeyArts.css'
import { STATIC_GALLERY_URLS } from '../../services/staticUrls'

const works = Object.entries(STATIC_GALLERY_URLS.keyarts.minecraft).map(([name, src], i) => ({
  id: i,
  src,
  label: name,
}))

function KeyArts() {
  const [current, setCurrent] = useState(0)

  function prev() {
    setCurrent(c => (c - 1 + works.length) % works.length)
  }

  function next() {
    setCurrent(c => (c + 1) % works.length)
  }

  if (works.length === 0) return null

  return (
    <section className="ka-section">
      <h2 className="ka-title">Key Arts</h2>

      <div className="ka-viewer">
        <button className="ka-btn" onClick={prev}>❮</button>

        <div className="ka-image">
          <img src={works[current].src} alt={works[current].label} />
          <div className="ka-counter">{current + 1} / {works.length}</div>
        </div>

        <button className="ka-btn" onClick={next}>❯</button>
      </div>
    </section>
  )
}

export default KeyArts