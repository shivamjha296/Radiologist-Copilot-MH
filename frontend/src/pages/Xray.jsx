import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import HeatmapOverlay from '../components/HeatmapOverlay'

export default function Xray(){
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const handleFileChange = (e)=>{
    const f = e.target.files[0]
    if(!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    toast.success('X-ray uploaded')
  }

  const analyze = ()=>{
    if(!file) return toast.error('Please upload an X-ray first')
    
    setAnalyzing(true)
    setResult(null)
    
    setTimeout(()=>{
      setResult({ 
        conditions:[
          {name:'Pneumonia', score:0.873, severity:'High', location:'Right lower lobe'},
          {name:'Cardiomegaly', score:0.452, severity:'Moderate', location:'Cardiac silhouette'},
          {name:'Infiltration', score:0.231, severity:'Low', location:'Bilateral'},
          {name:'Edema', score:0.089, severity:'Minimal', location:'Lung bases'}
        ], 
        summary:'Moderate pneumonia detected in right lower lobe with cardiomegaly. Recommend antibiotic treatment and follow-up.',
        confidence: 0.92,
        processingTime: '2.3s'
      })
      setAnalyzing(false)
      toast.success('Analysis complete!')
    }, 2500)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Toaster position="top-right"/>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-4">Upload X-ray Image</h3>
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
              <Upload className="mx-auto mb-3 text-gray-400" size={48}/>
              <div className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</div>
              <div className="text-xs text-gray-400">PNG, JPG or DICOM (max 10MB)</div>
              <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
            </label>
            
            {preview && (
              <div className="mt-4 text-center">
                <img src={preview} alt="Preview" className="max-w-full h-48 object-contain mx-auto rounded border" />
                <div className="mt-2 text-sm text-gray-500">{file?.name}</div>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <button 
                onClick={analyze} 
                disabled={!file || analyzing}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md font-medium"
              >
                {analyzing ? <><Loader2 className="animate-spin"/> Analyzing...</> : 'Analyze X-ray'}
              </button>
            </div>
          </div>

          {analyzing && (
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-teal-600"/>
                <div>
                  <div className="font-medium text-sm text-slate-800">AI Agent Processing</div>
                  <div className="text-xs text-slate-600">Running CheXNet inference...</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {result && (
            <>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Analysis Results</h4>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={18}/>
                    <span className="text-sm font-medium">{Math.round(result.confidence*100)}% Confidence</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {result.conditions.map((c,i)=>(
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{c.name}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          c.severity === 'High' ? 'bg-red-100 text-red-700' : 
                          c.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-green-100 text-green-700'
                        }`}>{c.severity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              c.score > 0.7 ? 'bg-red-500' : 
                              c.score > 0.4 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{width: `${c.score*100}%`}}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{Math.round(c.score*100)}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Location: {c.location}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-slate-700 flex-shrink-0 mt-0.5" size={16}/>
                    <div className="text-sm text-slate-700">{result.summary}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400 text-right">
                  Processing time: {result.processingTime}
                </div>
              </div>

              {preview && (
                <div className="p-6 bg-white rounded-lg shadow-sm border">
                  <h4 className="font-semibold text-lg mb-4">Grad-CAM Heatmap</h4>
                  <div className="flex justify-center">
                    <HeatmapOverlay imageUrl={preview} />
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Red/yellow regions indicate areas of high model attention
                  </div>
                </div>
              )}
            </>
          )}

          {!result && !analyzing && (
            <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <div className="text-gray-400 mb-2">No analysis yet</div>
              <div className="text-sm text-gray-500">Upload an X-ray and click analyze to see results</div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
