import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const RecentlyAccessed = ({ className = "", limit = 5 }) => {
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const API_BASE_URL = '/api';
    
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;
            
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/recent?limit=${limit}`, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    setRecentItems(result.data?.recentItems || []);
                }
            } catch (error) {
                console.error('Error fetching recent items:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [isAuthenticated, limit]);

    
    const handleItemClick = (item) => {
        // Navigate to the appropriate page based on item type
        const routes = {
            equipment: `/equipment/${item.id}`,
            lab: `/labs/${item.id}`,
            booking: `/bookings/${item.id}`,
            user: `/users/${item.id}`,
            maintenance: `/maintenance/${item.id}`,
            report: `/reports/${item.id}`
        };
        
        const route = routes[item.type];
        if (route) {
            navigate(route);
        }
    };
    
    const getItemIcon = (type) => {
        const icons = {
            equipment: '🖥️',
            lab: '🧪',
            booking: '📅',
            user: '👤',
            maintenance: '🔧',
            report: '📊'
        };
        return icons[type] || '📄';
    };
    
    const formatTimeAgo = (date) => {
        const now = new Date();
        const accessed = new Date(date);
        const diffInMinutes = Math.floor((now - accessed) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return accessed.toLocaleDateString();
    };
    
    const clearRecentItems = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/recent/clear`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                setRecentItems([]);
            }
        } catch (error) {
            console.error('Error clearing recent items:', error);
        }
    };
    
    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Recently Accessed
                </h3>
                {recentItems.length > 0 && (
                    <button
                        onClick={clearRecentItems}
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        title="Clear history"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                )}
            </div>
            
            {recentItems.length === 0 ? (
                <div className="text-center py-6">
                    <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-sm text-gray-500">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {recentItems.map((item, index) => (
                        <div
                            key={`${item.type}-${item.id}-${index}`}
                            onClick={() => handleItemClick(item)}
                            className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                            <span className="text-lg mr-3">{getItemIcon(item.type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                                    {item.name}
                                </p>
                                {item.description && (
                                    <p className="text-xs text-gray-500 truncate">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col items-end text-right">
                                <span className="text-xs text-gray-400">
                                    {formatTimeAgo(item.lastAccessed)}
                                </span>
                                {item.accessCount > 1 && (
                                    <span className="text-xs text-blue-500 font-medium">
                                        {item.accessCount}x
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {recentItems.length >= limit && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => navigate('/recent')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                        View all recent items →
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecentlyAccessed;