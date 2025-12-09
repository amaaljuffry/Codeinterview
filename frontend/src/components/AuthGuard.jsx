import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, Flex, Text } from '@radix-ui/themes'
import { Loader2 } from 'lucide-react'

/**
 * Authentication guard component
 * Protects routes that require authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content
 * @param {boolean} props.requireAuth - Whether auth is required (default: true)
 */
export default function AuthGuard({ children, requireAuth = true }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <Box style={{ 
        minHeight: '100vh', 
        background: '#000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Flex direction="column" align="center" gap="3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#fff' }} />
          <Text size="2" color="gray">Loading...</Text>
        </Flex>
      </Box>
    )
  }

  if (requireAuth && !isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Get auth token from localStorage
 * @returns {string|null} Token or null
 */
export function getAuthToken() {
  return localStorage.getItem('token')
}

/**
 * Logout user - clear auth data
 */
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/'
}
