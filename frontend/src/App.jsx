import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PatientProtectedRoute from './components/PatientProtectedRoute'
import LabAdminProtectedRoute from './components/LabAdminProtectedRoute'
import Layout from './components/Layout'
import Signup from './pages/Signup'
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
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
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
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/patients" element={
          <ProtectedRoute>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/xray" element={
          <ProtectedRoute>
            <Layout>
              <Xray />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/compare" element={
          <ProtectedRoute>
            <Layout>
              <Compare />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/radiologist/report/:reportId" element={
          <ProtectedRoute>
            <Layout>
              <RadiologistReportView />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}
