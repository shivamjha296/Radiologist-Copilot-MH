import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, Calendar, User, Activity, TrendingUp, TrendingDown, Minus, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function ComparisonView() {
    const { reportId } = useParams()
    const navigate = useNavigate()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReport()
    }, [reportId])

    async function fetchReport() {
        try {
            const response = await fetch(`http://localhost:8000/api/reports/${reportId}`)
            if (response.ok) {
                const data = await response.json()
                setReport(data)
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

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        )
    }

    if (!report || !report.comparison_findings) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                <AlertCircle size={48} className="mb-4 text-gray-400" />
                <p className="text-lg">No comparison data available.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
            {/* Header */}
            <header className="bg-white shadow-md border-b-4 border-yellow-500">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <Activity size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Comparison with Previous Scans</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Patient: <span className="font-semibold">{report.patientName}</span> • MRN: <span className="font-semibold">{report.patientId}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`/radiologist/report/${reportId}`)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Back to Report
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Patient Info Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                <User size={20} className="text-teal-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Patient Details</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Age/Gender</span>
                                <span className="font-medium text-gray-900">45 / M</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Scan Date</span>
                                <span className="font-medium text-gray-900">{report.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Modality</span>
                                <span className="font-medium text-gray-900">{report.scan?.modality || 'DX'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Scan Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar size={20} className="text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Current Scan</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Body Part</span>
                                <span className="font-medium text-gray-900">{report.scan?.body_part || 'CHEST'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">View</span>
                                <span className="font-medium text-gray-900">{report.scan?.view_position || 'PA'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className={`font-medium ${report.status === 'Final' ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {report.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Status Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <AlertCircle size={20} className="text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Analysis Status</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Comparison Complete</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">AI Analysis Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Trends Identified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Comparison Content */}
                <div className="bg-white rounded-xl shadow-xl p-8 border-t-4 border-yellow-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Activity size={24} className="text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Detailed Comparison Analysis</h2>
                            <p className="text-sm text-gray-600">Changes detected compared to previous imaging studies</p>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
                            <ReactMarkdown
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-6 flex items-center gap-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="space-y-2 my-4" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="space-y-2 my-4" {...props} />,
                                    li: ({ node, ...props }) => {
                                        const text = node.children[0]?.value || '';
                                        let icon = <Minus size={16} className="text-gray-400" />;
                                        let bgColor = 'bg-gray-50';
                                        let borderColor = 'border-gray-200';

                                        if (text.toLowerCase().includes('improved') || text.toLowerCase().includes('better') || text.toLowerCase().includes('resolved')) {
                                            icon = <TrendingUp size={16} className="text-green-600" />;
                                            bgColor = 'bg-green-50';
                                            borderColor = 'border-green-200';
                                        } else if (text.toLowerCase().includes('worsened') || text.toLowerCase().includes('increased') || text.toLowerCase().includes('worse') || text.toLowerCase().includes('new')) {
                                            icon = <TrendingDown size={16} className="text-red-600" />;
                                            bgColor = 'bg-red-50';
                                            borderColor = 'border-red-200';
                                        } else if (text.toLowerCase().includes('stable') || text.toLowerCase().includes('unchanged')) {
                                            icon = <Minus size={16} className="text-blue-600" />;
                                            bgColor = 'bg-blue-50';
                                            borderColor = 'border-blue-200';
                                        }

                                        return (
                                            <li className={`flex items-start gap-3 p-3 ${bgColor} border ${borderColor} rounded-lg`}>
                                                <div className="mt-0.5 flex-shrink-0">{icon}</div>
                                                <span className="text-gray-800 flex-1" {...props} />
                                            </li>
                                        );
                                    },
                                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                                    em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
                                }}
                            >
                                {report.comparison_findings}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-start gap-3 text-sm text-gray-600">
                            <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">
                                <strong className="text-gray-900">Important:</strong> This comparison analysis is generated by AI 
                                and should be reviewed by a qualified radiologist. Temporal changes identified may require 
                                correlation with clinical history and physical examination findings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
