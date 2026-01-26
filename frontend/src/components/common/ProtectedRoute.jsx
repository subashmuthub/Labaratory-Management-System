// src/components/common/ProtectedRoute.jsx - UPDATED VERSION
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute({ children, requiredRole = null }) {
    const { user, loading, isAuthenticated } = useAuth()
    const location = useLocation()

    // Check for stored authentication immediately
    const getStoredAuth = () => {
        try {
            const storedToken = localStorage.getItem('token')
            const storedUser = localStorage.getItem('user')
            return storedToken && storedUser ? JSON.parse(storedUser) : null
        } catch (error) {
            console.error('Error reading stored auth:', error)
            return null
        }
    }

    const storedUser = getStoredAuth()
    const currentUser = user || storedUser
    
    // Check if user is authenticated (either from state or storage)
    const isUserAuthenticated = isAuthenticated || !!storedUser
    
    // Show minimal loading only when necessary
    if (loading && !storedUser) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                    <p className="text-gray-600 mt-2 text-sm">Loading...</p>
                </div>
            </div>
        )
    }
    
    // Only redirect to login if definitely not authenticated
    if (!isUserAuthenticated) {
        console.log('🚪 ProtectedRoute: No authentication found, redirecting to login')
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Check for required role if specified
    if (requiredRole && currentUser) {
        // Handle both single role and array of roles
        const hasRequiredRole = Array.isArray(requiredRole) 
            ? requiredRole.includes(currentUser.role)
            : currentUser.role === requiredRole;

        if (!hasRequiredRole) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md mx-auto text-center p-6">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-4">
                            You don't have permission to access this page.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Your role: <span className="font-medium capitalize">{currentUser.role?.replace('_', ' ')}</span>
                            <br />
                            Required: <span className="font-medium">
                                {Array.isArray(requiredRole) 
                                    ? requiredRole.map(role => role.replace('_', ' ')).join(' or ') 
                                    : requiredRole.replace('_', ' ')
                                }
                            </span>
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
    }

    return children
}

// Component to redirect authenticated users away from login/register pages
export function AuthRedirect({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    // If user is authenticated and tries to access login/register, redirect to dashboard
    if (user) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

export default ProtectedRoute