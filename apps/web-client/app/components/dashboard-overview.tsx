import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  Library,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  libraries: {
    total: number;
    active: number;
    trend: number;
  };

  downloads: {
    total: number;
    inProgress: number;
    completed: number;
    failed: number;
    trend: number;
  };

  scans: {
    recent: number;
    scheduled: number;
    trend: number;
  };

  jobs: {
    pending: number;
    running: number;
    completed: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'download' | 'scan' | 'library' | 'job';
  title: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  description?: string;
}

export function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    libraries: { total: 2, active: 2, trend: 0 },
    downloads: { total: 48, inProgress: 3, completed: 42, failed: 3, trend: 12 },
    scans: { recent: 5, scheduled: 2, trend: -2 },
    jobs: { pending: 4, running: 1, completed: 23 },
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'download',
      title: 'Downloaded "The Martian" by Andy Weir',
      status: 'success',
      timestamp: '2 hours ago',
      description: 'Successfully processed 15 audio files',
    },
    {
      id: '2',
      type: 'scan',
      title: 'Library scan completed',
      status: 'info',
      timestamp: '4 hours ago',
      description: 'Found 3 new audiobooks available',
    },
    {
      id: '3',
      type: 'download',
      title: 'Download failed for "Project Hail Mary"',
      status: 'error',
      timestamp: '6 hours ago',
      description: 'License verification failed',
    },
    {
      id: '4',
      type: 'library',
      title: 'Connected to Seattle Public Library',
      status: 'success',
      timestamp: '1 day ago',
    },
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.displayName || user?.username || 'User'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's an overview of your audiobook library activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Libraries"
          value={stats.libraries.total}
          subtext={`${stats.libraries.active} active`}
          icon={<Library className="h-6 w-6" />}
          trend={stats.libraries.trend}
          color="blue"
        />

        <StatCard
          title="Downloads"
          value={stats.downloads.total}
          subtext={`${stats.downloads.inProgress} in progress`}
          icon={<Download className="h-6 w-6" />}
          trend={stats.downloads.trend}
          color="green"
        />

        <StatCard
          title="Recent Scans"
          value={stats.scans.recent}
          subtext={`${stats.scans.scheduled} scheduled`}
          icon={<Activity className="h-6 w-6" />}
          trend={stats.scans.trend}
          color="purple"
        />

        <StatCard
          title="Active Jobs"
          value={stats.jobs.pending + stats.jobs.running}
          subtext={`${stats.jobs.completed} completed`}
          icon={<Clock className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <QuickActionButton
                icon={<Library className="h-5 w-5" />}
                label="Add Library"
                onClick={() => console.log('Add library')}
              />
              <QuickActionButton
                icon={<Activity className="h-5 w-5" />}
                label="Scan All Libraries"
                onClick={() => console.log('Scan libraries')}
              />
              <QuickActionButton
                icon={<Download className="h-5 w-5" />}
                label="View Downloads"
                onClick={() => console.log('View downloads')}
              />
              <QuickActionButton
                icon={<BookOpen className="h-5 w-5" />}
                label="Browse Catalog"
                onClick={() => console.log('Browse catalog')}
              />
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Status</h2>
            </div>
            <div className="p-6 space-y-3">
              <StatusItem label="API Server" status="operational" />
              <StatusItem label="Task Queue" status="operational" />
              <StatusItem label="Download Service" status="degraded" />
              <StatusItem label="Database" status="operational" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  trend?: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, subtext, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const statusIcons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Activity className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">{statusIcons[activity.status]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
        {activity.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activity.description}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.timestamp}</p>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        w-full flex items-center space-x-3 px-4 py-3 rounded-lg
        bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
        text-gray-700 dark:text-gray-300 transition-colors duration-200
      "
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Status Item Component
function StatusItem({ label, status }: { label: string; status: 'operational' | 'degraded' | 'down' }) {
  const statusColors = {
    operational: 'bg-green-500',
    degraded: 'bg-yellow-500',
    down: 'bg-red-500',
  };

  const statusLabels = {
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{statusLabels[status]}</span>
      </div>
    </div>
  );
}

export default DashboardOverview;
