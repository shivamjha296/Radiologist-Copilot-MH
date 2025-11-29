import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, FileText, Activity, Layers, AlertCircle, Edit2, Save, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

// Heatmap Component
const HeatmapOverlay = ({ imageUrl, visible }) => {
    if (!visible) return null;

    if (imageUrl) {
        return (
            <img
                src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`}
                alt="Heatmap Overlay"
                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-70 pointer-events-none"
            />
        );
    }

    // Fallback to simulated heatmap if no image
    return (
        <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-60 bg-gradient-to-br from-transparent via-yellow-500/20 to-red-600/40 rounded-lg" />
    );
};

export default function RadiologistReportView() {
    const { reportId } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showHeatmap, setShowHeatmap] = useState(false)

    // Editing State
    const [isEditing, setIsEditing] = useState(false)
    const [editedText, setEditedText] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // UI State
    const [isImpressionOpen, setIsImpressionOpen] = useState(true)

    useEffect(() => {
        fetchReport()
    }, [reportId])

    async function fetchReport() {
        try {
            const response = await fetch(`http://localhost:8000/api/reports/${reportId}`)
            if (response.ok) {
                const data = await response.json()
                setReport(data)
                setEditedText(data.full_text)
            } else {
                toast.error('Failed to load report')
            }
        } catch (error) {
            console.error('Error fetching report:', error)
            toast.error('Error loading report')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (finalize = false) => {
        setIsSaving(true)
        try {
            const response = await fetch(`http://localhost:8000/api/reports/${reportId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_text: editedText,
                    status: finalize ? 'Final' : report.status
                })
            })

            if (response.ok) {
                toast.success(finalize ? 'Report finalized' : 'Changes saved')
                setReport(prev => ({ ...prev, full_text: editedText, status: finalize ? 'Final' : prev.status }))
                setIsEditing(false)
                if (finalize) navigate('/')
            } else {
                toast.error('Failed to save changes')
            }
        } catch (error) {
            console.error('Error saving report:', error)
            toast.error('Error saving report')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    if (!report) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p>Report not found.</p>
                <button onClick={() => navigate('/')} className="mt-4 text-teal-600 hover:underline">
                    Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="h-5 w-px bg-gray-300"></div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{report.patientName}</h1>
                        <p className="text-xs text-gray-500">MRN: {report.patientId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {report.comparison_findings && (
                        <button
                            onClick={() => navigate(`/report/${reportId}/comparison`)}
                            className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                        >
                            <Activity size={14} />
                            Comparison with past X-rays
                        </button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === 'Final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {report.status}
                    </span>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSave(false)}
                                className="px-3 py-1.5 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition flex items-center gap-1"
                                disabled={isSaving}
                            >
                                <Save size={14} />
                                Save Draft
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition flex items-center gap-1"
                                disabled={isSaving}
                            >
                                <CheckCircle size={14} />
                                Finalize
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2"
                        >
                            <Edit2 size={14} />
                            Edit Report
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content - 3 Part Split */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: Patient Info & History */}
                <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                        <div>
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                                <User size={18} className="text-teal-600" />
                                Patient Details
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Age/Gender</span>
                                    <span className="font-medium text-gray-900">45 / M</span> {/* Placeholder if not in report */}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Scan Date</span>
                                    <span className="font-medium text-gray-900">{report.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Modality</span>
                                    <span className="font-medium text-gray-900">{report.scan?.modality || 'DX'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Body Part</span>
                                    <span className="font-medium text-gray-900">{report.scan?.body_part || 'CHEST'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                                <Activity size={18} className="text-teal-600" />
                                Medical History
                            </h3>
                            <div className="prose prose-sm text-gray-600 bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                                {report.patient_history ? (
                                    <p className="whitespace-pre-wrap">{report.patient_history}</p>
                                ) : (
                                    <p className="italic text-gray-400">No history available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel: X-ray Image & Visualizations */}
                <div className="flex-1 bg-gray-900 flex flex-col relative overflow-hidden">
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showHeatmap ? 'bg-teal-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                        >
                            <Layers size={16} />
                            {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                        {/* Image Container */}
                        <div className="relative inline-block max-w-full max-h-full">
                            <img
                                src={report.scan?.file_url ? (report.scan.file_url.startsWith('http') ? report.scan.file_url : `http://localhost:8000${report.scan.file_url}`) : "/api/placeholder/800/800"}
                                alt="X-ray"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg"
                            />
                            <HeatmapOverlay
                                visible={showHeatmap}
                                imageUrl={report.ner_tags?.visualization_path}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel: AI Report */}
                <div className="w-1/4 bg-white border-l border-gray-200 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                        <div>
                            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                                <FileText size={18} className="text-teal-600" />
                                AI Analysis
                            </h3>

                            <div className="space-y-4">
                                {/* Collapsible Impression */}
                                <div className="border border-blue-100 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setIsImpressionOpen(!isImpressionOpen)}
                                        className="w-full flex items-center justify-between bg-blue-50 px-4 py-2 text-left"
                                    >
                                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Impression</h4>
                                        {isImpressionOpen ? <ChevronUp size={14} className="text-blue-800" /> : <ChevronDown size={14} className="text-blue-800" />}
                                    </button>

                                    {isImpressionOpen && (
                                        <div className="p-4 bg-blue-50/50">
                                            <div className="text-sm text-blue-900 font-medium leading-relaxed prose prose-sm max-w-none">
                                                <ReactMarkdown>{report.findings}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Findings</h4>
                                    </div>

                                    {isEditing ? (
                                        <textarea
                                            value={editedText}
                                            onChange={(e) => setEditedText(e.target.value)}
                                            className="w-full h-[400px] p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                                            <ReactMarkdown>{report.full_text}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
