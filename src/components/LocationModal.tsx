import { useState } from 'react';
import { Coordinates, POPULAR_CITIES, calculateQibla } from '../services/prayerTimes';
import { X, Search, MapPin, Compass, Crosshair, Check } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords: Coordinates;
  onSelectCoords: (coords: Coordinates) => void;
  onUseCurrentGPS: () => void;
  isLoadingGPS: boolean;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentCoords,
  onSelectCoords,
  onUseCurrentGPS,
  isLoadingGPS,
}: LocationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customLat, setCustomLat] = useState(currentCoords.latitude.toString());
  const [customLng, setCustomLng] = useState(currentCoords.longitude.toString());
  const [showCustomForm, setShowCustomForm] = useState(false);

  if (!isOpen) return null;

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onSelectCoords({
        latitude: lat,
        longitude: lng,
        city: 'Custom Location',
        country: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Change Location
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                GPS auto-detection or select world city
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

        {/* GPS Quick Action */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <button
            type="button"
            onClick={() => {
              onUseCurrentGPS();
              onClose();
            }}
            disabled={isLoadingGPS}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Crosshair className={`w-4 h-4 ${isLoadingGPS ? 'animate-spin' : ''}`} />
            <span>Use My Current GPS Location</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search city or country (e.g., Makkah, Jakarta, London...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* City List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Popular Cities Worldwide
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {filteredCities.map((c) => {
              const isSelected =
                Math.abs(currentCoords.latitude - c.lat) < 0.05 &&
                Math.abs(currentCoords.longitude - c.lng) < 0.05;
              const qibla = calculateQibla(c.lat, c.lng);

              return (
                <div
                  key={`${c.name}-${c.country}`}
                  onClick={() => {
                    onSelectCoords({
                      latitude: c.lat,
                      longitude: c.lng,
                      city: c.name,
                      country: c.country,
                      timezone: c.timezone,
                    });
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.country}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {qibla.bearing}° {qibla.directionName}
                    </div>
                    <div>{qibla.distanceKm.toLocaleString()} km</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Coordinates Dropdown */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {showCustomForm ? 'Hide Custom Coordinates' : '+ Enter Custom Latitude & Longitude'}
            </button>

            {showCustomForm && (
              <form onSubmit={handleApplyCustom} className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      placeholder="-6.2088"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      placeholder="106.8456"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Set Custom Location
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
