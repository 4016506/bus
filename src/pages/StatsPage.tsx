import { useEffect, useState } from 'react';
import NavBar from './NavBar';
import { 
  getAllBusLogs,
  checkFirebaseConnection 
} from '../services/busDataService';

type Stats = { [busNumber: string]: number };
type DateRange = {
  startDate: string;
  endDate: string;
};

function BusIcon({ number }: { number: string }) {
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
    <div className={`${iconClass} group-hover:scale-110 transition-all duration-300`}>
      <span className="text-white font-bold text-lg">{displayText}</span>
    </div>
  );
}

function BusStatsCard({ bus, count, max, rank }: { bus: string, count: number, max: number, rank: number }) {
  const percentage = max > 0 ? Math.round((count / max) * 100) : 0;
  
  return (
    <div className="card group hover:bg-white/15 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <BusIcon number={bus} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{bus}</h3>
            <p className="text-white/60 text-sm">#{rank} most used</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{count}</div>
          <div className="text-white/60 text-sm">rides</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-3 mb-2">
        <div 
          className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between text-sm text-white/60">
        <span>{percentage}% of max</span>
        <span>{count} total rides</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({});
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Helper function to check if a date is within the selected range
  const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
    if (!startDate && !endDate) return true; // Show all if no dates selected
    if (!startDate) return date <= endDate;
    if (!endDate) return date >= startDate;
    return date >= startDate && date <= endDate;
  };

  // Check Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkFirebaseConnection();
      setIsFirebaseConnected(connected);
    };
    
    checkConnection();
  }, []);

  // Load and calculate stats
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        let data: any = {};
        
        if (isFirebaseConnected) {
          data = await getAllBusLogs();
        } else {
          // Fallback to localStorage
          data = JSON.parse(localStorage.getItem('busLog') || '{}');
        }
        
        const counts: Stats = {};
        
        // Filter entries by date range
        Object.entries(data).forEach(([date, entries]: [string, any]) => {
          if (isDateInRange(date, dateRange.startDate, dateRange.endDate)) {
            if (Array.isArray(entries)) {
              entries.forEach((entry: any) => {
                counts[entry.busNumber] = (counts[entry.busNumber] || 0) + 1;
              });
            }
          }
        });
        
        setStats(counts);
        setCurrentPage(0); // Reset to first page when data changes
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback to localStorage on error
        const data = JSON.parse(localStorage.getItem('busLog') || '{}');
        const counts: Stats = {};
        
        Object.entries(data).forEach(([date, entries]: [string, any]) => {
          if (isDateInRange(date, dateRange.startDate, dateRange.endDate)) {
            entries.forEach((entry: any) => {
              counts[entry.busNumber] = (counts[entry.busNumber] || 0) + 1;
            });
          }
        });
        
        setStats(counts);
        setCurrentPage(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isFirebaseConnected !== null) { // Only run when we know the connection status
      loadStats();
    }
  }, [dateRange, isFirebaseConnected]);

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted.length > 0 ? sorted[0][1] : 0;
  
  // Pagination calculations
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBuses = sorted.slice(startIndex, endIndex);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const getDateRangeText = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return 'All Time';
    }
    if (dateRange.startDate && dateRange.endDate) {
      return `${dateRange.startDate} to ${dateRange.endDate}`;
    }
    if (dateRange.startDate) {
      return `From ${dateRange.startDate}`;
    }
    return `Until ${dateRange.endDate}`;
  };

  const totalRides = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const uniqueBuses = Object.keys(stats).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
      <NavBar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            📊 Bus Ride Statistics
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Analyze your transportation patterns and discover insights about your daily commute
          </p>
          {isLoading && (
            <div className="mt-4">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-white/70">Loading statistics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Date Filter Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <span className="text-2xl mr-3">📅</span>
                Date Filter
              </h3>
              <button 
                className="btn-secondary text-sm"
                onClick={() => setShowDateFilter(!showDateFilter)}
              >
                {showDateFilter ? 'Hide' : 'Show'} Filter
              </button>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-white/70">
                Currently showing: <span className="text-primary-300 font-semibold">{getDateRangeText()}</span>
              </p>
            </div>
            
            {showDateFilter && (
              <div className="space-y-4 animate-slide-up">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <button 
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300"
                  onClick={clearDateFilter}
                >
                  🗑️ Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="card text-center">
            <div className="text-4xl mb-3">🚌</div>
            <h3 className="text-3xl font-bold text-white mb-2">{totalRides}</h3>
            <p className="text-white/70">Total Rides</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-3">🔢</div>
            <h3 className="text-3xl font-bold text-white mb-2">{uniqueBuses}</h3>
            <p className="text-white/70">Unique Buses</p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {uniqueBuses > 0 ? Math.round(totalRides / uniqueBuses * 10) / 10 : 0}
            </h3>
            <p className="text-white/70">Avg per Bus</p>
          </div>
        </div>

        {/* Bus Statistics */}
        {sorted.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="card text-center py-16">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {dateRange.startDate || dateRange.endDate 
                  ? 'No data in selected range'
                  : 'No statistics available'
                }
              </h3>
              <p className="text-white/70 mb-8">
                {dateRange.startDate || dateRange.endDate 
                  ? 'Try adjusting your date filter or add some bus rides to see statistics.'
                  : 'Start tracking your bus rides to see detailed statistics here!'
                }
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                🏆 Bus Usage Rankings
              </h2>
            </div>
            
            {/* Pagination Info */}
            {sorted.length > itemsPerPage && (
              <div className="text-center mb-6">
                <p className="text-white/70">
                  Showing {startIndex + 1}-{Math.min(endIndex, sorted.length)} of {sorted.length} buses
                </p>
              </div>
            )}
            
            <div className="grid gap-6">
              {paginatedBuses.map(([bus, count], index) => (
                <BusStatsCard 
                  key={bus} 
                  bus={bus} 
                  count={count} 
                  max={maxCount} 
                  rank={startIndex + index + 1}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    currentPage === 0
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <span className="text-lg">←</span>
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-white/70">Page</span>
                  <span className="bg-gradient-to-r from-primary-500 to-purple-500 text-white px-3 py-1 rounded-lg font-bold">
                    {currentPage + 1}
                  </span>
                  <span className="text-white/70">of {totalPages}</span>
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    currentPage === totalPages - 1
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <span>Next</span>
                  <span className="text-lg">→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
