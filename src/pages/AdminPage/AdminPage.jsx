import { useState, useEffect, useRef } from 'react'
import { db, auth, storage } from '../../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { loadGalleryItems, saveGalleryItems, getStaticGalleryItems } from '../../services/gallery'
import './AdminPage.css'

// ─── canais: fallback estático ────────────────────────────────────────────────
const STATIC_CHANNELS = [
  {
    channelUrl: 'https://www.youtube.com/@cherryrar',
    subscribers: '5M',
    works: [
      { videoUrl: 'https://youtu.be/CKV9ypw_J0g?si=whbpNwMh15OQIL3Q' },
      { videoUrl: 'https://youtu.be/XCPrZd1TIR0?si=2BT87rlk7S5yZ-cA' },
    ],
  },
  {
    channelUrl: 'https://www.youtube.com/@PACtariik',
    subscribers: '1.44M',
    works: [{ videoUrl: 'https://youtu.be/5iecaGW8mVw?si=f8rfepjJAwsPzCAx' }],
  },
  {
    channelUrl: 'https://www.youtube.com/@Himaru',
    subscribers: '1.07M',
    works: [{ label: 'Teste A/B' }],
  },
  {
    channelUrl: 'https://www.youtube.com/@Febatista',
    subscribers: '4.98M',
    works: [{ videoUrl: 'https://youtu.be/f6G1Mag1px8?si=7QT_svaQaW-hNgQu' }],
  },
  {
    channelUrl: 'https://www.youtube.com/@FerrazJogando',
    subscribers: '39.7K',
    works: [
      { videoUrl: 'https://youtu.be/qAwds24C_-I?si=gEFDtoOZ1gk5lg0_' },
      { videoUrl: 'https://youtu.be/Y5dODL0QfwM?si=girGgnEHG9IPS3-0' },
      { videoUrl: 'https://youtu.be/JciovbtYlA0?si=osKOwwP4FJ2sf4cX' },
    ],
  },
  {
    channelUrl: 'https://www.youtube.com/@LifeboatNetwork',
    subscribers: '123K',
    works: [
      { videoUrl: 'https://youtu.be/vmWKyq5U0-w?si=Jd_yM-pHeNUviKTX' },
      { videoUrl: 'https://youtu.be/7UIs_eVkqYA?si=Np1URcxlLNpdX9nK' },
      { videoUrl: 'https://youtu.be/_ZAEtDEkptg?si=fuKS_WJsMQSLJbwl' },
      { videoUrl: 'https://youtu.be/24d0-OElGY8?si=JiKr1gSqGRYVG4PW' },
      { videoUrl: 'https://youtu.be/mlP0O-jaX5s?si=JdWR27k3b1lHHlKi' },
    ],
  },
]

function extractVideoId(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    return u.searchParams.get('v')
  } catch { return null }
}

// ─── image compression ────────────────────────────────────────────────────────

