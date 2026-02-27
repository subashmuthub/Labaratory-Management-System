// Excel Export Service - Real Data Only
import { apiCall } from './api';

class ExcelExportService {
    // Export report data to Excel - Only real data from database
    async exportToExcel(reportData, fileName = 'lab_report') {
        try {
            // Ensure we're only exporting real data
            if (!reportData || !reportData.equipment_details || reportData.equipment_details.length === 0) {
                throw new Error('No real data available to export. Please ensure you have actual lab equipment data.');
            }

            // Make API call to backend Excel export endpoint
            const response = await fetch('/api/reports/export-excel', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportData,
                    fileName
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export Excel file');
            }

            // Get the file blob
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.xlsx`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return {
                success: true,
                message: 'Excel file exported successfully with real data only'
            };

        } catch (error) {
            console.error('Excel export error:', error);
            return {
                success: false,
                message: error.message || 'Failed to export Excel file'
            };
        }
    }

    // Export specific equipment inventory to Excel
    async exportInventoryToExcel(labId = null) {
        try {
            // Get real inventory data from API
            const inventoryResponse = await apiCall('/api/reports/inventory', {
                method: 'POST',
                body: JSON.stringify({ 
                    lab_id: labId,
                    include_usage_stats: true 
                })
            });

            if (!inventoryResponse.success) {
                throw new Error('Failed to fetch inventory data');
            }

            if (!inventoryResponse.data.equipment_details || inventoryResponse.data.equipment_details.length === 0) {
                throw new Error('No equipment found in your lab database. Please add equipment first.');
            }

            // Export to Excel
            return await this.exportToExcel(inventoryResponse.data, 'equipment_inventory');

        } catch (error) {
            console.error('Inventory export error:', error);
            return {
                success: false,
                message: error.message || 'Failed to export inventory'
            };
        }
    }

    // Export usage analytics to Excel
    async exportUsageAnalyticsToExcel(dateRange = null) {
        try {
            // Get real usage data from API
            const usageResponse = await apiCall('/api/reports/usage-analytics', {
                method: 'POST',
                body: JSON.stringify({ 
                    date_range: dateRange,
                    detailed_analysis: true 
                })
            });

            if (!usageResponse.success) {
                throw new Error('Failed to fetch usage analytics');
            }

            if (!usageResponse.data.equipment_details || usageResponse.data.equipment_details.length === 0) {
                throw new Error('No usage data found. Equipment must be booked and used to generate analytics.');
            }

            // Export to Excel
            return await this.exportToExcel(usageResponse.data, 'usage_analytics');

        } catch (error) {
            console.error('Usage analytics export error:', error);
            return {
                success: false,
                message: error.message || 'Failed to export usage analytics'
            };
        }
    }

    // Export maintenance reports to Excel
    async exportMaintenanceToExcel() {
        try {
            // Get real maintenance data from API
            const maintenanceResponse = await apiCall('/api/reports/performance', {
                method: 'POST',
                body: JSON.stringify({ 
                    include_maintenance: true,
                    performance_metrics: true 
                })
            });

            if (!maintenanceResponse.success) {
                throw new Error('Failed to fetch maintenance data');
            }

            if (!maintenanceResponse.data.equipment_details || maintenanceResponse.data.equipment_details.length === 0) {
                throw new Error('No maintenance records found. Please perform equipment maintenance first.');
            }

            // Export to Excel
            return await this.exportToExcel(maintenanceResponse.data, 'maintenance_report');

        } catch (error) {
            console.error('Maintenance export error:', error);
            return {
                success: false,
                message: error.message || 'Failed to export maintenance report'
            };
        }
    }

    // Validate data before export (ensure no mock data)
    validateRealData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check for mock data indicators
        const mockIndicators = [
            'mock', 'sample', 'test', 'demo', 'example',
            'Mock', 'Sample', 'Test', 'Demo', 'Example'
        ];

        const dataString = JSON.stringify(data).toLowerCase();
        
        // If any mock indicators are found, reject the data
        return !mockIndicators.some(indicator => 
            dataString.includes(indicator.toLowerCase())
        );
    }
}

// Export singleton instance
export const excelExportService = new ExcelExportService();
export default excelExportService;