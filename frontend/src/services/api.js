// src/services/api.js - Cookie-Based Authentication
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiCall = async (endpoint, options = {}) => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies in requests
            ...options,
        };

        console.log('Making API call to:', `${API_BASE_URL}${endpoint}`);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        
        throw error;
    }
};

// Download file helper function
const downloadFile = async (endpoint, filename) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: 'include', // Include cookies in requests
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download Error:', error);
        throw error;
    }
};

// ✅ UPDATED: Users API - Fixed to match backend response format
export const usersAPI = {
    // Get all users - Fixed to handle the array response from backend
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiCall(`/users${queryString ? '?' + queryString : ''}`);
        // Backend returns array directly, not wrapped in data object
        return Array.isArray(response) ? response : response.data || response;
    },

    // Get user statistics - Fixed to handle nested data structure
    getStats: async () => {
        const response = await apiCall('/users/stats');
        // Backend returns { success: true, data: { total, active, students, ... } }
        return response.data || response;
    },

    // Get user by ID
    getById: (id) => apiCall(`/users/${id}`),

    // Create new user - Fixed to handle backend response format
    create: async (userData) => {
        const response = await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response; // Backend returns { success: true, message: ..., user: ... }
    },

    // Update user - Fixed to handle backend response format
    update: async (id, userData) => {
        const response = await apiCall(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        return response; // Backend returns { success: true, message: ..., user: ... }
    },

    // Update user status
    updateStatus: async (id, status) => {
        const response = await apiCall(`/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        return response;
    },

    // Reset user password
    resetPassword: async (id) => {
        const response = await apiCall(`/users/${id}/reset-password`, {
            method: 'POST',
        });
        return response;
    },

    // Delete user
    delete: (id) => apiCall(`/users/${id}`, {
        method: 'DELETE',
    }),

    // Get current user profile
    getProfile: async () => {
        const response = await apiCall('/auth/profile');
        return response; // Backend returns { success: true, data: user }
    },

    // Update current user profile
    updateProfile: (profileData) => apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    }),

    // Change password
    changePassword: (passwordData) => apiCall('/users/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
    }),

    // Test users endpoint
    test: () => apiCall('/users/test'),
};

// ✅ UPDATED: Authentication API - Fixed response handling
export const authAPI = {
    login: async (credentials) => {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        return response;
    },
    
    logout: () => apiCall('/auth/logout', { method: 'POST' }),
    
    getCurrentUser: () => apiCall('/auth/me'),
    
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),
    
    forgotPassword: (email) => apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    
    resetPassword: (token, password) => apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    }),
    
    // ✅ ADDED: Verify token endpoint
    verifyToken: () => apiCall('/auth/verify'),
};

// ✅ UPDATED: Equipment API - Fixed to match backend response format
export const equipmentAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiCall(`/equipment${queryString ? '?' + queryString : ''}`);
        // Backend returns { success: true, data: { equipment: [...], pagination: {...} } }
        return response.data || response;
    },

    getEquipment: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiCall(`/equipment${queryString ? '?' + queryString : ''}`);
        // Backend returns { success: true, data: { equipment: [...], pagination: {...} } }
        return response.data || response;
    },
    
    getEquipmentById: (id) => apiCall(`/equipment/${id}`),
    getById: (id) => apiCall(`/equipment/${id}`),
    
    createEquipment: (data) => apiCall('/equipment', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    create: (data) => apiCall('/equipment', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    updateEquipment: (id, data) => apiCall(`/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    update: (id, data) => apiCall(`/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    deleteEquipment: (id) => apiCall(`/equipment/${id}`, {
        method: 'DELETE',
    }),
    delete: (id) => apiCall(`/equipment/${id}`, {
        method: 'DELETE',
    }),
    
    getStats: async () => {
        const response = await apiCall('/equipment/stats');
        return response.data || response;
    },
    
    // ✅ ADDED: Get status summary
    getStatusSummary: async () => {
        const response = await apiCall('/equipment/status-summary');
        return response.data || response;
    },
    
    testEquipment: () => apiCall('/equipment/test'),
};

// ✅ UPDATED: Bookings API - Fixed to match backend response format
export const bookingsAPI = {
    getBookings: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiCall(`/bookings${queryString ? '?' + queryString : ''}`);
        // Backend returns { success: true, data: { bookings: [...] } }
        return response.data?.bookings || response.data || response;
    },
    
    getBookingById: async (id) => {
        const response = await apiCall(`/bookings/${id}`);
        return response.data?.booking || response.data || response;
    },
    
    createBooking: async (data) => {
        const response = await apiCall('/bookings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response;
    },
    
    updateBooking: (id, data) => apiCall(`/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    deleteBooking: (id) => apiCall(`/bookings/${id}`, {
        method: 'DELETE',
    }),
    
    approveBooking: (id) => apiCall(`/bookings/${id}/approve`, {
        method: 'PATCH',
    }),
    
    rejectBooking: (id, reason) => apiCall(`/bookings/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    }),
    
    getStats: async () => {
        const response = await apiCall('/bookings/stats');
        return response.data || response;
    },
    
    // ✅ ADDED: Get upcoming bookings
    getUpcoming: async (params = {}) => {
        const response = await apiCall(`/bookings/upcoming?${new URLSearchParams(params).toString()}`);
        return response.data || response;
    },
    
    testBookings: () => apiCall('/bookings/test'),
};

// ✅ ADDED: Labs API - This was missing
export const labsAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const response = await apiCall(`/labs${queryString ? '?' + queryString : ''}`);
        return response.data?.labs || response.data || response;
    },
    
    getById: (id) => apiCall(`/labs/${id}`),
    
    create: (data) => apiCall('/labs', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
    update: (id, data) => apiCall(`/labs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => apiCall(`/labs/${id}`, {
        method: 'DELETE',
    }),
    
    getStats: async () => {
        const response = await apiCall('/labs/stats');
        return response.data || response;
    },
};

// Keep the rest of your existing APIs...
export const maintenanceAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/maintenance${queryString ? '?' + queryString : ''}`);
    },
    getStats: () => apiCall('/maintenance/stats/summary'),
    getById: (id) => apiCall(`/maintenance/${id}`),
    create: (maintenanceData) => apiCall('/maintenance', {
        method: 'POST',
        body: JSON.stringify(maintenanceData),
    }),
    update: (id, maintenanceData) => apiCall(`/maintenance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(maintenanceData),
    }),
    delete: (id) => apiCall(`/maintenance/${id}`, {
        method: 'DELETE',
    }),
    getUpcoming: (days = 7) => apiCall(`/maintenance/upcoming/week?days=${days}`),
    getOverdue: () => apiCall('/maintenance/overdue/list'),
    test: () => apiCall('/maintenance/test'),
};

// Your existing reportsAPI, ordersAPI, dashboardAPI...
export const reportsAPI = {
    testConnection: () => apiCall('/reports/test'),
    getQuickStats: () => apiCall('/reports/quick-stats'),
    getPopularEquipment: (dateRange) =>
        apiCall(`/reports/popular-equipment?dateRange=${dateRange}`),
    getReports: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/reports${queryString ? '?' + queryString : ''}`);
    },
    getReportById: (id) => apiCall(`/reports/${id}`),
    generateReport: (reportData) => apiCall('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(reportData),
    }),
    generateLabReport: (reportData) => apiCall('/reports/generate-lab-report', {
        method: 'POST',
        body: JSON.stringify(reportData),
    }),
    deleteReport: (id) => apiCall(`/reports/${id}`, {
        method: 'DELETE',
    }),
    downloadReport: (id, filename) => downloadFile(`/reports/download/${id}`, filename || `report_${id}.json`),
    getSchedules: () => apiCall('/reports/schedules/list'),
    downloadExcelReport: async (id, filename) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reports/download/${id}/excel`, {
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `LabMS_Report_${id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Excel Download Error:', error);
            throw error;
        }
    },
    generateAndDownloadExcel: async (reportData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reports/generate-excel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(reportData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LabMS_${reportData.reportType}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Excel Generation Error:', error);
            throw error;
        }
    },
    generateComprehensiveExcel: async (dateRange, customStartDate = null, customEndDate = null) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reports/generate-comprehensive-excel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ dateRange, customStartDate, customEndDate })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LabMS_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Comprehensive Excel Generation Error:', error);
            throw error;
        }
    },
};

export const ordersAPI = {
    getOrders: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/orders${queryString ? '?' + queryString : ''}`);
    },
    getOrderById: (id) => apiCall(`/orders/${id}`),
    createOrder: (orderData) => apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
    }),
    updateOrder: (id, orderData) => apiCall(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(orderData),
    }),
    deleteOrder: (id) => apiCall(`/orders/${id}`, {
        method: 'DELETE',
    }),
    getOrderStats: () => apiCall('/orders/stats/summary'),
    testOrders: () => apiCall('/orders/test'),
};

