import { FileText, Download, Eye, Calendar, User } from 'lucide-react'

const mockReports = [
  {
    id: 1, 
    patientName: 'Anand Bineet Birendra Kumar', 
    patientId: 'NSSH.1215787',
    date: 'Sep 3, 2024',
    time: '14:30',
    diagnosis: 'Pneumonia (Left cardiac shadow)',
    findings: 'Soft tissue opacity behind left cardiac shadow due to pneumonia. Heart size normal.',
    confidence: 82,
    status: 'Final',
    radiologist: 'Dr. Anjali Desai'
  },
  {
    id: 2, 
    patientName: 'Kaushik V Krishnan', 
    patientId: 'NSSH.1243309',
    date: 'Jul 1, 2024',
    time: '11:15',
    diagnosis: 'Bilateral Pneumonia (Both lower zones)',
    findings: 'Bilateral lower zone pneumonia. Tracheostomy, NG tube, CVC in position.',
    confidence: 91,
    status: 'Final',
    radiologist: 'Dr. Vikram Singh'
  },
  {
    id: 3, 
    patientName: 'Shreyas Sanghavi', 
    patientId: 'NSSH.1272962',
    date: 'Jul 9, 2024',
    time: '09:45',
    diagnosis: 'Pneumonia (Left cardiac shadow)',
    findings: 'Soft tissue opacity behind left cardiac shadow. Normal cardiac and bony structures.',
    confidence: 78,
    status: 'Final',
    radiologist: 'Dr. Anjali Desai'
  },
  {
    id: 4, 
    patientName: 'Sameer Tukaram Sawant', 
    patientId: 'NSSH.1281948',
    date: 'Nov 21, 2024',
    time: '16:20',
    diagnosis: 'Pneumonia (Left cardiac shadow)',
    findings: 'Opacity behind left cardiac shadow. Nasogastric tube in position. Requires evaluation.',
    confidence: 75,
    status: 'Pending Review',
    radiologist: 'Dr. Vikram Singh'
  },
]

export default function Reports(){
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="space-y-4">
          {mockReports.map(report => (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{report.patientName}</h3>
                      <span className="text-sm text-gray-500">({report.patientId})</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        report.status === 'Final' 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {report.status}
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
                      <div className="text-sm text-gray-600">{report.findings}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-sm text-slate-600">AI Confidence:</div>
                      <div className="flex-1 max-w-xs bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full"
                          style={{width: `${report.confidence}%`}}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{report.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 text-sm font-medium shadow-md">
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
