import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

function EquipmentDetails() {
    const { id } = useParams()
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [equipment, setEquipment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchEquipment = async () => {
            if (!isAuthenticated) {
                navigate('/login')
                return
            }

            try {
                setLoading(true)
                const response = await fetch(`/api/equipment/${id}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.success) {
                        setEquipment(data.data.equipment)
                    } else {
                        setError(data.message || 'Equipment not found')
                    }
                } else {
                    setError('Equipment not found')
                }
            } catch (error) {
                console.error('Error fetching equipment:', error)
                setError('Failed to load equipment data')
            } finally {
                setLoading(false)
            }
        }

        fetchEquipment()
    }, [id, isAuthenticated, navigate])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <div className="mt-4 text-gray-600">Loading equipment details...</div>
                </div>
            </div>
        )
    }

    if (error || !equipment) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">{error || 'Equipment not found'}</div>
                    <Link to="/equipment" className="text-blue-600 hover:underline">
                        ← Back to Equipment Inventory
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="px-6 py-4">
                    <Link to="/equipment" className="text-blue-500 hover:underline">← Back to Inventory</Link>
                    <h1 className="text-2xl font-bold text-gray-800 mt-2">Equipment Details</h1>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Basic Information</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-medium">Equipment ID:</span>
                                <span>{equipment.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Name:</span>
                                <span>{equipment.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Category:</span>
                                <span className="capitalize">{equipment.category?.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Manufacturer:</span>
                                <span>{equipment.manufacturer || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Model:</span>
                                <span>{equipment.model || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Serial Number:</span>
                                <span className="font-mono text-sm">{equipment.serial_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Status:</span>
                                <span className={`px-2 py-1 rounded text-sm capitalize ${
                                    equipment.status === 'available' ? 'bg-green-100 text-green-800' :
                                    equipment.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                                    equipment.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                    equipment.status === 'broken' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {equipment.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Condition:</span>
                                <span className="capitalize">{equipment.condition_status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Laboratory:</span>
                                <span>{equipment.lab?.name || 'Unassigned'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Location Details:</span>
                                <span>{equipment.location_details || 'Not specified'}</span>
                            </div>
                            {equipment.description && (
                                <div>
                                    <span className="font-medium">Description:</span>
                                    <p className="mt-1 text-gray-600">{equipment.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="bg-white rounded shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Technical Specifications</h2>
                        <div className="space-y-3">
                            {equipment.category === 'computer' && (
                                <>
                                    {equipment.processor && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Processor:</span>
                                            <span>{equipment.processor}</span>
                                        </div>
                                    )}
                                    {equipment.ram && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">RAM:</span>
                                            <span>{equipment.ram}</span>
                                        </div>
                                    )}
                                    {equipment.storage && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Storage:</span>
                                            <span>{equipment.storage}</span>
                                        </div>
                                    )}
                                    {equipment.graphics_card && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Graphics Card:</span>
                                            <span>{equipment.graphics_card}</span>
                                        </div>
                                    )}
                                    {equipment.operating_system && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Operating System:</span>
                                            <span>{equipment.operating_system}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {equipment.category === 'projector' && (
                                <>
                                    {equipment.resolution && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Resolution:</span>
                                            <span>{equipment.resolution}</span>
                                        </div>
                                    )}
                                    {equipment.brightness && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Brightness:</span>
                                            <span>{equipment.brightness}</span>
                                        </div>
                                    )}
                                    {equipment.lamp_hours && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Lamp Hours:</span>
                                            <span>{equipment.lamp_hours}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {equipment.category === 'microscope' && (
                                <>
                                    {equipment.magnification && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Magnification:</span>
                                            <span>{equipment.magnification}</span>
                                        </div>
                                    )}
                                    {equipment.objective_lenses && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Objective Lenses:</span>
                                            <span>{equipment.objective_lenses}</span>
                                        </div>
                                    )}
                                    {equipment.illumination && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Illumination:</span>
                                            <span>{equipment.illumination}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {equipment.category === 'lab_equipment' && (
                                <>
                                    {equipment.capacity && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Capacity:</span>
                                            <span>{equipment.capacity}</span>
                                        </div>
                                    )}
                                    {equipment.power_rating && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Power Rating:</span>
                                            <span>{equipment.power_rating}</span>
                                        </div>
                                    )}
                                    {equipment.temperature_range && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Temperature Range:</span>
                                            <span>{equipment.temperature_range}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {equipment.category === 'printer' && (
                                <>
                                    {equipment.print_type && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Print Type:</span>
                                            <span>{equipment.print_type}</span>
                                        </div>
                                    )}
                                    {equipment.print_speed && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Print Speed:</span>
                                            <span>{equipment.print_speed}</span>
                                        </div>
                                    )}
                                    {equipment.connectivity && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Connectivity:</span>
                                            <span>{equipment.connectivity}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            {equipment.category === 'network' && (
                                <>
                                    {equipment.ports && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Ports:</span>
                                            <span>{equipment.ports}</span>
                                        </div>
                                    )}
                                    {equipment.speed && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Speed:</span>
                                            <span>{equipment.speed}</span>
                                        </div>
                                    )}
                                    {equipment.protocol && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Protocol:</span>
                                            <span>{equipment.protocol}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Purchase & Warranty Information */}
                    <div className="bg-white rounded shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Purchase & Warranty Information</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-medium">Purchase Date:</span>
                                <span>{equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Purchase Price:</span>
                                <span>₹{equipment.purchase_price ? equipment.purchase_price.toLocaleString() : 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Current Value:</span>
                                <span>₹{equipment.current_value ? equipment.current_value.toLocaleString() : 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Warranty Expiry:</span>
                                <span className={`${equipment.warranty_expiry && new Date(equipment.warranty_expiry) < new Date() ? 'text-red-600' : ''}`}>
                                    {equipment.warranty_expiry ? new Date(equipment.warranty_expiry).toLocaleDateString() : 'Not specified'}
                                    {equipment.warranty_expiry && new Date(equipment.warranty_expiry) < new Date() && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Expired</span>
                                    )}
                                </span>
                            </div>
                            {equipment.stock_register_page && (
                                <div className="flex justify-between">
                                    <span className="font-medium">Stock Register Page:</span>
                                    <span>{equipment.stock_register_page}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Actions</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                onClick={() => {
                                    // Navigate to equipment inventory with edit mode
                                    navigate('/equipment', { 
                                        state: { 
                                            editEquipment: equipment,
                                            shouldOpenEditModal: true 
                                        } 
                                    });
                                }}
                            >
                                Edit Equipment
                            </button>
                            <button 
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                                onClick={() => {
                                    navigate('/bookings/create', { 
                                        state: { 
                                            selectedEquipment: equipment,
                                            equipmentId: equipment.id,
                                            equipmentName: equipment.name
                                        } 
                                    });
                                }}
                                disabled={equipment.status === 'Out of Order' || equipment.status === 'Under Maintenance'}
                            >
                                Book Equipment
                            </button>
                            <button 
                                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                                onClick={() => {
                                    navigate('/maintenance/create', { 
                                        state: { 
                                            equipmentId: equipment.id,
                                            equipmentName: equipment.name 
                                        } 
                                    });
                                }}
                            >
                                Request Maintenance
                            </button>
                            <button 
                                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
                                onClick={() => {
                                    navigate(`/equipment/${equipment.id}/history`);
                                }}
                            >
                                View History
                            </button>
                            <button 
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                onClick={() => navigate(-1)}
                            >
                                Back to Inventory
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EquipmentDetails