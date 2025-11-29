import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Users, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPatient, setEditingPatient] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    try {
      const response = await fetch('http://localhost:8000/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Failed to load patients')
    }
  }

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDelete = async (patientId) => {
    if (window.confirm('Delete this patient record?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/patients/${patientId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setPatients(patients.filter(p => p.id !== patientId))
          toast.success('Patient deleted')
        } else {
          toast.error('Failed to delete patient')
        }
      } catch (error) {
        console.error('Error deleting patient:', error)
        toast.error('Error deleting patient')
      }
    }
  }

  const handleEdit = (patient) => {
    setEditingPatient({ ...patient })
    setIsAddingNew(false)
  }

  const handleSave = async () => {
    if (!editingPatient.name || !editingPatient.age) {
      toast.error('Please fill name and age')
      return
    }

    try {
      if (isAddingNew) {
        const response = await fetch('http://localhost:8000/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPatient)
        })

        if (response.ok) {
          const newPatient = await response.json()
          setPatients([...patients, newPatient])
          toast.success('Patient added')
        } else {
          toast.error('Failed to add patient')
        }
      } else {
        const response = await fetch(`http://localhost:8000/api/patients/${editingPatient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingPatient)
        })

        if (response.ok) {
          setPatients(patients.map(p => p.id === editingPatient.id ? { ...p, ...editingPatient } : p))
          toast.success('Patient updated')
        } else {
          toast.error('Failed to update patient')
        }
      }

      setEditingPatient(null)
      setIsAddingNew(false)
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error('Error saving patient')
    }
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditingPatient({
      name: '',
      age: '',
      diagnosis: '',
      status: 'Active',
      assignedTo: '',
      lastVisit: ''
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

  const getScanStatusColor = (status) => {
    const colors = {
      'Ready': 'bg-green-100 text-green-800',
      'Processing': 'bg-blue-100 text-blue-800',
      'None': 'bg-gray-100 text-gray-500'
    }
    return colors[status] || 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
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
            Create New Patient
          </button>
        </div>

        <div className="space-y-6">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, or diagnosis..."
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
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Scan Status</th>
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
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getScanStatusColor(patient.scanStatus)}`}>
                          {patient.scanStatus || 'None'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{patient.lastVisit}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-4">
                          {patient.scanStatus === 'Ready' && (
                            <button
                              onClick={() => navigate(`/radiologist/report/${patient.reportId}`)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 transition text-xs font-medium whitespace-nowrap"
                              title="View Report"
                            >
                              <FileText size={13} />
                              Report
                            </button>
                          )}
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
                {isAddingNew ? 'Add Patient' : 'Edit Patient'}
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
