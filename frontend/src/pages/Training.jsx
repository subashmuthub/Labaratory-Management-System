// src/pages/Training.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Training() {
    // Training-specific state
    const [trainings, setTrainings] = useState([])
    const [userCertifications, setUserCertifications] = useState([])
    const [equipment, setEquipment] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingTraining, setEditingTraining] = useState(null)
    const [activeTab, setActiveTab] = useState('my-certifications')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        equipment_id: '',
        required_for_equipment: true,
        duration_hours: 1,
        validity_months: 12,
        max_participants: 10,
        instructor: '',
        materials: ''
    })

    // Dashboard-style state
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
            badge: userCertifications.length
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

    const tabs = [
        {
            id: 'my-certifications',
            name: 'My Certifications',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
            )
        },
        {
            id: 'available-training',
            name: 'Available Training',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
            )
        },
        ...(user?.role === 'admin' || user?.role === 'lab_technician' ? [
            {
                id: 'manage-training',
                name: 'Manage Training',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                )
            },
            {
                id: 'user-compliance',
                name: 'User Compliance',
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                )
            }
        ] : [])
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

    useEffect(() => {
        // Set document title
        document.title = 'Training | NEC LabMS'
        
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        fetchData()
    }, [isAuthenticated, navigate])

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

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            await Promise.all([
                fetchTrainings(),
                fetchUserCertifications(),
                fetchEquipment(),
                ...(user?.role === 'admin' ? [fetchUsers()] : [])
            ])
        } catch (error) {
            setError('Failed to load training data')
        } finally {
            setLoading(false)
        }
    }

    const fetchTrainings = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/training`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const result = await response.json()
                setTrainings(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching trainings:', error)
        }
    }

    const fetchUserCertifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/training/certifications/user/${user.id}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const result = await response.json()
                setUserCertifications(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching certifications:', error)
        }
    }

    const fetchEquipment = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/equipment?limit=1000`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const result = await response.json()
                setEquipment(result.data?.equipment || result.data || [])
            }
        } catch (error) {
            console.error('Error fetching equipment:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                const result = await response.json()
                setUsers(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Client-side validation
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }
        if (formData.duration_hours < 0.5 || formData.duration_hours > 40) {
            setError('Duration must be between 0.5 and 40 hours');
            return;
        }
        if (formData.validity_months < 1 || formData.validity_months > 60) {
            setError('Validity must be between 1 and 60 months');
            return;
        }
        if (formData.max_participants < 1 || formData.max_participants > 100) {
            setError('Max participants must be between 1 and 100');
            return;
        }

        try {
            console.log('🎯 Submitting training form:', {
                editingTraining: editingTraining?.id,
                formData,
                user: user,
                userRole: user?.role,
                isAuthenticated: isAuthenticated ? 'Yes' : 'No'
            });

            // Clean form data before sending
            const cleanFormData = {
                ...formData,
                equipment_id: formData.equipment_id || null,
                instructor: formData.instructor || null,
                materials: formData.materials || null
            };

            const url = editingTraining
                ? `${API_BASE_URL}/training/${editingTraining.id}`
                : `${API_BASE_URL}/training`

            const method = editingTraining ? 'PUT' : 'POST'

            console.log(`📡 Making ${method} request to:`, url);
            console.log('📝 Sending data:', cleanFormData);

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanFormData)
            })

            console.log('📨 Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Success response:', result);
                await fetchTrainings()
                setShowModal(false)
                setEditingTraining(null)
                setFormData({
                    title: '',
                    description: '',
                    equipment_id: '',
                    required_for_equipment: true,
                    duration_hours: 1,
                    validity_months: 12,
                    max_participants: 10,
                    instructor: '',
                    materials: ''
                })
                showSuccessMessage(editingTraining ? 'Training updated successfully!' : 'Training created successfully!')
            } else {
                const result = await response.json()
                console.error('❌ Error response:', result);
                
                // Show detailed error message
                if (result.errors && Array.isArray(result.errors)) {
                    const errorMessages = result.errors.map(err => err.msg || err.message).join(', ');
                    setError(`Validation failed: ${errorMessages}`);
                } else if (result.message) {
                    setError(result.message);
                } else {
                    setError(`Failed to save training (Status: ${response.status})`);
                }
            }
        } catch (error) {
            console.error('💥 Network error:', error)
            setError('Failed to save training - network error')
        }
    }

    const enrollInTraining = async (trainingId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/training/${trainingId}/enroll`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                await fetchUserCertifications()
                setError('')
                showSuccessMessage('Successfully enrolled in training!')
            } else {
                const result = await response.json()
                setError(result.message || 'Failed to enroll in training')
            }
        } catch (error) {
            console.error('Error enrolling in training:', error)
            setError('Failed to enroll in training')
        }
    }

    const markCertificationComplete = async (certificationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/training/certifications/${certificationId}/complete`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                await fetchUserCertifications()
                showSuccessMessage('Certification marked as complete!')
            } else {
                setError('Failed to mark certification as complete')
            }
        } catch (error) {
            console.error('Error updating certification:', error)
            setError('Failed to update certification')
        }
    }

    const deleteTraining = async (id) => {
        if (!window.confirm('Are you sure you want to delete this training program?')) return

        try {
            const response = await fetch(`${API_BASE_URL}/training/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                await fetchTrainings()
                showSuccessMessage('Training program deleted successfully!')
            } else {
                setError('Failed to delete training program')
            }
        } catch (error) {
            console.error('Error deleting training:', error)
            setError('Failed to delete training program')
        }
    }

    // ✅ FIXED: Updated function to use cert.certification
    const getCertificationStatus = (certification) => {
        if (!certification.completed_at) return 'In Progress'

        const completedDate = new Date(certification.completed_at)
        const expiryDate = new Date(completedDate)
        expiryDate.setMonth(expiryDate.getMonth() + (certification.certification?.validity_months || 12))

        if (new Date() > expiryDate) return 'Expired'
        if (new Date() > new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000)) return 'Expiring Soon'
        return 'Valid'
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Valid': return 'bg-green-100 text-green-800'
            case 'Expiring Soon': return 'bg-yellow-100 text-yellow-800'
            case 'Expired': return 'bg-red-100 text-red-800'
            case 'In Progress': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // ✅ FIXED: Updated to use cert.certification
    const renderMyCertifications = () => (
        <div className="space-y-6">
            {userCertifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCertifications.map((cert) => {
                        const status = getCertificationStatus(cert)
                        const equipmentItem = equipment.find(eq => eq.id === cert.certification?.equipment_id)

                        return (
                            <div key={cert.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">{cert.certification?.title}</h3>
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                                        {status}
                                    </span>
                                </div>

                                <div className="space-y-3 text-sm">
                                    {equipmentItem && (
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                            </svg>
                                            <span><strong>Equipment:</strong> {equipmentItem.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span><strong>Duration:</strong> {cert.certification?.duration_hours} hours</span>
                                    </div>
                                    {cert.completed_at && (
                                        <>
                                            <div className="flex items-center text-gray-600">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <span><strong>Completed:</strong> {new Date(cert.completed_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                                <span><strong>Expires:</strong> {
                                                    new Date(new Date(cert.completed_at).setMonth(
                                                        new Date(cert.completed_at).getMonth() + (cert.certification?.validity_months || 12)
                                                    )).toLocaleDateString()
                                                }</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!cert.completed_at && (
                                    <button
                                        onClick={() => markCertificationComplete(cert.id)}
                                        className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Mark as Complete
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications yet</h3>
                    <p className="text-gray-600 mb-6">You don't have any certifications yet. Start by enrolling in available training programs.</p>
                    <button
                        onClick={() => setActiveTab('available-training')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Browse Available Training
                    </button>
                </div>
            )}
        </div>
    )

    const renderAvailableTraining = () => (
        <div className="space-y-6">
            {trainings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.map((training) => {
                        const equipmentItem = equipment.find(eq => eq.id === training.equipment_id)
                        const isEnrolled = userCertifications.some(cert => cert.training_id === training.id)

                        return (
                            <div key={training.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">{training.title}</h3>

                                <div className="space-y-3 text-sm mb-4">
                                    {equipmentItem && (
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                            </svg>
                                            <span><strong>Equipment:</strong> {equipmentItem.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span><strong>Duration:</strong> {training.duration_hours} hours</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                        <span><strong>Max Participants:</strong> {training.max_participants}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <span><strong>Valid for:</strong> {training.validity_months} months</span>
                                    </div>
                                    {training.instructor && (
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            <span><strong>Instructor:</strong> {training.instructor}</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{training.description}</p>

                                {isEnrolled ? (
                                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center font-medium">
                                        ✓ Already Enrolled
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => enrollInTraining(training.id)}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Enroll Now
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No training programs available</h3>
                    <p className="text-gray-600">Check back later for new training opportunities.</p>
                </div>
            )}
        </div>
    )

    const renderManageTraining = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span>Add Training Program</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {trainings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Equipment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Participants</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {trainings.map((training) => {
                                    const equipmentItem = equipment.find(eq => eq.id === training.equipment_id)

                                    return (
                                        <tr key={training.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{training.title}</div>
                                                <div className="text-sm text-gray-500">{training.instructor}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {equipmentItem?.name || 'General'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {training.duration_hours}h
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {training.current_participants || 0}/{training.max_participants}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setEditingTraining(training)
                                                        setFormData(training)
                                                        setShowModal(true)
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 mr-4 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteTraining(training.id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No training programs</h3>
                        <p className="text-gray-600 mb-6">Get started by creating your first training program.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Add Training Program
                        </button>
                    </div>
                )}
            </div>
        </div>
    )

    // ✅ FIXED: Updated renderUserCompliance function
    const renderUserCompliance = () => {
        const complianceData = users.map(user => {
            const userCerts = userCertifications.filter(cert => cert.user_id === user.id)
            const requiredTrainings = trainings.filter(t => t.required_for_equipment)
            const completedCerts = userCerts.filter(cert => cert.completed_at)
            const expiredCerts = userCerts.filter(cert => {
                if (!cert.completed_at) return false
                const expiryDate = new Date(cert.completed_at)
                expiryDate.setMonth(expiryDate.getMonth() + (cert.certification?.validity_months || 12))
                return new Date() > expiryDate
            })

            return {
                ...user,
                totalRequired: requiredTrainings.length,
                completed: completedCerts.length,
                expired: expiredCerts.length,
                complianceRate: requiredTrainings.length > 0 ?
                    Math.round((completedCerts.length / requiredTrainings.length) * 100) : 100
            }
        })

        return (
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">User Compliance Overview</h3>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {complianceData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Compliance Rate</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Completed</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expired</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {complianceData.map((userData) => (
                                        <tr key={userData.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                                                <div className="text-sm text-gray-500">{userData.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                                        <div
                                                            className={`h-2 rounded-full ${userData.complianceRate >= 80 ? 'bg-green-500' :
                                                                userData.complianceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${userData.complianceRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-900 font-medium">{userData.complianceRate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {userData.completed}/{userData.totalRequired}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {userData.expired}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${userData.complianceRate >= 80 ? 'bg-green-100 text-green-800' :
                                                    userData.complianceRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {userData.complianceRate >= 80 ? 'Compliant' :
                                                        userData.complianceRate >= 60 ? 'Needs Training' : 'Non-Compliant'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No compliance data available</h3>
                            <p className="text-gray-600">User compliance information will appear here once users start completing training.</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading training data...</p>
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
                                        placeholder="Search training..."
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
                                <h1 className="text-3xl font-bold text-gray-900">Training & Certifications</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage your training programs, track certifications, and ensure compliance.
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">
                                My certifications: {userCertifications.length}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-all flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        {activeTab === 'my-certifications' && renderMyCertifications()}
                        {activeTab === 'available-training' && renderAvailableTraining()}
                        {activeTab === 'manage-training' && renderManageTraining()}
                        {activeTab === 'user-compliance' && renderUserCompliance()}
                    </div>
                </main>
            </div>

            {/* Training Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-2xl font-semibold text-gray-900">
                                {editingTraining ? 'Edit Training Program' : 'Add Training Program'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    setEditingTraining(null)
                                    setFormData({
                                        title: '',
                                        description: '',
                                        equipment_id: '',
                                        required_for_equipment: true,
                                        duration_hours: 1,
                                        validity_months: 12,
                                        max_participants: 10,
                                        instructor: '',
                                        materials: ''
                                    })
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Enter training title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment</label>
                                    <select
                                        value={formData.equipment_id}
                                        onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    >
                                        <option value="">General Training</option>
                                        {equipment.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Describe the training program"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="40"
                                        required
                                        value={formData.duration_hours}
                                        onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid for (months)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        required
                                        value={formData.validity_months}
                                        onChange={(e) => setFormData({ ...formData, validity_months: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        required
                                        value={formData.max_participants}
                                        onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Instructor</label>
                                <input
                                    type="text"
                                    value={formData.instructor}
                                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="Enter instructor name"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="required"
                                    checked={formData.required_for_equipment}
                                    onChange={(e) => setFormData({ ...formData, required_for_equipment: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="required" className="ml-2 text-sm font-medium text-gray-700">
                                    Required for equipment access
                                </label>
                            </div>

                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditingTraining(null)
                                        setFormData({
                                            title: '',
                                            description: '',
                                            equipment_id: '',
                                            required_for_equipment: true,
                                            duration_hours: 1,
                                            validity_months: 12,
                                            max_participants: 10,
                                            instructor: '',
                                            materials: ''
                                        })
                                    }}
                                    className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingTraining ? 'Update Program' : 'Create Program'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}