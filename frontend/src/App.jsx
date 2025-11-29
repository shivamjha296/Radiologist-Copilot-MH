import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PatientProtectedRoute from './components/PatientProtectedRoute'
import LabAdminProtectedRoute from './components/LabAdminProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Xray from './pages/Xray'
import Reports from './pages/Reports'
import Compare from './pages/Compare'
import Patients from './pages/Patients'
import PatientDashboard from './pages/PatientDashboard'
import PatientReportView from './pages/PatientReportView'
import LabAdminDashboard from './pages/LabAdminDashboard'
import RadiologistReportView from './pages/RadiologistReportView'
import ComparisonView from './pages/ComparisonView'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Lab Admin Routes - With Lab Admin Protection, No Layout */}
        <Route path="/lab-admin" element={
          <LabAdminProtectedRoute>
            <LabAdminDashboard />
          </LabAdminProtectedRoute>
        } />

        {/* Patient Routes - With Patient Protection, No Layout */}
        <Route path="/patient-dashboard" element={
          <PatientProtectedRoute>
            <PatientDashboard />
          </PatientProtectedRoute>
        } />
        <Route path="/patient-report/:reportId" element={
          <PatientProtectedRoute>
            <PatientReportView />
          </PatientProtectedRoute>
        } />

        {/* Comparison View - Standalone page that can be opened in new window */}
        <Route path="/report/:reportId/comparison" element={<ComparisonView />} />

        {/* Main App Routes - With Layout and Protection for Radiologists */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Patients />} />
                <Route path="/xray" element={<Xray />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/radiologist/report/:reportId" element={<RadiologistReportView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}
