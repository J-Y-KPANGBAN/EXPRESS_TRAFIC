import React, { useState } from 'react';
import './SeatSelector.css';

const SeatSelector = ({ 
  availableSeats, 
  selectedSeats, 
  onSeatSelect,
  maxSelection = 1 
}) => {
  const [selected, setSelected] = useState(selectedSeats || []);

  const handleSeatClick = (seatNumber) => {
    let newSelected = [...selected];
    
    if (newSelected.includes(seatNumber)) {
      newSelected = newSelected.filter(seat => seat !== seatNumber);
    } else {
      if (newSelected.length >= maxSelection) {
        newSelected.shift();
      }
      newSelected.push(seatNumber);
    }
    
    setSelected(newSelected);
    onSeatSelect(newSelected);
  };

  return (
    <div className="seat-selector">
      <div className="bus-layout">
        {availableSeats.map(seat => (
          <button
            key={seat.number}
            className={`seat ${selected.includes(seat.number) ? 'selected' : ''} ${seat.available ? 'available' : 'occupied'}`}
            onClick={() => seat.available && handleSeatClick(seat.number)}
            disabled={!seat.available}
          >
            {seat.number}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeatSelector;