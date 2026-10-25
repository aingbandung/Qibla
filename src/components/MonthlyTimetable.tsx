import { useState } from 'react';
import {
  Coordinates,
  PrayerSettings,
  calculatePrayerTimes,
  formatPrayerTime,
  getHijriDate,
} from '../services/prayerTimes';
import { ChevronLeft, ChevronRight, Printer, Calendar, MapPin } from 'lucide-react';

interface MonthlyTimetableProps {
  userCoords: Coordinates;
  settings: PrayerSettings;
}

export default function MonthlyTimetable({ userCoords, settings }: MonthlyTimetableProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleResetToToday = () => {
    setCurrentMonthDate(new Date());
  };

  // Generate prayer times for each day of the month
  const monthDays = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const times = calculatePrayerTimes(d, userCoords, settings);
    const hijri = getHijriDate(d, settings.hijriOffsetDays);
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    return {
      date: d,
      dayNum: i + 1,
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      hijriStr: `${hijri.day} ${hijri.monthName}`,
      times,
      isToday,
    };
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Month Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {currentMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userCoords.city || 'Current GPS Location'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Current Month
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      {/* Timetable Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Day</th>
                <th className="py-3 px-3">Hijri</th>
                <th className="py-3 px-3">Imsak</th>
                <th className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-bold">Fajr</th>
                <th className="py-3 px-3">Sunrise</th>
                <th className="py-3 px-3 font-bold">Dhuhr</th>
                <th className="py-3 px-3 font-bold">Asr</th>
                <th className="py-3 px-3 text-emerald-700 dark:text-emerald-400 font-bold">Maghrib</th>
                <th className="py-3 px-3 font-bold">Isha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono tabular-nums">
              {monthDays.map((item) => {
                const isFri = item.dayName === 'Fri';
                return (
                  <tr
                    key={item.dayNum}
                    className={`transition-colors ${
                      item.isToday
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/50 font-semibold text-emerald-950 dark:text-emerald-200'
                        : isFri
                        ? 'bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-sans font-medium whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                        {String(item.dayNum).padStart(2, '0')}
                      </span>
                      <span className={`${isFri ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {item.dayName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {item.hijriStr}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      {formatPrayerTime(item.times.imsak, settings.is24Hour)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-emerald-300">
                      {formatPrayerTime(item.times.fajr, settings.is24Hour)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      {formatPrayerTime(item.times.sunrise, settings.is24Hour)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      {formatPrayerTime(item.times.dhuhr, settings.is24Hour)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      {formatPrayerTime(item.times.asr, settings.is24Hour)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-emerald-300">
                      {formatPrayerTime(item.times.maghrib, settings.is24Hour)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      {formatPrayerTime(item.times.isha, settings.is24Hour)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
