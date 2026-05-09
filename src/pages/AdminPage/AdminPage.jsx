import { useState, useEffect } from 'react'
import { db, auth } from '../../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import './AdminPage.css'

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

export default function AdminPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(INITIAL_STATE)
  const [saved, setSaved] = useState(false)
  const [input, setInput] = useState({ 
    fila: { name: '', qty: '1' }, 
    wip: { name: '', qty: '1' }, 
    prontos: { name: '', qty: '1' }, 
    concluidos: { name: '', qty: '1' } 
  })
  const [clientInput, setClientInput] = useState({ name: '' })
  const [clientError, setClientError] = useState('')
  const [dragging, setDragging] = useState(null) // { field, index }

  useEffect(() => {
    async function load() {
      const ref = doc(db, 'commissions', 'status')
      const snap = await getDoc(ref)
      if (snap.exists()) setData({ ...INITIAL_STATE, ...snap.data() })
    }
    load()
  }, [])

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
    
    // Salvar automaticamente
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

    const alreadyExists = data.clients.some(client => client.name.toLowerCase() === name.toLowerCase())
    if (alreadyExists) {
      setClientError('Client already registered.')
      return
    }

    const code = generateClientCode(name)
    const newClient = { name, code }
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


  function onDragStart(field, index) {
    setDragging({ field, index })
  }

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

  // salva automaticamente
  await setDoc(doc(db, 'commissions', 'status'), newData)
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back" onClick={() => navigate('/')}>← Back</button>
        <h1>Commission Status</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-save" onClick={save}>{saved ? '✓ Saved!' : 'Save'}</button>
          <button className="admin-back" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      {/* STATUS */}
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
            onChange={e => {
              setClientInput(prev => ({ ...prev, name: e.target.value }))
              if (clientError) setClientError('')
            }}
          />
          <button onClick={addClient}>Add client</button>
        </div>
        {clientError && <p className="admin-error">{clientError}</p>}
        <p className="admin-info-text">Client code is generated automatically from the name.</p>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.clients?.length ? data.clients.map((client, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{client.name}</td>
                  <td>
                    <button className="admin-remove" onClick={() => removeClient(index)}>Remover</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4">Nenhum cliente registrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h2>Comissões finalizadas</h2>
        <p className="admin-info-text">O total é calculado automaticamente a partir da coluna Completed.</p>
      </div>

      {/* KANBAN */}
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
  )
}