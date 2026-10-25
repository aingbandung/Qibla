import { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
}

const DHIKR_PRESETS: DhikrItem[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ ٱللَّٰهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah',
  },
  {
    id: 'alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّٰهِ',
    transliteration: 'Alhamdulillah',
    translation: 'All praise is due to Allah',
  },
  {
    id: 'allahuakbar',
    arabic: 'ٱللَّٰهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness from Allah',
  },
  {
    id: 'lailahaillallah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
    transliteration: 'La ilaha illallah',
    translation: 'There is no god but Allah',
  },
  {
    id: 'salawat',
    arabic: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    transliteration: 'Allahumma Salli Ala Muhammad',
    translation: 'O Allah, send blessings upon Muhammad',
  },
  {
    id: 'hasbi',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: "Hasbunallahu wa ni'mal wakeel",
    translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs',
  },
];

export default function TasbihCounter() {
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrItem>(DHIKR_PRESETS[0]);
  const [count, setCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      }
    } catch {
      // ignore
    }
  };

  const increment = () => {
    playClickSound();

    if ('vibrate' in navigator) {
      try {
        if (target !== 0 && count + 1 === target) {
          navigator.vibrate([60, 40, 100]);
        } else {
          navigator.vibrate(25);
        }
      } catch {
        // ignore
      }
    }

    if (target !== 0 && count + 1 >= target) {
      setCount(0);
    } else {
      setCount((prev) => prev + 1);
    }
    setTotalCount((prev) => prev + 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleResetAll = () => {
    setCount(0);
    setTotalCount(0);
  };

  const progressPercent = target > 0 ? (count / target) * 100 : 0;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Dhikr Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          Select Remembrance (Dhikr)
        </label>
        <select
          value={selectedDhikr.id}
          onChange={(e) => {
            const found = DHIKR_PRESETS.find((d) => d.id === e.target.value);
            if (found) {
              setSelectedDhikr(found);
              setCount(0);
            }
          }}
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {DHIKR_PRESETS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.transliteration} — {d.translation}
            </option>
          ))}
        </select>

        {/* Selected Dhikr Display */}
        <div className="mt-4 text-center py-2 space-y-1">
          <p className="font-arabic text-2xl text-slate-900 dark:text-white">
            {selectedDhikr.arabic}
          </p>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {selectedDhikr.transliteration}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            "{selectedDhikr.translation}"
          </div>
        </div>
      </div>

      {/* Target Selector */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Target:</span>
          {[33, 99, 100, 0].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTarget(t);
                setCount(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                target === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t === 0 ? 'Free' : t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200`}
          title={soundEnabled ? 'Mute click' : 'Enable click sound'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Big Tactile Bead / Counter Button */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          {/* Circular SVG Progress */}
          {target > 0 && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                className="stroke-emerald-600 transition-all duration-150 ease-out"
                strokeWidth="6"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (1000 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
          )}

          {/* Clickable Pad */}
          <button
            type="button"
            onClick={increment}
            className="w-52 h-52 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xl active:scale-95 transition-transform flex flex-col items-center justify-center select-none cursor-pointer group"
          >
            <span className="text-5xl sm:text-6xl font-mono font-extrabold text-slate-900 dark:text-white tabular-nums">
              {count}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1">
              {target > 0 ? `/ ${target}` : 'TAP TO COUNT'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mt-2 group-hover:scale-105 transition-transform">
              Tap Anywhere
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Summary & Reset */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-400">Total counted: </span>
          <span className="font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Lap</span>
          </button>

          <button
            onClick={handleResetAll}
            className="text-slate-400 hover:text-red-500 transition-colors text-[11px]"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
