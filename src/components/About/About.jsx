import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../../firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import './About.css'
import { loadDecorationAsset } from '../../services/decorations'
import { STATIC_DECORATION_URLS } from '../../services/staticUrls'

function About() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ clientsCount: 15, completedCount: 40 })
  const [loadedStats, setLoadedStats] = useState(false)
  const [skinSrc, setSkinSrc] = useState(STATIC_DECORATION_URLS['outros/decoracoes/Perfil_About.png'] || '')

  useEffect(() => {
    const ref = doc(db, 'commissions', 'status')
    const unsubscribe = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data()
        setStats({
          clientsCount: data.clients?.length ?? 0,
          completedCount: data.concluidos?.length ?? 0,
        })
      }
      setLoadedStats(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let active = true
    loadDecorationAsset('outros/decoracoes/Perfil_About.png').then(src => {
      if (active && src) setSkinSrc(src)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const clientsCount = loadedStats ? stats.clientsCount : 15
  const completedCount = loadedStats ? stats.completedCount : 40

  return (
    <section className="about-section">
      <div className="about-split">
        <div className="about-split-left">
          <img src={skinSrc || ''} alt="Snowless Skin" className="about-split-img" />
        </div>

        <div className="about-split-right">
          <div className="about-text">
            <h2 className="about-name">Snowless</h2>
            <p className="about-bio">
              Hey! I'm Snowless! A Minecraft & Roblox thumbmaker and keyartist with over 2 years of
              experience. I create high-quality thumbnails, key art, banners and profile pictures
              that make your content stand out. Whether you're a small creator or a Marketplace
              developer, I'm here to bring your vision to life.
            </p>
          </div>

          <div className="about-stats">
            <div className="about-stat-item">
              <span className="about-stat-number">+2</span>
              <span className="about-stat-label">YEARS OF EXPERIENCE</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat-item">
              <span className="about-stat-number">+{completedCount}</span>
              <span className="about-stat-label">COMPLETED ARTWORKS</span>
            </div>
            <div className="about-stat-divider" />
            <div className="about-stat-item">
              <span className="about-stat-number">+{clientsCount}</span>
              <span className="about-stat-label">SATISFIED CLIENTS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="about-contact">
        <p className="about-contact-title">Get In Touch</p>
        <div className="about-contact-grid">
          <a href="https://discordapp.com/users/1401982556420833462" target="_blank" rel="noreferrer" className="about-contact-card discord">
            <div className="acc-icon discord">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            </div>
            <div className="acc-info">
              <span className="acc-name">Discord</span>
              <span className="acc-handle">Direct message @ssnowlesss</span>
            </div>
            <span className="acc-arrow">→</span>
          </a>

          <a href="https://ytjobs.co/talent/profile/414383?r=152" target="_blank" rel="noreferrer" className="about-contact-card ytb-jobs">
            <div className="acc-icon ytb-jobs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </div>
            <div className="acc-info">
              <span className="acc-name">YouTube Jobs</span>
              <span className="acc-handle">Hire me</span>
            </div>
            <span className="acc-arrow">→</span>
          </a>

          <a href="https://youtube.com/@snowlessweasel" target="_blank" rel="noreferrer" className="about-contact-card ytb-canal">
            <div className="acc-icon ytb-canal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </div>
            <div className="acc-info">
              <span className="acc-name">YouTube Channel</span>
              <span className="acc-handle">@snowlessweasel</span>
            </div>
            <span className="acc-arrow">→</span>
          </a>

          <a href="https://x.com/Snowlesszito" target="_blank" rel="noreferrer" className="about-contact-card twitter">
            <div className="acc-icon twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </div>
            <div className="acc-info">
              <span className="acc-name">Twitter / X</span>
              <span className="acc-handle">Follow me</span>
            </div>
            <span className="acc-arrow">→</span>
          </a>
        </div>

        <div className="about-tos-strip">
          <div className="about-tos-strip-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="about-tos-strip-text">
            <span className="about-tos-strip-label">Terms of Service — Required Reading</span>
            <span className="about-tos-strip-sub">You must read and agree to the ToS before placing any order.</span>
          </div>
          <Link className="about-tos-strip-link" to="/tos">Read Now →</Link>
        </div>
      </div>
    </section>
  )
}

export default About