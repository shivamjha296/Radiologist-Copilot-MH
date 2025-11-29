import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Edit, Trash2, Users, ChevronDown, LogOut, Upload, FileText, Layout, Database, Activity, FileImage } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LabAdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('patients')
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Data States
  const [patients, setPatients] = useState([])
  const [scans, setScans] = useState([])
  const [reports, setReports] = useState([])

  // Patient CRUD State
  const [editingPatient, setEditingPatient] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Upload State
  const [uploadingPatient, setUploadingPatient] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [bodyPart, setBodyPart] = useState('CHEST')
  const [isUploading, setIsUploading] = useState(false)

  // Fetch Data based on active tab
  useEffect(() => {
    if (activeTab === 'patients') fetchPatients()
    if (activeTab === 'scans') fetchScans()
    if (activeTab === 'reports') fetchReports()
  }, [activeTab])

  async function fetchPatients() {
    try {
      const response = await fetch('http://localhost:8000/api/patients')
      if (response.ok) setPatients(await response.json())
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
    }
  }

  async function fetchScans() {
    try {
      const response = await fetch('http://localhost:8000/api/scans')
      if (response.ok) setScans(await response.json())
    } catch (error) {
      console.error('Error fetching scans:', error)
      toast.error('Failed to load scans')
    }
  }

  async function fetchReports() {
    try {
      const response = await fetch('http://localhost:8000/api/reports')
      if (response.ok) setReports(await response.json())
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  // --- Patient CRUD Handlers ---
  const handleDelete = async (patientId) => {
    if (window.confirm('Delete this patient record?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/patients/${patientId}`, { method: 'DELETE' })
        if (response.ok) {
          setPatients(patients.filter(p => p.id !== patientId))
          toast.success('Patient deleted')
        } else {
          toast.error('Failed to delete patient')
        }
      } catch (error) {
        toast.error('Error deleting patient')
      }
    }
  }

  const handleEdit = (patient) => {
    setEditingPatient({ ...patient })
    setIsAddingNew(false)
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditingPatient({
      name: '', age: '', diagnosis: '', status: 'Active', assignedTo: '', lastVisit: ''
    })
  }

  const handleSavePatient = async () => {
    if (!editingPatient.name || !editingPatient.age) {
      toast.error('Please fill name and age')
      return
    }
    try {
      const url = isAddingNew ? 'http://localhost:8000/api/patients' : `http://localhost:8000/api/patients/${editingPatient.id}`
      const method = isAddingNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPatient)
      })

      if (response.ok) {
        toast.success(isAddingNew ? 'Patient added' : 'Patient updated')
        fetchPatients()
        setEditingPatient(null)
        setIsAddingNew(false)
      } else {
        toast.error('Failed to save patient')
      }
    } catch (error) {
      toast.error('Error saving patient')
    }
  }

  // --- Upload Handlers ---
  const handleUploadClick = (patient) => {
    setUploadingPatient(patient)
    setSelectedFile(null)
    setBodyPart('CHEST')
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append('patient_id', uploadingPatient.id)
    formData.append('file', selectedFile)
    formData.append('body_part', bodyPart)

    try {
      const response = await fetch('http://localhost:8000/api/scans', {
        method: 'POST',
        body: formData
      })
      if (response.ok) {
        toast.success('X-ray uploaded successfully. Analysis started.')
        setUploadingPatient(null)
        fetchPatients()
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // --- Filtering ---
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredScans = scans.filter(s =>
    s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredReports = reports.filter(r =>
    r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.radiologist.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Activity className="text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-gray-800">Lab Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'patients' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Users size={18} />
            Patients
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'scans' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <FileImage size={18} />
            Scans
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <FileText size={18} />
            Reports
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">Lab Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab} Database</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and view all {activeTab} records</p>
          </div>

          {activeTab === 'patients' && (
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition font-medium shadow-sm"
            >
              <Plus size={18} />
              New Patient
            </button>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {/* Search */}
          <div className="mb-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Views */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {activeTab === 'patients' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Visit</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{patient.age}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{patient.lastVisit}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleUploadClick(patient)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Upload</button>
                        <button onClick={() => handleEdit(patient)} className="text-teal-600 hover:text-teal-800 text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(patient.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'scans' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scan ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Body Part</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Modality</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{scan.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{scan.patientName}</div>
                        <div className="text-xs text-gray-500">{scan.patientId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{scan.bodyPart}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{scan.modality}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{scan.date}</td>
                      <td className="px-6 py-4 text-right">
                        <a href={scan.file_url.startsWith('http') ? scan.file_url : `http://localhost:8000${scan.file_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">View Image</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'reports' && (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Radiologist</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{report.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{report.patientName}</div>
                        <div className="text-xs text-gray-500">{report.patientId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{report.radiologist}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${report.status === 'Final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{report.date}</td>
                      <td className="px-6 py-4 text-right">
                        {report.pdf_url ? (
                          <a href={report.pdf_url.startsWith('http') ? report.pdf_url : `http://localhost:8000${report.pdf_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">Download PDF</a>
                        ) : (
                          <span className="text-gray-400 text-sm">No PDF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modals (Edit/Add & Upload) */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{isAddingNew ? 'Add Patient' : 'Edit Patient'}</h2>
            <div className="space-y-4">
              <input
                placeholder="Name"
                value={editingPatient.name}
                onChange={e => setEditingPatient({ ...editingPatient, name: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Age"
                type="number"
                value={editingPatient.age}
                onChange={e => setEditingPatient({ ...editingPatient, age: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Diagnosis"
                value={editingPatient.diagnosis}
                onChange={e => setEditingPatient({ ...editingPatient, diagnosis: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <select
                value={editingPatient.status}
                onChange={e => setEditingPatient({ ...editingPatient, status: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option>Active</option>
                <option>Treatment</option>
                <option>Monitoring</option>
                <option>Cleared</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditingPatient(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={handleSavePatient} className="px-4 py-2 bg-teal-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {uploadingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Upload X-ray for {uploadingPatient.name}</h2>
            <div className="space-y-4">
              <select
                value={bodyPart}
                onChange={e => setBodyPart(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="CHEST">Chest</option>
                <option value="ABDOMEN">Abdomen</option>
                <option value="HEAD">Head</option>
                <option value="SPINE">Spine</option>
                <option value="EXTREMITY">Extremity</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files[0])}
                className="w-full"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setUploadingPatient(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
