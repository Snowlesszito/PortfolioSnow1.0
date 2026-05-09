import { useLayoutEffect } from 'react'
import './Home.css'
import banner from '../../assets/images/banner/Banner.png'
import BeforeAfter from '../../components/BeforeAfter/BeforeAfter'
import HowItWorks from '../../components/HowItWorks/HowItWorks'
import About from '../../components/About/About'
import Categories from '../../components/Categories/Categories'
import '../../App.css'
import CommissionStatus from '../../components/CommissionStatus/CommissionStatus'
import ChannelCarousel from '../../components/ChannelCarousel/ChannelCarousel'

const slideModules = import.meta.glob(
  '../../assets/images/banner/images/*.{jpg,JPG,jpeg,png,PNG,webp}',
  { eager: true }
)
const images = Object.values(slideModules).map(m => m.default)
function Home() {
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
          <img src={banner} alt="Snowless" className="logo" />
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
