import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Calendar, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Reports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const response = await fetch(`http://localhost:8000/api/reports?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    }
  }

  const handleViewReport = (report) => {
    navigate(`/radiologist/report/${report.id}`)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="space-y-4">
          {reports.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No reports found.
            </div>
          )}
          {reports.map(report => (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{report.patientName}</h3>
                      <span className="text-sm text-gray-500">({report.patientId})</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${report.status === 'Final'
                        ? 'bg-teal-600 text-white'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {report.status || 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{report.date} at {report.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{report.radiologist}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium text-slate-700 mb-1">Diagnosis:</div>
                      <div className="text-base font-semibold text-slate-900">{report.diagnosis}</div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Key Findings:</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{report.findings}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-sm text-slate-600">AI Confidence:</div>
                      <div className="flex-1 max-w-xs bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{ width: `${report.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{report.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 text-sm font-medium shadow-md"
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition flex items-center gap-2 text-sm font-medium">
                      <Download size={16} />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
