import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import {
  Activity,
  BookOpen,
  ChevronRight,
  Clock,
  Download,
  Home,
  Library,
  LogOut,
  Menu,
  Scan,
  Settings,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  permission?: string;
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Libraries',
      path: '/dashboard/libraries',
      icon: <Library className="h-5 w-5" />,
      permission: 'ManageLibraries',
    },
    {
      name: 'Downloads',
      path: '/dashboard/downloads',
      icon: <Download className="h-5 w-5" />,
      badge: 3, // This would come from state
      permission: 'DownloadBooks',
    },
    {
      name: 'Scans',
      path: '/dashboard/scans',
      icon: <Scan className="h-5 w-5" />,
      permission: 'ManageScans',
    },
    {
      name: 'Activity',
      path: '/dashboard/activity',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      name: 'Jobs',
      path: '/dashboard/jobs',
      icon: <Clock className="h-5 w-5" />,
      permission: 'ManageJobs',
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg
          transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">AudioBook DL</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight
                className={`h-5 w-5 text-gray-500 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'User'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2 rounded-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2 rounded-lg
                transition-colors duration-200 mb-2
                ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="
                w-full flex items-center space-x-3 px-3 py-2 rounded-lg
                text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-200
              "
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`
          transition-all duration-200 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
        `}
      >
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
