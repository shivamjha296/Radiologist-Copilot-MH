import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, User, Lock, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('radiologist')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(username, password, role)
      
      if (result.success) {
        toast.success('Login successful!')
        navigate('/')
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="h-screen flex items-center justify-center overflow-hidden relative"
      style={{
        backgroundImage: 'url(/static/ai-generated-medical-background-human-body-3d-scan-free-photo.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      
      <Toaster position="top-right" />
      
      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl shadow-xl mb-3 backdrop-blur-md">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">Radiologist's AI Copilot</h1>
          <p className="text-slate-200 text-xs drop-shadow-md">AI-Powered Diagnostic Assistant</p>
        </div>

        {/* Login Card - Glassmorphism */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-5 text-center">Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selector - Dropdown */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                Select Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="radiologist">Radiologist</option>
                  <option value="patient">Patient</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="text-slate-400" size={18} />
                </div>
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-slate-400" size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                  placeholder="Enter your name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-slate-400" size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-4 p-3 bg-slate-50/70 backdrop-blur-sm rounded-lg border border-slate-200/50">
            <p className="text-xs text-slate-700 font-medium mb-1.5">Login Instructions:</p>
            <div className="text-xs text-slate-600 space-y-0.5">
              <div>1. Select role from dropdown</div>
              <div>2. Enter any name (e.g., <span className="font-mono bg-white/90 px-1.5 py-0.5 rounded shadow-sm">Dr. John</span>)</div>
              <div>3. Password: <span className="font-mono bg-white/90 px-1.5 py-0.5 rounded shadow-sm">password123</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-xs mt-4 drop-shadow-lg">
          © 2025 Radiologist's AI Copilot. All rights reserved.
        </p>
      </div>
    </div>
  )
}
