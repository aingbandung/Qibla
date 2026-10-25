import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Coordinates,
  PrayerSettings,
  DEFAULT_SETTINGS,
  calculatePrayerTimes,
  POPULAR_CITIES,
} from './services/prayerTimes';
import { soundService } from './services/soundService';
import { getCurrentGPSPosition } from './services/locationService';
import PrayerDashboard from './components/PrayerDashboard';
import QiblaCompass from './components/QiblaCompass';
import QiblaMap from './components/QiblaMap';
import MonthlyTimetable from './components/MonthlyTimetable';
import IslamicCalendar from './components/IslamicCalendar';
import TasbihCounter from './components/TasbihCounter';
import SettingsModal from './components/SettingsModal';
import LocationModal from './components/LocationModal';
import {
  Compass,
  Clock,
  Map as MapIcon,
  Calendar,
  CalendarDays,
  Sparkles,
  SlidersHorizontal,
  Moon,
  Sun,
  MapPin,
  RefreshCw,
} from 'lucide-react';

type NavTab = 'dashboard' | 'compass' | 'map' | 'calendar' | 'schedule' | 'tasbih';

const STORAGE_KEY_SETTINGS = 'qibla_sholat_settings_v1';
const STORAGE_KEY_COORDS = 'qibla_sholat_coords_v1';
const STORAGE_KEY_THEME = 'qibla_sholat_theme_v1';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Settings State
  const [settings, setSettings] = useState<PrayerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Coordinates State (default to Jakarta, Indonesia or Makkah, will auto-update via GPS)
  const [coords, setCoords] = useState<Coordinates>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COORDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default initial location
    return {
      latitude: -6.2088,
      longitude: 106.8456,
      city: 'Jakarta',
      country: 'Indonesia',
      timezone: 7,
    };
  });

  const [isLoadingGPS, setIsLoadingGPS] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Track the last notified prayer to avoid repeat notifications
  const lastNotifiedKeyRef = useRef<string | null>(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDarkMode]);

  // Persist settings
  const handleUpdateSettings = (newSettings: PrayerSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
  };

  // Persist coordinates
  const handleSelectCoords = (newCoords: Coordinates) => {
    setCoords(newCoords);
    localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify(newCoords));
  };

  // GPS Geolocation Handler (Cross-platform Web + Android Capacitor)
  const handleGetGPSLocation = useCallback(async () => {
    setIsLoadingGPS(true);
    try {
      const loc = await getCurrentGPSPosition();
      handleSelectCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
        city: loc.city,
        country: loc.country,
        timezone: loc.timezone,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to retrieve GPS location.';
      console.warn('GPS location retrieval error:', msg);
      alert(`${msg}\nPlease ensure GPS and location permissions are enabled for this app, or pick a city from the list.`);
    } finally {
      setIsLoadingGPS(false);
    }
  }, []);

  // Try GPS automatically on first mount if no saved coords exist
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COORDS);
    if (!saved && 'geolocation' in navigator) {
      handleGetGPSLocation();
    }
  }, [handleGetGPSLocation]);

  // Background prayer times notification & Adhan scheduler ticker
  useEffect(() => {
    const checkPrayerTimes = () => {
      const now = new Date();
      const times = calculatePrayerTimes(now, coords, settings);

      const prayersToCheck: Array<{ key: string; name: string; date: Date }> = [
        { key: 'fajr', name: 'Fajr', date: times.fajr },
        { key: 'dhuhr', name: 'Dhuhr', date: times.dhuhr },
        { key: 'asr', name: 'Asr', date: times.asr },
        { key: 'maghrib', name: 'Maghrib', date: times.maghrib },
        { key: 'isha', name: 'Isha', date: times.isha },
      ];

      const nowTimeMs = now.getTime();

      for (const p of prayersToCheck) {
        if (!settings.enabledAdhans[p.key]) continue;

        const diffSeconds = Math.abs((nowTimeMs - p.date.getTime()) / 1000);
        // If within 45 seconds of the prayer time, and hasn't notified yet for this prayer today
        const prayerDayKey = `${now.toDateString()}_${p.key}`;

        if (diffSeconds < 45 && lastNotifiedKeyRef.current !== prayerDayKey) {
          lastNotifiedKeyRef.current = prayerDayKey;

          // Trigger push notification
          soundService.showNotification(`Time for ${p.name} Prayer`, {
            body: `Allahu Akbar! The time for ${p.name} has arrived (${coords.city || 'your area'}).`,
          });

          // Play configured sound profile
          soundService.playProfile(settings.soundProfile, settings.audioVolume);
          break;
        }
      }
    };

    // Check every 15 seconds
    const interval = setInterval(checkPrayerTimes, 15000);
    return () => clearInterval(interval);
  }, [coords, settings]);

  const navLinks = [
    { id: 'dashboard', label: 'Prayer Times', icon: Clock },
    { id: 'compass', label: 'Qibla Compass', icon: Compass },
    { id: 'map', label: 'Direction Map', icon: MapIcon },
    { id: 'calendar', label: 'Hijri Calendar', icon: CalendarDays },
    { id: 'schedule', label: 'Monthly Timetable', icon: Calendar },
    { id: 'tasbih', label: 'Tasbih', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Brand title, one line
        Zone 2: Clean single-line nav links
        Zone 3: 1 primary action (Settings) + Theme toggle
      */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="flex items-center gap-2 group"
            >
              <img
                src="/app-icon.jpg"
                alt="Qibla App Icon"
                className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-emerald-500/30 group-hover:scale-105 transition-transform shrink-0"
              />
              <span className="text-base sm:text-lg font-extrabold tracking-tight font-display text-slate-900 dark:text-white whitespace-nowrap">
                Qibla and Sholat by FF
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {navLinks.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
                      : ''
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 rounded-xl transition-all shadow-sm whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <PrayerDashboard
            userCoords={coords}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToCompass={() => setActiveTab('compass')}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onRefreshGPS={handleGetGPSLocation}
            isLoadingGPS={isLoadingGPS}
          />
        )}

        {activeTab === 'compass' && (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Qibla Compass
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time gyroscope & magnetic orientation directly pointing toward the Kaaba in Makkah
              </p>
            </div>

            <QiblaCompass userCoords={coords} />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                  Qibla Direction Map
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Great-circle geodesic arc from your location to the Holy Kaaba (Al-Masjid Al-Haram, Makkah)
                </p>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Change Location</span>
              </button>
            </div>

            <QiblaMap
              userCoords={coords}
              isDarkMode={isDarkMode}
              onRefreshLocation={handleGetGPSLocation}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <IslamicCalendar userCoords={coords} settings={settings} />
        )}

        {activeTab === 'schedule' && (
          <MonthlyTimetable userCoords={coords} settings={settings} />
        )}

        {activeTab === 'tasbih' && (
          <div className="space-y-4">
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                Digital Tasbih & Dhikr
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Remembrance of Allah with tactile counter, target laps, and vibrational feedback
              </p>
            </div>

            <TasbihCounter />
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Strictly >= 44px touch targets) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-bottom">
        <div className="grid grid-cols-6 items-center h-16">
          {navLinks.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NavTab)}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors px-0.5 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[9px] tracking-tight mt-1 truncate max-w-[54px]">
                  {tab.id === 'dashboard'
                    ? 'Prayer'
                    : tab.id === 'calendar'
                    ? 'Hijri'
                    : tab.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCoords={coords}
        onSelectCoords={handleSelectCoords}
        onUseCurrentGPS={handleGetGPSLocation}
        isLoadingGPS={isLoadingGPS}
      />
    </div>
  );
}
