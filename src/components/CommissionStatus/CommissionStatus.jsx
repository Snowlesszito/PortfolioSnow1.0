import { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import pintura from '../../assets/images/outros/antesedepois/pintura.png'
import './CommissionStatus.css'

export default function CommissionStatus() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const ref = doc(db, 'commissions', 'status')
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setData(snap.data())
    })
    return () => unsub()
  }, [])

  if (!data) return null

  const statusInfo = {
    Open: { label: 'Open for commissions', color: '#0d4f74', accent: '#8ed1ff' },
    Closed: { label: 'Commissions closed', color: '#2b2a37', accent: '#b48ead' },
    Limited: { label: 'Limited openings', color: '#2f3e50', accent: '#f3be7d' },
  }

  const currentStatus = statusInfo[data.status] || statusInfo.Open

  return (
    <section className="cs-section">
      <img src={pintura} alt="" className="cs-pintura" aria-hidden="true" />
      <h2 className="cs-title">Commission Status</h2>

      <div className="cs-badge" style={{ background: currentStatus.color, borderColor: currentStatus.accent, boxShadow: `0 6px 28px ${currentStatus.accent}55` }}>
        <span className="cs-badge-icon" style={{ background: currentStatus.accent, boxShadow: `0 0 8px ${currentStatus.accent}` }} />
        <span>{currentStatus.label}</span>
      </div>

      <div className="cs-grid">
        <div className="cs-card">
          <span className="cs-number">{data.fila?.length || 0}</span>
          <span className="cs-label">Queue</span>
        </div>
        <div className="cs-card">
          <span className="cs-number">{data.wip?.length || 0}</span>
          <span className="cs-label">W.I.P.</span>
        </div>
        <div className="cs-card">
          <span className="cs-number">{data.prontos?.length || 0}</span>
          <span className="cs-label">Ready to delivery</span>
        </div>
        <div className="cs-card">
          <span className="cs-number">{data.concluidos?.length || 0}</span>
          <span className="cs-label">Completed</span>
        </div>
      </div>
    </section>
  )
  
}

