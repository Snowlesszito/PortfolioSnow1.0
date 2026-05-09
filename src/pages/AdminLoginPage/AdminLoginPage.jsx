import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../../firebase'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import '../AdminPage/AdminPage.css'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/admin'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        navigate(from, { replace: true })
      }
    })
    return () => unsubscribe()
  }, [from, navigate])

  async function login() {
    try {
      setError('')
      await signInWithEmailAndPassword(auth, email, password)
      navigate(from, { replace: true })
    } catch (e) {
      setError('Email ou senha incorretos.')
    }
  }

  return (
    <div className="admin-login">
      <h1>Admin</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && login()}
      />
      {error && <p className="admin-error">{error}</p>}
      <button onClick={login}>Entrar</button>
    </div>
  )
}
