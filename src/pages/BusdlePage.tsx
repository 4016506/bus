import { useState, useEffect } from 'react';
import NavBar from './NavBar';
import BusKeyboard from '../components/BusKeyboard';
import { 
  subscribeToBusdleTemplate,
  checkFirebaseConnection,
  subscribeToActiveBusBank
} from '../services/busDataService';

interface BusdleTemplate {
  date: string;
  busOrder: string[];
  uniqueBusCount: number;
  busBank?: string[];
}

interface Guess {
  buses: string[];
  results: ('correct' | 'present' | 'absent')[];
  isAnimating?: boolean;
}

interface SavedGameState {
  guesses: Guess[];
  currentGuess: string[];
  gameWon: boolean;
  inputValues: string[];
  templateDate: string;
  gameMode: 'easy' | 'hard';
}

// localStorage utility functions for game state persistence
const saveGameState = (gameState: SavedGameState) => {
  try {
    localStorage.setItem('busdleGameState', JSON.stringify(gameState));
  } catch (error) {
    console.warn('Failed to save game state to localStorage:', error);
  }
};

const loadGameState = (): SavedGameState | null => {
  try {
    const saved = localStorage.getItem('busdleGameState');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load game state from localStorage:', error);
    return null;
  }
};

const clearGameState = () => {
  try {
    localStorage.removeItem('busdleGameState');
  } catch (error) {
    console.warn('Failed to clear game state from localStorage:', error);
  }
};

