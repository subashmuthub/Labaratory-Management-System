import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function BookingSystem() {
    const { isAuthenticated, user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef(null)

    // Booking-specific state
    const [bookings, setBookings] = useState([])
    const [labs, setLabs] = useState([])
    const [equipment, setEquipment] = useState([])
    const [filteredEquipment, setFilteredEquipment] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showBookingForm, setShowBookingForm] = useState(false)
    const [newBooking, setNewBooking] = useState({
        booking_type: 'lab',
        lab_id: '',
        equipment_id: '',
        date: '',
        start_time: '',
        end_time: '',
        purpose: ''
    })

    // Dashboard-style state
    const [searchQuery, setSearchQuery] = useState('')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Define API base URL
    const API_BASE_URL = '/api'

    // Navigation items
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
            badge: bookings.length
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
            badge: null
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
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch labs, equipment and bookings
    useEffect(() => {
        // Set document title
        document.title = 'Bookings | NEC LabMS'
        
        if (!token) {
            navigate('/login')
            return
        }

        const fetchData = async () => {
            if (!isAuthenticated || !token) {
                console.log('Waiting for authentication...')
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const headers = {
                    'Content-Type': 'application/json'
                }

                // Fetch labs
                const labsResponse = await fetch(`${API_BASE_URL}/labs`, { credentials: 'include', headers })
                if (labsResponse.ok) {
                    const labsData = await labsResponse.json()
                    setLabs(labsData.data?.labs || [])
                } else {
                    console.error('Failed to fetch labs:', labsResponse.status)
                }

                // Fetch equipment
                const equipmentResponse = await fetch(`${API_BASE_URL}/equipment?limit=1000`, { headers })
                if (equipmentResponse.ok) {
                    const equipmentData = await equipmentResponse.json()
                    setEquipment(equipmentData.data?.equipment || [])
                    setFilteredEquipment(equipmentData.data?.equipment || [])
                } else {
                    console.error('Failed to fetch equipment:', equipmentResponse.status)
                }

                // Fetch bookings - admins see all, students see only their own
                const bookingsUrl = user?.role === 'admin' 
                    ? `${API_BASE_URL}/bookings` 
                    : `${API_BASE_URL}/bookings?my_bookings=true`
                const bookingsResponse = await fetch(bookingsUrl, { headers })
                if (bookingsResponse.ok) {
                    const bookingsData = await bookingsResponse.json()
                    console.log('📅 Bookings API response:', bookingsData)
                    console.log('📅 Bookings data:', bookingsData.data)
                    console.log('📅 Bookings count:', Array.isArray(bookingsData.data) ? bookingsData.data.length : 0)
                    
                    // Backend returns { success: true, data: [...bookings], pagination: {...} }
                    // So bookingsData.data is already the array of bookings
                    const bookingsArray = Array.isArray(bookingsData.data) ? bookingsData.data : []
                    setBookings(bookingsArray)
                    console.log('📅 Bookings set:', bookingsArray.length, 'bookings')
                } else {
                    console.error('Failed to fetch bookings:', bookingsResponse.status)
                    const errorData = await bookingsResponse.json()
                    console.error('Booking error details:', errorData)
                }

            } catch (error) {
                console.error('Error fetching data:', error)
                setError('Failed to load data. Please check your connection.')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [token, isAuthenticated, navigate])

    // Filter equipment when lab is selected
    useEffect(() => {
        if (newBooking.lab_id) {
            const filtered = equipment.filter(item => item.lab_id === parseInt(newBooking.lab_id))
            setFilteredEquipment(filtered)
        } else {
            setFilteredEquipment(equipment)
        }
        // Reset equipment selection when lab changes
        setNewBooking(prev => ({ ...prev, equipment_id: '' }))
    }, [newBooking.lab_id, equipment])

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

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setNewBooking({ ...newBooking, [name]: value })
    }

    const handleBookingTypeChange = (e) => {
        const bookingType = e.target.value
        setNewBooking({
            ...newBooking,
            booking_type: bookingType,
            lab_id: '',
            equipment_id: ''
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!isAuthenticated || !token) {
            setError('You must be logged in to create a booking')
            return
        }

        // Validation
        if (newBooking.booking_type === 'lab' && !newBooking.lab_id) {
            setError('Please select a lab')
            return
        }
        if (newBooking.booking_type === 'equipment' && (!newBooking.lab_id || !newBooking.equipment_id)) {
            setError('Please select both lab and equipment')
            return
        }

        try {
            setLoading(true)
            setError('')

            // Format booking data - ensure time format compatibility
            const bookingData = {
                booking_type: newBooking.booking_type,
                lab_id: parseInt(newBooking.lab_id),
                equipment_id: newBooking.booking_type === 'equipment' ? parseInt(newBooking.equipment_id) : null,
                date: newBooking.date,
                start_time: newBooking.start_time, // Send as HH:MM (browser handles this format)
                end_time: newBooking.end_time,     // Send as HH:MM (browser handles this format)
                purpose: newBooking.purpose
            }

            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            })

            const data = await response.json()

            if (response.ok && data.success) {
                // Refresh bookings list instead of manually adding
                const bookingsUrl = user?.role === 'admin' 
                    ? `${API_BASE_URL}/bookings` 
                    : `${API_BASE_URL}/bookings?my_bookings=true`
                
                const refreshResponse = await fetch(bookingsUrl, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json()
                    // Backend returns { success: true, data: [...bookings], pagination: {...} }
                    const bookingsArray = Array.isArray(refreshData.data) ? refreshData.data : []
                    setBookings(bookingsArray)
                    console.log('📅 Bookings refreshed:', bookingsArray.length, 'bookings')
                }
                
                setShowBookingForm(false)
                setNewBooking({
                    booking_type: 'lab',
                    lab_id: '',
                    equipment_id: '',
                    date: '',
                    start_time: '',
                    end_time: '',
                    purpose: ''
                })
                showSuccessMessage('Booking created successfully!')
            } else {
                setError(data.message || 'Failed to create booking')
            }
        } catch (error) {
            console.error('Error creating booking:', error)
            setError('Failed to create booking. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelBooking = async (id) => {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                // Remove booking from list
                setBookings(bookings.filter(booking => booking.id !== id))
                showSuccessMessage('Booking cancelled successfully!')
            } else {
                const data = await response.json()
                setError(data.message || 'Failed to cancel booking')
            }
        } catch (error) {
            console.error('Error cancelling booking:', error)
            setError('Failed to cancel booking. Please try again.')
        }
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

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-green-100 text-green-800'
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getBookingTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'lab': return 'bg-blue-100 text-blue-800'
            case 'equipment': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const options = { year: 'numeric', month: 'short', day: 'numeric' }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    // Format time for display
    const formatTime = (timeString) => {
        if (!timeString) return ''
        // If it's a full timestamp, extract just the time portion
        if (timeString.includes('T')) {
            timeString = timeString.split('T')[1]
        }

        // Handle various time formats
        let hours, minutes
        if (timeString.includes(':')) {
            [hours, minutes] = timeString.split(':')
        } else {
            hours = timeString.substring(0, 2)
            minutes = timeString.substring(2, 4)
        }

        const parsedHours = parseInt(hours)
        const ampm = parsedHours >= 12 ? 'PM' : 'AM'
        const displayHours = parsedHours % 12 || 12

        return `${displayHours}:${minutes} ${ampm}`
    }

    const filteredBookings = bookings.filter(booking => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            booking.lab?.name?.toLowerCase().includes(query) ||
            booking.equipment?.name?.toLowerCase().includes(query) ||
            booking.user?.name?.toLowerCase().includes(query) ||
            booking.purpose?.toLowerCase().includes(query) ||
            booking.status?.toLowerCase().includes(query)
        )
    })

    if (loading && !bookings.length) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading bookings...</p>
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
                                        placeholder="Search bookings..."
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

                                {/* New Booking Button */}
                                <button
                                    onClick={() => setShowBookingForm(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                    disabled={!isAuthenticated}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    <span>New Booking</span>
                                </button>

                                {/* Notifications */}
                                <button
                                    onClick={() => handleNavigation('/notifications')}
                                    className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Notifications"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                    </svg>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Lab & Equipment Bookings</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage your lab and equipment reservations. Book resources for your research and experiments.
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">
                                Total bookings: {bookings.length}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                                    <p className="text-3xl font-bold text-blue-600">{bookings.length}</p>
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
                                    <p className="text-sm font-medium text-gray-600">Lab Bookings</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {bookings.filter(b => b.booking_type === 'lab').length}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Equipment Bookings</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {bookings.filter(b => b.booking_type === 'equipment').length}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                                    <p className="text-3xl font-bold text-emerald-600">
                                        {bookings.filter(b => b.status === 'confirmed').length}
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-100 rounded-full">
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form Modal */}
                    {showBookingForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">New Booking</h2>
                                    <button
                                        onClick={() => setShowBookingForm(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Booking Type Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Type</label>
                                        <select
                                            name="booking_type"
                                            value={newBooking.booking_type}
                                            onChange={handleBookingTypeChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                        >
                                            <option value="lab">Book Entire Lab</option>
                                            <option value="equipment">Book Specific Equipment</option>
                                        </select>
                                    </div>

                                    {/* Lab Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Lab</label>
                                        <select
                                            name="lab_id"
                                            value={newBooking.lab_id}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                        >
                                            <option value="">Select Lab</option>
                                            {labs.map(lab => (
                                                <option key={lab.id} value={lab.id}>
                                                    {lab.name} {lab.location && `(${lab.location})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Equipment Selection */}
                                    {newBooking.booking_type === 'equipment' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment</label>
                                            <select
                                                name="equipment_id"
                                                value={newBooking.equipment_id}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                required={newBooking.booking_type === 'equipment'}
                                            >
                                                <option value="">Select Equipment</option>
                                                {filteredEquipment.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name} ({item.serial_number})
                                                    </option>
                                                ))}
                                            </select>
                                            {newBooking.lab_id && filteredEquipment.length === 0 && (
                                                <p className="text-sm text-gray-500 mt-2">No equipment available in this lab</p>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={newBooking.date}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                                            <input
                                                type="time"
                                                name="start_time"
                                                value={newBooking.start_time}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                                            <input
                                                type="time"
                                                name="end_time"
                                                value={newBooking.end_time}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                                        <textarea
                                            name="purpose"
                                            value={newBooking.purpose}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            rows="3"
                                            placeholder="Describe the purpose of booking"
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowBookingForm(false)}
                                            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={loading}
                                        >
                                            {loading ? 'Creating...' : 'Create Booking'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Bookings Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Current Bookings</h2>
                            <div className="text-sm text-gray-600">
                                Showing {filteredBookings.length} of {bookings.length} bookings
                            </div>
                        </div>

                        {filteredBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                                <p className="text-gray-600 mb-6">
                                    {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first booking.'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={() => setShowBookingForm(true)}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Create New Booking
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lab</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipment</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredBookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.id}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getBookingTypeColor(booking.booking_type)}`}>
                                                        {booking.booking_type?.charAt(0).toUpperCase() + booking.booking_type?.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {booking.lab?.name || 'Unknown Lab'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {booking.equipment?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {booking.user?.name || 'Unknown User'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(booking.start_time)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {booking.status !== 'cancelled' && (
                                                        <button
                                                            className="text-red-600 hover:text-red-800 hover:underline transition-colors"
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default BookingSystem