function compressImage(file, maxW = 1920, maxH = 1080, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img
      if (width > maxW || height > maxH) {
        const scale = Math.min(maxW / width, maxH / height)
        width  = Math.round(width  * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error(`Falha ao comprimir ${file.name}`)),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Erro ao ler ${file.name}`)) }
    img.src = objectUrl
  })
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// ─── constantes ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Open', 'Closed', 'Limited']
const COLUMNS        = ['fila', 'wip', 'prontos', 'concluidos']
const COLUMN_LABELS  = {
  fila:       'Queue',
  wip:        'In Progress (WIP)',
  prontos:    'Ready for Delivery',
  concluidos: 'Completed',
}

const INITIAL_COMMISSIONS = {
  status:     'Open',
  fila:       [],
  wip:        [],
  prontos:    [],
  concluidos: [],
  clients:    [],
}

const GALLERY_CATEGORIES = ['thumbnails', 'keyarts', 'promocional', 'profiles']
const GALLERY_CATEGORY_LABELS = {
  thumbnails: 'Thumbnails',
  keyarts:    'Key Arts',
  promocional:'Promocionais',
  profiles:   'Profiles',
}
const GALLERY_PLATFORMS = ['minecraft', 'roblox']

const UPLOAD_LIMIT    = 10
const UPLOAD_COOLDOWN = 60 * 60 * 1000  // 1 hora

function getLastUploadTime()    { return parseInt(localStorage.getItem('adminLastUpload') ?? '0') }
function getRemainingCooldown() { return Math.max(0, UPLOAD_COOLDOWN - (Date.now() - getLastUploadTime())) }
function fmtCooldown(ms)        { const m = Math.floor(ms / 60000); const s = Math.floor((ms % 60000) / 1000); return `${m}:${s.toString().padStart(2, '0')}` }

// ─── estado inicial da galeria (tudo vazio, carregado depois) ─────────────────

function makeEmptyGallery() {
  return Object.fromEntries(
    GALLERY_CATEGORIES.map(cat => [
      cat,
      Object.fromEntries(GALLERY_PLATFORMS.map(plt => [plt, getStaticGalleryItems(cat, plt)])),
    ])
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const navigate = useNavigate()
  const [section, setSection] = useState('commissions')

  // ── commissions ──
  const [commissions, setCommissions] = useState(INITIAL_COMMISSIONS)
  const [saved,        setSaved]       = useState(false)
  const [input,        setInput]       = useState(
    Object.fromEntries(COLUMNS.map(f => [f, { name: '', qty: '1' }]))
  )
  const [clientInput,  setClientInput] = useState({ name: '' })
  const [clientError,  setClientError] = useState('')
  const [dragging,     setDragging]    = useState(null)

  // ── gallery ──
  const [gallery,        setGallery]        = useState(makeEmptyGallery)

  // ── channels ──
  const [channels,       setChannels]       = useState(STATIC_CHANNELS)
  const [channelsSaved,  setChannelsSaved]  = useState(false)
  const [channelsError,  setChannelsError]  = useState('')
  const [newChannel,     setNewChannel]     = useState({ channelUrl: '', subscribers: '' })
  const [newChannelErr,  setNewChannelErr]  = useState('')
  const [expandedCh,     setExpandedCh]     = useState(null)  // index do canal expandido
  const [newVideo,       setNewVideo]       = useState({})    // { [chIndex]: { videoUrl: '', label: '' } }
  const [galleryLoading, setGalleryLoading] = useState(true)
  const [galleryError,   setGalleryError]   = useState('')
  const [galleryCategory,setGalleryCategory]= useState('thumbnails')
  const [galleryPlatform,setGalleryPlatform]= useState('minecraft')
  const [dragFrom,       setDragFrom]       = useState(null)
  const [dragOver,       setDragOver]       = useState(null)

  // ── upload ──
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState('')
  const [uploadMsg,    setUploadMsg]    = useState('')
  const [cooldown,     setCooldown]     = useState(getRemainingCooldown)
  const [newUrl,       setNewUrl]       = useState('')
  const [newUrlError,  setNewUrlError]  = useState('')
  const [newUrlMsg,    setNewUrlMsg]    = useState('')
  const fileRef     = useRef(null)
  const cooldownRef = useRef(null)

  // ── load commissions ──
  useEffect(() => {
    getDoc(doc(db, 'commissions', 'status')).then(snap => {
      if (snap.exists()) setCommissions(prev => ({ ...INITIAL_COMMISSIONS, ...snap.data() }))
    })
  }, [])

  // ── load channels ──
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'channels', 'list'))
        if (!snap.exists()) return
        const data = snap.data().channels
        if (active && Array.isArray(data) && data.length > 0) setChannels(data)
      } catch (err) {
        console.warn('[admin] channels load failed', err)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // ── load gallery ──
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const loaded = makeEmptyGallery()
        await Promise.all(
          GALLERY_CATEGORIES.flatMap(cat =>
            GALLERY_PLATFORMS.map(async plt => {
              const items = await loadGalleryItems(cat, plt)
              loaded[cat][plt] = items
            })
          )
        )
        if (active) setGallery(loaded)
      } catch (err) {
        console.warn('[admin] gallery load failed', err)
        if (active) setGalleryError('Falha ao carregar a galeria.')
      } finally {
        if (active) setGalleryLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // ── cooldown timer ──
  useEffect(() => {
    if (getRemainingCooldown() <= 0) return
    cooldownRef.current = setInterval(() => {
      const r = getRemainingCooldown()
      setCooldown(r)
      if (r <= 0) clearInterval(cooldownRef.current)
    }, 1000)
    return () => clearInterval(cooldownRef.current)
  }, [])

  function startCooldown() {
    localStorage.setItem('adminLastUpload', Date.now().toString())
    setCooldown(UPLOAD_COOLDOWN)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      const r = getRemainingCooldown()
      setCooldown(r)
      if (r <= 0) clearInterval(cooldownRef.current)
    }, 1000)
  }

  // ─── helpers da galeria ────────────────────────────────────────────────────

  const currentItems = gallery[galleryCategory]?.[galleryPlatform] ?? []

  function setCurrentItems(items) {
    setGallery(prev => ({
      ...prev,
      [galleryCategory]: {
        ...prev[galleryCategory],
        [galleryPlatform]: items,
      },
    }))
  }

  async function persistCurrent(items) {
    await saveGalleryItems(galleryCategory, galleryPlatform, items)
  }

  // ── reordenar via drag ──
  function onDragStart(i) { setDragFrom(i); setDragOver(i) }
  function onDragOver(e, i) { e.preventDefault(); setDragOver(i) }
  async function onDrop(toIndex) {
    if (dragFrom === null || dragFrom === toIndex) {
      setDragFrom(null); setDragOver(null)
      return
    }
    const list = [...currentItems]
    const [moved] = list.splice(dragFrom, 1)
    list.splice(toIndex, 0, moved)
    setCurrentItems(list)
    setDragFrom(null)
    setDragOver(null)
    try { await persistCurrent(list) }
    catch (err) { console.error('[admin] reorder save failed', err) }
  }
  function onDragEnd() { setDragFrom(null); setDragOver(null) }

  // ── upload de arquivo ──
  async function handleUpload(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    if (cooldown > 0) {
      setUploadError(`Cooldown ativo. Aguarde ${fmtCooldown(cooldown)}.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (files.length > UPLOAD_LIMIT) {
      setUploadError(`Máximo ${UPLOAD_LIMIT} imagens por envio.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const oversized = files.filter(f => f.size > 20 * 1024 * 1024)
    if (oversized.length) {
      setUploadError(`Imagens acima de 20MB: ${oversized.map(f => f.name).join(', ')}`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true); setUploadError(''); setUploadMsg('')

    try {
      let totalOrig = 0, totalComp = 0
      const newItems = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadMsg(`Comprimindo ${i + 1}/${files.length}…`)
        totalOrig += file.size
        const blob = await compressImage(file)
        totalComp += blob.size

        const baseName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
        const path     = `galleries/${galleryCategory}/${galleryPlatform}/${Date.now()}_${baseName}`
        const fileRef2 = sRef(storage, path)
        await uploadBytes(fileRef2, blob)
        const url = await getDownloadURL(fileRef2)

        newItems.push({ id: `upload_${Date.now()}_${i}`, url, src: url, label: baseName, path })
      }

      const updated = [...currentItems, ...newItems]
      setCurrentItems(updated)
      await persistCurrent(updated)
      startCooldown()

      const saved2  = totalOrig - totalComp
      const pct     = Math.round((saved2 / totalOrig) * 100)
      setUploadMsg(`${files.length} imagem(ns) enviada(s). ${fmtBytes(totalOrig)} → ${fmtBytes(totalComp)} (−${pct}%)`)
      setTimeout(() => setUploadMsg(''), 6000)
    } catch (err) {
      setUploadError(`Erro ao enviar: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── deletar item ──
  async function deleteItem(index) {
    const item = currentItems[index]
    // tenta remover do Storage se tiver path
    if (item.path) {
      try { await deleteObject(sRef(storage, item.path)) } catch { /* ignora */ }
    }
    const updated = currentItems.filter((_, i) => i !== index)
    setCurrentItems(updated)
    await persistCurrent(updated)
  }

  // ── adicionar URL ──
  function validateUrl(url) {
    if (!url) return 'Informe uma URL.'
    if (!/^https?:\/\//i.test(url)) return 'A URL deve começar com http:// ou https://.'
    if (!/\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(url)) return 'Use uma URL de imagem (jpg, png, webp, gif, avif ou svg).'
    return ''
  }

  async function addUrl() {
    const url = newUrl.trim()
    const err = validateUrl(url)
    if (err) { setNewUrlError(err); setNewUrlMsg(''); return }

    setNewUrlError(''); setNewUrlMsg('')
    const label = url.split('/').pop().split('?')[0] || `image-${Date.now()}`
    const item  = { id: `url_${Date.now()}`, url, src: url, label }
    const updated = [...currentItems, item]

    try {
      setCurrentItems(updated)
      await persistCurrent(updated)
      setNewUrl('')
      setNewUrlMsg('Imagem adicionada com sucesso.')
      setTimeout(() => setNewUrlMsg(''), 4000)
    } catch (err2) {
      console.error('[admin] addUrl failed', err2)
      setNewUrlError('Falha ao salvar. Tente novamente.')
    }
  }

  // ─── channels helpers ──────────────────────────────────────────────────────

  async function saveChannels(list) {
    await setDoc(doc(db, 'channels', 'list'), { channels: list })
    setChannelsSaved(true)
    setTimeout(() => setChannelsSaved(false), 2000)
  }

  function addChannel() {
    const url  = newChannel.channelUrl.trim()
    const subs = newChannel.subscribers.trim()
    if (!url) { setNewChannelErr('Informe a URL do canal.'); return }
    if (!/^https?:\/\/(www\.)?youtube\.com\//i.test(url)) {
      setNewChannelErr('Use uma URL do YouTube (youtube.com/@handle).')
      return
    }
    setNewChannelErr('')
    const updated = [...channels, { channelUrl: url, subscribers: subs, works: [] }]
    setChannels(updated)
    setNewChannel({ channelUrl: '', subscribers: '' })
    saveChannels(updated)
  }

  function removeChannel(index) {
    const updated = channels.filter((_, i) => i !== index)
    setChannels(updated)
    saveChannels(updated)
  }

  function addVideoToChannel(chIndex) {
    const v = newVideo[chIndex] ?? {}
    const videoUrl = (v.videoUrl ?? '').trim()
    const label    = (v.label    ?? '').trim()
    if (!videoUrl && !label) return
    const updated = channels.map((ch, i) => {
      if (i !== chIndex) return ch
      return { ...ch, works: [...(ch.works ?? []), { videoUrl: videoUrl || undefined, label: label || undefined }] }
    })
    setChannels(updated)
    setNewVideo(prev => ({ ...prev, [chIndex]: { videoUrl: '', label: '' } }))
    saveChannels(updated)
  }

  function removeVideoFromChannel(chIndex, vIndex) {
    const updated = channels.map((ch, i) => {
      if (i !== chIndex) return ch
      return { ...ch, works: (ch.works ?? []).filter((_, j) => j !== vIndex) }
    })
    setChannels(updated)
    saveChannels(updated)
  }

  function updateSubscribers(chIndex, value) {
    const updated = channels.map((ch, i) => i === chIndex ? { ...ch, subscribers: value } : ch)
    setChannels(updated)
  }

  // ─── commissions helpers ───────────────────────────────────────────────────

  async function saveCommissions(data) {
    await setDoc(doc(db, 'commissions', 'status'), data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addItem(field) {
    const name = input[field].name.trim()
    const qty  = parseInt(input[field].qty) || 1
    if (!name) return
    const updated = { ...commissions, [field]: [...commissions[field], ...Array(qty).fill(name)] }
    setCommissions(updated)
    setInput(prev => ({ ...prev, [field]: { name: '', qty: '1' } }))
    await saveCommissions(updated)
  }

  function removeItem(field, index) {
    setCommissions(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
  }

  function generateCode(name) {
    return (name.match(/\b\w/g) ?? []).join('').slice(0, 3).toUpperCase()
  }

  async function addClient() {
    const name = clientInput.name.trim()
    if (!name) return
    if (commissions.clients.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setClientError('Cliente já cadastrado.'); return
    }
    const updated = { ...commissions, clients: [...commissions.clients, { name, code: generateCode(name) }] }
    setCommissions(updated)
    setClientInput({ name: '' }); setClientError('')
    await saveCommissions(updated)
  }

  function removeClient(index) {
    setCommissions(prev => ({ ...prev, clients: prev.clients.filter((_, i) => i !== index) }))
  }

  function onKanbanDragStart(field, index) { setDragging({ field, index }) }

  async function onDropColumn(targetField) {
    if (!dragging) return
    const { field, index } = dragging
    if (field === targetField) return
    const item = commissions[field][index]
    const updated = {
      ...commissions,
      [field]:       commissions[field].filter((_, i) => i !== index),
      [targetField]: [...commissions[targetField], item],
    }
    setCommissions(updated)
    setDragging(null)
    await saveCommissions(updated)
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <button className="admin-sidebar-back" onClick={() => navigate('/')}>← Back</button>
        <nav className="admin-sidebar-nav">
          <button
            className={`admin-sidebar-item ${section === 'commissions' ? 'active' : ''}`}
            onClick={() => setSection('commissions')}
          >
            <span className="admin-sidebar-icon">📋</span>Comissões
          </button>
          <button
            className={`admin-sidebar-item ${section === 'arts' ? 'active' : ''}`}
            onClick={() => setSection('arts')}
          >
            <span className="admin-sidebar-icon">🖼</span>Artes
          </button>
          <button
            className={`admin-sidebar-item ${section === 'channels' ? 'active' : ''}`}
            onClick={() => setSection('channels')}
          >
            <span className="admin-sidebar-icon">📺</span>Canais
          </button>
        </nav>
        <button className="admin-sidebar-logout" onClick={() => signOut(auth)}>Logout</button>
      </aside>

      <main className="admin-main">

        {/* ─── COMMISSIONS ─────────────────────────────────────────────────── */}
        {section === 'commissions' && (
          <div className="admin-page">
            <div className="admin-header">
              <h1>Commissions</h1>
              <button className="admin-save" onClick={() => saveCommissions(commissions)}>
                {saved ? '✓ Saved!' : 'Save'}
              </button>
            </div>

            <div className="admin-section">
              <h2>Commission Status</h2>
              <div className="admin-status-btns">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`admin-status-btn ${commissions.status === s ? 'active' : ''}`}
                    onClick={() => setCommissions(prev => ({ ...prev, status: s }))}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="admin-summary-grid">
              <div className="admin-summary-card">
                <span>Clientes cadastrados</span>
                <strong>{commissions.clients?.length ?? 0}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Completed commissions</span>
                <strong>{commissions.concluidos?.length ?? 0}</strong>
              </div>
            </div>

            <div className="admin-section">
              <h2>Clientes</h2>
              <div className="admin-client-row">
                <input
                  placeholder="Nome do cliente"
                  value={clientInput.name}
                  onChange={e => { setClientInput({ name: e.target.value }); setClientError('') }}
                  onKeyDown={e => e.key === 'Enter' && addClient()}
                />
                <button onClick={addClient}>Add client</button>
              </div>
              {clientError && <p className="admin-error">{clientError}</p>}
              <p className="admin-info-text">Código gerado automaticamente a partir do nome.</p>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Name</th><th>Ações</th></tr></thead>
                  <tbody>
                    {commissions.clients?.length
                      ? commissions.clients.map((c, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{c.name}</td>
                          <td><button className="admin-remove" onClick={() => removeClient(i)}>Remover</button></td>
                        </tr>
                      ))
                      : <tr><td colSpan="3">Nenhum cliente ainda.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-kanban">
              {COLUMNS.map(field => (
                <div
                  key={field}
                  className="admin-column"
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDropColumn(field)}
                >
                  <div className="admin-column-header">
                    <h2>{COLUMN_LABELS[field]}</h2>
                    <span className="admin-counter">{commissions[field]?.length ?? 0}</span>
                  </div>
                  <div className="admin-input-row">
                    <input
                      placeholder="Nome..."
                      value={input[field].name}
                      onChange={e => setInput(p => ({ ...p, [field]: { ...p[field], name: e.target.value } }))}
                      onKeyDown={e => e.key === 'Enter' && addItem(field)}
                    />
                    <input
                      type="number" placeholder="Qtd" min="1" max="99"
                      value={input[field].qty}
                      onChange={e => setInput(p => ({ ...p, [field]: { ...p[field], qty: e.target.value } }))}
                      style={{ width: '60px' }}
                    />
                    <button onClick={() => addItem(field)}>+</button>
                  </div>
                  <ul className="admin-list">
                    {commissions[field]?.map((item, i) => (
                      <li
                        key={i}
                        draggable
                        onDragStart={() => onKanbanDragStart(field, i)}
                        className={`admin-card ${dragging?.field === field && dragging?.index === i ? 'dragging' : ''}`}
                      >
                        <span>⠿ {item}</span>
                        <button className="admin-remove" onClick={() => removeItem(field, i)}>✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ARTS ────────────────────────────────────────────────────────── */}
        {section === 'arts' && (
          <div className="admin-page">
            <div className="admin-header">
              <h1>Artes</h1>
            </div>

            <div className="admin-section">
              <h2>Galeria</h2>

              {/* categoria */}
              <div className="admin-thumb-tabs">
                {GALLERY_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`admin-status-btn ${galleryCategory === cat ? 'active' : ''}`}
                    onClick={() => { setGalleryCategory(cat); setUploadError(''); setUploadMsg('') }}
                  >
                    {GALLERY_CATEGORY_LABELS[cat] ?? cat}
                  </button>
                ))}
              </div>

              {/* plataforma */}
              <div className="admin-thumb-tabs">
                {GALLERY_PLATFORMS.map(plt => (
                  <button
                    key={plt}
                    className={`admin-status-btn ${galleryPlatform === plt ? 'active' : ''}`}
                    onClick={() => { setGalleryPlatform(plt); setUploadError(''); setUploadMsg('') }}
                  >
                    {plt.charAt(0).toUpperCase() + plt.slice(1)}
                  </button>
                ))}
              </div>

              {/* upload de arquivo */}
              <label className={`admin-thumb-label ${uploading || cooldown > 0 ? 'disabled' : ''}`}>
                {uploading
                  ? 'Enviando...'
                  : cooldown > 0
                    ? `Cooldown: ${fmtCooldown(cooldown)}`
                    : `Adicionar imagens (máx. ${UPLOAD_LIMIT}, até 20MB cada)`}
                <input
                  type="file" multiple accept="image/jpeg,image/jpg,image/png"
                  ref={fileRef} onChange={handleUpload}
                  disabled={uploading || cooldown > 0}
                  style={{ display: 'none' }}
                />
              </label>

              {/* mensagens */}
              {galleryError  && <p className="admin-error">{galleryError}</p>}
              {uploadError   && <p className="admin-error">{uploadError}</p>}
              {uploadMsg     && <p className="admin-success">{uploadMsg}</p>}

              {/* adicionar por URL */}
              <div className="admin-section admin-url-input-section">
                <h3>Adicionar imagem via URL</h3>
                <div className="admin-url-input-row">
                  <input
                    type="url" placeholder="Cole a URL da imagem aqui"
                    value={newUrl}
                    onChange={e => { setNewUrl(e.target.value); setNewUrlError(''); setNewUrlMsg('') }}
                    onKeyDown={e => e.key === 'Enter' && addUrl()}
                  />
                  <button onClick={addUrl}>Adicionar URL</button>
                </div>
                {newUrlError && <p className="admin-error">{newUrlError}</p>}
                {newUrlMsg   && <p className="admin-success">{newUrlMsg}</p>}
              </div>

              <p className="admin-info-text">Arraste para reordenar. A ordem é salva automaticamente no Firestore.</p>

              {/* grid */}
              <div className="admin-thumb-grid">
                {galleryLoading && <p className="admin-info-text">Carregando galeria…</p>}

                {!galleryLoading && currentItems.length === 0 && (
                  <p className="admin-info-text">Nenhuma imagem nesta categoria/plataforma.</p>
                )}

                {!galleryLoading && currentItems.map((item, i) => {
                  const url = item.src ?? item.url
                  if (!url) return null

                  return (
                    <div
                      key={item.id ?? i}
                      className={[
                        'admin-thumb-item',
                        dragFrom === i ? 'dragging-thumb' : '',
                        dragOver === i && dragFrom !== i ? 'drag-over' : '',
                      ].filter(Boolean).join(' ')}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={e => onDragOver(e, i)}
                      onDrop={() => onDrop(i)}
                      onDragEnd={onDragEnd}
                    >
                      <img src={url} alt={item.label ?? ''} draggable={false} />
                      <button
                        className="admin-thumb-delete"
                        onClick={() => deleteItem(i)}
                        title="Remover"
                      >✕</button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── CHANNELS ────────────────────────────────────────────────────── */}
        {section === 'channels' && (
          <div className="admin-page">
            <div className="admin-header">
              <h1>Canais</h1>
              <button className="admin-save" onClick={() => saveChannels(channels)}>
                {channelsSaved ? '✓ Salvo!' : 'Salvar'}
              </button>
            </div>

            {channelsError && <p className="admin-error">{channelsError}</p>}

            {/* adicionar canal */}
            <div className="admin-section">
              <h2>Adicionar canal</h2>
              <div className="admin-client-row">
                <input
                  type="url"
                  placeholder="URL do canal (ex: https://www.youtube.com/@handle)"
                  value={newChannel.channelUrl}
                  onChange={e => { setNewChannel(p => ({ ...p, channelUrl: e.target.value })); setNewChannelErr('') }}
                  onKeyDown={e => e.key === 'Enter' && addChannel()}
                  style={{ flex: 2 }}
                />
                <input
                  placeholder="Subscribers (ex: 1.44M)"
                  value={newChannel.subscribers}
                  onChange={e => setNewChannel(p => ({ ...p, subscribers: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addChannel()}
                  style={{ flex: 1 }}
                />
                <button onClick={addChannel}>Adicionar</button>
              </div>
              {newChannelErr && <p className="admin-error">{newChannelErr}</p>}
            </div>

            {/* lista de canais */}
            <div className="admin-section">
              <h2>Canais cadastrados ({channels.length})</h2>
              <p className="admin-info-text">Clique em um canal para gerenciar os vídeos.</p>

              {channels.length === 0 && <p className="admin-info-text">Nenhum canal ainda.</p>}

              {channels.map((ch, chIndex) => {
                const handle = (() => {
                  try {
                    const parts = new URL(ch.channelUrl).pathname.split('/').filter(Boolean)
                    return parts[0] ?? ch.channelUrl
                  } catch { return ch.channelUrl }
                })()
                const isExpanded = expandedCh === chIndex

                return (
                  <div key={chIndex} className="admin-channel-item">
                    <div className="admin-channel-header" onClick={() => setExpandedCh(isExpanded ? null : chIndex)}>
                      <span className="admin-channel-handle">{handle}</span>
                      <div className="admin-channel-meta">
                        <input
                          className="admin-channel-subs-input"
                          value={ch.subscribers}
                          onChange={e => { e.stopPropagation(); updateSubscribers(chIndex, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          placeholder="Subscribers"
                          title="Subscribers"
                        />
                        <span className="admin-channel-count">{(ch.works ?? []).length} vídeo(s)</span>
                        <span className="admin-channel-toggle">{isExpanded ? '▲' : '▼'}</span>
                        <button
                          className="admin-remove"
                          onClick={e => { e.stopPropagation(); removeChannel(chIndex) }}
                          title="Remover canal"
                        >✕</button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="admin-channel-body">
                        {/* vídeos existentes */}
                        {(ch.works ?? []).length === 0 && (
                          <p className="admin-info-text">Nenhum vídeo/badge ainda.</p>
                        )}
                        <div className="admin-thumb-grid">
                          {(ch.works ?? []).map((work, vIndex) => {
                            const vid   = work.videoUrl ? (() => {
                              try {
                                const u = new URL(work.videoUrl)
                                return u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v')
                              } catch { return null }
                            })() : null
                            const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null

                            return (
                              <div key={vIndex} className="admin-thumb-item" style={{ position: 'relative' }}>
                                {thumb
                                  ? <img src={thumb} alt={work.label ?? `Vídeo ${vIndex + 1}`} draggable={false} />
                                  : <div style={{ background: '#222', width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#66a4db', fontSize: '0.75rem', padding: '0.5rem', textAlign: 'center' }}>{work.label ?? 'badge'}</div>
                                }
                                <button
                                  className="admin-thumb-delete"
                                  onClick={() => removeVideoFromChannel(chIndex, vIndex)}
                                  title="Remover"
                                >✕</button>
                              </div>
                            )
                          })}
                        </div>

                        {/* adicionar vídeo */}
                        <div className="admin-url-input-section" style={{ marginTop: '1rem' }}>
                          <h3>Adicionar vídeo</h3>
                          <div className="admin-url-input-row">
                            <input
                              type="url"
                              placeholder="URL do vídeo (youtu.be/... ou youtube.com/watch?v=...)"
                              value={newVideo[chIndex]?.videoUrl ?? ''}
                              onChange={e => setNewVideo(p => ({ ...p, [chIndex]: { ...p[chIndex], videoUrl: e.target.value } }))}
                              onKeyDown={e => e.key === 'Enter' && addVideoToChannel(chIndex)}
                            />
                            <input
                              placeholder="Label (opcional)"
                              value={newVideo[chIndex]?.label ?? ''}
                              onChange={e => setNewVideo(p => ({ ...p, [chIndex]: { ...p[chIndex], label: e.target.value } }))}
                              onKeyDown={e => e.key === 'Enter' && addVideoToChannel(chIndex)}
                              style={{ maxWidth: '160px' }}
                            />
                            <button onClick={() => addVideoToChannel(chIndex)}>Adicionar</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
