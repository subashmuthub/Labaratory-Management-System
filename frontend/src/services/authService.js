// src/services/authService.js - Enhanced Authentication Service
import { apiConfig } from '../config/api.js'

const API_BASE_URL = 'http://localhost:5000/api'  // Use direct backend URL for testing

// Gmail validation - only allow gmail.com addresses
export const isValidGmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
    return gmailRegex.test(email)
}

// NEC email validation - allow nec.edu.in addresses
export const isValidNecEmail = (email) => {
    const necRegex = /^[a-zA-Z0-9._%+-]+@nec\.edu\.in$/
    return necRegex.test(email)
}

// General email validation - allow any valid email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Combined validation for login (ANY valid email - matches backend)
export const isValidLoginEmail = (email) => {
    return isValidEmail(email) // Allow any valid email for login
}

// Registration validation (Gmail OR NEC for OTP features)
export const isValidRegistrationEmail = (email) => {
    return isValidGmail(email) || isValidNecEmail(email)
}

// Send OTP to Gmail (registration only) with enhanced error handling
export const sendOTP = async (email) => {
    try {
        if (!isValidRegistrationEmail(email)) {
            return { success: false, message: 'Please use a valid Gmail (@gmail.com) or NEC (@nec.edu.in) email address' }
        }

        const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })

        const data = await response.json()
        
        // Handle specific error codes from backend
        if (!data.success) {
            if (data.code === 'EMAIL_SERVICE_UNAVAILABLE') {
                return { 
                    success: false, 
                    message: 'Email service is temporarily unavailable. Please try again later or contact support.',
                    code: 'EMAIL_SERVICE_UNAVAILABLE'
                }
            } else if (data.code === 'EMAIL_SEND_FAILED') {
                return { 
                    success: false, 
                    message: 'Failed to send verification email. Please check your email address and try again.',
                    code: 'EMAIL_SEND_FAILED'
                }
            } else {
                return { 
                    success: false, 
                    message: data.message || 'Failed to send OTP. Please try again.'
                }
            }
        }
        
        return data
    } catch (error) {
        console.error('Send OTP error:', error)
        return { success: false, message: 'Failed to send OTP' }
    }
}

// Verify OTP
export const verifyOTP = async (email, otp) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp })
        })

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Verify OTP error:', error)
        return { success: false, message: 'OTP verification failed' }
    }
}

// Register with OTP verification (Gmail only)
export const registerWithOTP = async (userData, otp) => {
    try {
        if (!isValidRegistrationEmail(userData.email)) {
            return { success: false, message: 'Please use a valid Gmail (@gmail.com) or NEC (@nec.edu.in) email address' }
        }

        const response = await fetch(`${API_BASE_URL}/auth/register-with-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...userData,
                otp
            })
        })

        const data = await response.json()
        
        if (data.success && data.data?.user) {
            // Store user data (session cookie is set by backend)
            localStorage.setItem('user', JSON.stringify(data.data.user))
        }
        
        return data
    } catch (error) {
        console.error('Register error:', error)
        return { success: false, message: 'Registration failed' }
    }
}

// Login with password (for existing users with Gmail or NEC email)
export const loginWithPassword = async (email, password) => {
    try {
        if (!isValidEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' }
        }

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        })

        const data = await response.json()
        
        if (data.success && data.data?.user) {
            // Store user data (session cookie is set by backend)
            localStorage.setItem('user', JSON.stringify(data.data.user))
        }
        
        return data
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, message: 'Login failed' }
    }
}

// Login with OTP verification (Gmail only)
export const loginWithOTP = async (email, otp) => {
    try {
        if (!isValidGmail(email)) {
            return { success: false, message: 'OTP login only available for Gmail addresses' }
        }

        const response = await fetch(`${API_BASE_URL}/auth/login-with-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                otp
            })
        })

        const data = await response.json()
        
        if (data.success && data.data?.user) {
            // Store user data (session cookie is set by backend)
            localStorage.setItem('user', JSON.stringify(data.data.user))
        }
        
        return data
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, message: 'Login failed' }
    }
}

// Get Google OAuth URL
export const getGoogleAuthUrl = async () => {
    try {
        console.log('🔗 Requesting Google OAuth URL from:', `${API_BASE_URL}/auth/oauth/google`)
        
        const response = await fetch(`${API_BASE_URL}/auth/oauth/google`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('✅ Google OAuth URL response:', data)
        return data
    } catch (error) {
        console.error('❌ Google OAuth URL error:', error)
        return { success: false, message: `Failed to get Google auth URL: ${error.message}` }
    }
}

// Get GitHub OAuth URL
export const getGitHubAuthUrl = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/oauth/github`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const data = await response.json()
        return data
    } catch (error) {
        console.error('GitHub OAuth URL error:', error)
        return { success: false, message: 'Failed to get GitHub auth URL' }
    }
}

// Google OAuth login
export const loginWithGoogle = async () => {
    try {
        console.log('🚀 Initiating Google OAuth login...')
        
        // Direct redirect to backend OAuth URL to bypass potential frontend issues
        const backendOAuthUrl = 'http://localhost:5000/api/auth/oauth/google';
        
        console.log('🔗 Fetching OAuth URL from backend...');
        const response = await fetch(backendOAuthUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            console.error('❌ Backend response not OK:', response.status, response.statusText);
            throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Backend OAuth response:', { success: data.success, hasAuthUrl: !!data.authUrl });
        
        if (data.success && data.authUrl) {
            console.log('✅ Got OAuth URL, redirecting to Google...');
            console.log('📝 Auth URL (truncated):', data.authUrl.substring(0, 100) + '...');
            
            // Store the current location for redirect after OAuth
            sessionStorage.setItem('oauthRedirectUrl', window.location.pathname);
            
            window.location.href = data.authUrl;
        } else {
            console.error('❌ Failed to get OAuth URL:', data);
            throw new Error(data.message || 'Failed to initiate OAuth - no auth URL received');
        }
        
        return { success: true };
    } catch (error) {
        console.error('❌ Google login error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw new Error(`Google login failed: ${error.message}`);
    }
}

// GitHub OAuth login
export const loginWithGitHub = async () => {
    try {
        const response = await getGitHubAuthUrl()
        if (response.success && response.authUrl) {
            window.location.href = response.authUrl
        }
        return response
    } catch (error) {
        console.error('GitHub login error:', error)
        return { success: false, message: 'GitHub login failed' }
    }
}

// Handle OAuth callback
export const handleOAuthCallback = async (code, state) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/oauth/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, state })
        })

        const data = await response.json()
        
        if (data.success && data.data?.user) {
            // Store user data (session cookie is set by backend)
            localStorage.setItem('user', JSON.stringify(data.data.user))
        }
        
        return data
    } catch (error) {
        console.error('OAuth callback error:', error)
        return { success: false, message: 'OAuth authentication failed' }
    }
}