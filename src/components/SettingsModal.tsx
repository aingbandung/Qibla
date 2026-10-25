import { useState } from 'react';
import {
  CALCULATION_METHODS,
  CalculationMethodId,
  HighLatitudeRule,
  JuristicMethod,
  PrayerSettings,
} from '../services/prayerTimes';
import { soundService, SoundProfile } from '../services/soundService';
import {
  X,
  Volume2,
  Bell,
  Sliders,
  SlidersHorizontal,
  Clock,
  RotateCcw,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrayerSettings;
  onSaveSettings: (settings: PrayerSettings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<PrayerSettings>(settings);
  const [activeTab, setActiveTab] = useState<'methods' | 'adjustments' | 'notifications' | 'display'>('methods');
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    soundService.getNotificationPermission()
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleTestSound = (profile?: SoundProfile) => {
    setIsPlayingTest(true);
    soundService.playProfile(profile || localSettings.soundProfile, localSettings.audioVolume);
    setTimeout(() => setIsPlayingTest(false), 2000);
  };

  const handleRequestPermission = async () => {
    const res = await soundService.requestNotificationPermission();
    setNotifPermission(res);
  };

  const handleSendTestNotification = () => {
    soundService.showNotification('Adhan Alert · Qibla & Sholat', {
      body: 'Time for prayer! Hayya alas-salah (Come to prayer).',
    });
    soundService.playProfile(localSettings.soundProfile, localSettings.audioVolume);
  };

  const updateAdjustment = (prayer: keyof typeof localSettings.adjustments, delta: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [prayer]: Math.max(-30, Math.min(30, prev.adjustments[prayer] + delta)),
      },
    }));
  };

  const resetAdjustments = () => {
    setLocalSettings((prev) => ({
      ...prev,
      adjustments: {
        imsak: 0,
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Prayer Settings & Customization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculation methods, minute tuning & adhan sound alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'methods', label: 'Calculation Methods' },
            { id: 'adjustments', label: 'Custom Timing Adjustments' },
            { id: 'notifications', label: 'Adhan & Sounds' },
            { id: 'display', label: 'Display & Calendar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Calculation Methods */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Calculation Method (Convention)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(CALCULATION_METHODS).map((m) => {
                    const isSelected = localSettings.method === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            method: m.id as CalculationMethodId,
                          }))
                        }
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {m.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {m.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Juristic Method */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Asr Juristic Method (School of Thought)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings((prev) => ({ ...prev, juristic: 'standard' }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      localSettings.juristic === 'standard'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Standard (Shafi'i, Maliki, Hanbali, Jaffari)</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Shadow factor 1: Shadow equals object length
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocalSettings((prev) => ({ ...prev, juristic: 'hanafi' }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      localSettings.juristic === 'hanafi'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Hanafi</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Shadow factor 2: Shadow equals twice object length
                    </div>
                  </button>
                </div>
              </div>

              {/* High Latitude Rule */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  High Latitude Adjustment Rule
                </label>
                <select
                  value={localSettings.highLatitudeRule}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      highLatitudeRule: e.target.value as HighLatitudeRule,
                    }))
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="angle_based">Angle-Based (Recommended for northern regions)</option>
                  <option value="middle_of_the_night">Middle of the Night (Fajr/Isha half of night)</option>
                  <option value="seventh_of_the_night">Seventh of the Night</option>
                  <option value="none">None (Standard formula)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Timing Adjustments */}
          {activeTab === 'adjustments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fine-tune each prayer time by +/- 30 minutes to match your local mosque schedule or official timetable.
                </p>
                <button
                  type="button"
                  onClick={resetAdjustments}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'imsak', label: 'Imsak' },
                  { key: 'fajr', label: 'Fajr (Subuh)' },
                  { key: 'sunrise', label: 'Sunrise (Syuruq)' },
                  { key: 'dhuhr', label: 'Dhuhr (Dzuhur)' },
                  { key: 'asr', label: 'Asr (Ashar)' },
                  { key: 'maghrib', label: 'Maghrib' },
                  { key: 'isha', label: 'Isha (Isya)' },
                ].map(({ key, label }) => {
                  const val = localSettings.adjustments[key as keyof typeof localSettings.adjustments];
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {label}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {val > 0 ? `+${val} min` : val < 0 ? `${val} min` : 'No adjustment'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateAdjustment(key as keyof typeof localSettings.adjustments, -1)
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold tabular-nums">
                          {val}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateAdjustment(key as keyof typeof localSettings.adjustments, 1)
                          }
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Notifications & Sounds */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Permission Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Browser Adhan Notifications
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Status: <span className="capitalize font-semibold">{notifPermission}</span>
                    </div>
                  </div>
                </div>

                {notifPermission !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Allow Notifications
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Send Test Alert
                  </button>
                )}
              </div>

              {/* Selectable Sound Profiles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Adhan Alert Sound Profile
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestSound()}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlayingTest ? 'Playing...' : 'Test Selected'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'makkah',
                      name: 'Makkah Adhan Melody',
                      desc: 'Sacred melodic vocal tones inspired by the Grand Mosque',
                    },
                    {
                      id: 'takbeer',
                      name: 'Takbeer Al-Haram',
                      desc: 'Resonant Allahu Akbar phrasing call',
                    },
                    {
                      id: 'chime',
                      name: 'Gentle Morning Chime',
                      desc: 'Peaceful acoustic bell harmony',
                    },
                    {
                      id: 'bowl',
                      name: 'Singing Bowl Tone',
                      desc: 'Deep warm resonant meditation tone',
                    },
                    {
                      id: 'silent',
                      name: 'Silent / Notification Only',
                      desc: 'Visual push alert and vibration without audio',
                    },
                  ].map((s) => {
                    const isSelected = localSettings.soundProfile === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setLocalSettings((prev) => ({
                            ...prev,
                            soundProfile: s.id as SoundProfile,
                          }));
                          if (s.id !== 'silent') {
                            handleTestSound(s.id as SoundProfile);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {s.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Audio Volume
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {Math.round(localSettings.audioVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.audioVolume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    setLocalSettings((prev) => ({ ...prev, audioVolume: vol }));
                    soundService.setVolume(vol);
                  }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Display & Calendar */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Time Format */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Time Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocalSettings((prev) => ({ ...prev, is24Hour: false }))}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      !localSettings.is24Hour
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-900 dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-sm">12-Hour (05:45 PM)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">AM / PM standard</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalSettings((prev) => ({ ...prev, is24Hour: true }))}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      localSettings.is24Hour
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-900 dark:text-emerald-300 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-sm">24-Hour (17:45)</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Military time</div>
                  </button>
                </div>
              </div>

              {/* Hijri Moon Sighting Offset */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Hijri Calendar Moon Sighting Offset
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Adjust by 1 or 2 days according to your local regional moon sighting declaration.
                </p>

                <div className="flex items-center gap-2">
                  {[-2, -1, 0, 1, 2].map((offset) => (
                    <button
                      key={offset}
                      type="button"
                      onClick={() =>
                        setLocalSettings((prev) => ({ ...prev, hijriOffsetDays: offset }))
                      }
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        localSettings.hijriOffsetDays === offset
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {offset > 0 ? `+${offset}` : offset} d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            Save & Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
