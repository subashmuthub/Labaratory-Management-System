import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isValidRegistrationEmail, handleOAuthCallback } from '../services/authService'
import OTPVerificationModal from '../components/auth/OTPVerificationModal'
import SocialAuthButtons from '../components/auth/SocialAuthButtons'

function EnhancedRegisterPage() {
    const [step, setStep] = useState('form') // 'form', 'otp'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [agreeToTerms, setAgreeToTerms] = useState(false)
    const [showOTPModal, setShowOTPModal] = useState(false)
    const { register, sendOTP, verifyOTP, registerWithOTP } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Handle OAuth callback
    useEffect(() => {
        const handleOAuth = async () => {
            const urlParams = new URLSearchParams(location.search)
            const code = urlParams.get('code')
            const state = urlParams.get('state')
            
            if (code && state) {
                setLoading(true)
                try {
                    const result = await handleOAuthCallback(code, state)
                    if (result.success) {
                        navigate('/dashboard', { replace: true })
                    } else {
                        setErrors({ oauth: result.message })
                    }
                } catch (error) {
                    setErrors({ oauth: 'OAuth authentication failed' })
                } finally {
                    setLoading(false)
                }
            }
        }

        handleOAuth()
    }, [location, navigate])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required'
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email address is required'
        } else if (!isValidRegistrationEmail(formData.email)) {
            newErrors.email = 'Please use a valid Gmail (@gmail.com) or NEC (@nec.edu.in) email address'
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number'
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        // Terms validation
        if (!agreeToTerms) {
            newErrors.terms = 'You must agree to the terms and conditions'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            return
        }

        setLoading(true)
        setErrors({})

        try {
            // Send OTP for email verification first  
            const result = await sendOTP(formData.email, 'registration')
            
            if (result.success) {
                // Show OTP modal for email verification
                setShowOTPModal(true)
            } else {
                setErrors({ submit: result.message || 'Failed to send verification code' })
            }
        } catch (error) {
            console.error('Registration error:', error)
            setErrors({ submit: 'Registration failed. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    const handleOTPSuccess = async (result) => {
        console.log('OTP verified successfully:', result)
        setLoading(true)
        
        try {
            // Now complete the registration with OTP
            const registrationResult = await registerWithOTP(
                formData.name, 
                formData.email, 
                formData.password, 
                formData.role, 
                result.otp || result.data?.otp
            )
            
            if (registrationResult.success) {
                setShowOTPModal(false)
                console.log('Registration completed successfully:', registrationResult.user)
                navigate('/dashboard', { replace: true })
            } else {
                setShowOTPModal(false)
                setErrors({ submit: registrationResult.message || 'Registration failed after OTP verification' })
            }
        } catch (error) {
            console.error('Registration completion error:', error)
            setShowOTPModal(false)
            setErrors({ submit: 'Failed to complete registration. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    const handleOTPError = (error) => {
        console.error('OTP verification failed:', error)
        setErrors({ submit: error || 'Email verification failed' })
    }

    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col" style={{backgroundImage: 'url(/Images/Home.jpg)'}}>
            {/* Background overlay for better readability */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* Enhanced Header Navigation */}
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
                        <div className="lg:hidden">
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

            {/* Enhanced Registration Section */}
            <div className="flex-grow flex items-center justify-center p-6 relative z-10">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100"></div>
                </div>
                
                <div className="relative z-10 bg-white/95 backdrop-blur-sm p-8 w-full max-w-lg rounded-2xl shadow-2xl border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-600">Join NEC Lab Management System</p>
                        {step === 'otp' && (
                            <p className="text-sm text-blue-600 mt-2">We've sent an OTP to {formData.email}</p>
                        )}
                    </div>

                    {/* Error Display */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                            <div className="flex items-center">
                                <span className="text-lg mr-2">⚠️</span>
                                <div className="text-sm">
                                    {Object.values(errors).map((error, index) => (
                                        <div key={index}>{error}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name Field */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base bg-gray-50/50 transition-all duration-200
                                        ${errors.name
                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50'
                                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-300'
                                        } 
                                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm`}
                                />
                            </div>
                        </div>

                        {/* Gmail Field */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Gmail Address
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
                                    placeholder="your.email@gmail.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base bg-gray-50/50 transition-all duration-200
                                        ${errors.email
                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50'
                                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-300'
                                        } 
                                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm`}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Only Gmail addresses are allowed</p>
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
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base bg-gray-50/50 transition-all duration-200
                                        ${errors.password
                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50'
                                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-300'
                                        } 
                                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm`}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Min 8 chars with uppercase, lowercase & number</p>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base bg-gray-50/50 transition-all duration-200
                                        ${errors.confirmPassword
                                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50'
                                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 hover:border-gray-300'
                                        } 
                                        focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm`}
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Account Type
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base bg-gray-50/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                                >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="lab_technician">Lab Technician</option>
                                </select>
                            </div>
                        </div>

                        {/* Terms Agreement */}
                        <div className="flex items-start space-x-3 my-6">
                            <input
                                type="checkbox"
                                id="agreeToTerms"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                disabled={loading}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 focus:ring-2 border-gray-300 mt-1"
                            />
                            <label htmlFor="agreeToTerms" className="text-sm text-gray-600 cursor-pointer">
                                I agree to the{' '}
                                <a href="#" className="text-purple-600 hover:text-purple-500 font-medium">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="text-purple-600 hover:text-purple-500 font-medium">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        {/* Create Account Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreeToTerms}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:shadow-md"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending OTP...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send OTP to Gmail
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
                </div>
            </div>

            {/* OTP Verification Modal */}
            <OTPVerificationModal
                isOpen={showOTPModal}
                onClose={() => setShowOTPModal(false)}
                email={formData.email}
                purpose="registration"
                onSuccess={handleOTPSuccess}
                onError={handleOTPError}
            />
        </div>
    )
    }

export default EnhancedRegisterPage