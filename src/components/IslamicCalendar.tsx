import { useState } from 'react';
import {
  Coordinates,
  PrayerSettings,
  calculatePrayerTimes,
  formatPrayerTime,
  getHijriDate,
} from '../services/prayerTimes';
import {
  ISLAMIC_EVENTS,
  IslamicEvent,
  EventCategory,
  getEventsForHijriDay,
  getUpcomingIslamicEvents,
} from '../services/islamicEvents';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Heart,
  BookOpen,
  Info,
  Clock,
  Filter,
  X,
  Star,
} from 'lucide-react';

interface IslamicCalendarProps {
  userCoords: Coordinates;
  settings: PrayerSettings;
}

export default function IslamicCalendar({ userCoords, settings }: IslamicCalendarProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: Date;
    hijri: ReturnType<typeof getHijriDate>;
    events: IslamicEvent[];
  } | null>(() => {
    const today = new Date();
    const hijri = getHijriDate(today, settings.hijriOffsetDays);
    const events = getEventsForHijriDay(hijri.monthIndex + 1, hijri.day);
    return { date: today, hijri, events };
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEventModal, setActiveEventModal] = useState<IslamicEvent | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  // Navigation handlers
  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleResetToday = () => {
    const now = new Date();
    setViewDate(now);
    const hijri = getHijriDate(now, settings.hijriOffsetDays);
    setSelectedDayEvents({
      date: now,
      hijri,
      events: getEventsForHijriDay(hijri.monthIndex + 1, hijri.day),
    });
  };

  // Calendar matrix calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun ... 6 = Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Generate grid days (42 slots: 6 weeks)
  const calendarDays = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    const hijri = getHijriDate(d, settings.hijriOffsetDays);
    const events = getEventsForHijriDay(hijri.monthIndex + 1, hijri.day);
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      dayNum: d.getDate(),
      hijri,
      events,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const hijri = getHijriDate(d, settings.hijriOffsetDays);
    const events = getEventsForHijriDay(hijri.monthIndex + 1, hijri.day);
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    calendarDays.push({
      date: d,
      isCurrentMonth: true,
      dayNum: day,
      hijri,
      events,
      isToday,
    });
  }

  // Next month leading days
  const remainingCells = 42 - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(year, month + 1, day);
    const hijri = getHijriDate(d, settings.hijriOffsetDays);
    const events = getEventsForHijriDay(hijri.monthIndex + 1, hijri.day);
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      dayNum: day,
      hijri,
      events,
    });
  }

  // Current Hijri Month info for header banner
  const midMonthDate = new Date(year, month, 15);
  const midMonthHijri = getHijriDate(midMonthDate, settings.hijriOffsetDays);
  const upcomingEvents = getUpcomingIslamicEvents(
    midMonthHijri.monthIndex + 1,
    midMonthHijri.day,
    5
  );

  // Filter events list
  const filteredEventsList = ISLAMIC_EVENTS.filter((e) => {
    // Category filter
    if (activeCategoryFilter === 'major' && e.category !== 'major') return false;
    if (activeCategoryFilter === 'ahlulbait' && !e.category.startsWith('ahlulbait')) return false;
    if (activeCategoryFilter === 'wiladat' && e.category !== 'ahlulbait_wiladat') return false;
    if (activeCategoryFilter === 'shahadat' && e.category !== 'ahlulbait_shahadat') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchPerson = (e.personality || '').toLowerCase().includes(q);
      const matchArabic = e.arabicTitle.includes(q);
      return matchTitle || matchDesc || matchPerson || matchArabic;
    }
    return true;
  });

  const getCategoryBadge = (category: EventCategory) => {
    switch (category) {
      case 'major':
        return {
          label: 'Major Islamic Holiday',
          classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'ahlulbait_wiladat':
        return {
          label: 'Ahlul Bait Wiladat (Birth)',
          classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'ahlulbait_shahadat':
        return {
          label: 'Ahlul Bait Shahadat (Martyrdom)',
          classes: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      case 'historical':
        return {
          label: 'Historical Milestone',
          classes: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800',
          dot: 'bg-sky-500',
        };
    }
  };

  const hijriMonthsNames = [
    'Muharram',
    'Safar',
    'Rabi al-Awwal',
    'Rabi al-Thani',
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    'Dhu al-Qi’dah',
    'Dhu al-Hijjah',
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner / Hijri Header Strip */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-4 -bottom-4 opacity-10 text-8xl font-arabic pointer-events-none select-none">
          {midMonthHijri.monthNameArabic}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider font-mono">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>ISLAMIC HIJRI CALENDAR</span>
              <span>·</span>
              <span>YEAR {midMonthHijri.year} AH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white mt-1">
              {midMonthHijri.monthName}{' '}
              <span className="font-arabic font-normal text-emerald-200">
                ({midMonthHijri.monthNameArabic})
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Coinciding with {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.
              Browse universal Islamic holidays and Ahlul Bait (A.S.) wiladat and shahadat commemorations.
            </p>
          </div>

          {/* Quick jump to Today */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToday}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all shadow-sm"
            >
              Jump to Today
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Interactive Calendar, Right is Selected Day & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): The Calendar Grid */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {midMonthHijri.monthName} {midMonthHijri.year} AH
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={d} className={`${i === 5 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const hasEvents = cell.events.length > 0;
              const hasMajor = cell.events.some((e) => e.category === 'major');
              const hasWiladat = cell.events.some((e) => e.category === 'ahlulbait_wiladat');
              const hasShahadat = cell.events.some((e) => e.category === 'ahlulbait_shahadat');

              const isSelected =
                selectedDayEvents &&
                selectedDayEvents.date.getDate() === cell.date.getDate() &&
                selectedDayEvents.date.getMonth() === cell.date.getMonth() &&
                selectedDayEvents.date.getFullYear() === cell.date.getFullYear();

              return (
                <div
                  key={idx}
                  onClick={() =>
                    setSelectedDayEvents({
                      date: cell.date,
                      hijri: cell.hijri,
                      events: cell.events,
                    })
                  }
                  className={`min-h-[72px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40'
                      : cell.isToday
                      ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-transparent text-slate-300 dark:text-slate-700'
                  }`}
                >
                  {/* Top: Gregorian Day & Hijri Day */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono ${
                        cell.isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center'
                          : cell.isCurrentMonth
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Hijri Day badge */}
                    <span className="text-[10px] font-semibold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {cell.hijri.day}
                    </span>
                  </div>

                  {/* Bottom: Event Dot or Title Pills */}
                  <div className="mt-1 space-y-0.5">
                    {hasEvents ? (
                      <div className="space-y-0.5">
                        {cell.events.slice(0, 1).map((ev) => {
                          const badge = getCategoryBadge(ev.category);
                          return (
                            <div
                              key={ev.id}
                              className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${badge.classes}`}
                              title={ev.title}
                            >
                              {ev.title.split('—')[0].split('(')[0]}
                            </div>
                          );
                        })}
                        {cell.events.length > 1 && (
                          <div className="text-[8px] text-slate-400 font-semibold pl-0.5">
                            +{cell.events.length - 1} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-3" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Major Holiday / Eid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Ahlul Bait Wiladat (Birth)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Ahlul Bait Shahadat (Martyrdom)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>Historical Milestone</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Selected Day Detail & Prayers */}
        <div className="lg:col-span-4 space-y-4">
          {selectedDayEvents && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Selected Day Header */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  SELECTED DAY
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDayEvents.hijri.formatted}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDayEvents.date.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {/* Events on this day */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Islamic & Ahlul Bait Events
                </h4>

                {selectedDayEvents.events.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedDayEvents.events.map((ev) => {
                      const badge = getCategoryBadge(ev.category);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setActiveEventModal(ev)}
                          className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-transform ${badge.classes}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                              {badge.label}
                            </span>
                            <span className="text-xs font-arabic">{ev.arabicTitle}</span>
                          </div>
                          <div className="text-xs font-bold">{ev.title}</div>
                          <p className="text-[11px] mt-1 line-clamp-2 opacity-90">
                            {ev.description}
                          </p>
                          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 mt-2 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            <span>Tap to view historical context & recommended a’mal</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
                    No major events recorded on this date.
                  </div>
                )}
              </div>

              {/* Day Prayer Times Snapshot */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Prayer Schedule for this date</span>
                </div>

                {(() => {
                  const dayTimes = calculatePrayerTimes(selectedDayEvents.date, userCoords, settings);
                  return (
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                        <span className="text-slate-400 font-sans">Fajr</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatPrayerTime(dayTimes.fajr, settings.is24Hour)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                        <span className="text-slate-400 font-sans">Dhuhr</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatPrayerTime(dayTimes.dhuhr, settings.is24Hour)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                        <span className="text-slate-400 font-sans">Asr</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatPrayerTime(dayTimes.asr, settings.is24Hour)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                        <span className="text-slate-400 font-sans">Maghrib</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatPrayerTime(dayTimes.maghrib, settings.is24Hour)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Islamic & Ahlul Bait Events Explorer & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Islamic & Ahlul Bait Milestones Directory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse historical events, holy births (Wiladat), and martyrdoms (Shahadat) across the 12 lunar months
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event, Imam, Prophet, Eid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Milestones' },
            { id: 'major', label: 'Major Islamic Days' },
            { id: 'ahlulbait', label: 'All Ahlul Bait Events' },
            { id: 'wiladat', label: 'Ahlul Bait Wiladat' },
            { id: 'shahadat', label: 'Ahlul Bait Shahadat' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                activeCategoryFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEventsList.map((ev) => {
            const badge = getCategoryBadge(ev.category);
            const monthName = hijriMonthsNames[ev.hijriMonth - 1];

            return (
              <div
                key={ev.id}
                onClick={() => setActiveEventModal(ev)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {ev.hijriDay} {monthName}
                    </span>
                    <span className="font-arabic text-xs text-slate-500 dark:text-slate-400">
                      {ev.arabicTitle}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {ev.title}
                  </h4>

                  {ev.personality && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Honoring: <strong className="text-slate-700 dark:text-slate-300">{ev.personality}</strong>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {ev.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${badge.classes}`}>
                    {badge.label}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
                    View A’mal →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details & A’mal Modal */}
      {activeEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {activeEventModal.hijriDay} {hijriMonthsNames[activeEventModal.hijriMonth - 1]}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {getCategoryBadge(activeEventModal.category).label}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  {activeEventModal.title}
                </h3>
                <p className="font-arabic text-lg text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {activeEventModal.arabicTitle}
                </p>
              </div>

              <button
                onClick={() => setActiveEventModal(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description & Context
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                  {activeEventModal.description}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Historical & Spiritual Significance
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeEventModal.significance}
                </p>
              </div>

              {activeEventModal.recommendedAmal && activeEventModal.recommendedAmal.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recommended Acts of Worship (A’mal)</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                    {activeEventModal.recommendedAmal.map((amal, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{amal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setActiveEventModal(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
