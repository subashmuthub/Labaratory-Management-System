import React, { createContext, useState, useEffect } from 'react';
import { apiConfig } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        console.log('🔄 AuthContext: Initializing authentication...');
        
        const initializeAuth = () => {
            // Get stored credentials
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            console.log('📋 AuthContext: Checking stored auth:', { 
                hasToken: !!storedToken, 
                hasUser: !!storedUser 
            });
            
            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('⚡ AuthContext: Restoring auth state immediately');
                    
                    // Set auth state synchronously
                    setToken(storedToken);
                    setUser(parsedUser);
                    setLoading(false);
                    
                    console.log('✅ AuthContext: Auth state restored for user:', parsedUser.email);
                    return true;
                } catch (error) {
                    console.error('❌ AuthContext: Error parsing stored user:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } else {
                console.log('🚫 AuthContext: No stored auth found');
            }
            
            setLoading(false);
            return false;
        };
        
        // Initialize auth state immediately
        const hasAuth = initializeAuth();
        
        // Add storage event listener for cross-tab sync
        const handleStorageChange = (event) => {
            if (event.key === 'token' || event.key === 'user') {
                console.log('🔄 AuthContext: Storage changed, reinitializing auth');
                initializeAuth();
            }
        };
        
        // Add beforeunload listener to ensure auth persistence
        const handleBeforeUnload = () => {
            // Ensure current auth state is saved
            if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                console.log('💾 AuthContext: Auth state preserved before unload');
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Background token verification (optional - don't block UI)
        const verifyTokenInBackground = async () => {
            if (!hasAuth || !navigator.onLine) {
                console.log('🚫 AuthContext: Skipping background verification - no auth or offline');
                return;
            }
            
            try {
                const storedToken = localStorage.getItem('token');
                if (!storedToken) return;
                
                console.log('🔍 AuthContext: Background token verification starting...');

                
                const response = await fetch(`${apiConfig.baseURL}/api/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${storedToken}`,
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ AuthContext: Token is valid');
                    } else {
                        console.warn('⚠️ AuthContext: Invalid token response');
                        // Only clear on explicit invalidity
                        if (data.message?.includes('invalid') || data.message?.includes('expired')) {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            setToken(null);
                            setUser(null);
                        }
                    }
                } else if (response.status === 401) {
                    console.warn('🔒 AuthContext: Token unauthorized - clearing auth');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                } else {
                    console.warn('⚠️ AuthContext: Verification failed with status:', response.status);
                }
            } catch (error) {
                console.warn('🌐 AuthContext: Background verification failed:', error.message);
                // Keep existing auth state on network errors
            }
        };
        // Start background verification if we have auth
        if (hasAuth) {
            // Delay verification slightly to let UI render first
            setTimeout(verifyTokenInBackground, 100);
        }
        
        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);

            const response = await fetch(`${apiConfig.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok && data.success && data.data && data.data.token) {
                // Store token and user data
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Update state
                setToken(data.data.token);
                setUser(data.data.user);

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
    const resendOTP = async (email, purpose = 'verification') => {
        try {
            console.log('Resending OTP to:', email);

            // Use the OTP resend endpoint consistently
            const endpoint = '/api/otp/resend';

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
                body: JSON.stringify({ name, email, password, role, otp })
            });

            const data = await response.json();
            console.log('Registration with OTP response:', data);

            if (response.ok && data.success && data.data && data.data.token) {
                // Store token and user data
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                // Update state
                setToken(data.data.token);
                setUser(data.data.user);

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
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (response.ok && data.success) {
                // Check if this is a complete registration (has token) or OTP initiation
                if (data.data && data.data.token) {
                    // Complete registration - store token and user data
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    // Update state
                    setToken(data.data.token);
                    setUser(data.data.user);

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
        console.log('🚪 AuthContext: User explicitly logging out');

        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear state
        setToken(null);
        setUser(null);

        // Optional: Call backend logout endpoint
        fetch(`${apiConfig.baseURL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        }).catch(error => {
            console.error('Logout API call error:', error);
        });
        
        console.log('✅ AuthContext: Logout completed successfully');
    };

    // Helper function to make authenticated requests
    const makeAuthenticatedRequest = async (url, options = {}) => {
        const authToken = token || localStorage.getItem('token');

        if (!authToken) {
            throw new Error('No authentication token available');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        return fetch(url, { ...options, ...defaultOptions });
    };

    // Function to update user data in context and localStorage
    const updateUser = (updatedUserData) => {
        const newUser = { ...user, ...updatedUserData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    // OAuth success handler - directly sets auth state without API call
    const handleOAuthSuccess = (token, userData) => {
        console.log('🔐 AuthContext: Handling OAuth success');
        console.log('👤 Setting OAuth user data:', userData);
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(token);
        setUser(userData);
        
        console.log('✅ AuthContext: OAuth authentication successful');
    };

    const value = {
        user,
        token,
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
        isAuthenticated: !loading && !!token && !!user && user.id,
        makeAuthenticatedRequest,
        updateUser,
        handleOAuthSuccess
    };

    // Additional safeguard: If auth state is lost but localStorage has data, restore it
    React.useEffect(() => {
        if (!loading && !token && !user) {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (storedToken && storedUser) {
                try {
                    console.log('🔄 AuthContext: Restoring lost auth state from localStorage');
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Error restoring auth state:', error);
                }
            }
        }
    }, [loading, token, user]);

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