// Enhanced Profile Page - Real-time Upload Version
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usersAPI } from '../services/api'

export default function NewProfile() {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        bio: '',
        avatar_url: null
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)

    const { user, isAuthenticated, updateUser } = useAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const debounceTimeoutRef = useRef(null)

    const fetchProfileData = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            
            // Fetch profile data
            const profileResponse = await usersAPI.getProfile()
            console.log('Profile response:', profileResponse)
            
            if (profileResponse.success && profileResponse.data) {
                setProfile(prev => ({ ...prev, ...profileResponse.data }))
                setAvatarPreview(profileResponse.data.avatar_url)
            } else if (profileResponse.success === false) {
                setError(profileResponse.message || 'Failed to load profile data')
            } else {
                // Handle case where response doesn't have success field but has data
                setProfile(prev => ({ ...prev, ...profileResponse }))
                setAvatarPreview(profileResponse.avatar_url)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            setError('Failed to load profile data: ' + error.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        fetchProfileData()
    }, [isAuthenticated, navigate, fetchProfileData])

    // Cleanup function
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
        }
    }, [])

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (file) {
            await processAvatarFile(file)
        }
    }

    const processAvatarFile = async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (PNG, JPG, JPEG, GIF, WEBP)')
            return
        }

        // Validate file size (10MB limit for raw file)
        if (file.size > 10 * 1024 * 1024) {
            setError('Avatar file size must be less than 10MB')
            return
        }

        console.log('📷 Processing avatar upload:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
        
        setUploadingAvatar(true)
        setError('')
        
        try {
            // Compress image before upload
            const compressedImage = await compressImage(file)
            console.log('✅ Avatar compressed successfully')
            
            // Update preview immediately
            setAvatarPreview(compressedImage)
            setProfile(prev => ({ ...prev, avatar_url: compressedImage }))
            
            // Auto-save the avatar to backend
            try {
                const response = await usersAPI.updateProfile({ 
                    ...profile, 
                    avatar_url: compressedImage 
                })
                
                if (response.success) {
                    setSuccess('✅ Profile picture updated successfully!')
                    updateUser(response.data)
                    setTimeout(() => setSuccess(''), 3000)
                } else {
                    setError(response.message || 'Failed to save avatar')
                    // Revert avatar on failure
                    setAvatarPreview(profile.avatar_url)
                }
            } catch (saveError) {
                console.error('Error saving avatar:', saveError)
                setError('Failed to save avatar: ' + saveError.message)
                // Revert avatar on failure
                setAvatarPreview(profile.avatar_url)
            }
            
            setUploadingAvatar(false)
        } catch (error) {
            console.error('❌ Error processing avatar:', error)
            setError('Error processing image. Please try again.')
            setUploadingAvatar(false)
        }
    }

    // Image compression function
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                // Calculate new dimensions (max 300x300 for avatars)
                const maxSize = 300
                let { width, height } = img

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width
                        width = maxSize
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height
                        height = maxSize
                    }
                }

                // Set canvas dimensions
                canvas.width = width
                canvas.height = height

                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height)
                
                // Convert to base64 with compression (0.8 quality for JPEG)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
                
                console.log('🗜️ Image compressed from', (file.size / 1024).toFixed(1) + 'KB', 
                           'to', (compressedDataUrl.length * 0.75 / 1024).toFixed(1) + 'KB')
                
                resolve(compressedDataUrl)
            }

            img.onerror = () => {
                reject(new Error('Failed to load image for compression'))
            }

            // Load the image
            const reader = new FileReader()
            reader.onload = (e) => {
                img.src = e.target.result
            }
            reader.onerror = () => {
                reject(new Error('Failed to read image file'))
            }
            reader.readAsDataURL(file)
        })
    }

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        setIsDragging(false)
        
        const files = e.dataTransfer.files
        if (files.length > 0) {
            await processAvatarFile(files[0])
        }
    }

    // Auto-save function with debouncing for form fields
    const autoSaveProfile = useCallback(async (updatedProfile) => {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }

        // Set new timeout for auto-save (2 seconds after user stops typing)
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                console.log('🔄 Auto-saving profile changes...')
                const response = await usersAPI.updateProfile(updatedProfile)
                
                if (response.success) {
                    console.log('✅ Profile auto-saved successfully')
                    updateUser(response.data)
                    setSuccess('💾 Changes saved automatically')
                    setTimeout(() => setSuccess(''), 2000)
                } else {
                    console.error('❌ Auto-save failed:', response.message)
                }
            } catch (error) {
                console.error('❌ Auto-save error:', error)
            }
        }, 2000) // 2 second delay
    }, [updateUser])

    // Handle field changes with auto-save
    const handleFieldChange = useCallback((field, value) => {
        const updatedProfile = { ...profile, [field]: value }
        setProfile(updatedProfile)
        
        // Only auto-save if the field has meaningful content
        if (value && value.toString().trim().length > 0) {
            autoSaveProfile(updatedProfile)
        }
    }, [profile, autoSaveProfile])

    const saveProfile = async () => {
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const response = await usersAPI.updateProfile(profile)
            if (response.success) {
                setSuccess('✅ Profile updated successfully!')
                updateUser(response.data)
                setTimeout(() => setSuccess(''), 3000)
            } else {
                setError(response.message || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            setError('Failed to update profile: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading your profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <span className="text-xl">←</span>
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Messages */}
                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
                        <span className="block sm:inline">{error}</span>
                        <button
                            className="absolute top-0 right-0 px-4 py-3"
                            onClick={() => setError('')}
                        >
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative">
                        <span className="block sm:inline">{success}</span>
                        <button
                            className="absolute top-0 right-0 px-4 py-3"
                            onClick={() => setSuccess('')}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Profile Form */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-6 mb-6">
                        <div className="relative">
                            <div 
                                className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg transition-all duration-300 ${
                                    isDragging ? 'border-blue-500 scale-105' : ''
                                } ${uploadingAvatar ? 'opacity-50' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-2xl font-bold">
                                        {(profile.name || user?.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                )}
                                
                                {/* Upload indicator overlay */}
                                {uploadingAvatar && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                    </div>
                                )}
                                
                                {/* Drag overlay */}
                                {isDragging && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">Drop image</span>
                                    </div>
                                )}
                            </div>
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className={`absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all shadow-md ${
                                    uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                                }`}
                                title="Click to upload new profile picture or drag & drop an image"
                            >
                                {uploadingAvatar ? (
                                    <span className="text-sm animate-pulse">⏳</span>
                                ) : (
                                    <span className="text-sm">📷</span>
                                )}
                            </button>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                                disabled={uploadingAvatar}
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">{profile.name || user?.name}</h3>
                            <p className="text-gray-600">{profile.position || 'Position not set'}</p>
                            <p className="text-sm text-gray-500">{profile.department || 'Department not set'}</p>
                            <div className="text-xs text-gray-400 mt-2 space-y-1">
                                <p>📷 Click camera icon or drag & drop to upload</p>
                                <p>💾 Images are saved automatically</p>
                                <p>�️ Auto-compressed to 300x300px for optimal performance</p>
                                <p>�📏 Max size: 10MB • Formats: PNG, JPG, JPEG, GIF, WEBP</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                                <span className="text-xs text-gray-500 ml-2">(auto-saves)</span>
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                                <span className="text-xs text-gray-500 ml-2">(auto-saves)</span>
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => handleFieldChange('email', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                                <span className="text-xs text-gray-500 ml-2">(auto-saves)</span>
                            </label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => handleFieldChange('phone', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department
                                <span className="text-xs text-gray-500 ml-2">(auto-saves)</span>
                            </label>
                            <input
                                type="text"
                                value={profile.department}
                                onChange={(e) => handleFieldChange('department', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your department"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Position
                                <span className="text-xs text-gray-500 ml-2">(auto-saves)</span>
                            </label>
                            <input
                                type="text"
                                value={profile.position}
                                onChange={(e) => handleFieldChange('position', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter your position/title"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bio
                                <span className="text-xs text-gray-500 ml-2">(auto-saves)</span>
                            </label>
                            <textarea
                                rows={4}
                                value={profile.bio}
                                onChange={(e) => handleFieldChange('bio', e.target.value)}
                                placeholder="Tell us about yourself..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>Real-time auto-save enabled</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Changes are automatically saved 2 seconds after you stop typing
                            </p>
                        </div>
                        
                        <button
                            onClick={saveProfile}
                            disabled={saving}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                            title="Manually save all changes now"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    <span>Save Now</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}