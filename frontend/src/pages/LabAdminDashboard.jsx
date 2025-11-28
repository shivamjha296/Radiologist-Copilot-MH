import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Edit, Trash2, Users, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const initialPatients = []

export default function LabAdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [patients, setPatients] = useState(initialPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPatient, setEditingPatient] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (patientId) => {
    if (window.confirm('Delete this patient record?')) {
      setPatients(patients.filter(p => p.id !== patientId))
      toast.success('Patient deleted')
    }
  }

  const handleEdit = (patient) => {
    setEditingPatient({ ...patient })
    setIsAddingNew(false)
  }

  const handleSave = () => {
    if (!editingPatient.name || !editingPatient.age || !editingPatient.diagnosis || !editingPatient.assignedTo) {
      toast.error('Please fill all fields')
      return
    }

    if (isAddingNew) {
      setPatients([...patients, editingPatient])
      toast.success('Patient added')
    } else {
      setPatients(patients.map(p => p.id === editingPatient.id ? editingPatient : p))
      toast.success('Patient updated')
    }

    setEditingPatient(null)
    setIsAddingNew(false)
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditingPatient({
      id: 'NSSH.' + String(Math.floor(Math.random() * 9000000) + 1000000),
      name: '',
      age: '',
      diagnosis: '',
      status: 'Active',
      lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      assignedTo: ''
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-teal-600 text-white',
      'Treatment': 'bg-amber-500 text-white',
      'Monitoring': 'bg-slate-500 text-white',
      'Cleared': 'bg-emerald-500 text-white'
    }
    return colors[status] || 'bg-slate-300 text-slate-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gray-100 shadow-md border-b border-gray-300">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Users className="text-white" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800">Lab Admin Portal</div>
              <div className="text-xs text-gray-500">Manage Patient Appointments</div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="flex items-center gap-3 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 shadow-md flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-800 truncate">{user?.name || 'Admin'}</div>
                  <div className="text-xs text-gray-500 capitalize">Lab Admin</div>
                </div>
              </div>
              <ChevronDown className="text-gray-500" size={16} />
            </button>
            {showLogoutMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
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
      <div className="max-w-[1400px] mx-auto px-12 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Patient Database</h2>
            <p className="text-sm text-gray-500 mt-1">{filteredPatients.length} patient records</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition font-medium shadow-md"
          >
            <Plus size={18} />
            Create New Appointment
          </button>
        </div>

        <div className="space-y-6">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, diagnosis, or assigned doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Patient Name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Age</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Diagnosis</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Assigned To</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Last Visit</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-3 text-xs font-medium text-gray-900 whitespace-nowrap">{patient.id}</td>
                      <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">{patient.name}</td>
                      <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{patient.age}</td>
                      <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">{patient.diagnosis}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">{patient.assignedTo}</td>
                      <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{patient.lastVisit}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(patient)}
                            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded flex items-center gap-1 transition text-xs font-medium whitespace-nowrap"
                            title="Edit"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1 transition text-xs font-medium whitespace-nowrap"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {isAddingNew ? 'Add Appointment' : 'Edit Appointment'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={editingPatient.id}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Anand Bineet Birendra Kumar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <input
                  type="number"
                  value={editingPatient.age}
                  onChange={(e) => setEditingPatient({ ...editingPatient, age: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  value={editingPatient.diagnosis}
                  onChange={(e) => setEditingPatient({ ...editingPatient, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Pneumonia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingPatient.status}
                  onChange={(e) => setEditingPatient({ ...editingPatient, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Active</option>
                  <option>Treatment</option>
                  <option>Monitoring</option>
                  <option>Cleared</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To *</label>
                <input
                  type="text"
                  value={editingPatient.assignedTo}
                  onChange={(e) => setEditingPatient({ ...editingPatient, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr. Anjali Desai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Visit</label>
                <input
                  type="text"
                  value={editingPatient.lastVisit}
                  onChange={(e) => setEditingPatient({ ...editingPatient, lastVisit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Oct 19, 2025"
                />
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingPatient(null)
                  setIsAddingNew(false)
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-md"
              >
                {isAddingNew ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
