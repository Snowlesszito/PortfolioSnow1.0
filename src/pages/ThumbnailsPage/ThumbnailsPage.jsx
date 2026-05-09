import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../GalleryPage/GalleryPage.css'

const minecraftModules = import.meta.glob(
  '../../assets/images/thumbnails/minecraft/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)

const robloxModules = import.meta.glob(
  '../../assets/images/thumbnails/roblox/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)

const minecraft = Object.entries(minecraftModules).map(([path, mod], i) => ({
  id: i,
  src: mod.default,
  label: path.split('/').pop(),
}))

const roblox = Object.entries(robloxModules).map(([path, mod], i) => ({
  id: i,
  src: mod.default,
  label: path.split('/').pop(),
}))

export default function ThumbnailsPage() {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('minecraft')

  const navigate = useNavigate()

  const works = tab === 'minecraft'
    ? minecraft
    : roblox

  return (
    <div className="gallery-page">

      <button
        className="gallery-back"
        onClick={() => navigate('/')}
      >
        ← Back
      </button>

      <h1 className="gallery-title">
        Thumbnails
      </h1>

      <div className="gallery-tabs">

        <button
          className={`gallery-tab ${
            tab === 'minecraft'
              ? 'gallery-tab-active'
              : ''
          }`}
          onClick={() => setTab('minecraft')}
        >
          <img
            src={`${import.meta.env.BASE_URL}minecraft.svg`}
            width={18}
            height={18}
            alt=""
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '6px',
            }}
          />

          Minecraft
        </button>

        <button
          className={`gallery-tab ${
            tab === 'roblox'
              ? 'gallery-tab-active'
              : ''
          }`}
          onClick={() => setTab('roblox')}
        >
          <img
            src={`${import.meta.env.BASE_URL}roblox.svg`}
            width={18}
            height={18}
            alt=""
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '6px',
            }}
          />

          Roblox
        </button>

      </div>

      <div className="gallery-grid" key={tab}>

        {works.map((w, i) => (
          <div
            key={w.id}
            className="gallery-item"
            style={{
              animationDelay: `${i * 0.04}s`,
            }}
            onClick={() => setSelected(w)}
          >
            <img
              src={w.src}
              alt={w.label}
              draggable={false}
              loading="lazy"
            />
          </div>
        ))}

      </div>

      {selected && (
        <div
          className="gallery-lightbox"
          onClick={() => setSelected(null)}
        >
          <div
            className="gallery-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selected.src}
              alt={selected.label}
            />

            <button
              className="gallery-lightbox-close"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  )
}