// src/components/auth/OTPVerification.jsx - OTP Verification Component
import { useState, useEffect, useRef } from 'react'

function OTPVerification({ 
    email, 
    onVerify, 
    onResend, 
    loading, 
    error, 
    onBack 
}) {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [timer, setTimer] = useState(60)
    const [canResend, setCanResend] = useState(false)
    const inputRefs = useRef([])

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1)
            }, 1000)
            return () => clearInterval(interval)
        } else {
            setCanResend(true)
        }
    }, [timer])

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus()
    }, [])

    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value

        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all digits are entered
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            onVerify(newOtp.join(''))
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newOtp = [...otp]
        
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i]
        }
        
        setOtp(newOtp)
        
        if (pastedData.length === 6) {
            onVerify(pastedData)
        } else if (pastedData.length > 0) {
            inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
        }
    }

    const handleResend = () => {
        setTimer(60)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        onResend()
    }

    const handleManualSubmit = () => {
        const otpString = otp.join('')
        if (otpString.length === 6) {
            onVerify(otpString)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-600 mb-2">
                    We've sent a 6-digit verification code to
                </p>
                <p className="font-semibold text-blue-600">{email}</p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                        </svg>
                        <span className="text-sm">{error}</span>
                    </div>
                </div>
            )}

            {/* OTP Input */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 text-center">
                    Enter Verification Code
                </label>
                <div className="flex justify-center space-x-3">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={loading}
                            className={`w-12 h-12 text-center text-xl font-bold border rounded-lg transition-all duration-200 
                                ${error 
                                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                                    : 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-400'
                                } 
                                focus:outline-none focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        />
                    ))}
                </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
                {!canResend ? (
                    <p className="text-sm text-gray-600">
                        Resend code in <span className="font-semibold text-blue-600">{timer}s</span>
                    </p>
                ) : (
                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors disabled:opacity-50"
                    >
                        Resend verification code
                    </button>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleManualSubmit}
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Verifying...
                        </div>
                    ) : (
                        'Verify Code'
                    )}
                </button>

                <button
                    onClick={onBack}
                    disabled={loading}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Back to Email Entry
                </button>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500 space-y-1">
                <p>Check your Gmail inbox and spam folder</p>
                <p>The code will expire in 10 minutes</p>
                {error && error.includes('service') && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700 text-sm">
                            ⚠️ If you're not receiving emails, the email service may be temporarily unavailable. 
                            Please try again later or contact support.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OTPVerification