import { useState, useEffect, useRef } from 'react'
import { db, auth, storage } from '../../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref as sRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import './AdminPage.css'

// Static thumbnail maps: filename → resolved URL (build-time)
const staticThumbMods = {
  minecraft: import.meta.glob(
    '../../assets/images/thumbnails/minecraft/*.{jpg,JPG,jpeg,png,PNG}',
    { eager: true }
  ),
  roblox: import.meta.glob(
    '../../assets/images/thumbnails/roblox/*.{jpg,JPG,jpeg,png,PNG}',
    { eager: true }
  ),
}

const staticThumbMap = {
  minecraft: Object.fromEntries(
    Object.entries(staticThumbMods.minecraft).map(([p, m]) => [p.split('/').pop(), m.default])
  ),
  roblox: Object.fromEntries(
    Object.entries(staticThumbMods.roblox).map(([p, m]) => [p.split('/').pop(), m.default])
  ),
}

// Compress image to max 1920×1080, output JPEG at given quality
function compressImage(file, maxW = 1920, maxH = 1080, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      // scale down only — never upscale
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

const STATUS_OPTIONS = ['Open', 'Closed', 'Limited']
const COLUMNS = ['fila', 'wip', 'prontos', 'concluidos']
const COLUMN_LABELS = {
  fila: 'Queue',
  wip: 'In Progress (WIP)',
  prontos: 'Ready for Delivery',
  concluidos: 'Completed',
}

const INITIAL_STATE = {
  status: 'Open',
  fila: [],
  wip: [],
  prontos: [],
  concluidos: [],
  clients: [],
}

const UPLOAD_LIMIT = 10
const UPLOAD_COOLDOWN = 60 * 60 * 1000

function getLastUploadTime() {
  const stored = localStorage.getItem('adminLastUpload')
  return stored ? parseInt(stored) : 0
}

function getTimeUntilNextUpload() {
  const remaining = UPLOAD_COOLDOWN - (Date.now() - getLastUploadTime())
  return remaining > 0 ? remaining : 0
}

function resolveThumbUrl(item, cat) {
  return item.isStatic ? (staticThumbMap[cat]?.[item.name] ?? null) : item.url
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [section, setSection] = useState('commissions') // 'commissions' | 'arts'

  // ── Commissions ──
  const [data, setData] = useState(INITIAL_STATE)
  const [saved, setSaved] = useState(false)
  const [input, setInput] = useState({
    fila: { name: '', qty: '1' },
    wip: { name: '', qty: '1' },
    prontos: { name: '', qty: '1' },
    concluidos: { name: '', qty: '1' },
  })
  const [clientInput, setClientInput] = useState({ name: '' })
  const [clientError, setClientError] = useState('')
  const [dragging, setDragging] = useState(null)

  // ── Thumbnails ──
  const [thumbCategory, setThumbCategory] = useState('minecraft')
  const [thumbOrder, setThumbOrder] = useState({ minecraft: [], roblox: [] })
  const [thumbUploading, setThumbUploading] = useState(false)
  const [thumbError, setThumbError] = useState('')
  const [thumbSuccess, setThumbSuccess] = useState('')
  const [thumbCooldown, setThumbCooldown] = useState(0)
  const [thumbDragIndex, setThumbDragIndex] = useState(null)
  const [thumbDragOverIndex, setThumbDragOverIndex] = useState(null)
  const thumbFileRef = useRef(null)
  const cooldownRef = useRef(null)

  // ── Load commissions ──
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'commissions', 'status'))
      if (snap.exists()) setData({ ...INITIAL_STATE, ...snap.data() })
    }
    load()
  }, [])

  // ── Load thumbnails ──
  useEffect(() => {
    async function loadThumbs() {
      for (const cat of ['minecraft', 'roblox']) {
        const snap = await getDoc(doc(db, 'thumbnails', cat))
        // migrate old `images` field → new `order` format
        const stored = snap.exists()
          ? (snap.data().order ?? snap.data().images?.map(img => ({ ...img, isStatic: false })) ?? [])
          : []

        // append any static images not yet tracked in stored order
        const trackedStatics = new Set(stored.filter(i => i.isStatic).map(i => i.name))
        const newStatics = Object.keys(staticThumbMap[cat])
          .filter(name => !trackedStatics.has(name))
          .map(name => ({ name, isStatic: true }))

        setThumbOrder(prev => ({ ...prev, [cat]: [...stored, ...newStatics] }))
      }
    }
    loadThumbs()
  }, [])

  // ── Cooldown timer ──
  useEffect(() => {
    const remaining = getTimeUntilNextUpload()
    if (remaining <= 0) return
    setThumbCooldown(remaining)
    cooldownRef.current = setInterval(() => {
      const r = getTimeUntilNextUpload()
      setThumbCooldown(r)
      if (r <= 0) { clearInterval(cooldownRef.current); cooldownRef.current = null }
    }, 1000)
    return () => clearInterval(cooldownRef.current)
  }, [])

  function startCooldownTimer() {
    setThumbCooldown(UPLOAD_COOLDOWN)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      const r = getTimeUntilNextUpload()
      setThumbCooldown(r)
      if (r <= 0) { clearInterval(cooldownRef.current); cooldownRef.current = null }
    }, 1000)
  }

  function formatCooldown(ms) {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ── Commission actions ──
  async function save() {
    await setDoc(doc(db, 'commissions', 'status'), data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addItem(field) {
    const name = input[field].name.trim()
    const qty = parseInt(input[field].qty) || 1
    if (!name) return
    const newItems = Array.from({ length: qty }, () => name)
    const updatedData = { ...data, [field]: [...data[field], ...newItems] }
    setData(updatedData)
    setInput(prev => ({ ...prev, [field]: { name: '', qty: '1' } }))
    await setDoc(doc(db, 'commissions', 'status'), updatedData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function removeItem(field, index) {
    setData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
  }

  function generateClientCode(name) {
    const letters = name.match(/\b\w/g) || []
    return letters.join('').slice(0, 3).toUpperCase()
  }

  async function addClient() {
    const name = clientInput.name.trim()
    if (!name) return
    if (data.clients.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setClientError('Client already registered.')
      return
    }
    const newClient = { name, code: generateClientCode(name) }
    const updatedData = { ...data, clients: [...data.clients, newClient] }
    setData(updatedData)
    setClientInput({ name: '' })
    setClientError('')
    await setDoc(doc(db, 'commissions', 'status'), updatedData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function removeClient(index) {
    setData(prev => ({ ...prev, clients: prev.clients.filter((_, i) => i !== index) }))
  }

  function onDragStart(field, index) { setDragging({ field, index }) }

  async function onDropColumn(targetField) {
    if (!dragging) return
    const { field, index } = dragging
    if (field === targetField) return
    const item = data[field][index]
    const newData = {
      ...data,
      [field]: data[field].filter((_, i) => i !== index),
      [targetField]: [...data[targetField], item],
    }
    setData(newData)
    setDragging(null)
    await setDoc(doc(db, 'commissions', 'status'), newData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Thumbnail actions ──
  async function uploadThumbnails(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    if (thumbCooldown > 0) {
      setThumbError(`Cooldown ativo. Aguarde ${formatCooldown(thumbCooldown)} para enviar novamente.`)
      if (thumbFileRef.current) thumbFileRef.current.value = ''
      return
    }
    if (files.length > UPLOAD_LIMIT) {
      setThumbError(`Máximo ${UPLOAD_LIMIT} imagens por envio.`)
      if (thumbFileRef.current) thumbFileRef.current.value = ''
      return
    }
    // 20MB input limit — compression will bring it down before upload
    const oversized = files.filter(f => f.size > 20 * 1024 * 1024)
    if (oversized.length) {
      setThumbError(`Imagens acima de 20MB: ${oversized.map(f => f.name).join(', ')}`)
      if (thumbFileRef.current) thumbFileRef.current.value = ''
      return
    }

    setThumbUploading(true)
    setThumbError('')
    setThumbSuccess('')

    try {
      const newImages = []
      let totalOriginal = 0
      let totalCompressed = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setThumbSuccess(`Comprimindo ${i + 1}/${files.length}…`)

        totalOriginal += file.size
        const blob = await compressImage(file)
        totalCompressed += blob.size

        const baseName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
        const path = `thumbnails/${thumbCategory}/${Date.now()}_${baseName}`
        const fileRef = sRef(storage, path)
        await uploadBytes(fileRef, blob)
        const url = await getDownloadURL(fileRef)
        newImages.push({ url, name: baseName, path, isStatic: false })
      }

      const newOrder = [...thumbOrder[thumbCategory], ...newImages]
      await setDoc(doc(db, 'thumbnails', thumbCategory), { order: newOrder }, { merge: true })
      setThumbOrder(prev => ({ ...prev, [thumbCategory]: newOrder }))
      localStorage.setItem('adminLastUpload', Date.now().toString())
      startCooldownTimer()

      const saved = totalOriginal - totalCompressed
      const pct   = Math.round((saved / totalOriginal) * 100)
      setThumbSuccess(
        `${files.length} imagem(ns) enviada(s). ` +
        `${fmtBytes(totalOriginal)} → ${fmtBytes(totalCompressed)} (−${pct}%)`
      )
      setTimeout(() => setThumbSuccess(''), 5000)
    } catch (err) {
      setThumbError(`Erro ao enviar: ${err.message}`)
    } finally {
      setThumbUploading(false)
      if (thumbFileRef.current) thumbFileRef.current.value = ''
    }
  }

  async function deleteThumbnail(cat, index) {
    const item = thumbOrder[cat][index]
    if (item.isStatic) return
    try { await deleteObject(sRef(storage, item.path)) } catch {}
    const newOrder = thumbOrder[cat].filter((_, i) => i !== index)
    await setDoc(doc(db, 'thumbnails', cat), { order: newOrder }, { merge: true })
    setThumbOrder(prev => ({ ...prev, [cat]: newOrder }))
  }

  async function reorderThumbnails(cat, fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    const list = [...thumbOrder[cat]]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    setThumbOrder(prev => ({ ...prev, [cat]: list }))
    await setDoc(doc(db, 'thumbnails', cat), { order: list }, { merge: true })
  }

  // ── Render ──
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
            <span className="admin-sidebar-icon">📋</span>
            Comissões
          </button>
          <button
            className={`admin-sidebar-item ${section === 'arts' ? 'active' : ''}`}
            onClick={() => setSection('arts')}
          >
            <span className="admin-sidebar-icon">🖼</span>
            Artes
          </button>
        </nav>
        <button className="admin-sidebar-logout" onClick={() => signOut(auth)}>Logout</button>
      </aside>

      {/* Main content */}
      <main className="admin-main">

        {/* ── Commissions section ── */}
        {section === 'commissions' && (
          <div className="admin-page">
            <div className="admin-header">
              <h1>Commissions</h1>
              <button className="admin-save" onClick={save}>{saved ? '✓ Saved!' : 'Save'}</button>
            </div>

            <div className="admin-section">
              <h2>Commission Status</h2>
              <div className="admin-status-btns">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`admin-status-btn ${data.status === s ? 'active' : ''}`}
                    onClick={() => setData(prev => ({ ...prev, status: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-summary-grid">
              <div className="admin-summary-card">
                <span>Clientes cadastrados</span>
                <strong>{data.clients?.length || 0}</strong>
              </div>
              <div className="admin-summary-card">
                <span>Completed commissions</span>
                <strong>{data.concluidos?.length || 0}</strong>
              </div>
            </div>

            <div className="admin-section">
              <h2>Clientes</h2>
              <div className="admin-client-row">
                <input
                  placeholder="Nome do cliente"
                  value={clientInput.name}
                  onChange={e => { setClientInput(prev => ({ ...prev, name: e.target.value })); if (clientError) setClientError('') }}
                />
                <button onClick={addClient}>Add client</button>
              </div>
              {clientError && <p className="admin-error">{clientError}</p>}
              <p className="admin-info-text">Client code is generated automatically from the name.</p>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {data.clients?.length ? data.clients.map((client, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{client.name}</td>
                        <td><button className="admin-remove" onClick={() => removeClient(index)}>Remover</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3">Nenhum cliente registrado ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-section">
              <h2>Comissões finalizadas</h2>
              <p className="admin-info-text">O total é calculado automaticamente a partir da coluna Completed.</p>
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
                    <span className="admin-counter">{data[field]?.length || 0}</span>
                  </div>
                  <div className="admin-input-row">
                    <input
                      placeholder="Nome..."
                      value={input[field].name}
                      onChange={e => setInput(prev => ({ ...prev, [field]: { ...prev[field], name: e.target.value } }))}
                      onKeyDown={e => e.key === 'Enter' && addItem(field)}
                    />
                    <input
                      type="number"
                      placeholder="Qtd"
                      min="1"
                      max="99"
                      value={input[field].qty}
                      onChange={e => setInput(prev => ({ ...prev, [field]: { ...prev[field], qty: e.target.value } }))}
                      onKeyDown={e => e.key === 'Enter' && addItem(field)}
                      style={{ width: '60px' }}
                    />
                    <button onClick={() => addItem(field)}>+</button>
                  </div>
                  <ul className="admin-list">
                    {data[field]?.map((item, i) => (
                      <li
                        key={i}
                        draggable
                        onDragStart={() => onDragStart(field, i)}
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

        {/* ── Arts section ── */}
        {section === 'arts' && (
          <div className="admin-page">
            <div className="admin-header">
              <h1>Artes</h1>
            </div>

            <div className="admin-section">
              <h2>Thumbnails</h2>

              <div className="admin-thumb-tabs">
                {['minecraft', 'roblox'].map(cat => (
                  <button
                    key={cat}
                    className={`admin-status-btn ${thumbCategory === cat ? 'active' : ''}`}
                    onClick={() => setThumbCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <label className={`admin-thumb-label ${thumbUploading || thumbCooldown > 0 ? 'disabled' : ''}`}>
                {thumbUploading
                  ? 'Enviando...'
                  : thumbCooldown > 0
                    ? `Cooldown: ${formatCooldown(thumbCooldown)}`
                    : `Adicionar imagens a ${thumbCategory} (máx. ${UPLOAD_LIMIT}, até 20MB cada)`}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png"
                  ref={thumbFileRef}
                  onChange={uploadThumbnails}
                  disabled={thumbUploading || thumbCooldown > 0}
                  style={{ display: 'none' }}
                />
              </label>

              {thumbError && <p className="admin-error">{thumbError}</p>}
              {thumbSuccess && <p className="admin-success">{thumbSuccess}</p>}

              <p className="admin-info-text">
                Arraste para reordenar. Imagens <strong>estáticas</strong> não podem ser deletadas aqui.
              </p>

              <div className="admin-thumb-grid">
                {thumbOrder[thumbCategory].length === 0
                  ? <p className="admin-info-text">Nenhuma thumbnail encontrada.</p>
                  : thumbOrder[thumbCategory].map((item, i) => {
                      const url = resolveThumbUrl(item, thumbCategory)
                      if (!url) return null
                      return (
                        <div
                          key={i}
                          className={`admin-thumb-item${thumbDragIndex === i ? ' dragging-thumb' : ''}${thumbDragOverIndex === i && thumbDragIndex !== i ? ' drag-over' : ''}`}
                          draggable
                          onDragStart={() => setThumbDragIndex(i)}
                          onDragOver={e => { e.preventDefault(); setThumbDragOverIndex(i) }}
                          onDrop={() => {
                            if (thumbDragIndex !== null) reorderThumbnails(thumbCategory, thumbDragIndex, i)
                            setThumbDragIndex(null)
                            setThumbDragOverIndex(null)
                          }}
                          onDragEnd={() => { setThumbDragIndex(null); setThumbDragOverIndex(null) }}
                        >
                          <img src={url} alt={item.name} />
                          {item.isStatic
                            ? <span className="admin-thumb-static-badge">Static</span>
                            : <button className="admin-thumb-delete" onClick={() => deleteThumbnail(thumbCategory, i)}>✕</button>
                          }
                        </div>
                      )
                    })
                }
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
