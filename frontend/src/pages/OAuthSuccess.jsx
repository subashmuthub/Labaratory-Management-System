// src/pages/OAuthSuccess.jsx - OAuth Success Handler
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function OAuthSuccess() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const { handleOAuthSuccess } = useAuth()
    const hasProcessed = useRef(false)

    useEffect(() => {
        // Check if we're actually on the oauth/success route
        if (!location.pathname.includes('/oauth/success')) {
            console.log('🚫 Not on OAuth success route, skipping OAuth processing');
            return
        }

        // Prevent multiple executions
        if (hasProcessed.current) {
            console.log('🛑 OAuth already processed, skipping');
            return
        }

        const processOAuthCallback = async () => {
            hasProcessed.current = true
            
            console.log('🔗 OAuth Success page loaded');
            console.log('📄 Current URL:', window.location.href);
            console.log('🔍 Search params:', Object.fromEntries(searchParams));
            
            const token = searchParams.get('token')
            const error = searchParams.get('error')

            console.log('🔑 Token parameter:', token ? token.substring(0, 20) + '...' : 'null');
            console.log('❌ Error parameter:', error);

            if (error) {
                console.error('OAuth error:', error)
                navigate('/login?error=' + encodeURIComponent(error))
                return
            }

            if (token) {
                try {
                    console.log('🔍 Decoding OAuth token');
                    
                    // Decode token to get user data (simple decode, not verification)
                    const base64Url = token.split('.')[1]
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
                    const jsonPayload = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    )
                    const decodedToken = JSON.parse(jsonPayload)
                    
                    // Create user object with proper structure
                    const userData = {
                        id: decodedToken.userId,
                        email: decodedToken.email,
                        name: decodedToken.name,
                        role: decodedToken.role,
                        isEmailVerified: true // OAuth users are verified
                    }
                    
                    console.log('👤 Extracted OAuth user data:', userData);
                    
                    // Use the dedicated OAuth success handler
                    handleOAuthSuccess(token, userData)
                    
                    console.log('🎯 OAuth processing complete - redirecting to dashboard');
                    
                    // Clean redirect to dashboard and remove search params from history
                    window.history.replaceState({}, '', '/dashboard')
                    navigate('/dashboard', { replace: true })
                    
                } catch (error) {
                    console.error('❌ Token processing error:', error)
                    navigate('/login?error=token_invalid')
                }
            } else {
                console.warn('⚠️ No token found in URL parameters');
                navigate('/login?error=no_token')
            }
        }

        processOAuthCallback()
    }, [searchParams, navigate, handleOAuthSuccess])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900">Processing OAuth login...</h2>
                <p className="text-gray-600 mt-2">Please wait while we complete your authentication.</p>
            </div>
        </div>
    )
}

export default OAuthSuccess