import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LabAdminProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated but not lab admin, redirect to appropriate dashboard
  if (user.role !== 'labadmin') {
    if (user.role === 'patient') {
      return <Navigate to="/patient-dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  // If authenticated as lab admin, render without sidebar
  return children
}
