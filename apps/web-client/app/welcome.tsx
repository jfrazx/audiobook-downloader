import { Link } from 'react-router';
import { BookOpen, Download, Activity, Users, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import type { WelcomeProps } from './types/auth.types';

export default function Welcome({
  title,
  subtitle = 'Download, organize, and enjoy your favorite audiobooks',
  showLoginButton = true,
  className = '',
}: WelcomeProps) {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}
    >
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Auth Status Header */}
        {isAuthenticated && user && (
          <div className="flex justify-between items-center mb-8 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Welcome back,</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {user.displayName || user.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="
                flex items-center px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400
                hover:text-slate-900 dark:hover:text-white transition-colors duration-200
              "
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        )}

        {/* Main Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4">
            <span className="block text-2xl md:text-3xl font-light text-slate-600 dark:text-slate-400 mb-2">
              Hello there,
            </span>
            Welcome to {title} 👋
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            title="Library Management"
            description="Connect and manage multiple library accounts in one place."
            bgColor="bg-blue-100 dark:bg-blue-900"
          />

          <FeatureCard
            icon={<Download className="h-6 w-6 text-green-600 dark:text-green-400" />}
            title="Automated Downloads"
            description="Automatically download and process your audiobook loans."
            bgColor="bg-green-100 dark:bg-green-900"
          />

          <FeatureCard
            icon={<Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            title="Activity Monitoring"
            description="Track downloads, scans, and library activity in real-time."
            bgColor="bg-purple-100 dark:bg-purple-900"
          />
        </div>

        {/* CTA Section */}
        {!isAuthenticated && showLoginButton && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center text-white mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-purple-100 mb-8 text-lg">
              Sign in to access your audiobook library and start managing your collection.
            </p>
            <Link
              to="/login"
              className="
                inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold
                rounded-xl hover:bg-purple-50 transition-colors duration-200
                transform hover:scale-105 active:scale-95
              "
            >
              <Users className="h-5 w-5 mr-2" />
              Sign In Now
            </Link>
          </div>
        )}

        {/* Dashboard Preview for Authenticated Users */}
        {isAuthenticated && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              Your Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
              Manage your libraries, view recent activity, and access your audiobook collection.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <DashboardCard
                title="Libraries"
                value="2"
                description="Connected accounts"
                color="text-blue-600 dark:text-blue-400"
              />
              <DashboardCard
                title="Downloads"
                value="12"
                description="This month"
                color="text-green-600 dark:text-green-400"
              />
              <DashboardCard
                title="Scans"
                value="3"
                description="Recent activity"
                color="text-purple-600 dark:text-purple-400"
              />
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Dashboard functionality coming in Phase 2
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center">
            Made with
            <span className="mx-1 text-red-500" role="img" aria-label="heart">
              ♥
            </span>
            for audiobook enthusiasts
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
}

function FeatureCard({ icon, title, description, bgColor }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm">{description}</p>
    </div>
  );
}

// Dashboard Card Component
interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  color: string;
}

function DashboardCard({ title, value, description, color }: DashboardCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
      <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</h4>
      <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
