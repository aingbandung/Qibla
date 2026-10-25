import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Coordinates, POPULAR_CITIES } from './prayerTimes';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: number;
}

/**
 * Finds the nearest known world city for coordinates fallback
 */
export function findNearestCity(lat: number, lng: number) {
  let closest = POPULAR_CITIES[0];
  let minDistance = Infinity;

  for (const city of POPULAR_CITIES) {
    const dLat = city.lat - lat;
    const dLng = city.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = city;
    }
  }

  return closest;
}

/**
 * Robust reverse geocoding with multiple free keyless endpoints
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; country: string }> {
  // Method 1: BigDataCloud free client reverse geocoder (works without API key in web & mobile webviews)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || '';
      const country = data.countryName || '';
      if (city) {
        return { city, country };
      }
    }
  } catch {
    // try fallback
  }

  // Method 2: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state || '';
      const country = addr.country || '';
      if (city) {
        return { city, country };
      }
    }
  } catch {
    // try nearest city fallback
  }

  // Method 3: Nearest city from built-in list if within 150km
  const nearest = findNearestCity(lat, lng);
  const dLat = Math.abs(nearest.lat - lat);
  const dLng = Math.abs(nearest.lng - lng);
  if (dLat < 1.5 && dLng < 1.5) {
    return { city: nearest.name, country: nearest.country };
  }

  // Default coordinate string
  return {
    city: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
    country: '',
  };
}

/**
 * Cross-platform GPS acquisition
 * Works seamlessly on Web, Android Capacitor native, and iOS
 */
export async function getCurrentGPSPosition(): Promise<LocationResult> {
  let lat: number | null = null;
  let lng: number | null = null;

  // Try native Capacitor Geolocation plugin if running in native app
  if (Capacitor.isNativePlatform()) {
    try {
      // Check & request runtime permissions on Android
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const req = await Geolocation.requestPermissions({ permissions: ['location'] });
        if (req.location !== 'granted') {
          throw new Error('Location permission denied on device.');
        }
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      });

      lat = position.coords.latitude;
      lng = position.coords.longitude;
    } catch (nativeErr) {
      console.warn('Native Capacitor Geolocation failed, attempting browser fallback:', nativeErr);
    }
  }

  // Fallback to HTML5 Geolocation API (for web or if native had an issue)
  if (lat === null || lng === null) {
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation is not supported by your device or browser.');
    }

    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      });
    });

    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
  }

  // Perform reverse geocoding to retrieve city name
  const geo = await reverseGeocode(lat, lng);
  const timezone = -new Date().getTimezoneOffset() / 60;

  return {
    latitude: lat,
    longitude: lng,
    city: geo.city,
    country: geo.country,
    timezone,
  };
}
