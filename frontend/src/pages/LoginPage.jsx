import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
    isValidLoginEmail, 
    handleOAuthCallback 
} from '../services/authService'
import SocialAuthButtons from '../components/auth/SocialAuthButtons'

function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [staySignedIn, setStaySignedIn] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
    const [forgotPasswordError, setForgotPasswordError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        document.title = 'Login | NEC LabMS'
        
        // Handle OAuth callbacks
        const urlParams = new URLSearchParams(location.search)
        const code = urlParams.get('code')
        const provider = urlParams.get('provider')
        
        if (code && provider) {
            handleOAuthLogin(provider, code)
        }
    }, [location])

    const handleOAuthLogin = async (provider, code) => {
        try {
            setLoading(true)
            const result = await handleOAuthCallback(provider, code)
            
            if (result.success) {
                // Store user data (session is stored in cookie by backend)
                localStorage.setItem('user', JSON.stringify(result.user))
                
                navigate('/dashboard', { replace: true })
            } else {
                setError(result.message || `${provider} authentication failed`)
            }
        } catch (error) {
            console.error(`${provider} OAuth error:`, error)
            setError(error.message || `Failed to authenticate with ${provider}`)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (error) setError('')
    }

    const validateForm = () => {
        if (!formData.email) {
            setError('Email is required')
            return false
        }
        if (!isValidLoginEmail(formData.email)) {
            setError('Please enter a valid email address')
            return false
        }
        if (!formData.password) {
            setError('Password is required')
            return false
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }

        setLoading(true)
        setError('')

        try {
            const result = await login(formData.email, formData.password)

            if (result.success) {
                console.log('✅ Login successful:', result.user)
                navigate('/dashboard', { replace: true })
            } else {
                setError(result.message || 'Invalid email or password')
            }
        } catch (error) {
            console.error('Login error:', error)
            setError('Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async (e) => {
        e.preventDefault()
        
        if (!forgotPasswordEmail) {
            setForgotPasswordError('Please enter your email address')
            return
        }
        
        if (!isValidLoginEmail(forgotPasswordEmail)) {
            setForgotPasswordError('Please enter a valid email address')
            return
        }

        setForgotPasswordLoading(true)
        setForgotPasswordError('')
        setForgotPasswordMessage('')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: forgotPasswordEmail }),
            });

            const data = await response.json();

            if (data.success) {
                setForgotPasswordMessage('If an account with this email exists, a password reset link will be sent.')
                setForgotPasswordEmail('')
                
                // Show temporary password in development mode
                if (data.tempPassword) {
                    setForgotPasswordMessage(`Password reset successful! Your temporary password is: ${data.tempPassword}`)
                }
                
                // Auto-close modal after 5 seconds
                setTimeout(() => {
                    setShowForgotPassword(false)
                    setForgotPasswordMessage('')
                }, 5000)
            } else {
                setForgotPasswordError(data.message || 'Unable to process password reset.')
            }
            
        } catch (error) {
            console.error('Forgot password error:', error)
            setForgotPasswordError('Unable to process password reset. Please try again later.')
        } finally {
            setForgotPasswordLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col bg-cover bg-center bg-no-repeat relative" style={{backgroundImage: 'url(/Images/Home.jpg)'}}>
            {/* Background overlay for better readability */}
            <div className="absolute inset-0 bg-black/40"></div>
            {/* Enhanced Top Navigation Bar */}
            <nav className="bg-gradient-to-r from-blue-800 via-blue-900 to-purple-900 shadow-2xl relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between px-6 py-4">
                        {/* Logo Section */}
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-2 shadow-lg">
                                <img
                                    src="/Images/Logo.png"
                                    alt="NEC Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="text-white">
                                <h1 className="text-xl md:text-2xl font-bold tracking-wide">
                                    NEC LabMS
                                </h1>
                                <p className="text-sm text-blue-200 font-medium">
                                    Laboratory Management System
                                </p>
                            </div>
                        </div>

                        {/* College Info Section */}
                        <div className="hidden md:block text-center text-white">
                            <h2 className="text-lg lg:text-xl font-bold text-yellow-300 mb-1">
                                NATIONAL ENGINEERING COLLEGE
                            </h2>
                            <p className="text-xs lg:text-sm text-blue-200 leading-relaxed">
                                An Autonomous Institution • Affiliated to Anna University, Chennai
                            </p>
                            <p className="text-xs text-blue-300 mt-1">
                                K.R.Nagar, Kovilpatti - 628503 • DST-FIST Sponsored Institution
                            </p>
                        </div>

                        {/* Founder Image */}
                        <div className="hidden lg:flex items-center space-x-3">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white p-1 shadow-lg">
                                <img
                                    src="/Images/Founder.jpg"
                                    alt="Founder"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                            <div className="text-white text-xs">
                                <p className="font-semibold">Principal</p>
                                <p className="text-blue-200">NEC</p>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <Link
                                to="/"
                                className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                            >
                                Home
                            </Link>
                        </div>
                    </div>
                    
                    {/* Mobile College Info */}
                    <div className="md:hidden px-6 pb-4 text-center text-white">
                        <h2 className="text-base font-bold text-yellow-300 mb-1">
                            NATIONAL ENGINEERING COLLEGE
                        </h2>
                        <p className="text-xs text-blue-200">
                            An Autonomous Institution • Affiliated to Anna University, Chennai
                        </p>
                    </div>
                </div>
            </nav>

            {/* Enhanced Login Section */}
            <div className="flex-grow flex items-center justify-center p-6 relative z-10">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100"></div>
                </div>
                
                <div className="relative z-10 bg-white/95 backdrop-blur-sm p-8 w-full max-w-lg rounded-2xl shadow-2xl border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600">Sign in to access NEC Lab Management System</p>
                    </div>

                    {/* Error Display - enhanced styling */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                            <div className="flex items-center">
                                <span className="text-lg mr-2">⚠️</span>
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    autoComplete="email"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base bg-gray-50/50 transition-all duration-200
                                        ${error && error.toLowerCase().includes('email')
                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50'
                                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300'
                                        } 
                                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm`}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base bg-gray-50/50 transition-all duration-200
                                        ${error && error.toLowerCase().includes('password')
                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50'
                                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-300'
                                        } 
                                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm`}
                                />
                            </div>
                        </div>

                        {/* Stay Signed In Checkbox */}
                        <div className="flex items-center justify-between my-6">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="staySignedIn"
                                    checked={staySignedIn}
                                    onChange={(e) => setStaySignedIn(e.target.checked)}
                                    disabled={loading}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 border-gray-300"
                                />
                                <label htmlFor="staySignedIn" className="ml-2 text-sm text-gray-600 cursor-pointer">
                                    Stay signed in
                                </label>
                            </div>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setShowForgotPassword(true)
                                    setError('')
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Forgot password?
                            </a>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading || !formData.email || !formData.password}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:shadow-md"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In
                                </div>
                            )}
                        </button>

                        {/* Social Auth Section */}
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <SocialAuthButtons onLoading={setLoading} />
                            </div>
                        </div>
                    </form>

                    {/* Enhanced Footer Links */}
                    <div className="mt-8 text-center space-y-4">
                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>
                        
                        {/* Register Link */}
                        <div className="text-sm">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                        
                        {/* Back to Home */}
                        <div className="text-sm">
                            <Link
                                to="/"
                                className="inline-flex items-center text-gray-500 hover:text-blue-600 font-medium transition-colors"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Reset Password
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setForgotPasswordEmail('');
                                        setForgotPasswordMessage('');
                                        setForgotPasswordError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                                
                                <form onSubmit={handleForgotPassword}>
                                    <div>
                                        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="forgot-email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    
                                    {forgotPasswordError && (
                                        <div className="mt-3 text-sm text-red-600">
                                            {forgotPasswordError}
                                        </div>
                                    )}
                                    
                                    {forgotPasswordMessage && (
                                        <div className="mt-3 text-sm text-green-600">
                                            {forgotPasswordMessage}
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-end space-x-3 mt-5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPassword(false);
                                                setForgotPasswordEmail('');
                                                setForgotPasswordMessage('');
                                                setForgotPasswordError('');
                                            }}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotPasswordLoading}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LoginPage