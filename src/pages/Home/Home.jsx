import { useLayoutEffect, useEffect, useState } from 'react'
import './Home.css'
import BeforeAfter from '../../components/BeforeAfter/BeforeAfter'
import HowItWorks from '../../components/HowItWorks/HowItWorks'
import About from '../../components/About/About'
import Categories from '../../components/Categories/Categories'
import '../../App.css'
import CommissionStatus from '../../components/CommissionStatus/CommissionStatus'
import ChannelCarousel from '../../components/ChannelCarousel/ChannelCarousel'
import { loadGalleryItems, getStaticGalleryItems } from '../../services/gallery'
import { loadDecorationAsset } from '../../services/decorations'

const defaultImages = [
  ...getStaticGalleryItems('thumbnails', 'minecraft'),
  ...getStaticGalleryItems('thumbnails', 'roblox'),
].map(item => item.src)
function Home() {
  const [images, setImages] = useState(defaultImages)
  const [logoSrc, setLogoSrc] = useState('')

  useEffect(() => {
    let active = true

    async function loadThumbnails() {
      const [minecraft, roblox] = await Promise.all([
        loadGalleryItems('thumbnails', 'minecraft'),
        loadGalleryItems('thumbnails', 'roblox'),
      ])
      if (!active) return
      const thumbImages = [...minecraft, ...roblox].map(item => item.src).filter(Boolean)
      if (thumbImages.length >= defaultImages.length) {
        setImages(thumbImages)
      }
    }

    loadThumbnails()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    loadDecorationAsset('banner/Banner.png').then(src => {
      if (active && src) setLogoSrc(src)
    }).catch(() => {})
    return () => { active = false }
  }, [])
  useLayoutEffect(() => {
    const y = sessionStorage.getItem('homeScrollY')
    if (y !== null) {
      sessionStorage.removeItem('homeScrollY')
      window.scrollTo({ top: parseInt(y, 10), behavior: 'instant' })
    }
  }, [])

  return (
    <div>
      <div className="hero">
        <div className="hero-tickers">
          <div className="hero-ticker-row">
            <div className="hero-ticker-track hero-ticker-right">
              {[...images, ...images].map((src, i) => <img key={i} src={src} alt="" draggable={false} />)}
            </div>
          </div>
          <div className="hero-ticker-row">
            <div className="hero-ticker-track hero-ticker-left">
              {[...images, ...images].map((src, i) => <img key={i} src={src} alt="" draggable={false} />)}
            </div>
          </div>
          <div className="hero-ticker-row">
            <div className="hero-ticker-track hero-ticker-right hero-ticker-slow">
              {[...images, ...images].map((src, i) => <img key={i} src={src} alt="" draggable={false} />)}
            </div>
          </div>
        </div>
        <div className="hero-overlay" />

        <div className="hero-content">
          {logoSrc
            ? <img src={logoSrc} alt="Snowless" className="logo" />
            : <h1 className="logo">Snowless</h1>
          }
          <button
            className="hero-cta"
            onClick={() => document.querySelector('.categories-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span>Dive Into My World →</span>
          </button>
        </div>

        <button
          className="hero-scroll-arrow"
          aria-label="Scroll down"
          onClick={() => document.querySelector('.categories-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="8,10 22,24 36,10" stroke="#66a4db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
            <polyline points="8,21 22,35 36,21" stroke="#66a4db" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="hero-highlight" />
      <div className="hero-highlight" />

      <Categories />
      <HowItWorks />
      <BeforeAfter />

      <div className="cc-about-wrap">
        <ChannelCarousel />
        <About />
      </div>

      <CommissionStatus />
    </div>
  )
}

export default Home
