import { useState } from 'react'
import { GitCompare, Upload, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function Compare(){
  const [imageA, setImageA] = useState(null)
  const [imageB, setImageB] = useState(null)
  const [fileA, setFileA] = useState(null)
  const [fileB, setFileB] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileA = (e) => {
    const file = e.target.files[0]
    if(file) {
      setFileA(file.name)
      setImageA(URL.createObjectURL(file))
      setResult(null)
      toast.success('First X-ray uploaded')
    }
  }

  const handleFileB = (e) => {
    const file = e.target.files[0]
    if(file) {
      setFileB(file.name)
      setImageB(URL.createObjectURL(file))
      setResult(null)
      toast.success('Second X-ray uploaded')
    }
  }

  const compareImages = () => {
    if(!imageA || !imageB) {
      toast.error('Please upload both X-rays')
      return
    }

    setComparing(true)
    setTimeout(() => {
      setResult({
        changes: [
          { area: 'Right Lower Lobe', change: 'Increased opacity', severity: 'Moderate', trend: 'worsened' },
          { area: 'Cardiac Silhouette', change: 'Size unchanged', severity: 'Stable', trend: 'stable' },
          { area: 'Left Lung Field', change: 'Improved clarity', severity: 'Mild', trend: 'improved' },
          { area: 'Pleural Space', change: 'No effusion detected', severity: 'Normal', trend: 'stable' }
        ],
        summary: 'Comparison shows progression of infiltrate in right lower lobe. Left lung shows improvement. Cardiac size remains stable.',
        recommendation: 'Continue current treatment and schedule follow-up in 2 weeks.',
        timeDifference: '14 days',
        confidence: 88
      })
      setComparing(false)
      toast.success('Comparison complete!')
    }, 2500)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Toaster position="top-right"/>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image A Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">1</span>
                Earlier Scan
              </h3>
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                <Upload className="mx-auto mb-3 text-gray-400" size={40}/>
                <div className="text-sm text-gray-600 mb-2">Upload first X-ray</div>
                <div className="text-xs text-gray-400">PNG, JPG (max 10MB)</div>
                <input type="file" onChange={handleFileA} accept="image/*" className="hidden" />
              </label>
              {imageA && (
                <div className="mt-4">
                  <img src={imageA} alt="Scan A" className="w-full h-64 object-contain rounded border bg-gray-50" />
                  <div className="mt-2 text-sm text-gray-600 text-center">{fileA}</div>
                </div>
              )}
            </div>

            {/* Image B Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">2</span>
                Recent Scan
              </h3>
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
                <Upload className="mx-auto mb-3 text-gray-400" size={40}/>
                <div className="text-sm text-gray-600 mb-2">Upload second X-ray</div>
                <div className="text-xs text-gray-400">PNG, JPG (max 10MB)</div>
                <input type="file" onChange={handleFileB} accept="image/*" className="hidden" />
              </label>
              {imageB && (
                <div className="mt-4">
                  <img src={imageB} alt="Scan B" className="w-full h-64 object-contain rounded border bg-gray-50" />
                  <div className="mt-2 text-sm text-gray-600 text-center">{fileB}</div>
                </div>
              )}
            </div>
          </div>

          {/* Compare Button */}
          <div className="flex justify-center">
            <button 
              onClick={compareImages}
              disabled={!imageA || !imageB || comparing}
              className="px-8 py-3 bg-teal-600 text-white rounded-lg flex items-center gap-3 hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
            >
              <GitCompare size={20} />
              {comparing ? 'Analyzing Differences...' : 'Compare Scans'}
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Comparison Results</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Time difference:</span>
                  <span className="text-sm font-semibold text-teal-700">{result.timeDifference}</span>
                </div>
              </div>              <div className="space-y-3 mb-6">
                {result.changes.map((change, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{change.area}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            change.trend === 'improved' ? 'bg-green-100 text-green-700' :
                            change.trend === 'worsened' ? 'bg-red-100 text-red-700' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {change.trend === 'improved' ? '↑ Improved' : 
                             change.trend === 'worsened' ? '↓ Worsened' : 
                             '→ Stable'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{change.change}</div>
                        <div className="text-xs text-gray-500">Severity: {change.severity}</div>
                      </div>
                      {change.trend === 'improved' ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : change.trend === 'worsened' ? (
                        <AlertTriangle className="text-red-500" size={20} />
                      ) : (
                        <CheckCircle className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-100 rounded-lg border border-slate-300 mb-4">
                <div className="font-medium text-sm text-slate-900 mb-2">Summary</div>
                <div className="text-sm text-slate-700">{result.summary}</div>
              </div>

              <div className="p-4 bg-teal-600 rounded-lg shadow-md">
                <div className="font-medium text-sm text-white mb-2">Recommendation</div>
                <div className="text-sm text-teal-50">{result.recommendation}</div>
              </div>

              <div className="mt-4 text-right">
                <span className="text-xs text-gray-500">AI Confidence: </span>
                <span className="text-xs font-semibold text-gray-700">{result.confidence}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
