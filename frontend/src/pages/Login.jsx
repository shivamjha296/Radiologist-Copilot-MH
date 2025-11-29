import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../firebase'
import { Sparkles, User, Lock, Loader2, AlertCircle, ChevronDown, Mail } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
  const [authMode, setAuthMode] = useState('email') // 'email' or 'username'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('radiologist')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      toast.success('Login successful!')
      
      // Navigate based on role
      if (role === 'radiologist') {
        navigate('/dashboard')
      } else if (role === 'patient') {
        navigate('/patient-dashboard')
      } else if (role === 'labadmin') {
        navigate('/lab-admin')
      }

    } catch (err) {
      console.error('Google login error:', err)
      let errorMessage = 'An error occurred with Google login'
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed'
      } else if (err.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled'
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      
      if (authMode === 'email') {
        // Firebase Email authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        toast.success('Login successful!')
        
        // Navigate based on role
        if (role === 'radiologist') {
          navigate('/dashboard')
        } else if (role === 'patient') {
          navigate('/patient-dashboard')
        } else if (role === 'labadmin') {
          navigate('/lab-admin')
        }
        return
      } else {
        // Username/password authentication (legacy)
        result = await login(username, password, role)
      }
      
      if (result.success) {
        toast.success('Login successful!')
        navigate(result.redirectPath || '/dashboard')
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    } catch (err) {
      console.error('Login error:', err)
      let errorMessage = 'An error occurred. Please try again.'
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled'
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password'
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
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
          <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">Login</h2>
          
          {/* Auth Mode Tabs */}
          <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAuthMode('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                authMode === 'email'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('username')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                authMode === 'username'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Demo Login
            </button>
          </div>
          
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
                  <option value="labadmin">Lab Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="text-slate-400" size={18} />
                </div>
              </div>
            </div>

            {authMode === 'email' ? (
              <>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="text-slate-400" size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                      placeholder="your.email@example.com"
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
              </>
            ) : (
              <>
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
              </>
            )}

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

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors shadow-md border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Signup Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-semibold">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Demo Credentials Info */}
          <div className="mt-3 p-3 bg-slate-50/70 backdrop-blur-sm rounded-lg border border-slate-200/50">
            <p className="text-xs text-slate-700 font-medium mb-1.5">Login Instructions:</p>
            {authMode === 'email' ? (
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>1. Select role from dropdown</div>
                <div>2. Use email & password from signup</div>
                <div>3. Or use "Sign in with Google"</div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>1. Select role from dropdown</div>
                <div>2. Enter any name (e.g., <span className="font-mono bg-white/90 px-1.5 py-0.5 rounded shadow-sm">Dr. John</span>)</div>
                <div>3. Password: <span className="font-mono bg-white/90 px-1.5 py-0.5 rounded shadow-sm">password123</span></div>
              </div>
            )}
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
