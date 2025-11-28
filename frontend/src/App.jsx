import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Chat from './pages/Chat'
import Xray from './pages/Xray'
import Reports from './pages/Reports'
import Compare from './pages/Compare'
import Patients from './pages/Patients'

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Chat/>} />
                <Route path="/xray" element={<Xray/>} />
                <Route path="/reports" element={<Reports/>} />
                <Route path="/compare" element={<Compare/>} />
                <Route path="/patients" element={<Patients/>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}
