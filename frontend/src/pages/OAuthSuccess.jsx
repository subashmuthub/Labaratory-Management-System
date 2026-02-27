// src/pages/OAuthSuccess.jsx - OAuth Success Handler (Session-based)
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'

function OAuthSuccess() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const location = useLocation()
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
            
            const error = searchParams.get('error')

            console.log('❌ Error parameter:', error);

            if (error) {
                console.error('OAuth error:', error)
                navigate('/login?error=' + encodeURIComponent(error))
                return
            }

            try {
                console.log('🔍 Verifying session authentication');
                
                // Session cookie should already be set by backend
                // Just verify authentication and get user data
                const response = await fetch('/api/auth/verify', {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    console.error('❌ Session verification failed');
                    navigate('/login?error=session_invalid')
                    return
                }

                const data = await response.json();

                if (data.success && data.user) {
                    console.log('✅ OAuth authentication verified');
                    console.log('👤 User data:', data.user);
                    
                    // Store user data in localStorage for quick access
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    console.log('🎯 OAuth processing complete - redirecting to dashboard');
                    
                    // Clean redirect to dashboard and remove search params from history
                    window.history.replaceState({}, '', '/dashboard')
                    navigate('/dashboard', { replace: true })
                } else {
                    console.error('❌ No user data in verification response');
                    navigate('/login?error=verification_failed')
                }
            } catch (error) {
                console.error('❌ OAuth processing error:', error)
                navigate('/login?error=authentication_failed')
            }
        }

        processOAuthCallback()
    }, [searchParams, navigate, location.pathname, refreshAuth])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border--600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900">Processing OAuth login...</h2>
                <p className="text-gray-600 mt-2">Please wait while we complete your authentication.</p>
            </div>
        </div>
    )
}

export default OAuthSuccess