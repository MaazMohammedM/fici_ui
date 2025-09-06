import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requiredRole?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth/signin',
  requiredRole
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <h2 className="text-xl font-semibold text-primary dark:text-secondary mb-2">
            Loading...
          </h2>
          <p className="text-sm text-primary/70 dark:text-secondary/70">
            Checking authentication status
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to sign-in page with return url
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-primary dark:text-secondary mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-primary/70 dark:text-secondary/70">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute