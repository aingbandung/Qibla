import { useState, useEffect } from 'react';
import {
  Coordinates,
  PrayerSettings,
  PrayerTimesResult,
  calculatePrayerTimes,
  getNextPrayerInfo,
  formatPrayerTime,
  formatCountdown,
  getHijriDate,
  CALCULATION_METHODS,
} from '../services/prayerTimes';
import { soundService } from '../services/soundService';
import {
  Bell,
  BellOff,
  Clock,
  Compass,
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Sparkles,
  CalendarDays,
  Volume2,
} from 'lucide-react';

interface PrayerDashboardProps {
  userCoords: Coordinates;
  settings: PrayerSettings;
  onUpdateSettings: (newSettings: PrayerSettings) => void;
  onNavigateToCompass: () => void;
  onOpenLocationModal: () => void;
  onRefreshGPS: () => void;
  isLoadingGPS: boolean;
}

export default function PrayerDashboard({
  userCoords,
  settings,
  onUpdateSettings,
  onNavigateToCompass,
  onOpenLocationModal,
  onRefreshGPS,
  isLoadingGPS,
}: PrayerDashboardProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keep live second ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayTimes = calculatePrayerTimes(currentTime, userCoords, settings);
  const nextPrayer = getNextPrayerInfo(todayTimes, currentTime);
  const countdown = formatCountdown(nextPrayer.secondsRemaining);
  const hijri = getHijriDate(currentTime, settings.hijriOffsetDays);

  const toggleAdhan = (prayerKey: string) => {
    const updated = {
      ...settings,
      enabledAdhans: {
        ...settings.enabledAdhans,
        [prayerKey]: !settings.enabledAdhans[prayerKey],
      },
    };
    onUpdateSettings(updated);
  };

  // Prayer list definition
  const prayerList = [
    {
      key: 'imsak',
      name: 'Imsak',
      arabic: 'الإمساك',
      time: todayTimes.imsak,
      icon: Moon,
      isFasting: true,
      canAlert: false,
    },
    {
      key: 'fajr',
      name: 'Fajr',
      arabic: 'الفجر',
      time: todayTimes.fajr,
      icon: Sunrise,
      isFasting: true,
      canAlert: true,
    },
    {
      key: 'sunrise',
      name: 'Sunrise',
      arabic: 'الشروق',
      time: todayTimes.sunrise,
      icon: Sun,
      isFasting: false,
      canAlert: false,
    },
    {
      key: 'dhuhr',
      name: 'Dhuhr',
      arabic: 'الظهر',
      time: todayTimes.dhuhr,
      icon: Sun,
      isFasting: false,
      canAlert: true,
    },
    {
      key: 'asr',
      name: 'Asr',
      arabic: 'العصر',
      time: todayTimes.asr,
      icon: Sun,
      isFasting: false,
      canAlert: true,
    },
    {
      key: 'maghrib',
      name: 'Maghrib',
      arabic: 'المغرب',
      time: todayTimes.maghrib,
      icon: Sunset,
      isFasting: true,
      canAlert: true,
    },
    {
      key: 'isha',
      name: 'Isha',
      arabic: 'العشاء',
      time: todayTimes.isha,
      icon: Moon,
      isFasting: false,
      canAlert: true,
    },
  ];

  // Daily spiritual reflection quote
  const dailyVerses = [
    {
      arabic: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
      translation: 'Indeed, prayer has been decreed upon the believers at specified times.',
      reference: 'Surah An-Nisa (4:103)',
    },
    {
      arabic: 'وَأَقِمِ الصَّلَاةَ لِذِكْرِي',
      translation: 'And establish prayer for My remembrance.',
      reference: 'Surah Taha (20:14)',
    },
    {
      arabic: 'حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ',
      translation: 'Maintain with care the [obligatory] prayers and [in particular] the middle prayer.',
      reference: 'Surah Al-Baqarah (2:238)',
    },
    {
      arabic: 'فَإِذَا فَرَغْتَ فَانصَبْ وَإِلَىٰ رَبِّكَ فَارْغَب',
      translation: 'So when you have finished [your duties], then stand up [for worship], and to your Lord direct your longing.',
      reference: 'Surah Ash-Sharh (94:7-8)',
    },
  ];

  const currentVerse = dailyVerses[currentTime.getDay() % dailyVerses.length];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {hijri.formatted}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {currentTime.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onOpenLocationModal}
              className="group flex items-center gap-1.5 text-slate-900 dark:text-white font-semibold text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{userCoords.city || 'Current GPS Location'}</span>
              {userCoords.country && (
                <span className="text-slate-500 font-normal">({userCoords.country})</span>
              )}
            </button>

            <button
              onClick={onRefreshGPS}
              disabled={isLoadingGPS}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGPS ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active calculation method indicator */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right hidden md:block">
            <div className="text-[11px] text-slate-400">Calculation Method</div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {CALCULATION_METHODS[settings.method]?.name.split('(')[0] || 'Standard'}
            </div>
          </div>

          <button
            onClick={onNavigateToCompass}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Compass className="w-4 h-4" />
            <span>Open Compass</span>
          </button>
        </div>
      </div>

      {/* Dominant Hero Focal Anchor: Next Prayer Countdown */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Subtle Islamic Geometric Watermark Accent */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none text-9xl font-arabic">
          ۞
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Next Prayer Info & Countdown */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold font-mono">
                UPCOMING PRAYER
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">
                Currently: <strong className="text-slate-200">{nextPrayer.currentName}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white">
                {nextPrayer.nextName}
              </h1>
              <span className="text-xl sm:text-2xl font-arabic text-emerald-300/80">
                {prayerList.find((p) => p.key === nextPrayer.nextKey)?.arabic || ''}
              </span>
              <div className="text-sm font-medium text-slate-300 ml-auto md:ml-0 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                at {formatPrayerTime(nextPrayer.nextTime, settings.is24Hour)}
              </div>
            </div>

            {/* Countdown Clock (Tabular numerals) */}
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white tabular-nums">
                    {countdown.display}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  <div>Remaining</div>
                  <div className="text-[10px] text-emerald-400 font-mono">until Adhan</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${nextPrayer.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Qibla Glance & Fasting Status */}
          <div className="md:col-span-4 flex flex-col gap-3 md:border-l md:border-slate-800 md:pl-6">
            <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Fasting Window (Today)
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs">
                <div>
                  <span className="text-slate-400">Imsak: </span>
                  <span className="font-semibold text-white tabular-nums">
                    {formatPrayerTime(todayTimes.imsak, settings.is24Hour)}
                  </span>
                </div>
                <span className="text-slate-600">→</span>
                <div>
                  <span className="text-slate-400">Maghrib: </span>
                  <span className="font-semibold text-emerald-400 tabular-nums">
                    {formatPrayerTime(todayTimes.maghrib, settings.is24Hour)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                  Last 3rd of Night (Tahajjud)
                </div>
                <div className="text-sm font-semibold text-white tabular-nums mt-0.5">
                  {formatPrayerTime(todayTimes.tahajjud, settings.is24Hour)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                  Midnight
                </div>
                <div className="text-sm font-semibold text-slate-300 tabular-nums mt-0.5">
                  {formatPrayerTime(todayTimes.midnight, settings.is24Hour)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Prayers Schedule Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Daily Prayers Schedule</span>
            <span className="text-xs font-normal text-slate-500">
              ({settings.is24Hour ? '24-hour' : '12-hour format'})
            </span>
          </h2>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Adhan Notifications: <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{settings.soundProfile}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {prayerList.map((prayer) => {
            const isNext = prayer.key === nextPrayer.nextKey;
            const isCurrent = prayer.key === nextPrayer.currentKey;
            const IconComponent = prayer.icon;
            const isAlertEnabled = settings.enabledAdhans[prayer.key] ?? false;

            return (
              <div
                key={prayer.key}
                className={`relative p-4 rounded-2xl border transition-all ${
                  isNext
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : isCurrent
                    ? 'bg-slate-50 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Row: Icon + Arabic */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isNext
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <span className="font-arabic text-sm text-slate-500 dark:text-slate-400">
                    {prayer.arabic}
                  </span>
                </div>

                {/* Prayer Title */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-semibold tracking-tight ${
                      isNext
                        ? 'text-emerald-900 dark:text-emerald-300'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {prayer.name}
                  </span>
                  {isNext && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      Next
                    </span>
                  )}
                </div>

                {/* Prayer Time */}
                <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatPrayerTime(prayer.time, settings.is24Hour)}
                </div>

                {/* Bottom Row: Adhan Alert Toggle */}
                {prayer.canAlert && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Adhan Alert</span>
                    <button
                      onClick={() => toggleAdhan(prayer.key)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isAlertEnabled
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isAlertEnabled ? 'Adhan alert on' : 'Adhan alert off'}
                    >
                      {isAlertEnabled ? (
                        <Bell className="w-3.5 h-3.5" />
                      ) : (
                        <BellOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Spiritual Reflection / Quranic Quote */}
      <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spiritual Reflection</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-normal">{currentVerse.reference}</span>
          </div>
          <p className="font-arabic text-lg text-slate-800 dark:text-slate-200 mt-1">
            {currentVerse.arabic}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 italic">
            "{currentVerse.translation}"
          </p>
        </div>

        <button
          onClick={() => soundService.playProfile(settings.soundProfile, settings.audioVolume)}
          className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Preview Adhan Tone</span>
        </button>
      </div>
    </div>
  );
}
