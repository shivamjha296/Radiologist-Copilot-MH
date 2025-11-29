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
        isAuthenticated: true,
        authMethod: 'username'
      }
      setUser(userData)
      localStorage.setItem('radiologist_user', JSON.stringify(userData))
      
      // Return redirect path based on role
      const redirectPath = role === 'patient' ? '/patient-dashboard' : role === 'labadmin' ? '/lab-admin' : '/'
      return { success: true, redirectPath }
    } else {
      return { success: false, error: 'Invalid credentials. Password must be "password123"' }
    }
  }

  const loginWithPhone = async (phoneNumber, countryCode, role) => {
    // Simulate phone.mail API call
    await new Promise(resolve => setTimeout(resolve, 1200))

    // Validate phone number format (10 digits for India)
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Phone number must be 10 digits' }
    }

    // India-specific validation for +91
    if (countryCode === '+91') {
      const firstDigit = cleanPhone[0]
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        return { success: false, error: 'Indian phone numbers must start with 6, 7, 8, or 9' }
      }
    }

    // Simulate successful phone authentication
    const fullPhone = `${countryCode}${cleanPhone}`
    const displayName = role === 'radiologist' 
      ? `Dr. User (${cleanPhone.slice(-4)})` 
      : `User (${cleanPhone.slice(-4)})`

    const userData = {
      username: fullPhone,
      name: displayName,
      phoneNumber: fullPhone,
      role: role,
      isAuthenticated: true,
      authMethod: 'phone'
    }
    
    setUser(userData)
    localStorage.setItem('radiologist_user', JSON.stringify(userData))
    
    // Return redirect path based on role
    const redirectPath = role === 'patient' ? '/patient-dashboard' : role === 'labadmin' ? '/lab-admin' : '/'
    return { success: true, redirectPath }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('radiologist_user')
  }

  const value = {
    user,
    login,
    loginWithPhone,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
