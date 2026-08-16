import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { auth } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function RequireAuth({ children }) {
  const [status, setStatus] = useState('pending')
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setStatus(user ? 'authenticated' : 'unauthenticated')
    })
    return () => unsubscribe()
  }, [])

  if (status === 'pending') return null
  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
