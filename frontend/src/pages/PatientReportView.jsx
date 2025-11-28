import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, User, Calendar, FileText, Download, Printer, MessageSquare, Image as ImageIcon, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// Sample chat responses for patient Q&A
const generateAIResponse = (question) => {
  const responses = {
    'pain': 'Monitor any chest discomfort. Contact your doctor if pain persists.',
    'normal': 'A normal X-ray means no abnormalities were detected in your lungs or chest.',
    'pneumonia': 'Pneumonia is a lung infection. Follow your treatment plan and get adequate rest.',
    'follow': 'Follow-up visits help monitor your recovery. Please attend all scheduled appointments.',
    'exercise': 'Light activity is usually fine. Avoid strenuous exercise until cleared by your doctor.',
    'medication': 'Take all medications as prescribed. Complete the full course even if you feel better.'
  }
  
  const lowerQuestion = question.toLowerCase()
  for (const [key, response] of Object.entries(responses)) {
    if (lowerQuestion.includes(key)) {
      return response
    }
  }
  
  return "I can help explain information from your report. For medical advice, please consult your healthcare provider."
}

export default function PatientReportView() {
  const { reportId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
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
  
  // Get report data from navigation state or use sample data
  const report = location.state?.report || {
    id: reportId,
    reportNumber: `Report ${reportId}`,
    title: 'Chest X-Ray Analysis',
    date: 'November 28, 2024',
    time: '14:30',
    diagnosis: 'Normal Study',
    doctor: 'Dr. Anjali Desai',
    status: 'Completed',
    xrayImage: '/api/placeholder/600/600',
    findings: 'The chest X-ray shows normal lung fields with no signs of pneumonia, consolidation, or other abnormalities.',
    recommendations: 'No immediate follow-up required.',
    summary: 'This is a normal chest X-ray study with no abnormal findings.'
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

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

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        text: generateAIResponse(chatInput),
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000)
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 flex-shrink-0">
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
            <h1 className="text-xl font-bold text-gray-900">{report.reportNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success('Download started')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={() => toast.success('Printing...')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - X-ray Image and Report */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Report Header Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{report.title}</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{report.date} at {report.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={16} />
                      <span>Reviewed by {report.doctor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Diagnosis</h3>
                  <p className="text-blue-800">{report.diagnosis}</p>
                </div>
              </div>
            </div>

            {/* X-ray Image */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="text-gray-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">X-ray Image</h3>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 flex justify-center items-center">
                <img
                  src="https://raw.githubusercontent.com/ieee8023/covid-chestxray-dataset/master/images/01E392EE-69F9-4E33-BFCE-E5C968654078.jpeg"
                  alt="Chest X-ray"
                  className="max-w-full h-64 object-contain rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%231a1a1a' width='400' height='400'/%3E%3Ctext fill='%23ffffff' font-family='Arial' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EChest X-Ray Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>

            {/* Report Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-gray-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Detailed Report</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{report.summary}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Detailed Findings</h4>
                  <p className="text-gray-700 leading-relaxed">{report.findings}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                  <p className="text-gray-700 bg-blue-50 rounded-lg p-4">{report.recommendations}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chat */}
        <div className="w-[450px] bg-white border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-teal-600" size={20} />
              <h3 className="font-semibold text-gray-900">Ask Questions</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Get help understanding your report</p>
          </div>

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                placeholder="Ask about your report..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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