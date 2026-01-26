// AddLab.jsx - Full Page Component with Sidebar and Header
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function AddLab() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, token, logout } = useAuth()

    // State for form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        lab_type: 'cse',
        capacity: 30,
        square_feet: '',
        lab_seats: ''
    })

    // State for loading and error handling
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Sidebar and UI state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Refs
    const nameInputRef = useRef(null)
    const userMenuRef = useRef(null)
    const notificationRef = useRef(null)

    // Sidebar Navigation Items
    const navigationItems = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z"></path>
                </svg>
            ),
            path: '/dashboard',
            show: true
        },
        {
            id: 'lab-management',
            title: 'Lab Management',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
            ),
            path: '/lab-management',
            show: true
        },
        {
            id: 'equipment',
            title: 'Equipment',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
            ),
            path: '/equipment',
            show: true
        },
        {
            id: 'bookings',
            title: 'Bookings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            ),
            path: '/bookings',
            show: true
        },
        {
            id: 'calendar',
            title: 'Calendar',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            ),
            path: '/calendar',
            show: true
        },
        {
            id: 'training',
            title: 'Training',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
            ),
            path: '/training',
            show: true
        },
        {
            id: 'incidents',
            title: 'Incidents',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            ),
            path: '/incidents',
            show: true
        },
        {
            id: 'orders',
            title: 'Orders',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
            ),
            path: '/orders',
            show: user?.role === 'admin'
        },
        {
            id: 'users',
            title: 'Users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
            ),
            path: '/users',
            show: user?.role === 'admin'
        },
        {
            id: 'reports',
            title: 'Reports',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
            ),
            path: '/reports',
            show: user?.role === 'admin'
        },
        {
            id: 'maintenance',
            title: 'Maintenance',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
            ),
            path: '/maintenance',
            show: user?.role === 'admin' || user?.role === 'lab_technician'
        }
    ]

    // Focus on name input when component mounts
    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.focus()
        }
    }, [])

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false)
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Update form field values
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        // Clear error when user starts typing
        if (error) setError('')
    }

    // Submit form data to create a new lab
    const handleSubmit = async (e) => {
        e?.preventDefault()
        setLoading(true)
        setError('')

        // Validate form data
        if (!formData.name.trim()) {
            setError('Lab name is required')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/labs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
                // Show success message
                setTimeout(() => {
                    navigate('/lab-management')
                }, 1500)
            } else {
                setError(data.message || 'Failed to create lab')
            }
        } catch (error) {
            console.error('Error creating lab:', error)
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleNavigation = (path) => {
        navigate(path)
    }

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/login')
        } catch (error) {
            console.error('Logout error:', error)
            navigate('/login')
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 flex">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                    {!sidebarCollapsed && (
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg overflow-hidden p-1">
                                <img 
                                    src="/nec-logo.png" 
                                    alt="NEC Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h1 className="text-xl font-bold text-white">
                                NEC LabMS
                            </h1>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
                    >
                        <svg className={`w-5 h-5 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                        </svg>
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {navigationItems.filter(item => item.show).map((item) => {
                            const isActive = location.pathname === item.path
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    title={sidebarCollapsed ? item.title : ''}
                                >
                                    <div className="flex items-center justify-center w-5 h-5">
                                        {item.icon}
                                    </div>
                                    {!sidebarCollapsed && (
                                        <span className="ml-3 flex-1 text-left">{item.title}</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </nav>

                {/* Sidebar Footer */}
                {!sidebarCollapsed && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                    {(user?.name || user?.email)?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.name || user?.email}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search anything..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </form>

                            {/* Header Right Section */}
                            <div className="flex items-center space-x-4">
                                {/* Back Button */}
                                <button
                                    onClick={() => navigate('/lab-management')}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Back to Lab Management"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                                    </svg>
                                </button>

                                {/* Notifications */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Notifications"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                        </svg>
                                    </button>
                                </div>

                                {/* User Menu */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-medium text-sm">
                                                {(user?.name || user?.email)?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>

                                    {/* User Dropdown */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                            </div>
                                            <button
                                                onClick={() => handleNavigation('/profile')}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                </svg>
                                                <span>Profile</span>
                                            </button>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                                </svg>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-6">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Add New Lab</h1>
                                <p className="mt-2 text-gray-600">
                                    Create a new laboratory space with all necessary details and specifications.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/lab-management')}
                                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.name.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </span>
                                    ) : 'Create Lab'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-medium text-gray-900">Lab Information</h2>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Fill in the details below to create a new lab. Fields marked with an asterisk (*) are required.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    {/* Success Message */}
                                    {success && (
                                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Lab created successfully! Redirecting...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Display */}
                                    {error && (
                                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span>{error}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lab Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Lab Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            ref={nameInputRef}
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="Enter lab name (e.g., Computer Lab 101)"
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Choose a descriptive name for the lab</p>
                                    </div>

                                    {/* Lab Type and Capacity */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Department <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="lab_type"
                                                value={formData.lab_type}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                required
                                            >
                                                <option value="cse">CSE</option>
                                                <option value="eee">EEE</option>
                                                <option value="ece">ECE</option>
                                                <option value="mech">MECH</option>
                                                <option value="aids">AIDS</option>
                                                <option value="sh">S&H</option>
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500">Select the department this lab belongs to</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Capacity
                                            </label>
                                            <input
                                                type="number"
                                                name="capacity"
                                                value={formData.capacity}
                                                onChange={handleChange}
                                                min="1"
                                                max="500"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                placeholder="30"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Maximum number of people</p>
                                        </div>
                                    </div>

                                    {/* Square Feet and Lab Seats */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Square Feet
                                            </label>
                                            <input
                                                type="number"
                                                name="square_feet"
                                                value={formData.square_feet}
                                                onChange={handleChange}
                                                min="0"
                                                step="0.1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                placeholder="e.g., 1200.5"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Total area of the lab in square feet</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Lab Seats
                                            </label>
                                            <input
                                                type="number"
                                                name="lab_seats"
                                                value={formData.lab_seats}
                                                onChange={handleChange}
                                                min="0"
                                                max="500"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                placeholder="25"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Number of available seats/workstations</p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="e.g., Building A, Floor 2, Room 201"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Specify where the lab is located</p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            rows="5"
                                            placeholder="Provide a detailed description of the lab, including its purpose, equipment, and any other relevant information."
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Add details about the lab's purpose and features</p>
                                    </div>

                                    {/* Form Actions - Mobile */}
                                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 lg:hidden">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/lab-management')}
                                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !formData.name.trim()}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Creating...' : 'Create Lab'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Right Column - Additional Info */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Tips</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Choose a clear, descriptive name that helps users quickly identify the lab.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Include specific room numbers and building names in the location field.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Square footage helps with capacity planning and resource allocation.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Lab seats should reflect actual workstations, not just standing capacity.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lab Type Legend */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Department Types Guide</h4>
                                    <dl className="space-y-2 text-xs">
                                        <div>
                                            <dt className="font-medium text-gray-700">CSE</dt>
                                            <dd className="text-gray-500">Computer Science & Engineering</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">EEE</dt>
                                            <dd className="text-gray-500">Electrical & Electronics Engineering</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">ECE</dt>
                                            <dd className="text-gray-500">Electronics & Communication Engineering</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">MECH</dt>
                                            <dd className="text-gray-500">Mechanical Engineering</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">AIDS</dt>
                                            <dd className="text-gray-500">Artificial Intelligence & Data Science</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">S&H</dt>
                                            <dd className="text-gray-500">Sciences & Humanities</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Field Specifications */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Field Specifications</h4>
                                    <dl className="space-y-2 text-xs">
                                        <div>
                                            <dt className="font-medium text-gray-700">Square Feet</dt>
                                            <dd className="text-gray-500">Accepts decimal values (e.g., 1250.5)</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">Lab Seats</dt>
                                            <dd className="text-gray-500">Number of individual workstations</dd>
                                        </div>
                                        <div>
                                            <dt className="font-medium text-gray-700">Capacity</dt>
                                            <dd className="text-gray-500">Maximum occupancy including standing</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AddLab