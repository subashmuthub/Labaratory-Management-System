import React, { createContext, useState, useEffect } from 'react';
import { apiConfig } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [skipVerify, setSkipVerify] = useState(false);

    // Initialize auth state from server (check cookie)
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // First, check localStorage for recently set user (from OAuth or login)
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        // Optimistically set user from localStorage
                        setUser(parsedUser);
                        console.log('📦 Loaded user from localStorage:', parsedUser.email);
                    } catch (e) {
                        localStorage.removeItem('user');
                    }
                }

                // If skipVerify flag is set (after fresh registration/login), trust localStorage
                if (skipVerify && storedUser) {
                    console.log('⏭️ Skipping verification - user just logged in/registered');
                    setSkipVerify(false);
                    setLoading(false);
                    return;
                }

                // Longer delay to ensure cookie is set by browser after registration/OAuth redirect
                await new Promise(resolve => setTimeout(resolve, 300));

                // Verify session with server - only log if authenticated
                console.log('🔍 Verifying session with server...');
                const response = await fetch(`${apiConfig.baseURL}/api/auth/verify`, {
                    credentials: 'include' // Include cookies
                }).catch((err) => {
                    console.log('⚠️ Verify request failed:', err.message);
                    return null;
                });

                if (response && response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.user) {
                        setUser(data.data.user);
                        localStorage.setItem('user', JSON.stringify(data.data.user));
                        console.log('✅ Session verified:', data.data.user.email);
                    } else {
                        // Only clear if we don't have a stored user from recent action
                        if (!storedUser) {
                            setUser(null);
                            localStorage.removeItem('user');
                        } else {
                            console.log('⚠️ Verify returned no user, but keeping localStorage user');
                        }
                    }
                } else {
                    // If verify failed but we have a stored user, keep it for a moment
                    // This handles the case where registration just completed
                    if (storedUser) {
                        console.log('⚠️ Verify failed, but keeping recently stored user');
                        // User was already set from localStorage, keep it
                    } else {
                        // Not authenticated - this is normal on login page
                        setUser(null);
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.log('⚠️ Auth initialization error:', error.message);
                // Only clear if we don't have stored user
                const storedUser = localStorage.getItem('user');
                if (!storedUser) {
                    setUser(null);
                    localStorage.removeItem('user');
                }
            } finally {
                setLoading(false);
            }
        };
        
        initializeAuth();
    }, [skipVerify]);

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
                // Skip verification on next mount since we just logged in
                setSkipVerify(true);

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
                // Skip verification on next mount since we just registered
                setSkipVerify(true);

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
                    // Skip verification on next mount since we just registered
                    setSkipVerify(true);

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
        isAuthenticated: !loading && !!user && ((user.id !== null && user.id !== undefined) || (user.userId !== null && user.userId !== undefined)),
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