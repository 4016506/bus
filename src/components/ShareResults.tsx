import { useState } from 'react';

interface Guess {
  buses: string[];
  results: ('correct' | 'present' | 'absent')[];
}

interface ShareResultsProps {
  guesses: Guess[];
  templateDate: string;
  gameMode: 'easy' | 'hard';
  onClose: () => void;
}

// Emoji mapping for different result types
const getResultEmoji = (result: 'correct' | 'present' | 'absent'): string => {
  switch (result) {
    case 'correct': return '🟩'; // Green square
    case 'present': return '🟨'; // Yellow square  
    case 'absent': return '⬛'; // Black square
    default: return '⬜'; // White square (fallback)
  }
};

// Helper function to format dates consistently
const formatDate = (dateString: string): string => {
  if (dateString === 'current') {
    return new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Fallback to original string
    }
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (error) {
    return dateString; // Fallback to original string
  }
};

// Generate the shareable text template
const generateShareText = (guesses: Guess[], templateDate: string, gameMode: 'easy' | 'hard'): string => {
  const formattedDate = formatDate(templateDate);
  
  const modeEmoji = gameMode === 'easy' ? '🌟' : '🔥';
  const modeText = gameMode === 'easy' ? 'Wimpy Mode' : 'Normal Mode';
  
  // Performance rating based on number of guesses
  const getPerformanceRating = (guessCount: number): string => {
    if (guessCount === 1) return '🎯 PERFECT!';
    if (guessCount <= 3) return '🏆 EXCELLENT!';
    if (guessCount <= 5) return '👍 GOOD!';
    return '💪 Keep trying!';
  };
  
  let shareText = `🎯 Busdle ${formattedDate} - ${guesses.length} Guess${guesses.length !== 1 ? 'es' : ''} ${modeEmoji}\n`;
  shareText += `${modeText} • ${getPerformanceRating(guesses.length)}\n\n`;
  
  guesses.forEach((guess, index) => {
    const busString = guess.buses.join('-');
    const emojiString = guess.results.map(getResultEmoji).join('');
    shareText += `${busString} ${emojiString}\n`;
  });
  
  shareText += `\n🚌 Play Busdle at your local bus stop!`;
  shareText += `\n#Busdle #Wordle #BusGame`;
  
  return shareText;
};

export default function ShareResults({ guesses, templateDate, gameMode, onClose }: ShareResultsProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  const shareText = generateShareText(guesses, templateDate, gameMode);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🎉 Share Your Results!</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Preview Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                showPreview 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              📱 Preview
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                !showPreview 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              📝 Raw Text
            </button>
          </div>

          {/* Preview Mode */}
          {showPreview && (
            <div className="bg-slate-900 rounded-xl p-6 border border-white/10">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">Your Busdle Results</h3>
                <p className="text-white/70 mb-1">
                  {formatDate(templateDate)} • {guesses.length} Guess{guesses.length !== 1 ? 'es' : ''}
                </p>
                <p className="text-white/60 text-sm">
                  {gameMode === 'easy' ? '🌟 Wimpy Mode' : '🔥 Normal Mode'} • {
                    guesses.length === 1 ? '🎯 PERFECT!' : 
                    guesses.length <= 3 ? '🏆 EXCELLENT!' : 
                    guesses.length <= 5 ? '👍 GOOD!' : '💪 Keep trying!'
                  }
                </p>
              </div>
              
              <div className="space-y-3">
                {guesses.map((guess, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {guess.buses.map((bus, busIndex) => (
                        <div
                          key={busIndex}
                          className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm ${
                            guess.results[busIndex] === 'correct' 
                              ? 'bg-green-500' 
                              : guess.results[busIndex] === 'present'
                              ? 'bg-yellow-500'
                              : 'bg-gray-600'
                          }`}
                        >
                          {bus}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {guess.results.map((result, resultIndex) => (
                        <span key={resultIndex} className="text-lg">
                          {getResultEmoji(result)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-white/60 text-sm">
                  🚌 Play Busdle at your local bus stop!
                </p>
                <p className="text-white/50 text-xs mt-1">
                  #Busdle #Wordle #BusGame
                </p>
              </div>
            </div>
          )}

          {/* Raw Text Mode */}
          {!showPreview && (
            <div className="bg-slate-900 rounded-xl p-6 border border-white/10">
              <pre className="text-white/90 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {shareText}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
            >
              Close
            </button>
          </div>

          {/* Share Instructions */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">💡 How to Share</h4>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Click "Copy to Clipboard" to copy the text</li>
              <li>• Paste it in any messaging app or social media</li>
              <li>• The emojis will show your guess pattern visually</li>
              <li>• Challenge your friends to beat your score!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
