// C:\Users\Jean-YvesDG\Downloads\ExpressTrafic\frontend\src\Components\UI\Calendar\Calendar.js
import React from "react";
import { convertToDisplayDate } from "../../../utils/dateFormatter";
import "./Calendar.css";

const Calendar = ({ label, value, onChange, required = false, error }) => {
  // Conversion jj/mm/aaaa → YYYY-MM-DD pour l'input date
  const formatForInput = (dateString) => {
    if (!dateString) return '';
    
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateString;
  };

  const handleChange = (e) => {
    const inputDate = e.target.value;
    
    if (inputDate) {
      // Conversion YYYY-MM-DD → jj/mm/yyyy
      const [year, month, day] = inputDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  return (
    <div className="calendar-container">
      {label && (
        <label className="calendar-label">
          {label} {required && '**'}
        </label>
      )}
      
      <input
        type="date"
        className={`calendar-input ${error ? 'calendar-input-error' : ''}`}
        value={formatForInput(value)}
        onChange={handleChange}
        required={required}
        max={new Date().toISOString().split('T')[0]} // Pas de dates futures
      />
      
      {/* Affichage du format et de la date convertie */}
      <div className="calendar-hint">
        <small>Format: jj/mm/aaaa</small>
        {value && (
          <small className="calendar-preview">
            Saisie: {convertToDisplayDate(value)}
          </small>
        )}
      </div>
      
      {error && <div className="calendar-error">{error}</div>}
    </div>
  );
};

export default Calendar;