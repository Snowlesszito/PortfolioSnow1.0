import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Categories.css'

const thumbModules = import.meta.glob(
  '../../assets/images/thumbnails/**/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)
const keyModules = import.meta.glob(
  '../../assets/images/keyart/**/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)
const promoModules = import.meta.glob(
  '../../assets/images/promocionais/**/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)

const profileModules = import.meta.glob(
  '../../assets/images/profile/**/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)

const thumbs = Object.values(thumbModules).map(m => m.default)
const keys = Object.values(keyModules).map(m => m.default)
const promos = Object.values(promoModules).map(m => m.default)
const profiles = Object.values(profileModules).map(m => m.default)
const categories = [
  { title: 'Thumbnails', description: 'Minecraft thumbnails for YouTube videos.', images: thumbs, path: '/thumbnails' },
  { title: 'KEYART', description: 'Minecraft key art for Marketplace addons.', images: keys, path: '/keyarts' },
  { title: 'Promotional', description: 'Special occasion artwork, wallpapers and more.', images: promos, path: '/promocional' },
  { title: 'Profiles', description: 'Profile pictures for various Minecraft characters.', images: profiles, path: '/profiles' },
]

function CategoryCard({ title, description, images, path }) {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (images.length === 0) return
    const interval = setInterval(() => {
      setPrev(current)
      setFading(true)
      setCurrent(c => (c + 1) % images.length)
      setTimeout(() => {
        setPrev(null)
        setFading(false)
      }, 800)
    }, 4000)
    return () => clearInterval(interval)
  }, [images, current])

  return (
    <div className="cat-card" onClick={() => { sessionStorage.setItem('homeScrollY', window.scrollY); navigate(path) }}>
      <div className="cat-img-wrap">
        <div className="cat-image">
          {prev !== null && (
            <img
              src={images[prev]}
              alt={title}
              className="cat-img cat-img-out"
            />
          )}
          <img
            src={images[current]}
            alt={title}
            className={`cat-img ${fading ? 'cat-img-in' : ''}`}
          />
          <div className="cat-overlay">
            <h3 className="cat-title">{title}</h3>
            <p className="cat-desc">{description}</p>
          </div>
          <span className="cat-badge">{images.length}</span>
        </div>
        <span className="cat-corner cat-tl" />
        <span className="cat-corner cat-tr" />
        <span className="cat-corner cat-bl" />
        <span className="cat-corner cat-br" />
      </div>
      <span className="cat-label">{title}</span>
    </div>
  )
}
function Categories() {
  return (
    <section className="categories-section">
      <h2 className="categories-title">Categories</h2>
      <div className="categories-grid">
        {categories.map(cat => (
          <CategoryCard key={cat.path} {...cat} />
        ))}
      </div>
    </section>
  )
}

export default Categories