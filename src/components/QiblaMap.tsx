import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { KAABA_COORDS, calculateQibla, Coordinates } from '../services/prayerTimes';
import { Compass, Navigation2, Layers, MapPin, Maximize2, Locate } from 'lucide-react';

interface QiblaMapProps {
  userCoords: Coordinates;
  isDarkMode: boolean;
  onRefreshLocation: () => void;
}

// Generate points along the great circle path between two lat/lng coordinates
function getGreatCirclePoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  numPoints: number = 60
): [number, number][] {
  const d2r = (deg: number) => (deg * Math.PI) / 180;
  const r2d = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = d2r(startLat);
  const lon1 = d2r(startLng);
  const lat2 = d2r(endLat);
  const lon2 = d2r(endLng);

  // Angular distance between points
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
      )
    );

  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = r2d(Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))));
    const lon = r2d(Math.atan2(y, x));

    points.push([lat, lon]);
  }

  return points;
}

export default function QiblaMap({ userCoords, isDarkMode, onRefreshLocation }: QiblaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [zoomLevel, setZoomLevel] = useState<number>(3);

  const qiblaInfo = calculateQibla(userCoords.latitude, userCoords.longitude);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Base Tile layers
    const standardLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    );

    if (mapType === 'satellite') {
      satelliteLayer.addTo(map);
    } else {
      standardLayer.addTo(map);
    }

    // Great circle line points
    const pathPoints = getGreatCirclePoints(
      userCoords.latitude,
      userCoords.longitude,
      KAABA_COORDS.latitude,
      KAABA_COORDS.longitude,
      80
    );

    // Glowing polyline
    const qiblaPolyline = L.polyline(pathPoints, {
      color: '#10b981', // emerald-500
      weight: 3.5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map);

    // User Marker
    const userIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
        <div class="relative w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `;

    const userMarkerIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([userCoords.latitude, userCoords.longitude], {
      icon: userMarkerIcon,
    }).addTo(map);

    userMarker.bindPopup(`
      <div style="font-family: inherit; padding: 2px;">
        <strong style="color: #059669;">Your Location</strong><br/>
        ${userCoords.city || 'Current GPS'}<br/>
        <small style="color: #64748b;">${userCoords.latitude.toFixed(4)}°, ${userCoords.longitude.toFixed(4)}°</small>
      </div>
    `);

    // Kaaba Marker
    const kaabaIconHtml = `
      <div class="relative flex items-center justify-center group cursor-pointer">
        <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center backdrop-blur-sm shadow-xl">
          <div class="w-5 h-5 rounded-lg bg-neutral-900 border border-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-300">
            🕋
          </div>
        </div>
      </div>
    `;

    const kaabaMarkerIcon = L.divIcon({
      html: kaabaIconHtml,
      className: 'custom-kaaba-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const kaabaMarker = L.marker([KAABA_COORDS.latitude, KAABA_COORDS.longitude], {
      icon: kaabaMarkerIcon,
    }).addTo(map);

    kaabaMarker.bindPopup(`
      <div style="font-family: inherit; padding: 4px;">
        <strong style="color: #d97706;">Holy Kaaba (Al-Haram)</strong><br/>
        Makkah al-Mukarramah, KSA<br/>
        <small style="color: #64748b;">Qibla Destination</small>
      </div>
    `);

    // Fit map bounds to show both user and Kaaba
    const bounds = L.latLngBounds([
      [userCoords.latitude, userCoords.longitude],
      [KAABA_COORDS.latitude, KAABA_COORDS.longitude],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [userCoords, mapType]);

  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds([
      [userCoords.latitude, userCoords.longitude],
      [KAABA_COORDS.latitude, KAABA_COORDS.longitude],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
  };

  const handleCenterUser = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([userCoords.latitude, userCoords.longitude], 13, {
      duration: 1.2,
    });
  };

  const handleCenterKaaba = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([KAABA_COORDS.latitude, KAABA_COORDS.longitude], 14, {
      duration: 1.5,
    });
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Info Strip */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Compass className="w-4 h-4" />
            <span>{qiblaInfo.bearing}° {qiblaInfo.directionName}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {qiblaInfo.distanceKm.toLocaleString()} km
            </span>
            <span className="text-slate-400 ml-1">({qiblaInfo.distanceMiles.toLocaleString()} mi)</span>
          </div>
        </div>

        {/* Satellite / Street Switcher */}
        <button
          onClick={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
          title="Toggle Satellite / Street map"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="capitalize">{mapType === 'standard' ? 'Satellite' : 'Street'}</span>
        </button>
      </div>

      {/* Floating Action Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleFitRoute}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Fit full path to Kaaba"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleCenterUser}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Zoom to My Location"
        >
          <Locate className="w-4 h-4" />
        </button>
        <button
          onClick={handleCenterKaaba}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md flex items-center justify-center text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Zoom to Kaaba (Makkah)"
        >
          <span className="text-base">🕋</span>
        </button>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800/70 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>You</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t border-dashed border-emerald-500"></span>
          <span>Great Circle Path</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <div className="flex items-center gap-1">
          <span>🕋</span>
          <span>Kaaba, Makkah</span>
        </div>
      </div>
    </div>
  );
}