export default function BusdlePage() {
  const [currentTemplate, setCurrentTemplate] = useState<BusdleTemplate | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animatingGuessIndex, setAnimatingGuessIndex] = useState<number | null>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [gameMode, setGameMode] = useState<'easy' | 'hard'>('hard');
  const [selectedBuses, setSelectedBuses] = useState<string[]>([]);
  const [fallbackBusBank, setFallbackBusBank] = useState<string[]>([]);

  // Check Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkFirebaseConnection();
      setIsFirebaseConnected(connected);
    };
    
    checkConnection();
  }, []);

  // Load fallback bus bank from Firebase or localStorage
  useEffect(() => {
    if (isFirebaseConnected) {
      const unsubscribe = subscribeToActiveBusBank((busBank) => {
        setFallbackBusBank(busBank);
      });
      return unsubscribe;
    } else {
      // Fallback to localStorage
      const savedBusBank = localStorage.getItem('selectedBusBank');
      if (savedBusBank) {
        try {
          setFallbackBusBank(JSON.parse(savedBusBank));
        } catch (error) {
          console.error('Error loading fallback bus bank:', error);
        }
      }
    }
  }, [isFirebaseConnected]);

  // Load current Busdle template and saved game state
  useEffect(() => {
    if (isFirebaseConnected) {
      // Subscribe to real-time updates from Firebase using 'current' as the key
      const unsubscribe = subscribeToBusdleTemplate('current', (template) => {
        setCurrentTemplate(template);
        if (template) {
          // Load saved game state if it exists and matches current template
          const savedState = loadGameState();
          if (savedState && savedState.templateDate === template.date) {
            // Restore saved game state
            setGuesses(savedState.guesses.map(guess => ({ ...guess, isAnimating: false }))); // Remove animation flags
            setCurrentGuess(savedState.currentGuess);
            setGameWon(savedState.gameWon);
            setInputValues(savedState.inputValues);
            setGameMode(savedState.gameMode || 'hard');
          } else {
            // No saved state or different template, start fresh
            setInputValues(new Array(template.busOrder.length).fill(''));
            setGuesses([]);
            setCurrentGuess([]);
            setGameWon(false);
            setGameMode('hard');
          }
        }
      });
      
      return unsubscribe;
    } else {
      // Fallback to localStorage
      const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
      
      if (busdleData['current']) {
        setCurrentTemplate(busdleData['current']);
        
        // Load saved game state if it exists and matches current template
        const savedState = loadGameState();
        if (savedState && savedState.templateDate === busdleData['current'].date) {
          // Restore saved game state
          setGuesses(savedState.guesses.map(guess => ({ ...guess, isAnimating: false }))); // Remove animation flags
          setCurrentGuess(savedState.currentGuess);
          setGameWon(savedState.gameWon);
          setInputValues(savedState.inputValues);
          setGameMode(savedState.gameMode || 'hard');
        } else {
          // No saved state or different template, start fresh
          setInputValues(new Array(busdleData['current'].busOrder.length).fill(''));
          setGuesses([]);
          setCurrentGuess([]);
          setGameWon(false);
          setGameMode('hard');
        }
      }
    }
  }, [isFirebaseConnected]);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (currentTemplate) {
      const gameState: SavedGameState = {
        guesses: guesses.map(guess => ({ ...guess, isAnimating: false })), // Remove animation flags before saving
        currentGuess,
        gameWon,
        inputValues,
        templateDate: currentTemplate.date,
        gameMode
      };
      saveGameState(gameState);
    }
  }, [guesses, currentGuess, gameWon, inputValues, currentTemplate, gameMode]);

  // Check if guess matches the target (proper Wordle algorithm)
  const evaluateGuess = (guess: string[]): ('correct' | 'present' | 'absent')[] => {
    if (!currentTemplate) return [];
    
    const target = currentTemplate.busOrder;
    const result: ('correct' | 'present' | 'absent')[] = new Array(guess.length).fill('absent');
    const targetCounts: { [key: string]: number } = {};
    
    // Count occurrences of each bus in target
    target.forEach(bus => {
      targetCounts[bus] = (targetCounts[bus] || 0) + 1;
    });
    
    // First pass: mark all correct positions
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === target[i]) {
        result[i] = 'correct';
        targetCounts[guess[i]]--; // Reduce available count for this bus
      }
    }
    
    // Second pass: mark present positions (wrong position but exists)
    for (let i = 0; i < guess.length; i++) {
      if (result[i] === 'absent') { // Only check positions not already marked as correct
        if (targetCounts[guess[i]] && targetCounts[guess[i]] > 0) {
          result[i] = 'present';
          targetCounts[guess[i]]--; // Reduce available count
        }
      }
    }
    
    return result;
  };

  const handleGuess = async () => {
    if (!currentTemplate || currentGuess.length !== currentTemplate.busOrder.length || isSubmitting) return;
    
    // Check if all positions are filled with non-empty alphanumeric values
    if (currentGuess.some(bus => !bus || bus.length === 0)) {
      return;
    }

    // Use the new function with current guess data
    await handleGuessWithData([...currentGuess]);
  };

  const handleInputChange = (index: number, value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    const newInputValues = [...inputValues];
    newInputValues[index] = cleanedValue;
    setInputValues(newInputValues);
    
    const newCurrentGuess = [...currentGuess];
    newCurrentGuess[index] = cleanedValue;
    setCurrentGuess(newCurrentGuess);
  };

  const resetGame = () => {
    setGuesses([]);
    setCurrentGuess([]);
    setGameWon(false);
    setShowWinAnimation(false);
    setIsSubmitting(false);
    setAnimatingGuessIndex(null);
    setInputValues(currentTemplate ? new Array(currentTemplate.busOrder.length).fill('') : []);
    setGameMode('hard');
    setSelectedBuses([]);
    // Clear saved game state from localStorage
    clearGameState();
  };

  // Bus selection functions for easy mode
  const handleBusSelect = (bus: string) => {
    if (selectedBuses.length < (currentTemplate?.busOrder.length || 0)) {
      setSelectedBuses(prev => [...prev, bus]);
    }
  };

  const handleBusBackspace = () => {
    setSelectedBuses(prev => prev.slice(0, -1));
  };

  const handleBusEnter = () => {
    if (selectedBuses.length === (currentTemplate?.busOrder.length || 0)) {
      const guessBuses = [...selectedBuses];
      const inputVals = selectedBuses.map(bus => bus);
      
      // Set the guess immediately
      setCurrentGuess(guessBuses);
      setInputValues(inputVals);
      setSelectedBuses([]);
      
      // Submit the guess directly with the data
      handleGuessWithData(guessBuses);
    }
  };

  // New function to handle guess submission with explicit data
  const handleGuessWithData = async (guessData: string[]) => {
    if (!currentTemplate || guessData.length !== currentTemplate.busOrder.length || isSubmitting) return;
    
    // Check if all positions are filled with non-empty alphanumeric values
    if (guessData.some(bus => !bus || bus.length === 0)) {
      return;
    }

    setIsSubmitting(true);
    
    const results = evaluateGuess(guessData);
    const newGuessIndex = guesses.length;
    const newGuess: Guess = { buses: [...guessData], results, isAnimating: true };
    
    // Add the guess immediately but with animation flag
    setGuesses(prev => [...prev, newGuess]);
    setAnimatingGuessIndex(newGuessIndex);
    
    // Reset current guess inputs immediately
    setCurrentGuess([]);
    setInputValues(new Array(currentTemplate.busOrder.length).fill(''));
    setSelectedBuses([]);
    
    // Animate tiles with staggered timing
    for (let i = 0; i < results.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i * 100)); // 100ms delay between tiles
    }
    
    // Wait for the last animation to complete
    await new Promise(resolve => setTimeout(resolve, 600)); // Animation duration
    
    // Remove animation flag and check win condition
    setGuesses(prev => prev.map((guess, index) => 
      index === newGuessIndex ? { ...guess, isAnimating: false } : guess
    ));
    setAnimatingGuessIndex(null);
    
    // Check if won (with slight delay for better UX)
    if (results.every(result => result === 'correct')) {
      setTimeout(() => {
        setShowWinAnimation(true);
        setTimeout(() => {
          setGameWon(true);
          setShowWinAnimation(false);
        }, 1000);
      }, 300);
    }
    
    setIsSubmitting(false);
  };

  const getColorClass = (result: 'correct' | 'present' | 'absent') => {
    switch (result) {
      case 'correct': return 'busdle-tile-correct';
      case 'present': return 'busdle-tile-present';
      case 'absent': return 'busdle-tile-absent';
      default: return 'busdle-tile-pending';
    }
  };

  const getTileClasses = (guessIndex: number, tileIndex: number, result: 'correct' | 'present' | 'absent', isAnimating: boolean) => {
    let classes = `w-16 h-16 ${getColorClass(result)} rounded-lg flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 busdle-tile`;
    
    if (isAnimating && animatingGuessIndex === guessIndex) {
      classes += ' busdle-tile-flip';
      classes += ` animate-delay-${tileIndex * 100}`;
    }
    
    // Add win animation for the winning row
    if (showWinAnimation && guessIndex === guesses.length - 1 && result === 'correct') {
      classes += ' busdle-tile-win';
    }
    
    return classes;
  };

  // Helper function to get the effective bus bank (template or fallback)
  const getEffectiveBusBank = () => {
    return currentTemplate?.busBank || fallbackBusBank;
  };

  if (!currentTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
        <NavBar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="card max-w-md mx-auto">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-white mb-4">No Busdle Available</h2>
              <p className="text-white/70 mb-6">
                No bus order has been set for today. Ask the admin to set up today's Busdle template in the Add Bus page.
              </p>
              <div className="text-center">
                <span className="text-white/50 text-sm">Check back later!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
      <NavBar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🎯 Busdle
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-4">
            Guess the order of buses that arrived this morning!
          </p>
          <div className="flex justify-center gap-6 text-white/60 mb-6">
            <span>🚌 Total Buses: {currentTemplate.busOrder.length}</span>
            <span>🔢 Unique Buses: {currentTemplate.uniqueBusCount}</span>
            <span>🎮 Guesses: {guesses.length}</span>
          </div>

          {/* Mode Selection - Only show before first guess */}
          {guesses.length === 0 && !gameWon && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Choose Your Difficulty
              </h3>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setGameMode('hard')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    gameMode === 'hard'
                      ? 'bg-red-500/20 border-2 border-red-500 text-red-200'
                      : 'bg-white/10 hover:bg-white/20 text-white/70'
                  }`}
                >
                  🔥 Normal Mode
                  <div className="text-xs mt-1">How the game should actually be played</div>
                </button>
                <button
                  onClick={() => setGameMode('easy')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    gameMode === 'easy'
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-200'
                      : 'bg-white/10 hover:bg-white/20 text-white/70'
                  }`}
                >
                  🌟 Wimpy Mode
                  <div className="text-xs mt-1">For wimps who can't count for shit</div>
                </button>
              </div>
              {gameMode === 'easy' && getEffectiveBusBank().length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-white/70 text-sm">
                    Bus bank: {getEffectiveBusBank().length} buses available
                  </p>
                </div>
              )}
              {gameMode === 'easy' && getEffectiveBusBank().length === 0 && (
                <div className="mt-4 text-center">
                  <p className="text-yellow-500/70 text-sm">
                    ⚠️ No bus bank available. Switch to hard mode or ask admin to set one.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Previous Guesses */}
          <div className="space-y-3 mb-6">
            {guesses.map((guess, guessIndex) => (
              <div key={guessIndex} className="flex gap-2 justify-center">
                {guess.buses.map((bus, busIndex) => (
                  <div
                    key={busIndex}
                    className={getTileClasses(guessIndex, busIndex, guess.results[busIndex], guess.isAnimating || false)}
                    style={{
                      animationDelay: guess.isAnimating && animatingGuessIndex === guessIndex ? `${busIndex * 100}ms` : '0ms'
                    }}
                  >
                    {bus}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Current Guess Input */}
          {!gameWon && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                {gameMode === 'easy' ? 'Select your guess:' : 'Enter your guess:'}
              </h3>
              
              {/* Show selected buses for easy mode */}
              {gameMode === 'easy' && (
                <div className="flex gap-2 justify-center mb-4">
                  {Array.from({ length: currentTemplate.busOrder.length }, (_, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 text-center text-lg font-bold bg-white/10 border border-white/30 rounded-lg text-white flex items-center justify-center"
                    >
                      {selectedBuses[index] || '?'}
                    </div>
                  ))}
                </div>
              )}

              {/* Hard mode input */}
              {gameMode === 'hard' && (
                <div className="flex gap-2 justify-center mb-4">
                  {inputValues.map((value, index) => (
                    <input
                      key={index}
                      type="text"
                      value={value}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      className="w-16 h-16 text-center text-lg font-bold bg-white/10 border border-white/30 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      placeholder="?"
                      maxLength={3}
                      pattern="[a-zA-Z0-9]*"
                      title="Only letters and numbers are allowed"
                    />
                  ))}
                </div>
              )}

              {/* Submit button for hard mode */}
              {gameMode === 'hard' && (
                <div className="text-center">
                  <button
                    onClick={handleGuess}
                    disabled={currentGuess.length !== currentTemplate.busOrder.length || currentGuess.some(bus => !bus || bus.length === 0) || isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '🎯 Checking...' : '🎯 Submit Guess'}
                  </button>
                </div>
              )}

              {/* Bus keyboard for easy mode */}
              {gameMode === 'easy' && getEffectiveBusBank().length > 0 && (
                <BusKeyboard
                  buses={getEffectiveBusBank()}
                  onBusSelect={handleBusSelect}
                  onBackspace={handleBusBackspace}
                  onEnter={handleBusEnter}
                  disabled={isSubmitting}
                  selectedBuses={selectedBuses}
                  maxLength={currentTemplate.busOrder.length}
                />
              )}

              {/* No bus bank available message */}
              {gameMode === 'easy' && getEffectiveBusBank().length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-white/70 mb-4">
                    No bus bank available for easy mode.
                  </p>
                  <button
                    onClick={() => setGameMode('hard')}
                    className="btn-primary"
                  >
                    Switch to Hard Mode
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Win Screen */}
          {gameWon && (
            <div className="card text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-4">Congratulations!</h2>
              <p className="text-xl text-white/80 mb-4">
                You guessed the bus order correctly!
              </p>
              <p className="text-lg text-white/60 mb-6">
                It took you {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={resetGame} className="btn-secondary">
                  🔄 Play Again
                </button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="card mt-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">How to Play</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xs">42</div>
                <span className="text-white/80">Correct bus in correct position</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-white font-bold text-xs">15</div>
                <span className="text-white/80">Correct bus in wrong position</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-white font-bold text-xs">99</div>
                <span className="text-white/80">Bus not in today's order</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
