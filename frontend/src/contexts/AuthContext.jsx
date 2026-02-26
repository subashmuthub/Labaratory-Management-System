import React, { createContext, useState, useEffect } from 'react';
import { apiConfig } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state from server (check cookie)
    useEffect(() => {
        console.log('🔄 AuthContext: Initializing authentication...');
        
        const initializeAuth = async () => {
            try {
                // Try to verify cookie with server
                const response = await fetch(`${apiConfig.baseURL}/api/auth/verify`, {
                    credentials: 'include' // Include cookies
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.user) {
                        setUser(data.data.user);
                        // Also store in localStorage for quick access (but not the token)
                        localStorage.setItem('user', JSON.stringify(data.data.user));
                        console.log('✅ AuthContext: Authenticated user:', data.data.user.email);
                    }
                } else {
                    console.log('🚫 AuthContext: No valid session found');
                    localStorage.removeItem('user');
                }
            } catch (error) {
                console.error('❌ AuthContext: Initialization error:', error);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };
        
        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);

            const response = await fetch(`${apiConfig.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success && data.data?.user) {
                // Update state
                setUser(data.data.user);
                // Store user data (not token) in localStorage
                localStorage.setItem('user', JSON.stringify(data.data.user));

                console.log('Login successful, user:', data.data.user);
                return { success: true, user: data.data.user };
            } else {
                console.error('Login failed:', data.message);
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    // Send OTP to email for verification
    const sendOTP = async (email, purpose = 'verification') => {
        try {
            console.log('Sending OTP to:', email, 'for purpose:', purpose);

            // Use Enhanced Auth for registration
            const response = await fetch(`${apiConfig.baseURL}/api/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, purpose })
            });

            const data = await response.json();
            console.log('Send OTP response:', data);

            if (response.ok && data.success) {
                return { 
                    success: true, 
                    message: data.message, 
                    expires_in: data.data?.expires_in 
                };
            } else {
                return { success: false, message: data.message || 'Failed to send OTP' };
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    // Verify OTP
    const verifyOTP = async (email, otp) => {
        try {
            console.log('Verifying OTP for:', email);

            // Use Enhanced Auth for consistency
            const response = await fetch(`${apiConfig.baseURL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();
            console.log('Verify OTP response:', data);

            return {
                success: data.success,
                message: data.message || (data.success ? 'OTP verified successfully' : 'OTP verification failed'),
                data: data.data
            };
        } catch (error) {
            console.error('Verify OTP error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    // Resend OTP
    const resendOTP = async (email, purpose = 'registration') => {
        try {
            console.log('Resending OTP to:', email);

            // Use the Enhanced Auth resend endpoint
            const endpoint = '/api/auth/resend-otp';

            const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, purpose })
            });

            const data = await response.json();
            console.log('Resend OTP response:', data);

            if (response.ok && data.success) {
                return { 
                    success: true, 
                    message: data.message,
                    expires_in: data.data?.expires_in 
                };
            } else {
                return { success: false, message: data.message || 'Failed to resend OTP' };
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    // Send password reset OTP
    const sendPasswordResetOTP = async (email) => {
        try {
            console.log('Sending password reset OTP to:', email);

            const response = await fetch(`${apiConfig.baseURL}/api/otp/send-password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            console.log('Send password reset OTP response:', data);

            if (response.ok && data.success) {
                return { 
                    success: true, 
                    message: data.message,
                    expires_in: data.data?.expires_in 
                };
            } else {
                return { success: false, message: data.message || 'Failed to send password reset OTP' };
            }
        } catch (error) {
            console.error('Send password reset OTP error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    // Reset password with OTP
    const resetPasswordWithOTP = async (email, otp, newPassword) => {
        try {
            console.log('Resetting password with OTP for:', email);

            const response = await fetch(`${apiConfig.baseURL}/api/otp/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp, newPassword })
            });

            const data = await response.json();
            console.log('Reset password response:', data);

            return {
                success: data.success,
                message: data.message || (data.success ? 'Password reset successfully' : 'Password reset failed')
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    // Complete registration after OTP verification
    const registerWithOTP = async (name, email, password, role = 'student', otp) => {
        try {
            console.log('🔥 DEBUG: Completing registration for:', email);

            // Use Enhanced Auth register-with-otp endpoint
            const response = await fetch(`${apiConfig.baseURL}/api/auth/register-with-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ name, email, password, role, otp })
            });

            const data = await response.json();
            console.log('Registration with OTP response:', data);

            if (response.ok && data.success && data.data?.user) {
                // Update state
                setUser(data.data.user);
                // Store user data (not token) in localStorage
                localStorage.setItem('user', JSON.stringify(data.data.user));

                console.log('🎉 Registration completed successfully:', data.data.user);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration completion error:', error);
            return { success: false, message: 'Failed to complete registration. Please try again.' };
        }
    };

    const register = async (name, email, password, role = 'student') => {
        try {
            console.log('Attempting registration for:', email);

            const response = await fetch(`${apiConfig.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (response.ok && data.success) {
                // Check if this is a complete registration or OTP initiation
                if (data.data?.user) {
                    // Complete registration - update state
                    setUser(data.data.user);
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    console.log('Registration successful, user:', data.data.user);
                    return { success: true, user: data.data.user };
                } else {
                    // OTP initiation - return success to trigger OTP modal
                    console.log('OTP sent successfully, awaiting verification');
                    return { 
                        success: true, 
                        message: data.message || 'OTP sent successfully',
                        requiresOTP: true,
                        email: data.data?.email
                    };
                }
            } else {
                console.error('Registration failed:', data.message);
                return { success: false, message: data.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    const logout = () => {
    const logout = async () => {
        console.log('🚪 AuthContext: User explicitly logging out');

        // Clear localStorage
        localStorage.removeItem('user');

        // Clear state
        setUser(null);

        // Call backend logout endpoint to clear cookie
        try {
            await fetch(`${apiConfig.baseURL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include' // Include cookies
            });
        } catch (error) {
            console.error('Logout API call error:', error);
        }
        
        console.log('✅ AuthContext: Logout completed successfully');
    };

    // Function to update user data in context and localStorage
    const updateUser = (updatedUserData) => {
        const newUser = { ...user, ...updatedUserData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const value = {
        user,
        login,
        register,
        registerWithOTP,
        sendOTP,
        verifyOTP,
        resendOTP,
        sendPasswordResetOTP,
        resetPasswordWithOTP,
        logout,
        loading,
        isAuthenticated: !loading && !!user && user.id,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};