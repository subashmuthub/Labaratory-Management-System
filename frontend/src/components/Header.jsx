import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Header() {
    const location = useLocation()
    const { logout, user } = useAuth()

    const handleLogout = () => {
        console.log('🖱️ Header: Logout button clicked');
        logout();
    }

    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Title */}
                    <Link to="/dashboard" className="flex items-center space-x-3 hover:text-blue-200 transition-colors">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">LAB</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">LabMS</h1>
                            <p className="text-xs text-blue-200">Laboratory Management System</p>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex space-x-6">
                        <Link
                            to="/dashboard"
                            className={`hover:text-blue-200 transition-colors ${location.pathname === '/dashboard' ? 'text-blue-200 border-b-2 border-blue-200' : ''
                                }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/equipment"
                            className={`hover:text-blue-200 transition-colors ${location.pathname === '/equipment' ? 'text-blue-200 border-b-2 border-blue-200' : ''
                                }`}
                        >
                            Equipment
                        </Link>
                        <Link
                            to="/maintenance"
                            className={`hover:text-blue-200 transition-colors ${location.pathname === '/maintenance' ? 'text-blue-200 border-b-2 border-blue-200' : ''
                                }`}
                        >
                            Maintenance
                        </Link>
                        <Link
                            to="/reports"
                            className={`hover:text-blue-200 transition-colors ${location.pathname === '/reports' ? 'text-blue-200 border-b-2 border-blue-200' : ''
                                }`}
                        >
                            Reports
                        </Link>
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm">Welcome, {user?.name || 'User'}</span>
                        <button 
                            onClick={handleLogout}
                            className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header