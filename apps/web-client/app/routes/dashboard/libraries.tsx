import { Library, Plus, Settings, Trash2, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface LibraryItem {
  id: string;
  name: string;
  hostname: string;
  cardNumber: string;
  status: 'connected' | 'error' | 'syncing';
  lastSync: string;
  bookCount: number;
  loanCount: number;
}

export default function LibrariesPage() {
  const [libraries] = useState<LibraryItem[]>([
    {
      id: '1',
      name: 'Seattle Public Library',
      hostname: 'seattle.overdrive.com',
      cardNumber: '****4567',
      status: 'connected',
      lastSync: '2 hours ago',
      bookCount: 142,
      loanCount: 5,
    },
    {
      id: '2',
      name: 'King County Library System',
      hostname: 'kcls.overdrive.com',
      cardNumber: '****8901',
      status: 'syncing',
      lastSync: '1 day ago',
      bookCount: 89,
      loanCount: 3,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Library Accounts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your connected library accounts and OverDrive access
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="
            flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg
            hover:bg-purple-700 transition-colors duration-200
          "
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Library
        </button>
      </div>

      {/* Libraries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {libraries.map((library) => (
          <LibraryCard key={library.id} library={library} />
        ))}
      </div>

      {/* Empty State */}
      {libraries.length === 0 && (
        <div className="text-center py-12">
          <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No libraries connected</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your library account to start downloading audiobooks
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="
              inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg
              hover:bg-purple-700 transition-colors duration-200
            "
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Library
          </button>
        </div>
      )}
    </div>
  );
}

// Library Card Component
function LibraryCard({ library }: { library: LibraryItem }) {
  const statusColors = {
    connected: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    error: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    syncing: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  };

  const statusIcons = {
    connected: <CheckCircle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    syncing: <RefreshCw className="h-4 w-4 animate-spin" />,
  };

  const statusLabels = {
    connected: 'Connected',
    error: 'Connection Error',
    syncing: 'Syncing',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Library className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{library.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{library.hostname}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Remove"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[library.status]}`}
        >
          {statusIcons[library.status]}
          <span>{statusLabels[library.status]}</span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Last sync: {library.lastSync}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Books</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{library.bookCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Loans</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{library.loanCount}</p>
        </div>
      </div>

      {/* Card Number */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Card Number</p>
        <p className="font-mono text-gray-900 dark:text-white">{library.cardNumber}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
          Scan Library
        </button>
        <button className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
