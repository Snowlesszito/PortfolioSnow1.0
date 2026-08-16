import { useNavigate } from 'react-router-dom'
import './NotFoundPage.css'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="nf-page">
      <div className="nf-card">
        <span className="nf-code">404</span>
        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-subtitle">Oops, I don't think that address is correct.</p>
        <button className="nf-btn" onClick={() => navigate('/')}>
          ← Back to home
        </button>
      </div>
    </div>
  )
}
