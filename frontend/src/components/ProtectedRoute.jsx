import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated as patient but trying to access radiologist routes, redirect
  if (user.role === 'patient') {
    return <Navigate to="/patient-dashboard" replace />
  }

  // If authenticated as lab admin but trying to access radiologist routes, redirect
  if (user.role === 'labadmin') {
    return <Navigate to="/lab-admin" replace />
  }

  return children
}
