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
            const userDataParam = searchParams.get('user')

            console.log('❌ Error parameter:', error);
            console.log('👤 User data parameter:', userDataParam ? 'present' : 'missing');

            if (error) {
                console.error('OAuth error:', error)
                navigate('/login?error=' + encodeURIComponent(error))
                return
            }

            // If we have user data in URL, establish a session through the proxy
            if (userDataParam) {
                try {
                    const userData = JSON.parse(decodeURIComponent(userDataParam));
                    console.log('👤 User data from OAuth:', userData);
                    
                    // Call endpoint to establish session (through Vite proxy)
                    console.log('🔐 Establishing session through proxy...');
                    const response = await fetch('/api/auth/oauth/establish-session', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId: userData.id })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data?.user) {
                            console.log('✅ Session established successfully');
                            console.log('👤 User data:', data.data.user);
                            
                            // Store user data in localStorage
                            localStorage.setItem('user', JSON.stringify(data.data.user));
                            
                            console.log('🎯 OAuth processing complete - redirecting to dashboard');
                            
                            // Clean redirect to dashboard
                            window.history.replaceState({}, '', '/dashboard')
                            navigate('/dashboard', { replace: true })
                            return
                        }
                    }
                    
                    console.error('❌ Failed to establish session');
                } catch (parseError) {
                    console.error('Failed to process OAuth callback:', parseError);
                }
            }

            // Fallback: Try to verify existing session
            try {
                console.log('🔍 Verifying existing session');
                
                const response = await fetch('/api/auth/verify', {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.user) {
                        console.log('✅ Session verified');
                        console.log('👤 User data:', data.data.user);
                        
                        // Store user data in localStorage
                        localStorage.setItem('user', JSON.stringify(data.data.user));
                        
                        console.log('🎯 Redirecting to dashboard');
                        
                        // Clean redirect to dashboard
                        window.history.replaceState({}, '', '/dashboard')
                        navigate('/dashboard', { replace: true })
                        return
                    }
                }
            } catch (error) {
                console.error('Session verification error:', error);
            }

            // If all methods failed, redirect to login
            console.error('❌ OAuth processing failed');
            navigate('/login?error=oauth_failed')
        }

        processOAuthCallback()
    }, [searchParams, navigate, location.pathname])

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