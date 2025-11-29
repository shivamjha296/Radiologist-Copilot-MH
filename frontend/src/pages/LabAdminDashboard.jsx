import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Edit, Trash2, Users, ChevronDown, LogOut, Upload, FileText, Layout, Database, Activity, FileImage, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LabAdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('patients')
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
      name: '', age: '', phone: '', diagnosis: '', status: 'Active', assignedTo: '', lastVisit: ''
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
      <aside className={`bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">Lab Admin</div>
              <div className="text-xs text-slate-300">Patient Management</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'patients' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
          >
            <Users size={20} />
            Patients
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'scans' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
          >
            <FileImage size={20} />
            Scans
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
          >
            <FileText size={20} />
            Reports
          </button>
        </nav>

        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 shadow-md text-white flex items-center justify-center font-medium">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">Lab Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gray-100 shadow-md border-b border-gray-300 flex-shrink-0">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Menu size={18} className="text-gray-700" />
              </button>
              <div>
                <div className="text-lg font-bold text-gray-800 capitalize">{activeTab} Database</div>
                <div className="text-xs text-gray-500">Manage and view all {activeTab} records</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="flex items-center gap-3 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="text-sm text-gray-700 font-medium">{user?.name || 'Admin'}</div>
                  <div className="w-9 h-9 rounded-full bg-teal-600 shadow-md flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <ChevronDown size={16} className="text-gray-600" />
                </button>

                {showLogoutMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowLogoutMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
                      <div className="px-4 py-2 border-b border-slate-200">
                        <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                        <div className="text-xs text-slate-500">Lab Administrator</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {/* Search and New Patient Button */}
          {activeTab === 'patients' && (
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition font-medium shadow-sm"
              >
                <Plus size={18} />
                New Patient
              </button>
            </div>
          )}

          {activeTab !== 'patients' && (
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
          )}

          {/* Views */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {activeTab === 'patients' && (
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Last Visit</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{patient.age}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{patient.phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{patient.lastVisit}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => handleUploadClick(patient)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 transition text-xs font-medium whitespace-nowrap"
                          >
                            <Upload size={13} />
                            Upload
                          </button>
                          <button
                            onClick={() => handleEdit(patient)}
                            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded flex items-center gap-1 transition text-xs font-medium whitespace-nowrap"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(patient.id)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1 transition text-xs font-medium whitespace-nowrap"
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
            )}

            {activeTab === 'scans' && (
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Scan ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Body Part</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Modality</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">View</th>
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
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Radiologist</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
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
                placeholder="Phone Number (+1234567890)"
                type="tel"
                value={editingPatient.phone}
                onChange={e => setEditingPatient({ ...editingPatient, phone: e.target.value })}
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
