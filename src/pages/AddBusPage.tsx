import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import { 
  addBusEntry, 
  undoLastBusEntry, 
  clearAllBusData, 
  clearBusLog, 
  saveBusdleTemplate,
  clearBusdleTemplate,
  subscribeToBusLog,
  subscribeToBusdleTemplate,
  migrateLocalStorageToFirebase,
  checkFirebaseConnection,
  type BusdleTemplate
} from '../services/busDataService';

const PAGE_PASSWORD = "PASSWORD";

export default function AddBusPage() {
  const [busNumber, setBusNumber] = useState('');
  const [message, setMessage] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [busdleOrder, setBusdleOrder] = useState('');
  const [busdleMessage, setBusdleMessage] = useState('');
  const [todaysBusCount, setTodaysBusCount] = useState(0);
  const [todaysEntries, setTodaysEntries] = useState<any[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [currentBusdleTemplate, setCurrentBusdleTemplate] = useState<BusdleTemplate | null>(null);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (busdleMessage) {
      const timer = setTimeout(() => setBusdleMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [busdleMessage]);

  // Check Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkFirebaseConnection();
      setIsFirebaseConnected(connected);
      
      if (!connected) {
        setMessage('⚠️ Firebase connection failed. Using local storage.');
      }
    };
    
    checkConnection();
  }, []);

  // Subscribe to today's bus log for real-time updates
  useEffect(() => {
    if (!isFirebaseConnected) return;
    
    const today = new Date().toISOString().slice(0, 10);
    const unsubscribe = subscribeToBusLog(today, (entries) => {
      setTodaysBusCount(entries.length);
      setTodaysEntries(entries);
    });
    
    return unsubscribe;
  }, [isFirebaseConnected]);

  // Subscribe to current busdle template
  useEffect(() => {
    if (!isFirebaseConnected) return;
    
    const today = new Date().toISOString().slice(0, 10);
    const unsubscribe = subscribeToBusdleTemplate(today, (template: BusdleTemplate | null) => {
      setCurrentBusdleTemplate(template);
    });
    
    return unsubscribe;
  }, [isFirebaseConnected]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
        <NavBar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="card">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
                <p className="text-white/70">Enter password to access the bus tracking page</p>
              </div>
              
              <form onSubmit={e => {
                e.preventDefault();
                if (inputPassword === PAGE_PASSWORD) {
                  setAuthenticated(true);
                  setPasswordError('');
                } else {
                  setPasswordError('Incorrect password.');
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={inputPassword}
                      onChange={e => setInputPassword(e.target.value)}
                      placeholder="Enter password"
                      className="input-field"
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary w-full">
                    🔑 Authenticate
                  </button>
                  
                  {passwordError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-200 text-sm">{passwordError}</p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleAddBus(e: React.FormEvent) {
    e.preventDefault();
    if (!busNumber.trim()) {
      setMessage('Please enter a bus number.');
      return;
    }
    
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const entry = { busNumber, timestamp: now.toISOString() };
      
      if (isFirebaseConnected) {
        await addBusEntry(today, entry);
      } else {
        // Fallback to localStorage
        const data = JSON.parse(localStorage.getItem('busLog') || '{}');
        if (!data[today]) data[today] = [];
        data[today].push(entry);
        localStorage.setItem('busLog', JSON.stringify(data));
      }
      
      setMessage(`Bus ${busNumber} added!`);
      setBusNumber('');
    } catch (error) {
      console.error('Error adding bus:', error);
      setMessage('Error adding bus. Please try again.');
    }
  }

  async function handleAddLightRail(line: '1' | '2') {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const entry = { busNumber: line === '1' ? 'Line 1' : 'Line 2', timestamp: now.toISOString() };
      
      if (isFirebaseConnected) {
        await addBusEntry(today, entry);
      } else {
        // Fallback to localStorage
        const data = JSON.parse(localStorage.getItem('busLog') || '{}');
        if (!data[today]) data[today] = [];
        data[today].push(entry);
        localStorage.setItem('busLog', JSON.stringify(data));
      }
      
      setMessage(`Added ${entry.busNumber} to today's rides!`);
    } catch (error) {
      console.error('Error adding light rail:', error);
      setMessage('Error adding light rail. Please try again.');
    }
  }

  async function handleUndo() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      if (isFirebaseConnected) {
        const removed = await undoLastBusEntry(today);
        if (removed) {
          setMessage(`Removed last bus: ${removed.busNumber}`);
        } else {
          setMessage('No buses to undo for today.');
        }
      } else {
        // Fallback to localStorage
        const data = JSON.parse(localStorage.getItem('busLog') || '{}');
        if (!data[today] || data[today].length === 0) {
          setMessage('No buses to undo for today.');
          return;
        }
        const removed = data[today].pop();
        localStorage.setItem('busLog', JSON.stringify(data));
        setMessage(removed ? `Removed last bus: ${removed.busNumber}` : 'No buses to undo for today.');
      }
    } catch (error) {
      console.error('Error undoing last bus:', error);
      setMessage('Error undoing last bus. Please try again.');
    }
  }

  async function handleClearAllBusData() {
    try {
      if (isFirebaseConnected) {
        await clearAllBusData();
      } else {
        // Fallback to localStorage
        localStorage.removeItem('busLog');
        localStorage.removeItem('busdleTemplates');
      }
      setMessage('All bus data cleared!');
    } catch (error) {
      console.error('Error clearing all bus data:', error);
      setMessage('Error clearing data. Please try again.');
    }
  }

  async function handleResetTodaysBuses() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      if (isFirebaseConnected) {
        await clearBusLog(today);
      } else {
        // Fallback to localStorage
        const data = JSON.parse(localStorage.getItem('busLog') || '{}');
        data[today] = [];
        localStorage.setItem('busLog', JSON.stringify(data));
      }
      
      setMessage("Today's buses have been reset!");
    } catch (error) {
      console.error('Error resetting today\'s buses:', error);
      setMessage('Error resetting buses. Please try again.');
    }
  }

  async function handleSetBusdleTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!busdleOrder.trim()) {
      setBusdleMessage('Please enter the bus order.');
      return;
    }

    try {
      // Parse the bus order (comma-separated)
      const busOrder = busdleOrder.split(',').map(bus => bus.trim()).filter(bus => bus);
      
      // Filter out light rail (Line 1, Line 2)
      const filteredBusOrder = busOrder.filter(bus => 
        !bus.toLowerCase().includes('line') && 
        bus.toLowerCase() !== 'line 1' && 
        bus.toLowerCase() !== 'line 2'
      );

      if (filteredBusOrder.length === 0) {
        setBusdleMessage('Please enter at least one valid bus (light rail excluded).');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const uniqueBuses = [...new Set(filteredBusOrder)];
      
      const busdleTemplate = {
        date: today,
        busOrder: filteredBusOrder,
        uniqueBusCount: uniqueBuses.length
      };

      if (isFirebaseConnected) {
        await saveBusdleTemplate(today, busdleTemplate);
      } else {
        // Fallback to localStorage
        const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
        busdleData[today] = busdleTemplate;
        localStorage.setItem('busdleTemplates', JSON.stringify(busdleData));
      }
      
      setBusdleMessage(`Busdle template set! ${filteredBusOrder.length} buses, ${uniqueBuses.length} unique.`);
      setBusdleOrder('');
    } catch (error) {
      console.error('Error setting busdle template:', error);
      setBusdleMessage('Error setting busdle template. Please try again.');
    }
  }

  function getCurrentBusdleTemplate() {
    if (isFirebaseConnected) {
      return currentBusdleTemplate;
    } else {
      // Fallback to localStorage
      const today = new Date().toISOString().slice(0, 10);
      const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
      return busdleData[today] || null;
    }
  }

  async function handleMigrateData() {
    setIsMigrating(true);
    try {
      await migrateLocalStorageToFirebase();
      setMessage('✅ Data migrated to Firebase successfully!');
    } catch (error) {
      console.error('Migration error:', error);
      setMessage('❌ Migration failed. Please try again.');
    }
    setIsMigrating(false);
  }

  async function handleClearBusdle() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      if (isFirebaseConnected) {
        await clearBusdleTemplate(today);
      } else {
        // Fallback to localStorage
        const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
        delete busdleData[today];
        localStorage.setItem('busdleTemplates', JSON.stringify(busdleData));
      }
      
      setBusdleMessage('🗑️ Today\'s Busdle cleared!');
    } catch (error) {
      console.error('Error clearing busdle:', error);
      setBusdleMessage('❌ Error clearing Busdle. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
      <NavBar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🚌 Add Bus Ride
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Track your daily bus rides and light rail trips with ease
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Bus Number Input */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">🚌</span>
                Add Bus Number
              </h3>
              <form onSubmit={handleAddBus} className="space-y-4">
                <input
                  type="text"
                  value={busNumber}
                  onChange={e => setBusNumber(e.target.value)}
                  placeholder="Enter bus number (e.g., 42, 15, etc.)"
                  className="input-field"
                />
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    ➕ Add Bus
                  </button>
                  <button 
                    type="button" 
                    onClick={handleUndo}
                    className="btn-secondary"
                  >
                    ↩️ Undo
                  </button>
                </div>
              </form>
            </div>

            {/* Light Rail Section */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">🚈</span>
                Light Rail
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => handleAddLightRail('1')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  🚈 Line 1
                </button>
                <button 
                  type="button" 
                  onClick={() => handleAddLightRail('2')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  🚈 Line 2
                </button>
              </div>
            </div>

            {/* Busdle Template Section */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                Busdle Template
              </h3>
              <form onSubmit={handleSetBusdleTemplate} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Bus Order (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={busdleOrder}
                    onChange={e => setBusdleOrder(e.target.value)}
                    placeholder="e.g., 42, 15, 42, 8, 15"
                    className="input-field"
                  />
                  <p className="text-white/50 text-xs mt-1">
                    Enter the exact order buses arrived. Light rail will be automatically excluded.
                  </p>
                </div>
                <button type="submit" className="btn-primary w-full">
                  🎯 Set Today's Busdle
                </button>
              </form>
              
              {/* Current Template Display */}
              {(() => {
                const currentTemplate = getCurrentBusdleTemplate();
                if (currentTemplate) {
                  return (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm mb-2">Today's Busdle:</p>
                      <div className="flex gap-2 flex-wrap">
                        {currentTemplate.busOrder.map((bus: string, index: number) => (
                          <span key={index} className="bg-primary-500/20 text-primary-200 px-2 py-1 rounded text-sm">
                            {bus}
                          </span>
                        ))}
                      </div>
                      <p className="text-white/50 text-xs mt-2">
                        {currentTemplate.busOrder.length} buses, {currentTemplate.uniqueBusCount} unique
                      </p>
                      <button 
                        onClick={handleClearBusdle}
                        className="mt-3 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
                      >
                        🗑️ Clear Today's Busdle
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Actions & Info */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">📅</span>
                Today's Summary
              </h3>
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🚌</div>
                <p className="text-white/70">
                  {isFirebaseConnected ? `${todaysBusCount} rides today` : (() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const data = JSON.parse(localStorage.getItem('busLog') || '{}');
                    const todayEntries = data[today] || [];
                    return `${todayEntries.length} rides today`;
                  })()}
                </p>
              </div>
            </div>

            {/* Firebase Status */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">{isFirebaseConnected ? '🔥' : '💾'}</span>
                {isFirebaseConnected ? 'Firebase Connected' : 'Local Storage'}
              </h3>
              <div className="text-center py-4">
                <div className={`text-sm px-3 py-2 rounded-lg ${
                  isFirebaseConnected 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {isFirebaseConnected 
                    ? '✅ Syncing across devices' 
                    : '⚠️ Data stored locally only'
                  }
                </div>
                {!isFirebaseConnected && localStorage.getItem('busLog') && (
                  <button 
                    onClick={handleMigrateData}
                    disabled={isMigrating}
                    className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    {isMigrating ? '🔄 Migrating...' : '📤 Migrate to Firebase'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">⚙️</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={handleResetTodaysBuses}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  🔄 Reset Today's Buses
                </button>
                <button 
                  onClick={handleClearAllBusData}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  🗑️ Clear All Data
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">📊</span>
                Recent Activity
              </h3>
              <div className="space-y-2">
                {(() => {
                  let todayEntries = [];
                  
                  if (isFirebaseConnected) {
                    // Use the real-time data from Firebase subscription
                    todayEntries = todaysEntries;
                  } else {
                    // Fallback to localStorage
                    const today = new Date().toISOString().slice(0, 10);
                    const data = JSON.parse(localStorage.getItem('busLog') || '{}');
                    todayEntries = data[today] || [];
                  }
                  
                  const recentEntries = todayEntries.slice(-3).reverse();
                  
                  if (recentEntries.length === 0) {
                    return <p className="text-white/50 text-center py-4">No recent activity</p>;
                  }
                  
                  return recentEntries.map((entry: any, index: number) => {
                    // Determine the correct icon class based on bus type
                    let iconClass = "bus-icon ";
                    let displayText = entry.busNumber;
                    
                    if (entry.busNumber === "Line 1") {
                      iconClass += "bus-icon-line1";
                      displayText = "1";
                    } else if (entry.busNumber === "Line 2") {
                      iconClass += "bus-icon-line2";
                      displayText = "2";
                    } else {
                      const hasNumber = /\d/.test(entry.busNumber);
                      iconClass += hasNumber ? "bus-icon-number" : "bus-icon-no-number";
                    }
                    
                    return (
                      <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className={iconClass}>
                            <span className="text-sm">
                              {displayText}
                            </span>
                          </div>
                          <span className="text-white font-medium">{entry.busNumber}</span>
                        </div>
                        <span className="text-white/50 text-sm">
                          {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="fixed bottom-6 right-6 max-w-sm">
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <p className="text-green-200 font-medium">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Busdle Message Display */}
        {busdleMessage && (
          <div className="fixed bottom-6 left-6 max-w-sm">
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <p className="text-purple-200 font-medium">{busdleMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
