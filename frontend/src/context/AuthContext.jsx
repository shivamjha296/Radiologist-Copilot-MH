import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('radiologist_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem('radiologist_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password, role) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Validate password (accept any username)
    if (password === 'password123' && username.trim()) {
      // Create display name based on role
      let displayName = username.trim()
      if (role === 'radiologist' && !displayName.toLowerCase().startsWith('dr')) {
        displayName = `Dr. ${displayName}`
      }

      const userData = {
        username: username.trim(),
        name: displayName,
        role: role,
        isAuthenticated: true
      }
      setUser(userData)
      localStorage.setItem('radiologist_user', JSON.stringify(userData))
      return { success: true }
    } else {
      return { success: false, error: 'Invalid credentials. Password must be "password123"' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('radiologist_user')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
