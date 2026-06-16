import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../firebase'
import { doc, getDoc } from 'firebase/firestore'
import '../GalleryPage/GalleryPage.css'

const minecraftModules = import.meta.glob(
  '../../assets/images/thumbnails/minecraft/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)

const robloxModules = import.meta.glob(
  '../../assets/images/thumbnails/roblox/*.{jpg,JPG,jpeg,png,PNG}',
  { eager: true }
)

// filename → resolved URL maps (for resolving stored static image names)
const staticNameMap = {
  minecraft: Object.fromEntries(
    Object.entries(minecraftModules).map(([p, m]) => [p.split('/').pop(), m.default])
  ),
  roblox: Object.fromEntries(
    Object.entries(robloxModules).map(([p, m]) => [p.split('/').pop(), m.default])
  ),
}

// Fallback static lists (used when Firestore has no order saved)
const staticMinecraft = Object.entries(minecraftModules).map(([path, mod], i) => ({
  id: `static_mc_${i}`,
  src: mod.default,
  label: path.split('/').pop(),
}))

const staticRoblox = Object.entries(robloxModules).map(([path, mod], i) => ({
  id: `static_rb_${i}`,
  src: mod.default,
  label: path.split('/').pop(),
}))

export default function ThumbnailsPage() {
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('minecraft')
  const [orderedWorks, setOrderedWorks] = useState({ minecraft: null, roblox: null })

  const navigate = useNavigate()

  useEffect(() => {
    function resolveItemName(item) {
      return item.name ?? item.label ?? item.path?.split('/').pop() ?? ''
    }

    function resolveItemSrc(item, nameMap) {
      if (item.isStatic) {
        return nameMap[resolveItemName(item)] ?? null
      }
      return item.url ?? item.src ?? null
    }

    async function loadOrder() {
      for (const cat of ['minecraft', 'roblox']) {
        const snap = await getDoc(doc(db, 'thumbnails', cat))
        if (!snap.exists()) continue

        const order = snap.data().order ?? snap.data().images?.map(img => ({ ...img, isStatic: false }))
        if (!order?.length) continue

        const nameMap = staticNameMap[cat]
        const resolved = order
          .map((item, i) => ({
            id: `ordered_${cat}_${i}`,
            src: resolveItemSrc(item, nameMap),
            label: resolveItemName(item),
          }))
          .filter(w => w.src)

        const savedNames = new Set(order.map(resolveItemName))
        const extras = Object.entries(nameMap)
          .filter(([name]) => !savedNames.has(name))
          .map(([name, src], i) => ({
            id: `extra_${cat}_${i}`,
            src,
            label: name,
          }))

        setOrderedWorks(prev => ({ ...prev, [cat]: [...resolved, ...extras] }))
      }
    }
    loadOrder()
  }, [])

  const works = tab === 'minecraft'
    ? (orderedWorks.minecraft ?? staticMinecraft)
    : (orderedWorks.roblox ?? staticRoblox)

  return (
    <div className="gallery-page">

      <button className="gallery-back" onClick={() => navigate('/')}>← Back</button>

      <h1 className="gallery-title">Thumbnails</h1>

      <div className="gallery-tabs">

        <button
          className={`gallery-tab ${tab === 'minecraft' ? 'gallery-tab-active' : ''}`}
          onClick={() => setTab('minecraft')}
        >
          <img
            src={`${import.meta.env.BASE_URL}minecraft.svg`}
            width={18}
            height={18}
            alt=""
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
          />
          Minecraft
        </button>

        <button
          className={`gallery-tab ${tab === 'roblox' ? 'gallery-tab-active' : ''}`}
          onClick={() => setTab('roblox')}
        >
          <img
            src={`${import.meta.env.BASE_URL}roblox.svg`}
            width={18}
            height={18}
            alt=""
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
          />
          Roblox
        </button>

      </div>

      <div className="gallery-grid" key={tab}>
        {works.map((w, i) => (
          <div
            key={w.id}
            className="gallery-item"
            style={{ animationDelay: `${i * 0.04}s` }}
            onClick={() => setSelected(w)}
          >
            <img src={w.src} alt={w.label} draggable={false} loading="lazy" />
          </div>
        ))}
      </div>

      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <div className="gallery-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={selected.src} alt={selected.label} />
            <button className="gallery-lightbox-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}

    </div>
  )
}
