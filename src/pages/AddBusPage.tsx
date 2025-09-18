import { useState, useEffect } from 'react';
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
  saveBusBankTemplate,
  getBusBankTemplates,
  deleteBusBankTemplate,
  updateBusBankTemplate,
  saveActiveBusBank,
  subscribeToActiveBusBank,
  type BusdleTemplate,
  type BusBankTemplate
} from '../services/busDataService';

const PAGE_PASSWORD = import.meta.env.VITE_PAGE_PASSWORD;

// Helper function to get local date in YYYY-MM-DD format
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  
  // Bus bank management state
  const [busBankTemplates, setBusBankTemplates] = useState<BusBankTemplate[]>([]);
  const [showBusBankManager, setShowBusBankManager] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBuses, setNewTemplateBuses] = useState('');
  const [selectedBusBank, setSelectedBusBank] = useState<string[]>([]);
  const [customBusBank, setCustomBusBank] = useState('');
  const [busBankMessage, setBusBankMessage] = useState('');
  const [isUserAction, setIsUserAction] = useState(false);
  
  // Edit template state
  const [editingTemplate, setEditingTemplate] = useState<BusBankTemplate | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateBuses, setEditTemplateBuses] = useState('');

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

  useEffect(() => {
    if (busBankMessage) {
      const timer = setTimeout(() => setBusBankMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [busBankMessage]);

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
    
    const today = getLocalDateString();
    const unsubscribe = subscribeToBusLog(today, (entries) => {
      setTodaysBusCount(entries.length);
      setTodaysEntries(entries);
    });
    
    return unsubscribe;
  }, [isFirebaseConnected]);

  // Subscribe to current busdle template (persistent, not date-based)
  useEffect(() => {
    if (!isFirebaseConnected) return;
    
    const unsubscribe = subscribeToBusdleTemplate('current', (template: BusdleTemplate | null) => {
      setCurrentBusdleTemplate(template);
    });
    
    return unsubscribe;
  }, [isFirebaseConnected]);

  // Load bus bank templates
  useEffect(() => {
    const loadBusBankTemplates = async () => {
      if (isFirebaseConnected) {
        try {
          const templates = await getBusBankTemplates();
          setBusBankTemplates(templates);
        } catch (error) {
          console.error('Error loading bus bank templates:', error);
        }
      } else {
        // Fallback to localStorage
        const templates = JSON.parse(localStorage.getItem('busBankTemplates') || '[]');
        setBusBankTemplates(templates);
      }
    };
    
    loadBusBankTemplates();
  }, [isFirebaseConnected]);

  // Load selected bus bank from Firebase
  useEffect(() => {
    if (isFirebaseConnected) {
      const unsubscribe = subscribeToActiveBusBank((busBank) => {
        setSelectedBusBank(busBank);
        // This is loading from Firebase, not a user action
        setIsUserAction(false);
      });
      return unsubscribe;
    } else {
      // Fallback to localStorage
      const savedBusBank = localStorage.getItem('selectedBusBank');
      if (savedBusBank) {
        try {
          setSelectedBusBank(JSON.parse(savedBusBank));
        } catch (error) {
          console.error('Error loading selected bus bank:', error);
        }
      }
      setIsUserAction(false);
    }
  }, [isFirebaseConnected]);

  // Save selected bus bank to Firebase only when user changes it
  useEffect(() => {
    if (!isUserAction) return; // Only save when user actually changes the bus bank
    
    if (!isFirebaseConnected) {
      // Fallback to localStorage
      if (selectedBusBank.length > 0) {
        localStorage.setItem('selectedBusBank', JSON.stringify(selectedBusBank));
      } else {
        localStorage.removeItem('selectedBusBank');
      }
      return;
    }

    // Save to Firebase when user changes it
    saveActiveBusBank(selectedBusBank).catch(error => {
      console.error('Error saving active bus bank:', error);
    });
  }, [selectedBusBank, isFirebaseConnected, isUserAction]);

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
      const today = getLocalDateString();
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
      const today = getLocalDateString();
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
      const today = getLocalDateString();
      
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
      const today = getLocalDateString();
      
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

      const uniqueBuses = [...new Set(filteredBusOrder)];
      
      // Use the selected bus bank from state (which is synced with Firebase)
      const currentSelectedBusBank = selectedBusBank;

      const busdleTemplate = {
        date: 'current',
        busOrder: filteredBusOrder,
        uniqueBusCount: uniqueBuses.length,
        busBank: currentSelectedBusBank.length > 0 ? currentSelectedBusBank : undefined
      };

      if (isFirebaseConnected) {
        await saveBusdleTemplate('current', busdleTemplate);
      } else {
        // Fallback to localStorage
        const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
        busdleData['current'] = busdleTemplate;
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
      const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
      return busdleData['current'] || null;
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
      if (isFirebaseConnected) {
        await clearBusdleTemplate('current');
      } else {
        // Fallback to localStorage
        const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
        delete busdleData['current'];
        localStorage.setItem('busdleTemplates', JSON.stringify(busdleData));
      }
      
      setBusdleMessage('🗑️ Current Busdle cleared!');
    } catch (error) {
      console.error('Error clearing busdle:', error);
      setBusdleMessage('❌ Error clearing Busdle. Please try again.');
    }
  }

  // Bus bank management functions
  async function handleCreateBusBankTemplate() {
    if (!newTemplateName.trim() || !newTemplateBuses.trim()) {
      setBusBankMessage('Please enter both template name and buses.');
      return;
    }

    if (busBankTemplates.length >= 3) {
      setBusBankMessage('Maximum 3 templates allowed. Delete one first.');
      return;
    }

    try {
      const buses = newTemplateBuses.split(',').map(bus => bus.trim()).filter(bus => bus);
      const template: BusBankTemplate = {
        id: `template_${Date.now()}`,
        name: newTemplateName.trim(),
        buses,
        createdAt: new Date().toISOString()
      };

      if (isFirebaseConnected) {
        await saveBusBankTemplate(template);
        const templates = await getBusBankTemplates();
        setBusBankTemplates(templates);
      } else {
        // Fallback to localStorage
        const templates = JSON.parse(localStorage.getItem('busBankTemplates') || '[]');
        templates.push(template);
        localStorage.setItem('busBankTemplates', JSON.stringify(templates));
        setBusBankTemplates(templates);
      }

      setBusBankMessage(`✅ Template "${template.name}" created!`);
      setNewTemplateName('');
      setNewTemplateBuses('');
    } catch (error) {
      console.error('Error creating bus bank template:', error);
      setBusBankMessage('❌ Error creating template. Please try again.');
    }
  }

  async function handleDeleteBusBankTemplate(templateId: string) {
    try {
      if (isFirebaseConnected) {
        await deleteBusBankTemplate(templateId);
        const templates = await getBusBankTemplates();
        setBusBankTemplates(templates);
      } else {
        // Fallback to localStorage
        const templates = JSON.parse(localStorage.getItem('busBankTemplates') || '[]');
        const filteredTemplates = templates.filter((t: BusBankTemplate) => t.id !== templateId);
        localStorage.setItem('busBankTemplates', JSON.stringify(filteredTemplates));
        setBusBankTemplates(filteredTemplates);
      }

      setBusBankMessage('🗑️ Template deleted!');
    } catch (error) {
      console.error('Error deleting bus bank template:', error);
      setBusBankMessage('❌ Error deleting template. Please try again.');
    }
  }

  function handleSelectBusBankTemplate(template: BusBankTemplate) {
    setIsUserAction(true);
    setSelectedBusBank(template.buses);
    setCustomBusBank('');
    setBusBankMessage(`✅ Selected template "${template.name}"`);
  }

  function handleCustomBusBankChange(value: string) {
    setIsUserAction(true);
    setCustomBusBank(value);
    const buses = value.split(',').map(bus => bus.trim()).filter(bus => bus);
    setSelectedBusBank(buses);
    setBusBankMessage('✅ Custom bus bank updated');
  }

  function handleClearBusBank() {
    setIsUserAction(true);
    setSelectedBusBank([]);
    setCustomBusBank('');
    setBusBankMessage('🗑️ Bus bank cleared');
  }

  // Edit template functions
  function handleEditTemplate(template: BusBankTemplate) {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateBuses(template.buses.join(', '));
  }

  async function handleSaveEdit() {
    if (!editingTemplate || !editTemplateName.trim() || !editTemplateBuses.trim()) {
      setBusBankMessage('Please enter both template name and buses.');
      return;
    }

    try {
      const buses = editTemplateBuses.split(',').map(bus => bus.trim()).filter(bus => bus);
      const updatedTemplate = {
        ...editingTemplate,
        name: editTemplateName.trim(),
        buses
      };

      if (isFirebaseConnected) {
        await updateBusBankTemplate(editingTemplate.id, {
          name: updatedTemplate.name,
          buses: updatedTemplate.buses
        });
        const templates = await getBusBankTemplates();
        setBusBankTemplates(templates);
      } else {
        // Fallback to localStorage
        const templates = JSON.parse(localStorage.getItem('busBankTemplates') || '[]');
        const updatedTemplates = templates.map((t: BusBankTemplate) => 
          t.id === editingTemplate.id ? updatedTemplate : t
        );
        localStorage.setItem('busBankTemplates', JSON.stringify(updatedTemplates));
        setBusBankTemplates(updatedTemplates);
      }

      setBusBankMessage(`✅ Template "${updatedTemplate.name}" updated!`);
      setEditingTemplate(null);
      setEditTemplateName('');
      setEditTemplateBuses('');
    } catch (error) {
      console.error('Error updating bus bank template:', error);
      setBusBankMessage('❌ Error updating template. Please try again.');
    }
  }

  function handleCancelEdit() {
    setEditingTemplate(null);
    setEditTemplateName('');
    setEditTemplateBuses('');
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
                  onChange={e => {
                    const value = e.target.value;
                    // Only allow numbers and uppercase letters, no spaces or symbols
                    const filteredValue = value.replace(/[^0-9A-Z]/g, '');
                    setBusNumber(filteredValue);
                  }}
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  🚈 Line 1
                </button>
                <button 
                  type="button" 
                  onClick={() => handleAddLightRail('2')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
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
                        🗑️ Clear Current Busdle
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Bus Bank Management Section */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="text-2xl mr-3">🏦</span>
                Bus Bank Management
                <button
                  onClick={() => setShowBusBankManager(!showBusBankManager)}
                  className="ml-auto text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
                >
                  {showBusBankManager ? 'Hide' : 'Manage'}
                </button>
              </h3>
              
              {showBusBankManager && (
                <div className="space-y-4">
                  {/* Create New Template */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Create New Template</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={e => setNewTemplateName(e.target.value)}
                        placeholder="Template name (e.g., 'Common Routes')"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={newTemplateBuses}
                        onChange={e => setNewTemplateBuses(e.target.value)}
                        placeholder="Bus numbers (comma-separated, e.g., 42, 15, 8, 3)"
                        className="input-field"
                      />
                      <button
                        onClick={handleCreateBusBankTemplate}
                        disabled={busBankTemplates.length >= 3}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busBankTemplates.length >= 3 ? 'Max 3 Templates' : '➕ Create Template'}
                      </button>
                    </div>
                  </div>

                  {/* Existing Templates */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Saved Templates</h4>
                    {busBankTemplates.length === 0 ? (
                      <p className="text-white/50 text-center py-4">No templates saved yet</p>
                    ) : (
                      <div className="space-y-2">
                        {busBankTemplates.map(template => (
                          <div key={template.id} className="bg-white/10 rounded-lg p-3">
                            {editingTemplate?.id === template.id ? (
                              // Edit mode
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-white/80 text-sm font-medium mb-2">
                                    Template Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editTemplateName}
                                    onChange={e => setEditTemplateName(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter template name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-white/80 text-sm font-medium mb-2">
                                    Bus Numbers (comma-separated)
                                  </label>
                                  <input
                                    type="text"
                                    value={editTemplateBuses}
                                    onChange={e => setEditTemplateBuses(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., 42, 15, 8, 3"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded text-sm transition-colors flex-1"
                                  >
                                    💾 Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 px-3 py-1 rounded text-sm transition-colors flex-1"
                                  >
                                    ❌ Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">{template.name}</span>
                                    <span className="text-white/50 text-sm">({template.buses.length} buses)</span>
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {template.buses.slice(0, 5).map((bus, index) => (
                                      <span key={index} className="bg-primary-500/20 text-primary-200 px-2 py-1 rounded text-xs">
                                        {bus}
                                      </span>
                                    ))}
                                    {template.buses.length > 5 && (
                                      <span className="text-white/50 text-xs">+{template.buses.length - 5} more</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-3">
                                  <button
                                    onClick={() => handleSelectBusBankTemplate(template)}
                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Select
                                  </button>
                                  <button
                                    onClick={() => handleEditTemplate(template)}
                                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBusBankTemplate(template.id)}
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded text-sm transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Bus Bank */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Custom Bus Bank</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={customBusBank}
                        onChange={e => handleCustomBusBankChange(e.target.value)}
                        placeholder="Enter custom bus numbers (comma-separated)"
                        className="input-field"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleClearBusBank}
                          className="btn-secondary flex-1"
                        >
                          🗑️ Clear
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Current Selection */}
                  {selectedBusBank.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-white mb-3">Selected Bus Bank</h4>
                      <div className="flex gap-2 flex-wrap">
                        {selectedBusBank.map((bus, index) => (
                          <span key={index} className="bg-primary-500/20 text-primary-200 px-2 py-1 rounded text-sm">
                            {bus}
                          </span>
                        ))}
                      </div>
                      <p className="text-white/50 text-sm mt-2">
                        {selectedBusBank.length} buses selected for easy mode
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                    const today = getLocalDateString();
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
                    const today = getLocalDateString();
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

        {/* Bus Bank Message Display */}
        {busBankMessage && (
          <div className="fixed bottom-6 right-6 max-w-sm">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏦</span>
                <p className="text-blue-200 font-medium">{busBankMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
