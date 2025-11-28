import { FileDown, FileText } from 'lucide-react'
import { generateMedicalReportPDF, downloadPDF } from '../utils/pdfGenerator'

export default function ReportCard({ reportData }) {
  
  const handleDownload = () => {
    const pdf = generateMedicalReportPDF(reportData)
    downloadPDF(pdf, `Medical_Report_${reportData.patientId}_${Date.now()}.pdf`)
  }

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 max-w-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-100 rounded-lg">
            <FileText className="text-slate-700" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Medical Report Generated</h3>
            <p className="text-sm text-gray-500">Patient ID: {reportData.patientId}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
          ✓ Validated
        </span>
      </div>

      {/* Report Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Patient:</span>
            <span className="ml-2 font-medium">{reportData.patientName}</span>
          </div>
          <div>
            <span className="text-gray-500">Age:</span>
            <span className="ml-2 font-medium">{reportData.age}</span>
          </div>
          <div>
            <span className="text-gray-500">Study:</span>
            <span className="ml-2 font-medium">{reportData.study}</span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>
            <span className="ml-2 font-medium">{reportData.date}</span>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Key Findings:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {reportData.impression.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-teal-600 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-500">Confidence Score:</span>
            <span className="ml-2 font-bold text-emerald-600">{reportData.validation.confidenceScore}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Processing Time:</span>
            <span className="ml-2 font-medium">{reportData.processingTime}</span>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg"
      >
        <FileDown size={20} />
        Download PDF Report
      </button>
    </div>
  )
}
