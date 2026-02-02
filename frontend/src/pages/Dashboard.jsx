// src/pages/Dashboard.jsx - Professional Dashboard with Sidebar and Real Backend Integration
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalLabs: 0,
        totalEquipment: 0,
        totalBookings: 0,
        activeBookings: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalUsers: 0,
        activeUsers: 0,
        totalIncidents: 0,
        completedTrainings: 0,
        pendingMaintenances: 0
    })

    const [recentActivities, setRecentActivities] = useState([])
    const [upcomingBookings, setUpcomingBookings] = useState([])
    const [systemAlerts, setSystemAlerts] = useState([])
    const [recentLabs, setRecentLabs] = useState([])
    const [recentOrders, setRecentOrders] = useState([])
    const [equipmentStatus, setEquipmentStatus] = useState([])
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    const [systemStatus, setSystemStatus] = useState({
        server: 'checking',
        database: 'checking',
        lastBackup: null,
        uptime: '0%',
        activeUsers: 0,
        systemLoad: 0
    })

    const [timeBasedGreeting, setTimeBasedGreeting] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showActivitiesModal, setShowActivitiesModal] = useState(false)
    const [allActivities, setAllActivities] = useState([])
    const [loadingActivities, setLoadingActivities] = useState(false)

    const { user, token, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef(null)
    const notificationRef = useRef(null)
    const API_BASE_URL = '/api'

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
            show: true,
            badge: null
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
            show: true,
            badge: stats.totalLabs > 0 ? stats.totalLabs : null
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
            show: true,
            badge: stats.totalEquipment > 0 ? stats.totalEquipment : null
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
            show: true,
            badge: stats.activeBookings > 0 ? stats.activeBookings : null
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
            show: true,
            badge: null
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
            show: true,
            badge: stats.completedTrainings > 0 ? stats.completedTrainings : null
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
            show: true,
            badge: stats.totalIncidents > 0 ? stats.totalIncidents : null,
            badgeColor: 'bg-red-500'
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
            show: user?.role === 'admin',
            badge: stats.pendingOrders > 0 ? stats.pendingOrders : null,
            badgeColor: 'bg-orange-500'
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
            show: user?.role === 'admin',
            badge: stats.totalUsers > 0 ? stats.totalUsers : null
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
            show: user?.role === 'admin',
            badge: null
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
            show: user?.role === 'admin' || user?.role === 'lab_technician',
            badge: stats.pendingMaintenances > 0 ? stats.pendingMaintenances : null,
            badgeColor: 'bg-yellow-500'
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
            ),
            path: '/notifications',
            show: true,
            badge: unreadCount > 0 ? unreadCount : null,
            badgeColor: 'bg-red-500'
        }
    ]

    // Time-based greeting and clock
    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            setCurrentTime(now)

            const hour = now.getHours()
            if (hour < 12) setTimeBasedGreeting('Good Morning')
            else if (hour < 17) setTimeBasedGreeting('Good Afternoon')
            else if (hour < 21) setTimeBasedGreeting('Good Evening')
            else setTimeBasedGreeting('Good Night')
        }

        updateTime()
        const timer = setInterval(updateTime, 1000)
        return () => clearInterval(timer)
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

    // Load dashboard data
    useEffect(() => {
        // Set document title
        document.title = 'Dashboard | NEC LabMS'
        
        if (!token) {
            navigate('/login')
            return
        }
        loadDashboardData()
    }, [token, navigate])

    const fetchNotificationCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications?unread_only=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setUnreadCount(result.data?.length || 0)
                }
            }
        } catch (error) {
            console.error('Error fetching notification count:', error)
        }
    }

    const fetchRecentNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications?limit=3`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setNotifications(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching recent notifications:', error)
        }
    }

    const fetchStats = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }

            const responses = await Promise.allSettled([
                fetch(`${API_BASE_URL}/labs/stats`, { headers }),
                fetch(`${API_BASE_URL}/equipment/stats`, { headers }),
                fetch(`${API_BASE_URL}/bookings/stats`, { headers }),
                fetch(`${API_BASE_URL}/orders/stats`, { headers }),
                fetch(`${API_BASE_URL}/users/stats`, { headers }),
                fetch(`${API_BASE_URL}/incidents/stats`, { headers }),
                fetch(`${API_BASE_URL}/training/stats`, { headers }),
                fetch(`${API_BASE_URL}/maintenance/stats`, { headers })
            ])

            const newStats = { ...stats }

            // Process lab stats
            if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
                const labData = await responses[0].value.json()
                if (labData.success) {
                    newStats.totalLabs = labData.data.total || 0
                }
            }

            // Process equipment stats
            if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
                const equipmentData = await responses[1].value.json()
                if (equipmentData.success) {
                    newStats.totalEquipment = equipmentData.data.total || 0
                }
            }

            // Process booking stats
            if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
                const bookingData = await responses[2].value.json()
                if (bookingData.success) {
                    newStats.totalBookings = bookingData.data.total || 0
                    newStats.activeBookings = bookingData.data.active || 0
                }
            }

            // Process order stats (admin only)
            if (user?.role === 'admin' && responses[3].status === 'fulfilled' && responses[3].value.ok) {
                const orderData = await responses[3].value.json()
                if (orderData.success) {
                    newStats.totalOrders = orderData.data.total || 0
                    newStats.pendingOrders = orderData.data.pending || 0
                }
            }

            // Process user stats (admin only)
            if (user?.role === 'admin' && responses[4].status === 'fulfilled' && responses[4].value.ok) {
                const userData = await responses[4].value.json()
                if (userData.success) {
                    newStats.totalUsers = userData.data.total || 0
                    newStats.activeUsers = userData.data.active || 0
                }
            }

            // Process incident stats
            if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
                const incidentData = await responses[5].value.json()
                if (incidentData.success) {
                    newStats.totalIncidents = incidentData.data.open || 0
                }
            }

            // Process training stats
            if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
                const trainingData = await responses[6].value.json()
                if (trainingData.success) {
                    newStats.completedTrainings = trainingData.data.completed || 0
                }
            }

            // Process maintenance stats
            if (responses[7].status === 'fulfilled' && responses[7].value.ok) {
                const maintenanceData = await responses[7].value.json()
                if (maintenanceData.success) {
                    newStats.pendingMaintenances = maintenanceData.data.pending || 0
                }
            }

            setStats(newStats)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const fetchRecentActivities = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/activities/recent?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setRecentActivities(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching recent activities:', error)
        }
    }

    const fetchAllActivities = async () => {
        setLoadingActivities(true)
        try {
            const response = await fetch(`${API_BASE_URL}/activities/recent?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAllActivities(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching all activities:', error)
        } finally {
            setLoadingActivities(false)
        }
    }

    const handleViewAllActivities = () => {
        setShowActivitiesModal(true)
        fetchAllActivities()
    }

    const fetchUpcomingBookings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/upcoming?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setUpcomingBookings(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching upcoming bookings:', error)
        }
    }

    const fetchSystemAlerts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/system/alerts?limit=5`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setSystemAlerts(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching system alerts:', error)
        }
    }

    const fetchRecentLabs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/labs?limit=5&sort=created_at&order=desc`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setRecentLabs(result.data?.labs || result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching recent labs:', error)
        }
    }

    const fetchRecentOrders = async () => {
        if (user?.role !== 'admin') return

        try {
            const response = await fetch(`${API_BASE_URL}/orders?limit=5&sort=created_at&order=desc`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setRecentOrders(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching recent orders:', error)
        }
    }

    const fetchEquipmentStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/equipment/status-summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setEquipmentStatus(result.data || [])
                }
            }
        } catch (error) {
            console.error('Error fetching equipment status:', error)
        }
    }

    const checkSystemStatus = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }

            const responses = await Promise.allSettled([
                fetch(`${API_BASE_URL}/system/health`, { headers }),
                fetch(`${API_BASE_URL}/system/metrics`, { headers })
            ])

            const newStatus = { ...systemStatus }

            // Process health check
            if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
                const healthData = await responses[0].value.json()
                if (healthData.success) {
                    newStatus.server = healthData.data.server || 'online'
                    newStatus.database = healthData.data.database || 'connected'
                    newStatus.lastBackup = healthData.data.lastBackup || new Date().toISOString()
                }
            }

            // Process metrics
            if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
                const metricsData = await responses[1].value.json()
                if (metricsData.success) {
                    newStatus.uptime = metricsData.data.uptime || '99.9%'
                    newStatus.activeUsers = metricsData.data.activeUsers || 0
                    newStatus.systemLoad = metricsData.data.systemLoad || 0
                }
            }

            setSystemStatus(newStatus)
        } catch (error) {
            console.error('Error checking system status:', error)
            setSystemStatus({
                server: 'error',
                database: 'error',
                lastBackup: null,
                uptime: '0%',
                activeUsers: 0,
                systemLoad: 0
            })
        }
    }

    const loadDashboardData = async () => {
        setLoading(true)
        setError('')

        try {
            await Promise.all([
                fetchStats(),
                fetchRecentActivities(),
                fetchUpcomingBookings(),
                fetchSystemAlerts(),
                fetchRecentLabs(),
                fetchRecentOrders(),
                fetchEquipmentStatus(),
                checkSystemStatus(),
                fetchNotificationCount()
            ])
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleNavigation = (path) => {
        try {
            navigate(path)
        } catch (err) {
            console.error('Navigation error:', err)
            setError(`Failed to navigate to ${path}`)
        }
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

    const handleNotificationDropdown = async () => {
        if (!showNotifications) {
            await fetchRecentNotifications()
        }
        setShowNotifications(!showNotifications)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'online':
            case 'connected':
                return 'text-green-600'
            case 'offline':
            case 'disconnected':
            case 'error':
                return 'text-red-600'
            case 'checking':
                return 'text-yellow-600'
            default:
                return 'text-gray-600'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online':
            case 'connected':
                return '🟢'
            case 'offline':
            case 'disconnected':
            case 'error':
                return '🔴'
            case 'checking':
                return '🟡'
            default:
                return '⚪'
        }
    }

    const formatTimeAgo = (timestamp) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInSeconds = Math.floor((now - time) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        return time.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 flex">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    {!sidebarCollapsed && (
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden">
                                <img 
                                    src="/nec-logo.png" 
                                    alt="NEC Logo" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                NEC LabMS
                            </h1>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                                        <>
                                            <span className="ml-3 flex-1 text-left">{item.title}</span>
                                            {item.badge && (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.badgeColor || 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {sidebarCollapsed && item.badge && (
                                        <span className={`absolute left-8 top-2 w-2 h-2 rounded-full ${item.badgeColor || 'bg-blue-500'
                                            }`}></span>
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
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">
                                            {(user?.name || user?.email)?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                )}
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
                                {/* Current Time */}
                                <div className="hidden md:block text-sm text-gray-600">
                                    {currentTime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                </div>

                                {/* Settings Icon - Admin Only */}
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => handleNavigation('/settings')}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Settings"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                    </button>
                                )}

                                {/* Notifications */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={handleNotificationDropdown}
                                        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Notifications"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                        </svg>
                                        {(unreadCount > 0 || systemAlerts.length > 0) && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                                {unreadCount + systemAlerts.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                                                <button
                                                    onClick={() => {
                                                        setShowNotifications(false)
                                                        handleNavigation('/notifications')
                                                    }}
                                                    className="text-sm text-blue-600 hover:text-blue-700"
                                                >
                                                    View All
                                                </button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.length > 0 || systemAlerts.length > 0 ? (
                                                    <>
                                                        {/* Recent Notifications */}
                                                        {notifications.slice(0, 2).map(notification => (
                                                            <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                                                                <div className="flex items-start space-x-2">
                                                                    <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                                                                        <p className="text-xs text-gray-600 truncate">{notification.message}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {formatTimeAgo(notification.created_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* System Alerts */}
                                                        {systemAlerts.slice(0, 2).map(alert => (
                                                            <div key={alert.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                                                                <div className="flex items-start space-x-2">
                                                                    <div className={`w-2 h-2 rounded-full mt-2 ${alert.type === 'error' ? 'bg-red-500' :
                                                                        alert.type === 'warning' ? 'bg-yellow-500' :
                                                                            alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                                                        }`}></div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-800">{alert.message}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {new Date(alert.created_at).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {(unreadCount + systemAlerts.length) > 4 && (
                                                            <div className="px-4 py-3 text-center border-t border-gray-100">
                                                                <p className="text-sm text-blue-600">
                                                                    + {(unreadCount + systemAlerts.length) - 4} more notification{((unreadCount + systemAlerts.length) - 4) !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-gray-500">
                                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                                        </svg>
                                                        <p className="text-sm">No notifications</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Menu */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                            {user?.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">
                                                        {(user?.name || user?.email)?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>

                                    {/* User Dropdown */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                                                        {user?.avatar_url ? (
                                                            <img
                                                                src={user.avatar_url}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                                                <span className="text-white font-medium text-sm">
                                                                    {(user?.name || user?.email)?.charAt(0)?.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                                    </div>
                                                </div>
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

                {/* Dashboard Content */}
                <main className="p-6">
                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                                <span>{error}</span>
                                <button
                                    onClick={() => setError('')}
                                    className="ml-auto hover:text-red-900"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Welcome Section */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {timeBasedGreeting}, {user?.name || user?.email?.split('@')[0]}! 👋
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Welcome back to your lab management dashboard. Here's what's happening today.
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center space-x-4">
                                <button
                                    onClick={loadDashboardData}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Labs</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalLabs}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Equipment</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalEquipment}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
                                    <p className="text-xs text-gray-500">Total: {stats.totalBookings}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Total Users Card - Show for admins */}
                        {user?.role === 'admin' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                                        <p className="text-xs text-gray-500">Active: {stats.activeUsers || 0}</p>
                                    </div>
                                    <div className="p-3 bg-indigo-100 rounded-full">
                                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {stats.totalIncidents > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                                        <p className="text-3xl font-bold text-red-600">{stats.totalIncidents}</p>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded-full">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {user?.role === 'admin' && stats.pendingOrders > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                        <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
                                        <p className="text-xs text-gray-500">Total: {stats.totalOrders}</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Recent Activities & Equipment Status */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Recent Activities */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                                    <button
                                        onClick={handleViewAllActivities}
                                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.slice(0, 5).map(activity => (
                                            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                                                        activity.type === 'incident' ? 'bg-red-100 text-red-600' :
                                                            activity.type === 'maintenance' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-green-100 text-green-600'
                                                        }`}>
                                                        <span className="text-sm">
                                                            {activity.type === 'booking' && '📅'}
                                                            {activity.type === 'incident' && '⚠️'}
                                                            {activity.type === 'maintenance' && '🔧'}
                                                            {activity.type === 'equipment' && '📦'}
                                                            {!['booking', 'incident', 'maintenance', 'equipment'].includes(activity.type) && '✅'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                                        <span>{activity.user_name}</span>
                                                        <span className="mx-1">•</span>
                                                        <span>{new Date(activity.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <p>No recent activities</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Equipment Status */}
                            {equipmentStatus.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Equipment Status</h2>
                                        <button
                                            onClick={() => handleNavigation('/equipment')}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {equipmentStatus.slice(0, 4).map(equipment => (
                                            <div key={equipment.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900">{equipment.name}</h3>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${equipment.status === 'available' ? 'bg-green-100 text-green-800' :
                                                        equipment.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                                                            equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {equipment.status?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{equipment.location}</p>
                                                {equipment.current_user && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Used by: {equipment.current_user}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Labs */}
                            {recentLabs.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Recent Labs</h2>
                                        <button
                                            onClick={() => handleNavigation('/lab-management')}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {recentLabs.slice(0, 5).map(lab => (
                                            <div key={lab.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{lab.name}</h3>
                                                    <p className="text-sm text-gray-600">{lab.location}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Created: {new Date(lab.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {lab.lab_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - System Status & Upcoming */}
                        <div className="space-y-8">
                            {/* System Status */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Server</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm">{getStatusIcon(systemStatus.server)}</span>
                                            <span className={`text-sm font-medium ${getStatusColor(systemStatus.server)}`}>
                                                {systemStatus.server}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Database</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm">{getStatusIcon(systemStatus.database)}</span>
                                            <span className={`text-sm font-medium ${getStatusColor(systemStatus.database)}`}>
                                                {systemStatus.database}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Uptime</span>
                                        <span className="text-sm text-gray-600">{systemStatus.uptime}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Active Users</span>
                                        <span className="text-sm text-gray-600">{systemStatus.activeUsers}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">System Load</span>
                                        <span className="text-sm text-gray-600">{systemStatus.systemLoad}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">Last Backup</span>
                                        <span className="text-sm text-gray-600">
                                            {systemStatus.lastBackup ?
                                                new Date(systemStatus.lastBackup).toLocaleDateString() :
                                                'Unknown'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Upcoming Bookings */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
                                    <button
                                        onClick={() => handleNavigation('/calendar')}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        View Calendar
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {upcomingBookings.length > 0 ? (
                                        upcomingBookings.map(booking => (
                                            <div key={booking.id} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                                                <h3 className="font-medium text-gray-900">{booking.lab_name || booking.equipment_name}</h3>
                                                <p className="text-sm text-gray-600">{booking.purpose}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(booking.start_time).toLocaleString()}
                                                    </span>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <p>No upcoming bookings</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Orders - Admin Only */}
                            {user?.role === 'admin' && recentOrders.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                                        <button
                                            onClick={() => handleNavigation('/orders')}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {recentOrders.slice(0, 5).map(order => (
                                            <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900">Order #{order.id}</h3>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{order.equipment_name}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">{order.supplier}</span>
                                                    <span className="text-sm font-medium text-gray-900">${order.total_amount}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Stats */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Summary</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Resources</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {stats.totalLabs + stats.totalEquipment}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Completed Trainings</span>
                                        <span className="text-lg font-bold text-green-600">{stats.completedTrainings}</span>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Users</span>
                                            <span className="text-lg font-bold text-purple-600">{stats.totalUsers}</span>
                                        </div>
                                    )}
                                    {stats.pendingMaintenances > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pending Maintenance</span>
                                            <span className="text-lg font-bold text-yellow-600">{stats.pendingMaintenances}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Recent Activities Modal */}
                {showActivitiesModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            {/* Background overlay */}
                            <div 
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                                aria-hidden="true"
                                onClick={() => setShowActivitiesModal(false)}
                            ></div>

                            {/* Center modal */}
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            {/* Modal panel */}
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center" id="modal-title">
                                            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            All Recent Activities
                                        </h3>
                                        <button
                                            onClick={() => setShowActivitiesModal(false)}
                                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="max-h-[600px] overflow-y-auto">
                                        {loadingActivities ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                            </div>
                                        ) : allActivities.length > 0 ? (
                                            <div className="space-y-3">
                                                {allActivities.map((activity, index) => (
                                                    <div 
                                                        key={activity.id || index} 
                                                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
                                                                activity.type === 'incident' ? 'bg-red-100 text-red-600' :
                                                                activity.type === 'maintenance' ? 'bg-yellow-100 text-yellow-600' :
                                                                activity.type === 'equipment' ? 'bg-purple-100 text-purple-600' :
                                                                activity.type === 'lab' ? 'bg-green-100 text-green-600' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                <span className="text-lg">
                                                                    {activity.type === 'booking' && '📅'}
                                                                    {activity.type === 'incident' && '⚠️'}
                                                                    {activity.type === 'maintenance' && '🔧'}
                                                                    {activity.type === 'equipment' && '📦'}
                                                                    {activity.type === 'lab' && '🧪'}
                                                                    {!['booking', 'incident', 'maintenance', 'equipment', 'lab'].includes(activity.type) && '✅'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {activity.description}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {activity.user_name}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(activity.created_at).toLocaleString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                                {activity.type && (
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                        activity.type === 'booking' ? 'bg-blue-50 text-blue-700' :
                                                                        activity.type === 'incident' ? 'bg-red-50 text-red-700' :
                                                                        activity.type === 'maintenance' ? 'bg-yellow-50 text-yellow-700' :
                                                                        activity.type === 'equipment' ? 'bg-purple-50 text-purple-700' :
                                                                        activity.type === 'lab' ? 'bg-green-50 text-green-700' :
                                                                        'bg-gray-50 text-gray-700'
                                                                    }`}>
                                                                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <p className="text-gray-500 text-lg">No activities found</p>
                                                <p className="text-gray-400 text-sm mt-2">Activities will appear here as you use the system</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowActivitiesModal(false)}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Close
                                    </button>
                                    {allActivities.length > 0 && (
                                        <span className="mt-3 sm:mt-0 text-sm text-gray-500">
                                            Showing {allActivities.length} {allActivities.length === 1 ? 'activity' : 'activities'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}