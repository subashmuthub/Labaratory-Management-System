// LabManagement.jsx - Full Page Component with Sidebar and Header
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// API Configuration
const API_BASE_URL = '/api'

// Add Lab Modal Component (kept within this file)
function AddLabModal({ isOpen, onClose, onLabAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        lab_type: 'cse',
        capacity: 30,
        square_feet: '',
        lab_seats: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const labTypes = [
        { value: 'cse', label: 'CSE' },
        { value: 'eee', label: 'EEE' },
        { value: 'ece', label: 'ECE' },
        { value: 'mech', label: 'MECH' },
        { value: 'aids', label: 'AIDS' },
        { value: 'sh', label: 'S&H' }
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!formData.name.trim()) {
            setError('Lab name is required')
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/labs`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                setFormData({
                    name: '',
                    description: '',
                    location: '',
                    lab_type: 'cse',
                    capacity: 30,
                    square_feet: '',
                    lab_seats: ''
                })
                onLabAdded(result.data.lab)
                onClose()
            } else {
                throw new Error(result.message || 'Failed to create lab')
            }
        } catch (error) {
            console.error('Error creating lab:', error)
            setError(error.message || 'Failed to create lab. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError('')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add New Lab</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Lab Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="Enter lab name"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                DEPT
                            </label>
                            <select
                                name="lab_type"
                                value={formData.lab_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                disabled={loading}
                            >
                                {labTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Capacity
                            </label>
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                min="1"
                                max="500"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="30"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Square Feet
                            </label>
                            <input
                                type="number"
                                name="square_feet"
                                value={formData.square_feet}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="e.g., 1200.5"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Lab Seats
                            </label>
                            <input
                                type="number"
                                name="lab_seats"
                                value={formData.lab_seats}
                                onChange={handleChange}
                                min="0"
                                max="500"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="25"
                                disabled={loading}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="e.g., Building A, Floor 2, Room 201"
                                disabled={loading}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                rows="3"
                                placeholder="Brief description of the lab"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Lab'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Edit Lab Modal Component
function EditLabModal({ isOpen, onClose, lab, onLabUpdated }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        lab_type: 'cse',
        capacity: 30,
        square_feet: '',
        lab_seats: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const labTypes = [
        { value: 'cse', label: 'CSE' },
        { value: 'eee', label: 'EEE' },
        { value: 'ece', label: 'ECE' },
        { value: 'mech', label: 'MECH' },
        { value: 'aids', label: 'AIDS' },
        { value: 'sh', label: 'S&H' }
    ]

    useEffect(() => {
        if (lab) {
            setFormData({
                name: lab.name || '',
                description: lab.description || '',
                location: lab.location || '',
                lab_type: lab.lab_type || 'cse',
                capacity: lab.capacity || 30,
                square_feet: lab.square_feet || '',
                lab_seats: lab.lab_seats || ''
            })
        }
    }, [lab])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE_URL}/labs/${lab.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                onLabUpdated(result.data.lab)
                onClose()
            } else {
                throw new Error(result.message || 'Failed to update lab')
            }
        } catch (error) {
            console.error('Error updating lab:', error)
            setError(error.message || 'Failed to update lab. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError('')
    }

    if (!isOpen || !lab) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Lab</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Lab Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="Enter lab name"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                DEPT
                            </label>
                            <select
                                name="lab_type"
                                value={formData.lab_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                disabled={loading}
                            >
                                {labTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Capacity
                            </label>
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                min="1"
                                max="500"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="30"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Square Feet
                            </label>
                            <input
                                type="number"
                                name="square_feet"
                                value={formData.square_feet}
                                onChange={handleChange}
                                min="0"
                                step="0.1"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="e.g., 1200.5"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Lab Seats
                            </label>
                            <input
                                type="number"
                                name="lab_seats"
                                value={formData.lab_seats}
                                onChange={handleChange}
                                min="0"
                                max="500"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="25"
                                disabled={loading}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                placeholder="e.g., Building A, Floor 2, Room 201"
                                disabled={loading}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
                                rows="3"
                                placeholder="Brief description of the lab"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Lab'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// View Lab Modal Component
function ViewLabModal({ isOpen, onClose, lab }) {
    if (!isOpen || !lab) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Lab Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Lab Name</label>
                                <div className="text-gray-900 font-medium">{lab.name}</div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Department</label>
                                <div className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {lab.lab_type?.toUpperCase() || 'General'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Location</label>
                                <div className="text-gray-900">{lab.location || 'Not specified'}</div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Capacity</label>
                                <div className="text-gray-900">{lab.capacity ? `${lab.capacity} people` : 'Not specified'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">Additional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lab.lab_seats && (
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Lab Seats</label>
                                    <div className="text-gray-900">{lab.lab_seats} seats</div>
                                </div>
                            )}
                            {lab.square_feet && (
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Square Feet</label>
                                    <div className="text-gray-900">{lab.square_feet} sq ft</div>
                                </div>
                            )}
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Created Date</label>
                                <div className="text-gray-900">
                                    {lab.created_at ? new Date(lab.created_at).toLocaleDateString() : 'Unknown'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Status</label>
                                <div className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {lab.description && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Description</h3>
                            <p className="text-gray-900">{lab.description}</p>
                        </div>
                    )}

                    {/* Lab Creator */}
                    {lab.labCreator && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3">Created By</h3>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {lab.labCreator.name?.charAt(0).toUpperCase() || lab.labCreator.email?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-gray-900 font-medium">
                                        {lab.labCreator.name || lab.labCreator.email}
                                    </div>
                                    <div className="text-gray-500 text-sm">{lab.labCreator.email}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

// Main Lab Management Component
export default function LabManagement() {
    const [labs, setLabs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [selectedLab, setSelectedLab] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')

    // Sidebar and UI state
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Refs
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

    // Fetch labs from backend
    const fetchLabs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/labs`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const result = await response.json()

            if (result.success) {
                setLabs(result.data.labs || [])
                setError('')
            } else {
                throw new Error(result.message || 'Failed to fetch labs')
            }
        } catch (error) {
            console.error('Error fetching labs:', error)
            setError(`Failed to load labs: ${error.message}`)
        }
    }

    // Delete lab
    const handleDeleteLab = async (labId) => {
        if (!confirm('Are you sure you want to delete this lab?')) {
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/labs/${labId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const result = await response.json()

            if (result.success) {
                setLabs(labs.filter(lab => lab.id !== labId))
            } else {
                throw new Error(result.message || 'Failed to delete lab')
            }
        } catch (error) {
            console.error('Error deleting lab:', error)
            alert(`Failed to delete lab: ${error.message}`)
        }
    }

    // Handle lab added
    const handleLabAdded = (newLab) => {
        setLabs(prev => [newLab, ...prev])
    }

    // Handle lab updated
    const handleLabUpdated = (updatedLab) => {
        setLabs(prev => prev.map(lab =>
            lab.id === updatedLab.id ? updatedLab : lab
        ))
    }

    // Handle edit lab
    const handleEditLab = (lab) => {
        setSelectedLab(lab)
        setIsEditModalOpen(true)
    }

    // Handle view lab
    const handleViewLab = (lab) => {
        setSelectedLab(lab)
        setIsViewModalOpen(true)
    }

    // Navigation functions
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

    // Filter labs based on search and type
    const filteredLabs = labs.filter(lab => {
        const matchesSearch = lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lab.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lab.description?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesType = filterType === 'all' || lab.lab_type === filterType

        return matchesSearch && matchesType
    })

    // Load data on component mount
    useEffect(() => {
        // Set document title
        document.title = 'Lab Management | NEC LabMS'
        
        const loadData = async () => {
            if (!isAuthenticated) return // Don't fetch if not authenticated
            setLoading(true)
            await fetchLabs()
            setLoading(false)
        }
        loadData()
    }, [isAuthenticated]) // Add isAuthenticated as dependency

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Initializing...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                    </div>
                    <p className="text-gray-600 mt-4 font-medium">Loading labs...</p>
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
                                <h1 className="text-3xl font-bold text-gray-900">Lab Management</h1>
                                <p className="mt-2 text-gray-600">
                                    Manage and monitor all laboratory spaces and their configurations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                    </svg>
                                    <span>{error}</span>
                                </div>
                                <button
                                    onClick={fetchLabs}
                                    className="ml-4 px-3 py-1 bg-red-200 text-red-800 rounded text-sm hover:bg-red-300"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search and Filter Bar */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search labs by name, Location, or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="cse">CSE</option>
                                <option value="eee">EEE</option>
                                <option value="ece">ECE</option>
                                <option value="mech">MECH</option>
                                <option value="aids">AIDS</option>
                                <option value="sh">S&H</option>
                            </select>
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add New Lab
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Labs Grid or Table */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Labs ({filteredLabs.length})
                                </h2>
                                <button
                                    onClick={fetchLabs}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {filteredLabs.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        {searchTerm || filterType !== 'all' ? 'No labs found matching your criteria' : 'No labs found'}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {user?.role === 'admin' ? 'Get started by creating a new lab.' : 'No labs available to view.'}
                                    </p>
                                    {user?.role === 'admin' && !searchTerm && filterType === 'all' && (
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setIsAddModalOpen(true)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Add Your First Lab
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Lab Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    DEPT
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Location
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Capacity
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredLabs.map((lab) => (
                                                <tr key={lab.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {lab.name}
                                                            </div>
                                                            {lab.description && (
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {lab.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {lab.lab_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General Lab'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {lab.location || 'Not specified'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div>
                                                            <div className="text-sm text-gray-900">{lab.capacity || 'N/A'} people</div>
                                                            {lab.lab_seats && (
                                                                <div className="text-xs text-gray-500">{lab.lab_seats} seats</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {lab.created_at ? new Date(lab.created_at).toLocaleDateString() : 'Unknown'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => handleViewLab(lab)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                View
                                                            </button>
                                                            {user?.role === 'admin' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditLab(lab)}
                                                                        className="text-indigo-600 hover:text-indigo-900"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteLab(lab.id)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modals */}
            {user?.role === 'admin' && (
                <>
                    <AddLabModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        onLabAdded={handleLabAdded}
                    />
                    <EditLabModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false)
                            setSelectedLab(null)
                        }}
                        lab={selectedLab}
                        onLabUpdated={handleLabUpdated}
                    />
                </>
            )}

            {/* View Lab Modal - Available to all users */}
            <ViewLabModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false)
                    setSelectedLab(null)
                }}
                lab={selectedLab}
            />
        </div>
    )
}
