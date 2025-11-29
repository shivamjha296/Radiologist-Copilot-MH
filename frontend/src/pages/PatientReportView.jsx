
import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, User, Calendar, FileText, Download, Printer, MessageSquare, Image as ImageIcon, LogOut, ChevronDown, Layers } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// Simple Heatmap Component (Simulated)
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

  return (
    <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-60 bg-gradient-to-br from-transparent via-yellow-500/20 to-red-600/40 rounded-lg" />
  );
};

// Sample chat responses for patient Q&A
// Enhanced local chatbot with report context
const generateAIResponse = (question, report) => {
  const lowerQuestion = question.toLowerCase()

  // Context-aware responses based on report data
  if (report) {
    if (lowerQuestion.includes('finding') || lowerQuestion.includes('wrong') || lowerQuestion.includes('show')) {
      return `Based on the report: ${report.findings || report.full_text || "No specific findings listed."}`
    }
    if (lowerQuestion.includes('impression') || lowerQuestion.includes('summary') || lowerQuestion.includes('conclusion')) {
      return `The summary of the report says: ${report.impression || "No impression listed."}`
    }
    if (lowerQuestion.includes('doctor') || lowerQuestion.includes('radiologist')) {
      return `This report was finalized by ${report.radiologist || "your doctor"}.`
    }
  }

  const responses = {
    'pain': 'Monitor any chest discomfort. Contact your doctor if pain persists.',
    'normal': 'A normal X-ray means no abnormalities were detected in your lungs or chest.',
    'pneumonia': 'Pneumonia is a lung infection. Follow your treatment plan and get adequate rest.',
    'follow': 'Follow-up visits help monitor your recovery. Please attend all scheduled appointments.',
    'exercise': 'Light activity is usually fine. Avoid strenuous exercise until cleared by your doctor.',
    'medication': 'Take all medications as prescribed. Complete the full course even if you feel better.'
  }

  for (const [key, response] of Object.entries(responses)) {
    if (lowerQuestion.includes(key)) {
      return response
    }
  }

  return "I can help explain information from your report. For specific medical advice, please consult your healthcare provider."
}

export default function PatientReportView() {
  const { reportId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: 'Hi! I can help explain your medical report. What would you like to know?',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    fetchReport()
  }, [reportId])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  async function fetchReport() {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched Report Data:', data) // Debug log
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

  // Helper to construct full URLs
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsTyping(true)

    // Call backend chat API
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          question: chatInput
        }),
      })

      let aiText = "I'm sorry, I couldn't process your request."

      if (response.ok) {
        const data = await response.json()
        aiText = data.answer
      } else {
        // Fallback to local logic if backend fails
        console.warn("Backend chat failed, using local fallback")
        aiText = generateAIResponse(chatInput, report)
      }

      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error("Chat error:", error)
      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        text: "I'm having trouble connecting to the server. " + generateAIResponse(chatInput, report),
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
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
        <button onClick={() => navigate('/patient-dashboard')} className="mt-4 text-teal-600 hover:underline">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const pdfUrl = getFullUrl(report.pdf_url);
  const scanUrl = getFullUrl(report.scan?.file_url) || "/api/placeholder/800/800";

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 flex-shrink-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back to Reports</span>
            </button>
            <div className="h-5 w-px bg-gray-300"></div>
            <h1 className="text-xl font-bold text-gray-900">{report.patientName} - {report.date}</h1>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Download size={16} />
                Download PDF
              </a>
            )}
            <div className="relative">
              <button
                onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium text-xs">
                  {user?.name?.charAt(0) || 'P'}
                </div>
                <ChevronDown size={14} />
              </button>
              {showLogoutMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowLogoutMenu(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Pane Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Pane: X-ray Image */}
        <div className="w-1/3 bg-gray-900 flex flex-col relative border-r border-gray-700">
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
            <div className="relative inline-block max-w-full max-h-full">
              <img
                src={scanUrl}
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

        {/* Center Pane: PDF Report */}
        <div className="flex-1 bg-gray-100 flex flex-col border-r border-gray-200">
          <div className="flex-1 p-4 overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full rounded-lg shadow-md border border-gray-200 bg-white"
                title="Medical Report PDF"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500">
                <FileText size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">PDF Report Not Available</p>
                <p className="text-sm">The report has not been finalized yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Chatbot */}
        <div className="w-[350px] bg-white flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-teal-50">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-teal-600" size={20} />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">Ask questions about your report</p>
          </div>

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-lg text-sm ${message.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}>
                  <p>{message.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${message.role === 'user' ? 'text-teal-100' : 'text-gray-500'
                    }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
