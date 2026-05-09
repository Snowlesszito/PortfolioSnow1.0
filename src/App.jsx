import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home'
import ThumbnailsPage from './pages/ThumbnailsPage/ThumbnailsPage.jsx'
import KeyArtsPage from './pages/KeyArtsPage/KeyArtsPage'
import PromocionalPage from './pages/PromocionalPage/PromocionalPage'
import ProfilePage from './pages/ProfilePage/Profile'
import TosPage from './pages/TosPage/TosPage'
import AdminPage from './pages/AdminPage/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage/AdminLoginPage'
import RequireAuth from './components/RequireAuth/RequireAuth'

function App() {
  useEffect(() => {
    const el = document.getElementById('loading-screen')
    if (!el) return

    const dismiss = () => {
      el.classList.add('done')
      setTimeout(() => el.remove(), 500)
    }

    const minDelay = new Promise(res => setTimeout(res, 800))
    const pageLoad = new Promise(res => {
      if (document.readyState === 'complete') res()
      else window.addEventListener('load', res, { once: true })
    })

    Promise.all([minDelay, pageLoad]).then(dismiss)
  }, [])

  return (
    <>
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/thumbnails" element={<ThumbnailsPage />} />
        <Route path="/keyarts" element={<KeyArtsPage />} />
        <Route path="/promocional" element={<PromocionalPage />} />
        <Route path="/tos" element={<TosPage />} />
        <Route path="/profiles" element={<ProfilePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
      </Routes>
    </>
  )
}

export default App