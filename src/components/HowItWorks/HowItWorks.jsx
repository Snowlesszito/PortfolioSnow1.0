import { useState, useEffect, useRef } from 'react'
import './HowItWorks.css'
import { loadDecorationAssets } from '../../services/decorations'
import DiscordChat from '../DiscordChat/DiscordChat'

const defaultStepImages = {
  'outros/decoracoes/roblox.png': '',
  'outros/decoracoes/Etapa1.png': '',
  'outros/decoracoes/Etapa2.png': '',
  'outros/decoracoes/Etapa3.png': '',
  'outros/decoracoes/grande.png': '',
}

const steps = [
  {
    number: '01',
    title: 'Get in touch',
    description: 'Reach out via Discord or YouTube Jobs to start the conversation.',
    image: null,
    component: <DiscordChat />,
  },
  {
    number: '02',
    title: 'Quote',
    description: 'We discuss the project scope and align on a fair price for your needs.',
    imageKey: 'outros/decoracoes/Etapa1.png',
  },
  {
    number: '03',
    title: 'Brief approval',
    description: 'References, style and dimensions are all confirmed before work begins.',
    imageKey: 'outros/decoracoes/Etapa2.png',
  },
  {
    number: '04',
    title: 'Sketches & follow-up',
    description: 'You follow the process in real time with direct communication throughout.',
    imageKey: 'outros/decoracoes/Etapa3.png',
  },
  {
    number: '05',
    title: 'Final delivery',
    description: 'The finished artwork is delivered in full quality after your approval.',
    imageKey: 'outros/decoracoes/grande.png',
  },
]

export default function HowItWorks() {
  const [active, setActive] = useState(0)
  const [decorSrc, setDecorSrc] = useState(defaultStepImages)
  const [robloxSrc, setRobloxSrc] = useState('')
  const timerRef = useRef(null)

  const resetTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActive(a => (a + 1) % steps.length)
    }, 4000)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    let active = true
    loadDecorationAssets([
      'outros/decoracoes/roblox.png',
      'outros/decoracoes/Etapa1.png',
      'outros/decoracoes/Etapa2.png',
      'outros/decoracoes/Etapa3.png',
      'outros/decoracoes/grande.png',
    ]).then(result => {
      if (!active) return
      setRobloxSrc(result['outros/decoracoes/roblox.png'] || '')
      setDecorSrc(result)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const prev = () => { setActive(a => (a - 1 + steps.length) % steps.length); resetTimer() }
  const next = () => { setActive(a => (a + 1) % steps.length); resetTimer() }
  const go   = (i) => { setActive(i); resetTimer() }

  const currentImage = steps[active].imageKey ? decorSrc[steps[active].imageKey] : steps[active].image

  return (
    <section className="hiw-section">
      {robloxSrc && <img src={robloxSrc} alt="" className="hiw-render-left" aria-hidden="true" />}
      <h2 className="hiw-title">How it works</h2>
      <p className="hiw-subtitle">Simple, transparent and collaborative from start to finish.</p>

      <div className="hiw-steps">
        {steps.map((step, i) => (
          <div
            className={`hiw-step${i === active ? ' hiw-step-active' : ''}`}
            key={i}
            onClick={() => go(i)}
          >
            <div className={`hiw-circle${i === active ? ' hiw-circle-active' : ''}`}>{step.number}</div>
            <div className="hiw-step-body">
              <h3 className="hiw-step-title">{step.title}</h3>
              <p className="hiw-step-desc">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="hiw-showcase">
        <button className="hiw-arrow" onClick={prev} aria-label="Previous">‹</button>
        <div className="hiw-showcase-img-wrap">
          {steps[active].component
            ? steps[active].component
            : currentImage
              ? <img key={active} src={currentImage} alt={steps[active].title} className="hiw-showcase-img" />
              : <div className="hiw-showcase-empty">Image coming soon</div>
          }
        </div>
        <button className="hiw-arrow" onClick={next} aria-label="Next">›</button>
      </div>
    </section>
  )
}
