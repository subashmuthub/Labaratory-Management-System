// src/pages/Incidents.jsx - COMPLETELY FIXED VERSION
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Incidents() {
    // ✅ FIXED: Ensure all arrays are properly initialized
    const [incidents, setIncidents] = useState([])
    const [filteredIncidents, setFilteredIncidents] = useState([])
    const [equipment, setEquipment] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingIncident, setEditingIncident] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')

    // Sidebar and UI state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        equipment_id: '',
        priority: 'medium',
        category: 'malfunction',
        location: '',
        reported_by: '',
        assigned_to: ''
    })

    const { user, isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef(null)
    const notificationRef = useRef(null)
    
    // ✅ FIXED: Consistent API URL
    const API_BASE_URL = '/api'

    const priorities = ['low', 'medium', 'high', 'critical']
    const statuses = ['open', 'in_progress', 'resolved', 'closed']
    const categories = ['malfunction', 'damage', 'safety', 'maintenance', 'other']

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
            badge: Array.isArray(incidents) && incidents.filter(i => i?.status === 'open').length > 0 
                ? incidents.filter(i => i?.status === 'open').length 
                : null,
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
            show: ['admin', 'lab_assistant', 'teacher'].includes(user?.role),
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
            badge: unreadCount > 0 ? unreadCount : null,
            badgeColor: 'bg-red-500'
        }
    ]

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

    // Fetch all data
    useEffect(() => {
        // Set document title
        document.title = 'Incidents | NEC LabMS'
        
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        fetchIncidents()
        fetchEquipment()
        fetchUsers()
        fetchNotificationCount()
    }, [isAuthenticated, navigate])

    // Filter incidents
    useEffect(() => {
        if (!Array.isArray(incidents)) {
            setFilteredIncidents([])
            return
        }

        let filtered = incidents.filter(incident => {
            if (!incident) return false
            
            const matchesSearch = (incident.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (incident.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === 'all' || incident.status === statusFilter
            const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter
            return matchesSearch && matchesStatus && matchesPriority
        })
        setFilteredIncidents(filtered)
    }, [incidents, searchTerm, statusFilter, priorityFilter])

    // ✅ FIXED: Safe notification count fetch
    const fetchNotificationCount = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications?unread_only=true`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    const count = result.data?.length || 0
                    setUnreadCount(count)
                }
            }
        } catch (error) {
            console.error('Error fetching notification count:', error)
            setUnreadCount(0)
        }
    }, [])

    // ✅ FIXED: Safe incidents fetch with proper error handling
    const fetchIncidents = async () => {
        try {
            console.log('🔍 Fetching incidents')
            const response = await fetch(`${API_BASE_URL}/incidents`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            console.log('📡 Incidents response status:', response.status, response.statusText)
            
            if (response.ok) {
                const result = await response.json()
                console.log('✅ Incidents response:', result)
                
                // ✅ FIXED: Ensure incidents is always an array
                const incidentsData = result.data || result || []
                const safeIncidents = Array.isArray(incidentsData) ? incidentsData : []
                
                setIncidents(safeIncidents)
                setError('') // Clear any previous errors
                console.log('✅ Incidents set:', safeIncidents.length, 'items')
            } else {
                const errorText = await response.text()
                console.error('❌ Incidents fetch failed:', response.status, errorText)
                setError(`Failed to fetch incidents: ${response.status} ${response.statusText}`)
                setIncidents([])
            }
        } catch (error) {
            console.error('❌ Error fetching incidents:', error)
            setError(`Failed to fetch incidents: ${error.message}`)
            setIncidents([])
        } finally {
            setLoading(false)
        }
    }

    // ✅ FIXED: Safe equipment fetch with proper error handling
    const fetchEquipment = async () => {
        try {
            console.log('🔍 Fetching equipment...')
            const response = await fetch(`${API_BASE_URL}/equipment?limit=1000`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            if (response.ok) {
                const result = await response.json()
                console.log('✅ Equipment response:', result)
                
                // ✅ FIXED: Handle nested data structure - equipment is in result.data.equipment
                const equipmentData = result.data?.equipment || result.data || result || []
                const safeEquipment = Array.isArray(equipmentData) ? equipmentData : []
                
                setEquipment(safeEquipment)
                console.log('✅ Equipment set:', safeEquipment.length, 'items')
            } else {
                console.error('❌ Equipment fetch failed:', response.status)
                setEquipment([])
            }
        } catch (error) {
            console.error('❌ Error fetching equipment:', error)
            setEquipment([])
        }
    }

    // ✅ FIXED: Safe users fetch with proper error handling
    const fetchUsers = async () => {
        try {
            console.log('🔍 Fetching users...')
            const response = await fetch(`${API_BASE_URL}/users`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            
            if (response.ok) {
                const result = await response.json()
                console.log('✅ Users response:', result)
                
                // ✅ FIXED: Users API returns array directly, not wrapped in data object
                const usersData = Array.isArray(result) ? result : (result.data?.users || result.data || [])
                const safeUsers = Array.isArray(usersData) ? usersData : []
                
                setUsers(safeUsers)
                console.log('✅ Users set:', safeUsers.length, 'items')
            } else {
                console.error('❌ Users fetch failed:', response.status)
                setUsers([])
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error)
            setUsers([])
        }
    }

    const handleNavigation = (path) => {
        try {
            navigate(path)
        } catch (error) {
            console.error('Navigation error:', error)
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            const url = editingIncident
                ? `${API_BASE_URL}/incidents/${editingIncident.id}`
                : `${API_BASE_URL}/incidents`

            const method = editingIncident ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    reported_by: formData.reported_by || user.id
                })
            })

            if (response.ok) {
                await fetchIncidents()
                setShowModal(false)
                setEditingIncident(null)
                setFormData({
                    title: '',
                    description: '',
                    equipment_id: '',
                    priority: 'medium',
                    category: 'malfunction',
                    location: '',
                    reported_by: '',
                    assigned_to: ''
                })
            } else {
                const result = await response.json()
                setError(result.message || 'Failed to save incident')
            }
        } catch (error) {
            console.error('Error saving incident:', error)
            setError('Failed to save incident')
        }
    }

    const handleEdit = (incident) => {
        if (!incident) return
        
        setEditingIncident(incident)
        setFormData({
            title: incident.title || '',
            description: incident.description || '',
            equipment_id: incident.equipment_id || '',
            priority: incident.priority || 'medium',
            category: incident.category || 'malfunction',
            location: incident.location || '',
            reported_by: incident.reported_by || '',
            assigned_to: incident.assigned_to || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (!id || !window.confirm('Are you sure you want to delete this incident?')) return

        try {
            const response = await fetch(`${API_BASE_URL}/incidents/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                await fetchIncidents()
            } else {
                setError('Failed to delete incident')
            }
        } catch (error) {
            console.error('Error deleting incident:', error)
            setError('Failed to delete incident')
        }
    }

    const updateStatus = async (id, newStatus) => {
        if (!id || !newStatus) return

        try {
            const response = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                await fetchIncidents()
            } else {
                setError('Failed to update status')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            setError('Failed to update status')
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'low': return 'bg-blue-100 text-blue-800'
            case 'medium': return 'bg-yellow-100 text-yellow-800'
            case 'high': return 'bg-orange-100 text-orange-800'
            case 'critical': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800'
            case 'in_progress': return 'bg-yellow-100 text-yellow-800'
            case 'resolved': return 'bg-green-100 text-green-800'
            case 'closed': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading incidents...</p>
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
                            <img 
                                src="/nec-logo.png" 
                                alt="NEC Logo" 
                                className="w-8 h-8 object-contain rounded-lg"
                            />
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
                                        ? 'bg-red-50 text-red-700 border-r-4 border-red-700'
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
                            {/* Page Title and Breadcrumb */}
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
                                    <p className="text-sm text-gray-600">Track and resolve lab incidents</p>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-8">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search anything..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                                    />
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </form>

                            {/* Header Right Section */}
                            <div className="flex items-center space-x-4">
                                {/* Report Incident Button */}
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                    <span>Report Incident</span>
                                </button>

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
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Notifications"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                        </svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                                {unreadCount}
                                            </span>
                                        )}
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

                {/* Page Content */}
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

                    {/* ✅ FIXED: Stats Cards with safe array access */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {Array.isArray(incidents) ? incidents.length : 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                                    <p className="text-3xl font-bold text-red-600">
                                        {Array.isArray(incidents) ? incidents.filter(i => i?.status === 'open').length : 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {Array.isArray(incidents) ? incidents.filter(i => i?.status === 'in_progress').length : 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {Array.isArray(incidents) ? incidents.filter(i => i?.status === 'resolved').length : 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Search incidents..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="all">All Statuses</option>
                                    {statuses.map(status => (
                                        <option key={status} value={status}>
                                            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="all">All Priorities</option>
                                    {priorities.map(priority => (
                                        <option key={priority} value={priority}>
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <div className="text-sm text-gray-600">
                                    <strong>{Array.isArray(filteredIncidents) ? filteredIncidents.length : 0}</strong> incident(s) found
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ FIXED: Incidents Table with safe array access */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Incident
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Equipment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned To
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Array.isArray(filteredIncidents) && filteredIncidents.map((incident) => {
                                        if (!incident) return null

                                        // ✅ FIXED: Safe array access with fallback
                                        const equipmentItem = Array.isArray(equipment) 
                                            ? equipment.find(eq => eq?.id === incident?.equipment_id) 
                                            : null
                                            
                                        const assignedUser = Array.isArray(users) 
                                            ? users.find(u => u?.id === incident?.assigned_to) 
                                            : null

                                        // ✅ FIXED: Use incidentReporter if available from backend associations
                                        const reporterName = incident?.incidentReporter?.name || 
                                                           incident?.reporter?.name || 
                                                           'Unknown Reporter'

                                        return (
                                            <tr key={incident?.id || Math.random()} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {incident?.title || 'No Title'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {incident?.description || 'No Description'}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {incident?.category?.replace('_', ' ') || 'No Category'} • By: {reporterName}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {/* ✅ FIXED: Use relatedEquipment from backend associations */}
                                                    {incident?.relatedEquipment?.name || equipmentItem?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(incident?.priority)}`}>
                                                        {incident?.priority || 'unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={incident?.status || 'open'}
                                                        onChange={(e) => updateStatus(incident?.id, e.target.value)}
                                                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(incident?.status)}`}
                                                        disabled={!['admin', 'lab_assistant', 'teacher'].includes(user?.role)}
                                                    >
                                                        {statuses.map(status => (
                                                            <option key={status} value={status}>
                                                                {status.replace('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {/* ✅ FIXED: Use incidentAssignee from backend associations */}
                                                    {incident?.incidentAssignee?.name || assignedUser?.name || 'Unassigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {incident?.created_at ? new Date(incident.created_at).toLocaleDateString() : 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleEdit(incident)}
                                                        className="text-blue-600 hover:text-blue-700 mr-3"
                                                        title="Edit incident"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                        </svg>
                                                    </button>
                                                    {(user?.role === 'admin' || incident?.reported_by === user?.id) && (
                                                        <button
                                                            onClick={() => handleDelete(incident?.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                            title="Delete incident"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* ✅ FIXED: Safe check for empty results */}
                            {(!Array.isArray(filteredIncidents) || filteredIncidents.length === 0) && (
                                <div className="text-center py-12">
                                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                    <p className="text-gray-500 text-lg">No incidents found</p>
                                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* ✅ FIXED: Modal with safe array access */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                                {editingIncident ? 'Edit Incident' : 'Report New Incident'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title*</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Brief description of the incident"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description*</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Detailed description of what happened"
                                    />
                                </div>

                                {/* ✅ FIXED: Equipment dropdown with safe array access */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Equipment</label>
                                    <select
                                        value={formData.equipment_id}
                                        onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="">Select Equipment (Optional)</option>
                                        {Array.isArray(equipment) && equipment.map(item => (
                                            <option key={item?.id || Math.random()} value={item?.id || ''}>
                                                {item?.name || 'Unknown Equipment'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Priority*</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            {priorities.map(priority => (
                                                <option key={priority} value={priority}>
                                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category*</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            {categories.map(category => (
                                                <option key={category} value={category}>
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Where did this incident occur?"
                                    />
                                </div>

                                {/* ✅ FIXED: Users dropdown with safe array access */}
                                {['admin', 'lab_assistant', 'teacher'].includes(user?.role) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Assign To</label>
                                        <select
                                            value={formData.assigned_to}
                                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Unassigned</option>
                                            {Array.isArray(users) && users
                                                .filter(u => ['admin', 'lab_assistant', 'teacher'].includes(u?.role))
                                                .map(userItem => (
                                                    <option key={userItem?.id || Math.random()} value={userItem?.id || ''}>
                                                        {userItem?.name || userItem?.email || 'Unknown User'}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false)
                                            setEditingIncident(null)
                                            setFormData({
                                                title: '',
                                                description: '',
                                                equipment_id: '',
                                                priority: 'medium',
                                                category: 'malfunction',
                                                location: '',
                                                reported_by: '',
                                                assigned_to: ''
                                            })
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
                                    >
                                        {editingIncident ? 'Update Incident' : 'Report Incident'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}