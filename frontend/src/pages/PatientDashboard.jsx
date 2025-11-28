import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Calendar, User, Eye, ChevronRight, LogOut, ChevronDown, Edit, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// Sample patient reports data
const patientReports = []

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [selectedReport, setSelectedReport] = useState(null)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: '',
    phone: '',
    age: '',
    gender: 'Male',
    address: ''
  })

  const handleReportClick = (report) => {
    navigate(`/patient-report/${report.id}`, { state: { report } })
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleEditProfile = () => {
    setShowLogoutMenu(false)
    setShowEditProfile(true)
  }

  const handleSaveProfile = () => {
    // Here you would typically save to backend
    toast.success('Profile updated successfully')
    setShowEditProfile(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gray-100 shadow-md border-b border-gray-300 flex-shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <User className="text-white" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800">Patient Portal</div>
              <div className="text-xs text-gray-500">View Your Medical Reports</div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="flex items-center gap-3 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 shadow-md flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'P'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-800 truncate">{user?.name || 'Patient'}</div>
                  <div className="text-xs text-gray-500 capitalize">Patient</div>
                </div>
              </div>
              <ChevronDown className="text-gray-500" size={16} />
            </button>
            {showLogoutMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <button
                  onClick={handleEditProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowLogoutMenu(false)
                    handleLogout()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-12 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Medical Reports</h2>
          <p className="text-gray-600">Click on any report to view details and ask questions</p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {patientReports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleReportClick(report)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-teal-200 transform hover:-translate-y-1"
            >
              {/* Report Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-teal-600" size={20} />
                    <h3 className="font-bold text-lg text-gray-900">{report.reportNumber}</h3>
                  </div>
                  <ChevronRight className="text-gray-400" size={16} />
                </div>
                <h4 className="text-base font-semibold text-gray-800 mb-2">{report.title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Calendar size={14} />
                  <span>{report.date}</span>
                  <span className="text-gray-400">•</span>
                  <span>{report.time}</span>
                </div>
              </div>

              {/* Report Content */}
              <div className="p-6">
                <div className="space-y-3">
                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {report.status}
                    </span>
                    <Eye className="text-gray-400" size={16} />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Diagnosis:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{report.diagnosis}</p>
                  </div>

                  {/* Doctor */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span>{report.doctor}</span>
                  </div>
                </div>
              </div>

              {/* View Report Button */}
              <div className="px-6 pb-6">
                <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                  <Eye size={16} />
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {patientReports.length === 0 && (
          <div className="text-center py-16">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Your medical reports will appear here once they are available.</p>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your address"
                  rows="3"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}