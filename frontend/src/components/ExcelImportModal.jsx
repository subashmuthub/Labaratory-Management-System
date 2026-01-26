// ExcelImportModal.jsx - Excel Import with Drag & Drop
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { apiConfig } from '../config/api'

const ExcelImportModal = ({ isOpen, onClose, onImportComplete, labs, token }) => {
    const [file, setFile] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [previewData, setPreviewData] = useState([])
    const [validationResults, setValidationResults] = useState([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [currentStep, setCurrentStep] = useState(1) // 1: Upload, 2: Preview, 3: Processing
    
    const fileInputRef = useRef(null)

    // Equipment categories and their required fields
    const equipmentCategories = {
        computer: ['name', 'serial_number', 'category', 'lab_id'],
        projector: ['name', 'serial_number', 'category', 'lab_id'],
        printer: ['name', 'serial_number', 'category', 'lab_id'],
        microscope: ['name', 'serial_number', 'category', 'lab_id'],
        lab_equipment: ['name', 'serial_number', 'category', 'lab_id'],
        network_equipment: ['name', 'serial_number', 'category', 'lab_id']
    }

    // Generate template data in the new format
    const generateSampleData = () => {
        return [
        {
            'S.No': 1,
            'Equipments': 'Desktop System',
            'Make': 'ACER',
            'System Description': 'Core i5-2320 2nd Gen / 4GB/500GB/18.5"',
            'Qty': 7,
            'Cost in Rs': '1,80,250 (7*25,750)',
            'Date of Purchase': '08.11.2011',
            'Stock Register Page No': 20
        },
        {
            'S.No': 2,
            'Equipments': 'Pen Tablet',
            'Make': 'Wacom One',
            'System Description': 'Wacom One Display Pen Tablet',
            'Qty': 2,
            'Cost in Rs': '63,998 (2*31,999)',
            'Date of Purchase': '28.09.2020',
            'Stock Register Page No': 37
        },
        {
            'S.No': 3,
            'Equipments': 'Printer',
            'Make': 'HP',
            'System Description': 'HP LaserJet – M1005 Printer',
            'Qty': 1,
            'Cost in Rs': '12,700',
            'Date of Purchase': '26.10.2015',
            'Stock Register Page No': 30
        },
        {
            'S.No': 4,
            'Equipments': 'Projector',
            'Make': 'BenQ',
            'System Description': 'Benq Projector LW550',
            'Qty': 1,
            'Cost in Rs': '49,664',
            'Date of Purchase': '01.03.2024',
            'Stock Register Page No': 44
        },
        {
            'S.No': 5,
            'Equipments': 'Interactive Display',
            'Make': 'BenQ',
            'System Description': 'Benq Projector Interactive Flat Panel RE 7504',
            'Qty': 1,
            'Cost in Rs': '1,46,434',
            'Date of Purchase': '18.10.2024',
            'Stock Register Page No': 45
        }
    ]
    }

    const handleDragEnter = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileSelection(files[0])
        }
    }

    const handleFileSelection = (selectedFile) => {
        if (!selectedFile) return

        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ]

        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Please select a valid Excel file (.xlsx, .xls) or CSV file')
            return
        }

        setFile(selectedFile)
        setError('')
        processFile(selectedFile)
    }

    const processFile = async (selectedFile) => {
        try {
            setCurrentStep(2)
            setUploadProgress(20)

            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    setUploadProgress(50)
                    const data = new Uint8Array(e.target.result)
                    const workbook = XLSX.read(data, { type: 'array' })
                    
                    // Get first sheet
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    
                    // Convert to JSON
                    let jsonData = XLSX.utils.sheet_to_json(worksheet)
                    
                    setUploadProgress(80)
                    
                    if (jsonData.length === 0) {
                        setError('The Excel file appears to be empty')
                        return
                    }

                    // Transform data to match our database schema
                    jsonData = transformExcelData(jsonData)

                    // Validate data
                    const validation = validateData(jsonData)
                    setPreviewData(jsonData.slice(0, 10)) // Show first 10 rows for preview
                    setValidationResults(validation)
                    setUploadProgress(100)

                } catch (error) {
                    console.error('Error processing file:', error)
                    setError('Error reading file. Please ensure it\'s a valid Excel file.')
                }
            }

            reader.readAsArrayBuffer(selectedFile)
        } catch (error) {
            console.error('File processing error:', error)
            setError('Failed to process file')
        }
    }

    // Transform Excel data to match database schema
    const transformExcelData = (rawData) => {
        return rawData.map((row, index) => {
            // Check if it's the new format (S.No, Equipments, Make, etc.)
            if (row['S.No'] && row['Equipments'] && row['Make']) {
                // Parse cost (handle Indian number format with commas)
                let cost = 0
                let quantity = row['Qty'] || 1
                if (row['Cost in Rs']) {
                    try {
                        // Extract the main cost amount (first number sequence before parentheses)
                        // Handle formats like "12,87,475 (25*51,499)" or "63,998 (2*31,999)"
                        const costStr = String(row['Cost in Rs'])
                        const match = costStr.match(/^([0-9,]+)/)
                        if (match) {
                            const numericPart = match[1].replace(/,/g, '')
                            cost = parseFloat(numericPart) || 0
                        }
                    } catch (error) {
                        console.warn('Error parsing cost:', row['Cost in Rs'], error)
                        cost = 0
                    }
                }

                // Ensure quantity is at least 1
                quantity = Math.max(1, parseInt(quantity) || 1)

                // Parse date (DD.MM.YYYY format)
                let purchaseDate = null
                if (row['Date of Purchase']) {
                    const dateStr = String(row['Date of Purchase'])
                    const dateParts = dateStr.split('.')
                    if (dateParts.length === 3) {
                        // Convert DD.MM.YYYY to YYYY-MM-DD
                        purchaseDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
                    }
                }

                // Determine category based on equipment type
                const equipmentType = String(row['Equipments']).toLowerCase()
                let category = 'lab_equipment' // default
                if (equipmentType.includes('desktop') || equipmentType.includes('computer')) {
                    category = 'computer'
                } else if (equipmentType.includes('projector') || equipmentType.includes('display')) {
                    category = 'projector'
                } else if (equipmentType.includes('printer')) {
                    category = 'printer'
                } else if (equipmentType.includes('network') || equipmentType.includes('switch')) {
                    category = 'network_equipment'
                } else if (equipmentType.includes('microscope')) {
                    category = 'microscope'
                }

                // Generate serial number if not provided
                const timestamp = new Date().getTime().toString().slice(-4)
                const serialNumber = `${String(row['Make']).toUpperCase()}-${String(row['S.No']).padStart(3, '0')}-${new Date().getFullYear()}-${timestamp}`

                return {
                    name: row['Equipments'] && row['Make'] ? `${row['Equipments']} ${row['Make']}` : 'Unknown Equipment',
                    description: row['System Description'] || '',
                    serial_number: serialNumber,
                    model: row['System Description'] || '',
                    manufacturer: row['Make'] || '',
                    category: category,
                    lab_id: labs && labs.length > 0 ? labs[0].id : 1, // Use first available lab or default to 1
                    location_details: '',
                    status: 'available',
                    condition_status: 'good',
                    purchase_price: Math.floor(cost / quantity), // Divide total cost by quantity
                    current_value: Math.floor((cost / quantity) * 0.8), // Estimate 80% of per-unit price
                    purchase_date: purchaseDate,
                    warranty_expiry: null,
                    quantity: quantity,
                    stock_register_page: row['Stock Register Page No'] ? String(row['Stock Register Page No']) : ''
                }
            } else {
                // Original format - return as is but ensure required fields
                return {
                    name: row.name || row.Equipments || 'Unknown Equipment',
                    description: row.description || row['System Description'] || '',
                    serial_number: row.serial_number || `AUTO-${index + 1}`,
                    model: row.model || '',
                    manufacturer: row.manufacturer || row.Make || '',
                    category: row.category || 'lab_equipment',
                    lab_id: row.lab_id || (labs && labs.length > 0 ? labs[0].id : 8),
                    location_details: row.location_details || '',
                    status: row.status || 'available',
                    condition_status: row.condition_status || 'good',
                    purchase_price: row.purchase_price || 0,
                    current_value: row.current_value || 0,
                    purchase_date: row.purchase_date || null,
                    warranty_expiry: row.warranty_expiry || null,
                    ...row // Include any additional fields
                }
            }
        })
    }

    const validateData = (data) => {
        const results = []
        
        data.forEach((row, index) => {
            const errors = []
            const warnings = []

            // Check required fields
            if (!row.name || row.name.trim() === '') {
                errors.push('Name is required')
            }
            if (!row.serial_number || row.serial_number.trim() === '') {
                warnings.push('Serial number will be auto-generated')
            }
            if (!row.category || row.category.trim() === '') {
                errors.push('Category is required')
            } else if (!equipmentCategories[row.category]) {
                errors.push(`Invalid category: ${row.category}`)
            }
            if (!row.lab_id) {
                warnings.push('Lab ID will default to 1 (can be changed later)')
            } else {
                const labExists = labs && labs.find(lab => lab.id === parseInt(row.lab_id))
                if (labs && labs.length > 0 && !labExists) {
                    errors.push(`Lab with ID ${row.lab_id} not found`)
                }
            }

            // Check optional but important fields
            if (!row.manufacturer) warnings.push('Manufacturer not specified')
            if (!row.model) warnings.push('Model not specified')
            if (!row.description) warnings.push('Description not provided')

            // Validate status values
            const validStatuses = ['available', 'in_use', 'maintenance', 'broken', 'retired']
            if (row.status && !validStatuses.includes(row.status)) {
                errors.push(`Invalid status: ${row.status}. Must be one of: ${validStatuses.join(', ')}`)
            }

            // Validate condition status
            const validConditions = ['excellent', 'good', 'fair', 'poor']
            if (row.condition_status && !validConditions.includes(row.condition_status)) {
                errors.push(`Invalid condition: ${row.condition_status}. Must be one of: ${validConditions.join(', ')}`)
            }

            // Validate dates
            if (row.purchase_date && row.purchase_date !== null) {
                const date = new Date(row.purchase_date)
                if (isNaN(date.getTime())) {
                    warnings.push('Invalid purchase date format - will use current date')
                }
            }
            if (row.warranty_expiry && row.warranty_expiry !== null) {
                const date = new Date(row.warranty_expiry)
                if (isNaN(date.getTime())) {
                    warnings.push('Invalid warranty expiry date format')
                }
            }

            // Validate purchase price
            if (row.purchase_price && isNaN(parseFloat(row.purchase_price))) {
                warnings.push('Purchase price should be a number')
            }

            results.push({
                row: index + 1,
                data: row,
                errors,
                warnings,
                isValid: errors.length === 0
            })
        })

        return results
    }

    const handleImport = async () => {
        try {
            setIsUploading(true)
            setCurrentStep(3)
            setUploadProgress(0)
            setError('')

            const validRows = validationResults.filter(result => result.isValid)
            
            if (validRows.length === 0) {
                setError('No valid rows to import. Please fix the errors and try again.')
                setIsUploading(false)
                return
            }

            // Prepare equipment data for bulk import
            const equipmentData = validRows.map(validationResult => ({
                ...validationResult.data,
                lab_id: parseInt(validationResult.data.lab_id),
                purchase_price: validationResult.data.purchase_price ? parseFloat(validationResult.data.purchase_price) : null,
                current_value: validationResult.data.current_value ? parseFloat(validationResult.data.current_value) : null,
                status: validationResult.data.status || 'available',
                condition_status: validationResult.data.condition_status || 'good'
            }))

            setUploadProgress(25)

            console.log('Sending equipment data:', {
                count: equipmentData.length,
                sample: equipmentData[0],
                url: `${apiConfig.baseURL}/equipment/bulk-import`
            })

            // Call bulk import endpoint
            const response = await fetch(`${apiConfig.baseURL}/equipment/bulk-import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ equipmentData })
            })

            setUploadProgress(75)

            const result = await response.json()
            console.log('Import response:', result)
            console.log('Response status:', response.status)
            console.log('Response OK:', response.ok)

            setUploadProgress(100)

            if (response.ok && result.success) {
                setSuccess(`Successfully imported ${result.data.success} equipment items!`)
                if (result.data.failed > 0) {
                    setError(`${result.data.failed} items failed to import:\n${result.data.errors.join('\n')}`)
                }
                
                // Wait a moment before closing to show success message
                setTimeout(() => {
                    onImportComplete()
                }, 1500)
            } else {
                const errorMsg = result.message || 'Import failed. Please try again.'
                const detailedErrors = result.data?.errors ? `\n\nDetails:\n${result.data.errors.slice(0, 5).join('\n')}` : ''
                setError(errorMsg + detailedErrors)
                console.error('Import failed:', result)
            }

        } catch (error) {
            console.error('Import error:', error)
            setError(`Import failed: ${error.message || 'Please try again.'}`)
        } finally {
            setIsUploading(false)
        }
    }

    const downloadTemplate = () => {
        const sampleData = generateSampleData()
        const ws = XLSX.utils.json_to_sheet(sampleData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Equipment Template')
        XLSX.writeFile(wb, 'equipment_template.xlsx')
    }

    const resetModal = () => {
        setFile(null)
        setPreviewData([])
        setValidationResults([])
        setError('')
        setSuccess('')
        setUploadProgress(0)
        setCurrentStep(1)
        setIsUploading(false)
    }

    const handleClose = () => {
        resetModal()
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">📊 Import Equipment from Excel</h2>
                        <p className="text-blue-100 text-sm">Upload Excel file to bulk import equipment data</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                                1
                            </div>
                            <span className="ml-2 font-medium">Upload File</span>
                        </div>
                        <div className="flex-1 h-1 mx-4 bg-gray-300">
                            <div className={`h-full transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} style={{width: currentStep >= 2 ? '100%' : '0%'}}></div>
                        </div>
                        <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                                2
                            </div>
                            <span className="ml-2 font-medium">Preview & Validate</span>
                        </div>
                        <div className="flex-1 h-1 mx-4 bg-gray-300">
                            <div className={`h-full transition-all duration-300 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} style={{width: currentStep >= 3 ? '100%' : '0%'}}></div>
                        </div>
                        <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                                3
                            </div>
                            <span className="ml-2 font-medium">Import</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Step 1: Upload */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {/* Download Template */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-blue-900">📥 Download Template</h3>
                                        <p className="text-blue-700 text-sm">Get the Excel template with sample data and required columns</p>
                                    </div>
                                    <button
                                        onClick={downloadTemplate}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Download Template
                                    </button>
                                </div>
                            </div>

                            {/* Drag & Drop Area */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    isDragging 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                }`}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <div className="space-y-4">
                                    <div className="text-6xl">📁</div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                                        </h3>
                                        <p className="text-gray-600">or click to browse</p>
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Choose File
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => handleFileSelection(e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* File Requirements */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2">📋 File Requirements</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Supported formats: .xlsx, .xls, .csv</li>
                                    <li>• Required columns: name, serial_number, category, lab_id</li>
                                    <li>• Optional columns: description, model, manufacturer, status, etc.</li>
                                    <li>• Maximum file size: 10MB</li>
                                    <li>• Maximum rows: 1000</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview & Validation */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold">📋 Data Preview & Validation</h3>
                                <div className="text-sm text-gray-600">
                                    File: {file?.name} ({previewData.length} rows shown)
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {uploadProgress < 100 && (
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}

                            {/* Validation Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {validationResults.filter(r => r.isValid).length}
                                    </div>
                                    <div className="text-green-700 text-sm">Valid Rows</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-red-600">
                                        {validationResults.filter(r => !r.isValid).length}
                                    </div>
                                    <div className="text-red-700 text-sm">Invalid Rows</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {validationResults.reduce((acc, r) => acc + r.warnings.length, 0)}
                                    </div>
                                    <div className="text-yellow-700 text-sm">Warnings</div>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Row</th>
                                                <th className="px-3 py-2 text-left">Status</th>
                                                <th className="px-3 py-2 text-left">Name</th>
                                                <th className="px-3 py-2 text-left">Serial Number</th>
                                                <th className="px-3 py-2 text-left">Category</th>
                                                <th className="px-3 py-2 text-left">Lab ID</th>
                                                <th className="px-3 py-2 text-left">Issues</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validationResults.slice(0, 10).map((result, index) => (
                                                <tr key={index} className={`border-t ${result.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                                                    <td className="px-3 py-2">{result.row}</td>
                                                    <td className="px-3 py-2">
                                                        {result.isValid ? (
                                                            <span className="text-green-600">✅ Valid</span>
                                                        ) : (
                                                            <span className="text-red-600">❌ Invalid</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">{result.data.name || '—'}</td>
                                                    <td className="px-3 py-2">{result.data.serial_number || '—'}</td>
                                                    <td className="px-3 py-2">{result.data.category || '—'}</td>
                                                    <td className="px-3 py-2">{result.data.lab_id || '—'}</td>
                                                    <td className="px-3 py-2">
                                                        {result.errors.length > 0 && (
                                                            <div className="text-red-600 text-xs">
                                                                {result.errors.join(', ')}
                                                            </div>
                                                        )}
                                                        {result.warnings.length > 0 && (
                                                            <div className="text-yellow-600 text-xs">
                                                                {result.warnings.join(', ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Import Progress */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-bold mb-4">🚀 Importing Equipment Data</h3>
                                
                                {/* Animated Progress Circle */}
                                <div className="relative w-32 h-32 mx-auto mb-6">
                                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            stroke="#3b82f6"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={314}
                                            strokeDashoffset={314 - (314 * uploadProgress) / 100}
                                            className="transition-all duration-300"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-blue-600">{uploadProgress}%</span>
                                    </div>
                                </div>

                                <p className="text-gray-600">
                                    {isUploading ? 'Processing equipment data...' : 'Import completed!'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-red-600 mr-2">❌</span>
                                <div className="text-red-700 whitespace-pre-line">{error}</div>
                            </div>
                        </div>
                    )}

                    {/* Success Messages */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <span className="text-green-600 mr-2">✅</span>
                                <div className="text-green-700">{success}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <div className="space-x-3">
                        {currentStep === 2 && (
                            <button
                                onClick={() => {
                                    resetModal()
                                    setCurrentStep(1)
                                }}
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                                disabled={isUploading}
                            >
                                Upload Different File
                            </button>
                        )}
                        {currentStep === 2 && validationResults.filter(r => r.isValid).length > 0 && (
                            <button
                                onClick={handleImport}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                disabled={isUploading}
                            >
                                Import {validationResults.filter(r => r.isValid).length} Valid Items
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExcelImportModal