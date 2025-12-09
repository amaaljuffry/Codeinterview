// RetroCalendar - Calendar component with RetroUI styling
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-day-picker/dist/style.css'

export const RetroCalendar = ({ 
  selected, 
  onSelect, 
  mode = 'single',
  disabled,
  fromDate,
  toDate,
  className = '',
  scheduledDates = [], // Array of dates that have scheduled events
}) => {
  const [month, setMonth] = useState(selected || new Date())

  // Check if a day has scheduled events
  const hasEvent = (date) => {
    return scheduledDates.some(eventDate => isSameDay(new Date(eventDate), date))
  }

  return (
    <div className={`bg-white border-2 border-black rounded-2xl p-4 shadow-xl ${className}`}>
      <DayPicker
        mode={mode}
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        disabled={disabled}
        fromDate={fromDate}
        toDate={toDate}
        showOutsideDays
        modifiers={{
          hasEvent: (date) => hasEvent(date),
        }}
        modifiersClassNames={{
          hasEvent: 'retro-has-event',
        }}
        classNames={{
          months: 'flex flex-col',
          month: 'space-y-4',
          caption: 'flex justify-between items-center px-2 mb-4',
          caption_label: 'text-lg font-black text-black',
          nav: 'flex gap-2',
          nav_button: 'w-8 h-8 bg-gray-100 hover:bg-[var(--primary)] rounded-lg border-2 border-black flex items-center justify-center transition-colors',
          nav_button_previous: '',
          nav_button_next: '',
          table: 'w-full border-collapse',
          head_row: 'flex mb-2',
          head_cell: 'text-gray-500 font-bold text-sm w-10 text-center',
          row: 'flex w-full',
          cell: 'p-0 text-center',
          day: 'w-10 h-10 rounded-lg font-medium text-black hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer',
          day_selected: 'bg-[var(--primary)] text-black font-bold border-2 border-black shadow-[0_2px_0_0_#000] hover:bg-[var(--primary-hover)]',
          day_today: 'border-2 border-black font-bold',
          day_outside: 'text-gray-300',
          day_disabled: 'text-gray-300 cursor-not-allowed hover:bg-transparent',
          day_hidden: 'invisible',
        }}
        components={{
          IconLeft: () => <ChevronLeft className="w-4 h-4" />,
          IconRight: () => <ChevronRight className="w-4 h-4" />,
        }}
      />
      
      {/* Legend */}
      {scheduledDates.length > 0 && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[var(--accent)] border border-black"></div>
            <span className="text-gray-600 font-medium">Scheduled</span>
          </div>
        </div>
      )}
      
      <style>{`
        .retro-has-event {
          position: relative;
        }
        .retro-has-event::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          border: 1px solid black;
        }
      `}</style>
    </div>
  )
}

// Simple date input with calendar popup
export const RetroDatePicker = ({ 
  label, 
  value, 
  onChange, 
  placeholder = 'Select date',
  minDate,
  maxDate,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-bold mb-2 text-black">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-left font-medium text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-colors"
      >
        {value ? format(value, 'PPP') : <span className="text-gray-400">{placeholder}</span>}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-2 z-50">
            <RetroCalendar
              selected={value}
              onSelect={(date) => {
                onChange(date)
                setIsOpen(false)
              }}
              fromDate={minDate}
              toDate={maxDate}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default RetroCalendar
