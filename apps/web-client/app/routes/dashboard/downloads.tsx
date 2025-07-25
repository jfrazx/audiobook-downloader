import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  X,
} from 'lucide-react';

interface DownloadItem {
  id: string;
  title: string;
  author: string;
  library: string;
  status: 'downloading' | 'queued' | 'completed' | 'failed' | 'paused';
  progress: number;

  size: {
    current: number;
    total: number;
  };

  speed?: number;
  eta?: string;
  error?: string;
}

export default function DownloadsPage() {
  const [downloads] = useState<DownloadItem[]>([
    {
      id: '1',
      title: 'The Martian',
      author: 'Andy Weir',
      library: 'Seattle Public Library',
      status: 'downloading',
      progress: 67,
      size: { current: 234, total: 350 },
      speed: 1.2,
      eta: '5 min',
    },
    {
      id: '2',
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      library: 'Seattle Public Library',
      status: 'queued',
      progress: 0,
      size: { current: 0, total: 420 },
    },
    {
      id: '3',
      title: 'Dune',
      author: 'Frank Herbert',
      library: 'King County Library System',
      status: 'completed',
      progress: 100,
      size: { current: 680, total: 680 },
    },
    {
      id: '4',
      title: 'Foundation',
      author: 'Isaac Asimov',
      library: 'King County Library System',
      status: 'failed',
      progress: 45,
      size: { current: 150, total: 330 },
      error: 'License verification failed',
    },
  ]);

  const activeDownloads = downloads.filter((d) => d.status === 'downloading' || d.status === 'paused');
  const queuedDownloads = downloads.filter((d) => d.status === 'queued');
  const completedDownloads = downloads.filter((d) => d.status === 'completed');
  const failedDownloads = downloads.filter((d) => d.status === 'failed');

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Downloads</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your audiobook downloads and queue</p>
      </div>

      {/* Download Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active"
          value={activeDownloads.length}
          icon={<Download className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          label="Queued"
          value={queuedDownloads.length}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          label="Completed"
          value={completedDownloads.length}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="Failed"
          value={failedDownloads.length}
          icon={<AlertCircle className="h-5 w-5" />}
          color="red"
        />
      </div>

      {/* Downloads List */}
      <div className="space-y-6">
        {/* Active Downloads */}
        {activeDownloads.length > 0 && <DownloadSection title="Active Downloads" items={activeDownloads} />}

        {/* Queued Downloads */}
        {queuedDownloads.length > 0 && <DownloadSection title="Queued" items={queuedDownloads} />}

        {/* Recent Downloads */}
        {(completedDownloads.length > 0 || failedDownloads.length > 0) && (
          <DownloadSection title="Recent" items={[...failedDownloads, ...completedDownloads].slice(0, 5)} />
        )}
      </div>

      {/* Empty State */}
      {downloads.length === 0 && (
        <div className="text-center py-12">
          <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No downloads yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Browse your library to start downloading audiobooks
          </p>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

// Download Section Component
function DownloadSection({ title, items }: { title: string; items: DownloadItem[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <DownloadCard key={item.id} download={item} />
        ))}
      </div>
    </div>
  );
}

// Download Card Component
function DownloadCard({ download }: { download: DownloadItem }) {
  const statusIcons = {
    downloading: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
    queued: <Clock className="h-5 w-5 text-yellow-600" />,
    completed: <CheckCircle className="h-5 w-5 text-green-600" />,
    failed: <AlertCircle className="h-5 w-5 text-red-600" />,
    paused: <Pause className="h-5 w-5 text-gray-600" />,
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          {statusIcons[download.status]}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{download.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {download.author} • {download.library}
            </p>
            {download.error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{download.error}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {download.status === 'downloading' && (
            <>
              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Pause className="h-4 w-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          {download.status === 'paused' && (
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Play className="h-4 w-4" />
            </button>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {(download.status === 'downloading' ||
        download.status === 'paused' ||
        download.status === 'failed') && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                download.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
              }`}
              style={{ width: `${download.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Download Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {formatBytes(download.size.current)} / {formatBytes(download.size.total)}
        </span>
        {download.status === 'downloading' && download.speed && (
          <span>
            {download.speed} MB/s • {download.eta} remaining
          </span>
        )}
        {download.status === 'completed' && <span>Completed</span>}
        {download.status === 'queued' && <span>Waiting in queue</span>}
      </div>
    </div>
  );
}
