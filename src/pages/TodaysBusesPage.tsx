import { useEffect, useState } from 'react';
import NavBar from './NavBar';

const PAGE_PASSWORD = "PASSWORD";

function BusIcon({ number, timestamp }: { number: string, timestamp?: string }) {
  let iconClass = "bus-icon ";
  let displayText = number;
  
  if (number === "Line 1") {
    iconClass += "bus-icon-line1";
    displayText = "1";
  } else if (number === "Line 2") {
    iconClass += "bus-icon-line2";
    displayText = "2";
  } else {
    const hasNumber = /\d/.test(number);
    iconClass += hasNumber ? "bus-icon-number" : "bus-icon-no-number";
  }
  
  return (
    <div className="group">
      <div className={`${iconClass} group-hover:scale-110 transition-all duration-300`}>
        <span className="text-white font-bold text-lg">{displayText}</span>
      </div>
      {timestamp && (
        <div className="text-center mt-2">
          <p className="text-white/60 text-xs">
            {new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
      )}
    </div>
  );
}

// Modal component for deletion confirmation
function DeleteBusModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  busEntry 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  busEntry: { busNumber: string; timestamp: string } | null;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PAGE_PASSWORD) {
      onConfirm();
      setPassword('');
      setError('');
      onClose();
    } else {
      setError('Incorrect password.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen || !busEntry) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🗑️</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete Bus Entry</h3>
          <p className="text-white/70 mb-4">
            Are you sure you want to delete <strong>{busEntry.busNumber}</strong> from{' '}
            {new Date(busEntry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}?
          </p>
          <p className="text-white/50 text-sm">Enter password to confirm deletion.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300"
            >
              🗑️ Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TodaysBusesPage() {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    busEntry: { busNumber: string; timestamp: string } | null;
    index: number;
  }>({
    isOpen: false,
    busEntry: null,
    index: -1
  });
  const [message, setMessage] = useState('');

  // Helper to load today's buses
  function loadBuses(currentDay: string) {
    const data = JSON.parse(localStorage.getItem('busLog') || '{}');
    const todaysEntries = data[currentDay] || [];
    setEntries(todaysEntries);
  }

  // Function to remove a specific bus by index
  function removeBus(index: number) {
    const data = JSON.parse(localStorage.getItem('busLog') || '{}');
    if (!data[today] || index < 0 || index >= data[today].length) {
      setMessage('Error: Invalid bus entry.');
      return;
    }
    
    const removedBus = data[today][index];
    data[today].splice(index, 1);
    localStorage.setItem('busLog', JSON.stringify(data));
    
    // Reload the entries
    loadBuses(today);
    setMessage(`Removed ${removedBus.busNumber} from ${new Date(removedBus.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  }

  // Handle opening delete modal
  function handleDeleteClick(entry: any, index: number) {
    setDeleteModal({
      isOpen: true,
      busEntry: entry,
      index: index
    });
  }

  // Handle closing delete modal
  function handleDeleteClose() {
    setDeleteModal({
      isOpen: false,
      busEntry: null,
      index: -1
    });
  }

  // Handle confirming deletion
  function handleDeleteConfirm() {
    if (deleteModal.index !== -1) {
      removeBus(deleteModal.index);
    }
  }

  useEffect(() => {
    loadBuses(today);
    // Set up timer to check for midnight
    const interval = setInterval(() => {
      const nowDay = new Date().toISOString().slice(0, 10);
      if (nowDay !== today) {
        setToday(nowDay);
        loadBuses(nowDay);
      }
    }, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [today]);

  const totalRides = entries.length;
  const uniqueBuses = [...new Set(entries.map(entry => entry.busNumber))].length;
  const firstRide = entries[0];
  const lastRide = entries[entries.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
      <NavBar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            📅 Today's Bus Rides
          </h1>
          <p className="text-xl text-white/70">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="card text-center">
            <div className="text-4xl mb-3">🚌</div>
            <h3 className="text-2xl font-bold text-white mb-2">{totalRides}</h3>
            <p className="text-white/70">Total Rides</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-3">🔢</div>
            <h3 className="text-2xl font-bold text-white mb-2">{uniqueBuses}</h3>
            <p className="text-white/70">Unique Buses</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {firstRide && lastRide ? 
                Math.round((new Date(lastRide.timestamp).getTime() - new Date(firstRide.timestamp).getTime()) / (1000 * 60 * 60)) + 'h' :
                '0h'
              }
            </h3>
            <p className="text-white/70">Duration</p>
          </div>
        </div>

        {/* Bus Rides Display */}
        {entries.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="card text-center py-16">
              <div className="text-6xl mb-6">🚌</div>
              <h3 className="text-2xl font-bold text-white mb-4">No buses recorded today</h3>
              <p className="text-white/70 mb-8">
                Start tracking your bus rides to see them appear here!
              </p>
              <a 
                href="/add" 
                className="btn-primary inline-block"
              >
                ➕ Add Your First Bus
              </a>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Timeline View */}
            <div className="card mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3">📋</span>
                Today's Timeline
              </h3>
              
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div key={index} className="group flex items-center space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <BusIcon number={entry.busNumber} />
                        <div>
                          <h4 className="text-white font-semibold text-lg">{entry.busNumber}</h4>
                          <p className="text-white/60 text-sm">
                            {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-white/50 text-sm">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Delete button - only visible on hover */}
                      <button
                        onClick={() => handleDeleteClick(entry, index)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300"
                        title="Delete this bus entry"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid View */}
            <div className="card">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-3xl mr-3">🎯</span>
                Bus Collection
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {entries.map((entry, index) => (
                  <BusIcon 
                    key={index} 
                    number={entry.busNumber} 
                    timestamp={entry.timestamp}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delete Bus Modal */}
        <DeleteBusModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          busEntry={deleteModal.busEntry}
        />

        {/* Success Message */}
        {message && (
          <div className="fixed bottom-6 right-6 max-w-sm z-40">
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <p className="text-green-200 font-medium">{message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
