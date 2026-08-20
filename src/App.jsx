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
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'

function App() {
  useEffect(() => {
   
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('p')
    if (redirectPath) {
      window.history.replaceState(null, '', redirectPath)
    }

    const el = document.getElementById('loading-screen')
    if (!el) return

    const dismiss = () => {
      el.classList.add('done')
      setTimeout(() => el.remove(), 500)
    }

    // The app is mounted at this point; third-party images should not block the UI.
    const timer = setTimeout(dismiss, 300)
    return () => clearTimeout(timer)
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
