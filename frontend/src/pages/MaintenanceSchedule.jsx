// src/pages/MaintenanceSchedule.jsx - Professional Maintenance Schedule with Sidebar
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { maintenanceAPI } from '../services/api'
import { Sidebar, AppHeader, getNavigationItems } from '../components/common/Navigation'

export default function MaintenanceSchedule() {
    // Maintenance-specific state
    const [maintenance, setMaintenance] = useState([])
    const [stats, setStats] = useState({
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0
    })

    // Navigation stats state
    const [navStats, setNavStats] = useState({
        totalLabs: 0,
        totalEquipment: 0,
        activeBookings: 0,
        totalIncidents: 0,
        pendingOrders: 0,
        totalUsers: 0,
        completedTrainings: 0,
        pendingMaintenances: 0,
        unreadNotifications: 0
    })
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
    const [newMaintenance, setNewMaintenance] = useState({
        equipment: '',
        type: 'routine',
        date: '',
        technician: '',
        description: '',
        estimatedCost: '',
        priority: 'medium'
    })

    // Dashboard-style state
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    const { user, isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef(null)
    const notificationRef = useRef(null)

    // Fetch navigation stats
    const fetchNavigationStats = async () => {
        try {
            const results = await Promise.allSettled([
                fetch('/api/labs/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/equipment/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/bookings/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/users/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/incidents/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/orders/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/training/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch('/api/maintenance/stats', { credentials: 'include', headers: { 'Content-Type': 'application/json' } }).then(r => r.json())
            ])

            const [labsRes, equipmentRes, bookingsRes, usersRes, incidentsRes, ordersRes, trainingRes, maintenanceRes] = results

            setNavStats({
                totalLabs: labsRes.status === 'fulfilled' ? (labsRes.value?.total || labsRes.value?.totalLabs || 0) : 0,
                totalEquipment: equipmentRes.status === 'fulfilled' ? (equipmentRes.value?.total || equipmentRes.value?.totalEquipment || 0) : 0,
                activeBookings: bookingsRes.status === 'fulfilled' ? (bookingsRes.value?.active || bookingsRes.value?.activeBookings || 0) : 0,
                totalIncidents: incidentsRes.status === 'fulfilled' ? (incidentsRes.value?.total || incidentsRes.value?.totalIncidents || 0) : 0,
                pendingOrders: ordersRes.status === 'fulfilled' ? (ordersRes.value?.pending || ordersRes.value?.pendingOrders || 0) : 0,
                totalUsers: usersRes.status === 'fulfilled' ? (usersRes.value?.total || usersRes.value?.totalUsers || 0) : 0,
                completedTrainings: trainingRes.status === 'fulfilled' ? (trainingRes.value?.completed || trainingRes.value?.completedTrainings || 0) : 0,
                pendingMaintenances: maintenanceRes.status === 'fulfilled' ? (maintenanceRes.value?.pending || maintenanceRes.value?.pendingMaintenances || 0) : 0,
                unreadNotifications: 0
            })
        } catch (error) {
            console.error('Error fetching navigation stats:', error)
        }
    }

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

    // Load data on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        loadMaintenanceData()
        fetchNavigationStats()
    }, [isAuthenticated, navigate])

    const loadMaintenanceData = async () => {
        setLoading(true)
        setError('')

        try {
            await Promise.all([
                fetchMaintenance(),
                fetchStats()
            ])
        } catch (error) {
            console.error('Error loading maintenance data:', error)
            setError('Failed to load maintenance data')
        } finally {
            setLoading(false)
        }
    }

    const fetchMaintenance = async () => {
        try {
            const response = await maintenanceAPI.getAll()
            const maintenanceData = response.data || response || []
            setMaintenance(Array.isArray(maintenanceData) ? maintenanceData : [])
        } catch (err) {
            console.error('Error fetching maintenance:', err)
            setError(`Failed to fetch maintenance records: ${err.message}`)
            setMaintenance([])
        }
    }

    const fetchStats = async () => {
        try {
            const response = await maintenanceAPI.getStats()
            const statsData = response.data || response
            setStats(statsData || {
                scheduled: 0,
                inProgress: 0,
                completed: 0,
                overdue: 0
            })
        } catch (err) {
            console.error('Error fetching stats:', err)
            setStats({
                scheduled: 0,
                inProgress: 0,
                completed: 0,
                overdue: 0
            })
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
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setNewMaintenance(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setError('')
            const maintenanceData = {
                equipment: newMaintenance.equipment,
                type: newMaintenance.type,
                date: newMaintenance.date,
                technician: newMaintenance.technician,
                description: newMaintenance.description,
                estimatedCost: newMaintenance.estimatedCost,
                priority: newMaintenance.priority
            }

            const response = await maintenanceAPI.create(maintenanceData)
            const newRecord = response.data || response
            setMaintenance(prev => [...prev, newRecord])

            setShowMaintenanceForm(false)
            setNewMaintenance({
                equipment: '',
                type: 'routine',
                date: '',
                technician: '',
                description: '',
                estimatedCost: '',
                priority: 'medium'
            })

            fetchStats()
        } catch (err) {
            console.error('Error creating maintenance:', err)
            setError(`Failed to create maintenance record: ${err.message}`)
        }
    }

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setError('')
            const response = await maintenanceAPI.update(id, { status: newStatus })
            const updatedRecord = response.data || response

            setMaintenance(prev => prev.map(item =>
                item.id === id ? updatedRecord : item
            ))
            fetchStats()
        } catch (err) {
            console.error('Error updating maintenance:', err)
            setError(`Failed to update maintenance status: ${err.message}`)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this maintenance record?')) {
            try {
                setError('')
                await maintenanceAPI.delete(id)
                setMaintenance(prev => prev.filter(item => item.id !== id))
                fetchStats()
            } catch (err) {
                console.error('Error deleting maintenance:', err)
                setError(`Failed to delete maintenance record: ${err.message}`)
            }
        }
    }

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase()
        switch (statusLower) {
            case 'scheduled': return 'bg-blue-100 text-blue-800'
            case 'in_progress': return 'bg-yellow-100 text-yellow-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'overdue': return 'bg-red-100 text-red-800'
            case 'cancelled': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeColor = (type) => {
        const typeLower = type?.toLowerCase()
        switch (typeLower) {
            case 'routine':
            case 'preventive': return 'bg-green-100 text-green-800'
            case 'repair': return 'bg-orange-100 text-orange-800'
            case 'emergency': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatStatus = (status) => {
        if (!status) return 'Unknown'
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatType = (type) => {
        if (!type) return 'Unknown'
        return type.charAt(0).toUpperCase() + type.slice(1)
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading maintenance data...</p>
                </div>
            </div>
        )
    }

    return (
    <div className="min-h-screen bg-gray-50">
            <Sidebar
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                currentPath={location.pathname}
                stats={navStats}
            />

            {/* Main Content */}
            <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 min-h-screen`}>
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search maintenance records..."
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

                                {/* Refresh Button */}
                                <button
                                    onClick={loadMaintenanceData}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Refresh Data"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>

                                {/* Schedule Maintenance Button */}
                                <button
                                    onClick={() => setShowMaintenanceForm(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                    <span>Schedule</span>
                                </button>

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
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">🔧</span>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Maintenance Schedule</h1>
                        </div>
                        <p className="mt-2 text-gray-600">
                            Manage and track equipment maintenance schedules, repairs, and preventive maintenance tasks.
                        </p>
                    </div>

                    {/* Maintenance Form Modal */}
                    {showMaintenanceForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-screen overflow-y-auto m-4">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Schedule Maintenance</h2>
                                        <button
                                            onClick={() => setShowMaintenanceForm(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                                            <select
                                                name="equipment"
                                                value={newMaintenance.equipment}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            >
                                                <option value="">Select Equipment</option>
                                                <option value="Computer-001">Computer-001</option>
                                                <option value="Computer-002">Computer-002</option>
                                                <option value="Printer-001">Printer-001</option>
                                                <option value="Printer-002">Printer-002</option>
                                                <option value="Projector-001">Projector-001</option>
                                                <option value="Projector-002">Projector-002</option>
                                                <option value="Scanner-001">Scanner-001</option>
                                                <option value="Scanner-002">Scanner-002</option>
                                                <option value="Microscope-001">Microscope-001</option>
                                                <option value="Oscilloscope-001">Oscilloscope-001</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
                                            <select
                                                name="type"
                                                value={newMaintenance.type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="routine">Routine</option>
                                                <option value="preventive">Preventive</option>
                                                <option value="repair">Repair</option>
                                                <option value="emergency">Emergency</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                            <select
                                                name="priority"
                                                value={newMaintenance.priority}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={newMaintenance.date}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Technician</label>
                                            <input
                                                type="text"
                                                name="technician"
                                                value={newMaintenance.technician}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Assigned technician name"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                name="description"
                                                value={newMaintenance.description}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows="3"
                                                placeholder="Maintenance details and requirements"
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost ($)</label>
                                            <input
                                                type="number"
                                                name="estimatedCost"
                                                value={newMaintenance.estimatedCost}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowMaintenanceForm(false)}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Schedule
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Scheduled</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
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
                                    <p className="text-sm font-medium text-gray-600">Completed</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Overdue</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.982 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option>All Equipment</option>
                                <option>Computer-001</option>
                                <option>Printer-001</option>
                                <option>Projector-001</option>
                                <option>Scanner-001</option>
                            </select>
                            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option>All Types</option>
                                <option>Routine</option>
                                <option>Preventive</option>
                                <option>Repair</option>
                                <option>Emergency</option>
                            </select>
                            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option>All Status</option>
                                <option>Scheduled</option>
                                <option>In Progress</option>
                                <option>Completed</option>
                                <option>Overdue</option>
                            </select>
                            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option>All Priorities</option>
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Maintenance Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Maintenance Records</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {maintenance.length > 0 ? maintenance.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{item.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {item.equipment_name || item.equipment || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.maintenance_type || item.type)}`}>
                                                    {formatType(item.maintenance_type || item.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                                    item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.scheduled_date || item.date || 'Not set'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                                    {formatStatus(item.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.technician_name || item.technician || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ${parseFloat(item.estimated_cost || item.cost || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {item.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(item.id, 'completed')}
                                                            className="text-green-600 hover:text-green-900 transition-colors"
                                                            title="Mark as Complete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {item.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(item.id, 'in_progress')}
                                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                                            title="Start Maintenance"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete Record"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                                    </svg>
                                                    <p className="text-lg font-medium">No maintenance records found</p>
                                                    <p className="text-sm">Schedule your first maintenance to get started.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Upcoming Maintenance */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Maintenance (Next 7 Days)</h2>
                        <div className="space-y-4">
                            {maintenance
                                .filter(item => {
                                    const itemDate = new Date(item.scheduled_date || item.date);
                                    const today = new Date();
                                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                                    return itemDate >= today && itemDate <= nextWeek && (item.status === 'scheduled' || item.status === 'in_progress');
                                })
                                .slice(0, 5)
                                .map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${item.priority === 'critical' ? 'bg-red-500' :
                                                    item.priority === 'high' ? 'bg-orange-500' :
                                                        item.priority === 'medium' ? 'bg-yellow-500' :
                                                            'bg-gray-500'
                                                    }`}></div>
                                                <h4 className="font-medium text-gray-900">
                                                    {item.equipment_name || item.equipment} - {formatType(item.maintenance_type || item.type)} Maintenance
                                                </h4>
                                            </div>
                                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                                                <span className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                    <span>{item.scheduled_date || item.date}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                    </svg>
                                                    <span>{item.technician_name || item.technician || 'Unassigned'}</span>
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className="mt-2 text-sm text-gray-500 truncate">{item.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-semibold text-gray-900">
                                                ${parseFloat(item.estimated_cost || item.cost || 0).toFixed(2)}
                                            </span>
                                            <div className="mt-1">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                                    {formatStatus(item.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            {maintenance.filter(item => {
                                const itemDate = new Date(item.scheduled_date || item.date);
                                const today = new Date();
                                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                                return itemDate >= today && itemDate <= nextWeek && (item.status === 'scheduled' || item.status === 'in_progress');
                            }).length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <p className="text-lg font-medium">No upcoming maintenance scheduled</p>
                                        <p className="text-sm">All equipment is up to date with maintenance.</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}