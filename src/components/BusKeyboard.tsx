
interface BusKeyboardProps {
  buses: string[];
  onBusSelect: (bus: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
  selectedBuses: string[];
  maxLength: number;
}

// Bus icon component (same as used in other pages)
function BusIcon({ number, isSelected, isDisabled }: { number: string, isSelected: boolean, isDisabled: boolean }) {
  let iconClass = "bus-icon-small ";
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
    <div className={`${iconClass} ${isSelected ? 'bus-icon-selected' : ''} ${isDisabled ? 'bus-icon-disabled' : ''}`}>
      <span className="text-white font-bold text-sm">{displayText}</span>
    </div>
  );
}

export default function BusKeyboard({ 
  buses, 
  onBusSelect, 
  onBackspace, 
  onEnter, 
  disabled = false,
  selectedBuses,
  maxLength
}: BusKeyboardProps) {
  // Calculate how many buses can still be selected
  const remainingSlots = maxLength - selectedBuses.length;
  const canSelectMore = remainingSlots > 0;

  // Sort buses: numerical first (by value), then alphabetical, then alphanumeric
  const sortedBuses = [...buses].sort((a, b) => {
    // Handle Line 1 and Line 2 specially
    if (a === "Line 1" && b === "Line 2") return -1;
    if (a === "Line 2" && b === "Line 1") return 1;
    if (a === "Line 1" || a === "Line 2") return -1;
    if (b === "Line 1" || b === "Line 2") return 1;

    // Check if both are purely numerical
    const aIsNumeric = /^\d+$/.test(a);
    const bIsNumeric = /^\d+$/.test(b);
    
    if (aIsNumeric && bIsNumeric) {
      return parseInt(a) - parseInt(b);
    }
    
    // Check if both are purely alphabetical
    const aIsAlpha = /^[A-Za-z]+$/.test(a);
    const bIsAlpha = /^[A-Za-z]+$/.test(b);
    
    if (aIsAlpha && bIsAlpha) {
      return a.localeCompare(b);
    }
    
    // Mixed types: numeric first, then alpha, then alphanumeric
    if (aIsNumeric && !bIsNumeric) return -1;
    if (!aIsNumeric && bIsNumeric) return 1;
    if (aIsAlpha && !bIsAlpha) return -1;
    if (!aIsAlpha && bIsAlpha) return 1;
    
    // Both alphanumeric or other mixed types
    return a.localeCompare(b);
  });

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Select Buses</h3>
        <p className="text-white/70 text-sm">
          {selectedBuses.length}/{maxLength} selected
          {remainingSlots > 0 && ` • ${remainingSlots} more needed`}
        </p>
      </div>

      {/* Bus grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 mb-6">
        {sortedBuses.map(bus => {
          const isSelected = selectedBuses.includes(bus);
          const isDisabled = disabled || (!isSelected && !canSelectMore);
          
          return (
            <button
              key={bus}
              onClick={() => onBusSelect(bus)}
              disabled={isDisabled}
              className="group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg transition-all duration-200"
            >
              <BusIcon 
                number={bus} 
                isSelected={isSelected}
                isDisabled={isDisabled}
              />
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBackspace}
          disabled={disabled || selectedBuses.length === 0}
          className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-white/5 disabled:text-white/30 text-yellow-200 font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
        >
          ⌫ Remove Last
        </button>
        <button
          onClick={onEnter}
          disabled={disabled || selectedBuses.length !== maxLength}
          className="flex-1 bg-green-500/20 hover:bg-green-500/30 disabled:bg-white/5 disabled:text-white/30 text-green-200 font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
        >
          ✓ Submit Guess
        </button>
      </div>
    </div>
  );
}
