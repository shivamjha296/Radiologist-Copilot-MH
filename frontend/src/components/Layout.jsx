import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, MessageSquare, Image, FileText, GitCompare, Users, Sparkles, Menu, X, LogOut, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Layout({ children }){
  const loc = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  
  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar - Full Height */}
      <aside className={`bg-slate-800 border-r border-slate-700 shadow-xl transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="text-white" size={20}/>
            </div>
            <div>
              <div className="text-lg font-bold text-white">Radiologist's</div>
              <div className="text-xs text-slate-300">AI Copilot</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            <Link to="/" className={`flex items-center gap-3 p-3 rounded-lg transition ${loc.pathname === '/' ? 'bg-teal-600 text-white font-medium shadow-md' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}>
              <MessageSquare size={20}/> Agentic Chat
            </Link>
            <Link to="/xray" className={`flex items-center gap-3 p-3 rounded-lg transition ${loc.pathname === '/xray' ? 'bg-teal-600 text-white font-medium shadow-md' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}>
              <Image size={20}/> X-ray Analysis
            </Link>
            <Link to="/compare" className={`flex items-center gap-3 p-3 rounded-lg transition ${loc.pathname === '/compare' ? 'bg-teal-600 text-white font-medium shadow-md' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}>
              <GitCompare size={20}/> Compare X-rays
            </Link>
            <Link to="/patients" className={`flex items-center gap-3 p-3 rounded-lg transition ${loc.pathname === '/patients' ? 'bg-teal-600 text-white font-medium shadow-md' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}>
              <Users size={20}/> Patients
            </Link>
            <Link to="/reports" className={`flex items-center gap-3 p-3 rounded-lg transition ${loc.pathname === '/reports' ? 'bg-teal-600 text-white font-medium shadow-md' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}>
              <FileText size={20}/> Reports
            </Link>
            
            {/* Separator */}
            <div className="border-t border-slate-700 my-4"></div>
            
            {/* Patient Portal Link */}
            <a 
              href="/patient-dashboard" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg transition hover:bg-blue-600 text-slate-300 hover:text-white border border-blue-500/50 hover:border-blue-400"
            >
              <User size={20}/> 
              <div>
                <div className="font-medium">Patient Portal</div>
                <div className="text-xs opacity-75">View as Patient</div>
              </div>
            </a>
          </nav>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="text-sm font-medium text-teal-400 mb-2 flex items-center gap-2">
              <Sparkles size={16} /> Agentic Features
            </div>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>✓ Multi-agent workflows</li>
              <li>✓ Autonomous task routing</li>
              <li>✓ Real-time collaboration</li>
              <li>✓ Smart report generation</li>
            </ul>
          </div>
        </div>

        {/* Sidebar Footer - User Info */}
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 shadow-md flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-gray-100 shadow-md border-b border-gray-300 flex-shrink-0">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Menu size={18} className="text-gray-700" />
              </button>
              <div>
                <div className="text-lg font-bold text-gray-800">Radiologist's Copilot</div>
                <div className="text-xs text-gray-500">AI-Powered Diagnostic Assistant</div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                className="flex items-center gap-3 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="text-sm text-gray-700 font-medium">{user?.name || 'User'}</div>
                <div className="w-9 h-9 rounded-full bg-teal-600 shadow-md flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <ChevronDown size={16} className="text-gray-600" />
              </button>

              {/* Logout Dropdown */}
              {showLogoutMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowLogoutMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-slate-200">
                      <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                      <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
                    </div>
                    <button
                      onClick={() => {
                        logout()
                        toast.success('Logged out successfully')
                        navigate('/login')
                        setShowLogoutMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-hidden bg-gray-50">
          <div className="h-full rounded-xl overflow-hidden shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