// ✅ UPDATED: Dashboard API - Added missing endpoints
export const dashboardAPI = {
    getOverview: () => apiCall('/dashboard/overview'),
    getRecentActivity: () => apiCall('/dashboard/recent-activity'),
    getStats: () => apiCall('/dashboard/stats'),
    getNotifications: () => apiCall('/dashboard/notifications'),
    
    // ✅ ADDED: Dashboard specific endpoints that your Dashboard component uses
    getActivities: async (params = {}) => {
        const response = await apiCall(`/activities/recent?${new URLSearchParams(params).toString()}`);
        return response.data || response;
    },
    
    getSystemAlerts: async (params = {}) => {
        const response = await apiCall(`/system/alerts?${new URLSearchParams(params).toString()}`);
        return response.data || response;
    },
    
    getSystemHealth: async () => {
        const response = await apiCall('/system/health');
        return response.data || response;
    },
    
    getSystemMetrics: async () => {
        const response = await apiCall('/system/metrics');
        return response.data || response;
    },
};

// Default export with all APIs
export default {
    users: usersAPI,
    auth: authAPI,
    equipment: equipmentAPI,
    bookings: bookingsAPI,
    labs: labsAPI, // ✅ ADDED
    maintenance: maintenanceAPI,
    reports: reportsAPI,
    orders: ordersAPI,
    dashboard: dashboardAPI,
};

// Named exports for convenience
export {
    API_BASE_URL,
    apiCall,
};