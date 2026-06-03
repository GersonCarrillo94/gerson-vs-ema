import { useState } from 'react';
import type { Meeting } from '../types';
import { STATUS_CONFIG } from '../types';

interface Props {
  meetings: Meeting[];
  onDaySelect: (date: string) => void;
  selectedDate: string | null;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=Sun → convert to Mon-start: (day + 6) % 7
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${String(year)}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function meetingsOnDay(meetings: Meeting[], dateStr: string): Meeting[] {
  return meetings.filter((m) => m.scheduled_at.startsWith(dateStr));
}

export function MeetingCalendar({ meetings, onDaySelect, selectedDate }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const firstOffset = getFirstDayOfWeek(viewYear, viewMonth);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  // Celda vacía + días del mes
  const cells = Array.from({ length: firstOffset + totalDays }, (_, i) =>
    i < firstOffset ? null : i - firstOffset + 1,
  );

  // Rellenar hasta múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header del mes */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-800 capitalize">{monthName}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
        >
          ›
        </button>
      </div>

      <div className="px-3 pb-3">
        {/* Nombres de días */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas de días */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${String(idx)}`} />;

            const dateStr = toDateStr(viewYear, viewMonth, day);
            const dayMeetings = meetingsOnDay(meetings, dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => { onDaySelect(dateStr); }}
                className={[
                  'relative flex flex-col items-center justify-start py-1.5 rounded-xl transition-colors',
                  isSelected ? 'bg-indigo-600 text-white' : isToday ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-gray-50 text-gray-700',
                ].join(' ')}
              >
                <span className="text-sm leading-none">{day}</span>

                {/* Dots de reuniones */}
                {dayMeetings.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className={[
                          'w-1.5 h-1.5 rounded-full',
                          isSelected ? 'bg-white' : STATUS_CONFIG[m.status].dot,
                        ].join(' ')}
                      />
                    ))}
                    {dayMeetings.length > 3 && (
                      <span className={`text-[9px] leading-none ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        +{String(dayMeetings.length - 3)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-gray-50 bg-gray-50">
        {(['pending', 'confirmed', 'completed', 'missed'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
            <span className="text-xs text-gray-500">{STATUS_CONFIG[s].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
