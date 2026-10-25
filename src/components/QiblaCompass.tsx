import { useState } from 'react';
import { calculateQibla, Coordinates } from '../services/prayerTimes';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import {
  Compass as CompassIcon,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Sliders,
  Smartphone,
  Navigation,
  Info,
} from 'lucide-react';

interface QiblaCompassProps {
  userCoords: Coordinates;
}

export default function QiblaCompass({ userCoords }: QiblaCompassProps) {
  const qibla = calculateQibla(userCoords.latitude, userCoords.longitude);

  const {
    currentHeading,
    relativeAngle,
    isFacingQibla,
    isSupported,
    permissionGranted,
    needsPermission,
    isSimulated,
    isManualMode,
    setIsManualMode,
    simulatedHeading,
    setSimulatedHeading,
    requestPermission,
  } = useDeviceOrientation(qibla.bearing);

  const [showSimControls, setShowSimControls] = useState<boolean>(isSimulated);

  // Rotation angle for the compass disk:
  // When heading is H, compass rose rotates by -H so North is at -H degrees, and your device points straight up (0° screen).
  const compassDiskRotation = -currentHeading;

  // The Kaaba position relative to North is qibla.bearing.
  // On the rotated disk, Kaaba is located at qibla.bearing degrees from the 'N' marker.
  // The relative turn needed is relativeAngle.

  const turnDirection = relativeAngle > 0 ? 'Right' : 'Left';
  const turnDegrees = Math.abs(Math.round(relativeAngle));

  // Cardinal marks
  const cardinals = [
    { label: 'N', deg: 0, isNorth: true },
    { label: 'E', deg: 90 },
    { label: 'S', deg: 180 },
    { label: 'W', deg: 270 },
  ];

  const ticks = Array.from({ length: 72 }, (_, i) => i * 5); // every 5 degrees

  return (
    <div className="flex flex-col items-center">
      {/* Alignment Status Banner */}
      <div className="w-full max-w-md mb-6">
        <div
          className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-between border ${
            isFacingQibla
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isFacingQibla
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {isFacingQibla ? (
                <CheckCircle2 className="w-5 h-5 animate-bounce" />
              ) : (
                <Navigation
                  className="w-5 h-5 transition-transform"
                  style={{ transform: `rotate(${relativeAngle}deg)` }}
                />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                {isFacingQibla ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    Facing the Holy Kaaba!
                  </span>
                ) : (
                  <span>
                    Turn <strong className="text-slate-900 dark:text-white">{turnDegrees}° {turnDirection}</strong>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Qibla Bearing: <span className="font-semibold">{qibla.bearing}° {qibla.directionName}</span> · Heading: {Math.round(currentHeading)}°
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
              {qibla.distanceKm.toLocaleString()} km
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">to Makkah</div>
          </div>
        </div>
      </div>

      {/* Permission Request for iOS Safari */}
      {needsPermission && !permissionGranted && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 max-w-md w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Enable device orientation for live compass</span>
          </div>
          <button
            onClick={() => requestPermission()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Enable Sensor
          </button>
        </div>
      )}

      {/* Compass Circular Instrument Frame */}
      <div className="relative w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] flex items-center justify-center my-2 select-none">
        {/* Outer Aura Ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            isFacingQibla
              ? 'ring-8 ring-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 scale-102'
              : 'ring-1 ring-slate-200 dark:ring-slate-800'
          }`}
        />

        {/* Outer Fixed Bezel / Top Indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <div
            className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] transition-colors ${
              isFacingQibla ? 'border-t-emerald-500' : 'border-t-red-500'
            }`}
          />
          <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-1">
            Phone Heading
          </div>
        </div>

        {/* Rotating Compass Dial */}
        <div
          className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center transition-transform duration-150 ease-out"
          style={{ transform: `rotate(${compassDiskRotation}deg)` }}
        >
          {/* Degree Ticks */}
          {ticks.map((deg) => {
            const isMajor = deg % 30 === 0;
            const isMedium = deg % 10 === 0;
            return (
              <div
                key={deg}
                className="absolute inset-0 flex justify-center pointer-events-none"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className={`transition-colors ${
                    isMajor
                      ? 'w-[2px] h-3 bg-slate-700 dark:bg-slate-300'
                      : isMedium
                      ? 'w-[1px] h-2 bg-slate-400 dark:bg-slate-600'
                      : 'w-[1px] h-1.5 bg-slate-300 dark:bg-slate-800'
                  }`}
                />
              </div>
            );
          })}

          {/* Cardinal Labels (N, E, S, W) */}
          {cardinals.map(({ label, deg, isNorth }) => (
            <div
              key={label}
              className="absolute inset-2 flex justify-center pointer-events-none"
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <span
                className={`text-xs font-bold font-mono tracking-wider ${
                  isNorth
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                style={{ transform: `rotate(${-deg}deg)` }}
              >
                {label}
              </span>
            </div>
          ))}

          {/* Kaaba Marker on Dial at Qibla Bearing */}
          <div
            className="absolute inset-0 flex justify-center pointer-events-none z-10"
            style={{ transform: `rotate(${qibla.bearing}deg)` }}
          >
            <div className="flex flex-col items-center -mt-3.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-sm">🕋</span>
              </div>
              <div className="w-0.5 h-10 bg-gradient-to-b from-amber-400 to-transparent" />
            </div>
          </div>

          {/* Subtle Inner Concentric Circles */}
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
              {/* Islamic Star / Geometric Accent */}
              <div className="text-slate-300 dark:text-slate-700 text-xs font-arabic">
                ۞
              </div>
            </div>
          </div>
        </div>

        {/* Center Needle & Readout (Fixed relative to device display) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full backdrop-blur-md border shadow-lg flex flex-col items-center justify-center transition-all ${
              isFacingQibla
                ? 'bg-emerald-600 text-white border-emerald-400 scale-105'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="text-sm sm:text-base font-bold font-mono tabular-nums leading-none">
              {Math.round(currentHeading)}°
            </div>
            <div
              className={`text-[9px] uppercase tracking-wider font-semibold mt-0.5 ${
                isFacingQibla
                  ? 'text-emerald-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isFacingQibla ? 'ALIGNED' : 'HEADING'}
            </div>
          </div>
        </div>
      </div>

      {/* Manual / Simulation Controls for Desktop or testing */}
      <div className="w-full max-w-md mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {isManualMode
                ? 'Simulated Mode (Rotate slider to test)'
                : 'Hardware Sensor Active'}
            </span>
          </div>

          <button
            onClick={() => {
              setIsManualMode(!isManualMode);
              setShowSimControls(true);
            }}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            <span>{isManualMode ? 'Use Real Sensor' : 'Manual Rotation'}</span>
          </button>
        </div>

        {(isManualMode || showSimControls) && (
          <div className="p-3.5 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Rotate Device Heading
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsManualMode(true);
                    setSimulatedHeading(qibla.bearing);
                  }}
                  className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 rounded font-medium transition-colors"
                >
                  Snap to Qibla ({qibla.bearing}°)
                </button>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {Math.round(simulatedHeading)}°
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="359"
              value={Math.round(simulatedHeading)}
              onChange={(e) => {
                setIsManualMode(true);
                setSimulatedHeading(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0° (N)</span>
              <span>90° (E)</span>
              <span>180° (S)</span>
              <span>270° (W)</span>
              <span>359°</span>
            </div>
          </div>
        )}

        {/* Helpful calibration tip */}
        <div className="flex items-start gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
          <span>
            Hold your device flat parallel to the ground for peak compass accuracy. Keep away from metallic cases or strong magnetic fields.
          </span>
        </div>
      </div>
    </div>
  );
}
