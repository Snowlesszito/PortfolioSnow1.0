import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Categories.css'
import { loadGalleryItems, getStaticGalleryItems } from '../../services/gallery'

const categories = [
  { title: 'Thumbnails', description: 'Minecraft thumbnails for YouTube videos.', category: 'thumbnails', path: '/thumbnails' },
  { title: 'KEYART', description: 'Minecraft key art for Marketplace addons.', category: 'keyarts', path: '/keyarts' },
  { title: 'Promotional', description: 'Special occasion artwork, wallpapers and more.', category: 'promocional', path: '/promocional' },
  { title: 'Profiles', description: 'Profile pictures for various Minecraft characters.', category: 'profiles', path: '/profiles' },
]

const initialPreviews = Object.fromEntries(
  categories.map(cat => [
    cat.category,
    getStaticGalleryItems(cat.category),
  ])
)

function CategoryCard({ title, description, category, path }) {
  const navigate = useNavigate()
  const [images, setImages] = useState(initialPreviews[category].slice(0, 4).map(item => item.src))
  const [totalCount, setTotalCount] = useState(initialPreviews[category].length)
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    let active = true
    loadGalleryItems(category).then(items => {
      if (!active) return
      const finalItems = items.length >= initialPreviews[category].length ? items : initialPreviews[category]
      setImages(finalItems.slice(0, 4).map(item => item.src))
      setTotalCount(finalItems.length)
    }).catch(() => {})
    return () => { active = false }
  }, [category])

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
            src={images[current] || ''}
            alt={title}
            className={`cat-img ${fading ? 'cat-img-in' : ''}`}
          />
          <div className="cat-overlay">
            <h3 className="cat-title">{title}</h3>
            <p className="cat-desc">{description}</p>
          </div>
          <span className="cat-badge">{totalCount}</span>
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