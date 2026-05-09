import { useEffect, useRef, useState } from 'react'
import './GridSection.css'
import img1 from '../../assets/images/keyart/minecraft/Key1.jpg'
import img2 from '../../assets/images/promocionais/minecraft/Promo1.jpg'

// Adicione suas imagens aqui
// import img1 from '../assets/images/...'

const works = [
  // { id: 1, src: img1, label: 'Nome da arte' },
  { id: 1, src: img1, label: 'Key Art 1' },
  { id: 2, src: img2, label: 'Promo 1' },
]

function GridSection() {
  const trackRef = useRef(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track || works.length === 0) return

    let pos = 0
    let raf

    function step() {
      if (!paused) {
        pos += 0.5
        const half = track.scrollHeight / 2
        if (pos >= half) pos = 0
        track.style.transform = `translateY(-${pos}px)`
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paused])

  return (
    <section className="grid-section">
      <h2 className="grid-title">Todos os Trabalhos</h2>

      <div
        className="grid-viewport"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="grid-track" ref={trackRef}>
          {[...works, ...works].map((work, i) => (
            <div key={i} className="grid-item">
              <img src={work.src} alt={work.label} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GridSection