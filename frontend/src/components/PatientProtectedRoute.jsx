import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PatientProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!user || !user.isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If authenticated as radiologist but trying to access patient routes, redirect
  if (user.role === 'radiologist') {
    return <Navigate to="/" replace />
  }

  // If authenticated as patient, render the component
  return children
}