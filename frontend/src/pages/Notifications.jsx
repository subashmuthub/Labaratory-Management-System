// src/pages/Notifications.jsx - Professional Notifications with Sidebar and Backend Integration
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Notifications() {
    // Notifications specific state
    const [notifications, setNotifications] = useState([])
    const [settings, setSettings] = useState({
        booking_confirmations: true,
        maintenance_alerts: true,
        equipment_availability: true,
        system_updates: true,
        incident_reports: true,
        order_updates: true,
        user_activities: false,
        training_reminders: true,
        notification_method: 'email',
        email_frequency: 'immediate',
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00'
    })
    const [filter, setFilter] = useState('all')
    const [settingsSaved, setSettingsSaved] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    // Dashboard-style state
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    const { user, token, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef(null)
    const notificationRef = useRef(null)
    const wsRef = useRef(null)
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
            badge: null
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
            badge: null
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
            badge: null
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
            badge: null
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
            badge: null
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
            badge: null
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
            badge: null
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
            badge: null
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
            badge: getUnreadCount() > 0 ? getUnreadCount() : null,
            badgeColor: 'bg-red-500'
        }
    ]

    // Time update effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
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

    const loadNotificationsData = async () => {
        setLoading(true)
        setError('')

        try {
            await Promise.all([
                fetchNotifications(),
                fetchNotificationSettings()
            ])
        } catch (err) {
            console.error('Error loading notifications data:', err)
            setError('Failed to load notifications data')
        } finally {
            setLoading(false)
        }
    }

    const setupWebSocketConnection = () => {
        if (!user?.id) return

        const wsUrl = `ws://localhost:8000/ws/notifications/${user.id}?token=${token}`
        wsRef.current = new WebSocket(wsUrl)

        wsRef.current.onopen = () => {
            console.log('WebSocket connected for real-time notifications')
        }

        wsRef.current.onmessage = (event) => {
            const notification = JSON.parse(event.data)
            handleNewNotification(notification)
        }

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected')
        }

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error)
        }
    }

    // Load data and setup WebSocket
    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        loadNotificationsData()
        setupWebSocketConnection()

        // Cleanup WebSocket on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [token, navigate])

    // Auto-refresh notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications()
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [])

    function getUnreadCount() {
        return notifications.filter(n => !n.read).length
    }

    const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev])

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
            })
        }

        // Show in-app notification
        showSuccessMessage(`New notification: ${notification.title}`)
    }

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch notifications: ${response.status}`)
            }

            const result = await response.json()
            if (result.success) {
                setNotifications(result.data || [])
                setLastRefresh(new Date())
            } else {
                throw new Error(result.message || 'Failed to fetch notifications')
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
            if (!notifications.length) { // Only set error if no existing notifications
                setError(error.message)
            }
        }
    }

    const fetchNotificationSettings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setSettings({ ...settings, ...result.data })
                }
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error)
        }
    }

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                setNotifications(prev => prev.map(notification =>
                    notification.id === id ? { ...notification, read: true } : notification
                ))
            } else {
                throw new Error('Failed to mark notification as read')
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
            setError('Failed to update notification')
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
                showSuccessMessage('All notifications marked as read')
            } else {
                throw new Error('Failed to mark all notifications as read')
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
            setError('Failed to update notifications')
        }
    }

    const deleteNotification = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                setNotifications(prev => prev.filter(notification => notification.id !== id))
                showSuccessMessage('Notification deleted')
            } else {
                throw new Error('Failed to delete notification')
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
            setError('Failed to delete notification')
        }
    }

    const clearAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                setNotifications([])
                showSuccessMessage('All notifications cleared')
            } else {
                throw new Error('Failed to clear all notifications')
            }
        } catch (error) {
            console.error('Error clearing all notifications:', error)
            setError('Failed to clear notifications')
        }
    }

    const saveNotificationSettings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                setSettingsSaved(true)
                setTimeout(() => setSettingsSaved(false), 3000)
                showSuccessMessage('Notification settings saved successfully!')
            } else {
                throw new Error('Failed to save notification settings')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            setError('Failed to save settings')
        }
    }

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
                showSuccessMessage('Browser notifications enabled!')
            }
        }
    }

    const createNotification = async (notificationData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notificationData)
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setNotifications(prev => [result.data, ...prev])
                    return result.data
                }
            }
        } catch (error) {
            console.error('Error creating notification:', error)
        }
    }

    const handleNavigation = (path) => {
        try {
            navigate(path)
        } catch (error) {
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
        // Search functionality can be implemented here
    }

    const handleSettingChange = (setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }))
    }

    const showSuccessMessage = (message) => {
        const successDiv = document.createElement('div')
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50'
        successDiv.textContent = `✅ ${message}`
        document.body.appendChild(successDiv)
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv)
            }
        }, 3000)
    }

    const getNotificationIcon = (type) => {
        const iconMap = {
            booking: (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
            ),
            maintenance: (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                </svg>
            ),
            system: (
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
            ),
            equipment: (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
            ),
            reminder: (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            ),
            incident: (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
            ),
            order: (
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
            ),
            training: (
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
            )
        }
        return iconMap[type] || (
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
        )
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
            case 'urgent':
                return 'border-l-red-500 bg-red-50'
            case 'medium':
            case 'normal':
                return 'border-l-blue-500 bg-blue-50'
            case 'low':
                return 'border-l-gray-400 bg-gray-50'
            default:
                return 'border-l-gray-400 bg-gray-50'
        }
    }

    const formatTimeAgo = (timestamp) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInSeconds = Math.floor((now - time) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
        return time.toLocaleDateString()
    }

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = !searchQuery ||
            notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message?.toLowerCase().includes(searchQuery.toLowerCase())

        if (filter === 'all') return matchesSearch
        if (filter === 'unread') return !notification.read && matchesSearch
        return notification.type === filter && matchesSearch
    })

    const unreadCount = getUnreadCount()
    const filterCounts = {
        all: notifications.length,
        unread: unreadCount,
        booking: notifications.filter(n => n.type === 'booking').length,
        maintenance: notifications.filter(n => n.type === 'maintenance').length,
        system: notifications.filter(n => n.type === 'system').length,
        equipment: notifications.filter(n => n.type === 'equipment').length,
        incident: notifications.filter(n => n.type === 'incident').length,
        order: notifications.filter(n => n.type === 'order').length,
        training: notifications.filter(n => n.type === 'training').length
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading notifications...</p>
                </div>
            </div>
        )
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
                                        placeholder="Search notifications..."
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

                                {/* Last Refresh */}
                                <div className="hidden md:block text-xs text-gray-500">
                                    Last updated: {lastRefresh.toLocaleTimeString()}
                                </div>

                                {/* Refresh Button */}
                                <button
                                    onClick={fetchNotifications}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Refresh Notifications"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>

                                {/* Enable Browser Notifications */}
                                {Notification.permission !== 'granted' && (
                                    <button
                                        onClick={requestNotificationPermission}
                                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                                    >
                                        Enable Notifications
                                    </button>
                                )}

                                {/* Bulk Actions */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={unreadCount === 0}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Mark All Read
                                    </button>
                                    <button
                                        onClick={clearAllNotifications}
                                        disabled={notifications.length === 0}
                                        className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Clear All
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

                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="ml-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                                            {unreadCount} unread
                                        </span>
                                    )}
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Stay updated with real-time notifications about lab activities, bookings, and system updates.
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">
                                Total: {notifications.length} notifications
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                        <div className="flex overflow-x-auto">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'unread', label: 'Unread' },
                                { key: 'booking', label: 'Bookings' },
                                { key: 'maintenance', label: 'Maintenance' },
                                { key: 'system', label: 'System' },
                                { key: 'equipment', label: 'Equipment' },
                                { key: 'incident', label: 'Incidents' },
                                { key: 'order', label: 'Orders' },
                                { key: 'training', label: 'Training' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-all ${filter === tab.key
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.label} ({filterCounts[tab.key] || 0})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-4 mb-8">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`bg-white rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${getPriorityColor(notification.priority)} ${!notification.read ? 'ring-2 ring-blue-100' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.read && (
                                                        <span className="bg-blue-500 w-3 h-3 rounded-full animate-pulse"></span>
                                                    )}
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {notification.priority || 'normal'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 mb-3 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span className="flex items-center space-x-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                        <span>{formatTimeAgo(notification.created_at)}</span>
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                                                        </svg>
                                                        <span className="capitalize">{notification.type}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2 ml-4">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="text-6xl mb-4">
                                    {filter === 'unread' ? '📭' : '🔔'}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {filter === 'unread'
                                        ? "You're all caught up! No new notifications to read."
                                        : filter === 'all'
                                            ? "You don't have any notifications yet."
                                            : `No ${filter} notifications found.`
                                    }
                                </p>
                                {filter !== 'all' && (
                                    <button
                                        onClick={() => setFilter('all')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        View All Notifications
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                            {settingsSaved && (
                                <span className="text-green-600 text-sm font-medium">Settings saved successfully!</span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Notification Types */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
                                <div className="space-y-4">
                                    {[
                                        { key: 'booking_confirmations', label: 'Booking Confirmations', desc: 'Get notified when bookings are confirmed or cancelled' },
                                        { key: 'maintenance_alerts', label: 'Maintenance Alerts', desc: 'Get notified about scheduled maintenance' },
                                        { key: 'equipment_availability', label: 'Equipment Availability', desc: 'Get notified when equipment becomes available' },
                                        { key: 'system_updates', label: 'System Updates', desc: 'Get notified about system maintenance and updates' },
                                        { key: 'incident_reports', label: 'Incident Reports', desc: 'Get notified about new incident reports' },
                                        { key: 'order_updates', label: 'Order Updates', desc: 'Get notified about order status changes' },
                                        { key: 'user_activities', label: 'User Activities', desc: 'Get notified about user activities (Admin only)' },
                                        { key: 'training_reminders', label: 'Training Reminders', desc: 'Get notified about upcoming training sessions' }
                                    ].map(setting => (
                                        <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{setting.label}</h4>
                                                <p className="text-sm text-gray-600">{setting.desc}</p>
                                            </div>
                                            <label className="flex items-center ml-4">
                                                <input
                                                    type="checkbox"
                                                    checked={settings[setting.key]}
                                                    onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Enable</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notification Methods & Preferences */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Preferences</h3>

                                <div className="space-y-6">
                                    {/* Notification Method */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Notification Method</h4>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'email', label: 'Email notifications only' },
                                                { value: 'sms', label: 'SMS notifications only' },
                                                { value: 'both', label: 'Both email and SMS' },
                                                { value: 'in_app', label: 'In-app notifications only' }
                                            ].map(method => (
                                                <label key={method.value} className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="notification_method"
                                                        checked={settings.notification_method === method.value}
                                                        onChange={() => handleSettingChange('notification_method', method.value)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">{method.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Frequency */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">Email Frequency</h4>
                                        <select
                                            value={settings.email_frequency}
                                            onChange={(e) => handleSettingChange('email_frequency', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="immediate">Immediate</option>
                                            <option value="hourly">Hourly digest</option>
                                            <option value="daily">Daily digest</option>
                                            <option value="weekly">Weekly digest</option>
                                        </select>
                                    </div>

                                    {/* Quiet Hours */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900">Quiet Hours</h4>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.quiet_hours_enabled}
                                                    onChange={(e) => handleSettingChange('quiet_hours_enabled', e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Enable</span>
                                            </label>
                                        </div>
                                        {settings.quiet_hours_enabled && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={settings.quiet_hours_start}
                                                        onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={settings.quiet_hours_end}
                                                        onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={saveNotificationSettings}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

// Export utility functions for other components to create notifications
export const createNotification = async (token, notificationData) => {
    try {
        const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationData)
        })

        if (response.ok) {
            const result = await response.json()
            return result.data
        }
    } catch (error) {
        console.error('Error creating notification:', error)
    }
}

// Notification types for other components to use
export const NOTIFICATION_TYPES = {
    BOOKING: 'booking',
    MAINTENANCE: 'maintenance',
    SYSTEM: 'system',
    EQUIPMENT: 'equipment',
    REMINDER: 'reminder',
    INCIDENT: 'incident',
    ORDER: 'order',
    TRAINING: 'training'
}

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
}