/**
 * Qibla and Prayer Times Astronomical Calculation Engine
 * High-precision solar positioning and juristic methods
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone?: number;
}

export type CalculationMethodId =
  | 'isna'
  | 'umm_al_qura'
  | 'mwl'
  | 'egyptian'
  | 'karachi'
  | 'tehran'
  | 'jaffari'
  | 'kemenag'
  | 'singapore'
  | 'custom';

export interface MethodParams {
  id: CalculationMethodId;
  name: string;
  description: string;
  fajrAngle: number;
  ishaAngle: number; // if ishaMinutes is not set
  ishaMinutes?: number; // Umm al-Qura uses 90 min (120 in Ramadan)
  maghribAngle?: number; // Jaffari & Tehran use twilight angle for Maghrib (eastern redness)
  maghribMinutes?: number;
  midnightMethod: 'standard' | 'jaffari'; // Jaffari: halfway between Sunset and Fajr
}

export const CALCULATION_METHODS: Record<CalculationMethodId, MethodParams> = {
  isna: {
    id: 'isna',
    name: 'ISNA (Islamic Society of North America)',
    description: 'Fajr 15°, Isha 15° — Used commonly across North America',
    fajrAngle: 15,
    ishaAngle: 15,
    midnightMethod: 'standard',
  },
  umm_al_qura: {
    id: 'umm_al_qura',
    name: 'Umm al-Qura University, Makkah',
    description: 'Fajr 18.5°, Isha 90 min after Maghrib — Official Saudi Arabia standard',
    fajrAngle: 18.5,
    ishaAngle: 0,
    ishaMinutes: 90,
    midnightMethod: 'standard',
  },
  mwl: {
    id: 'mwl',
    name: 'Muslim World League (MWL)',
    description: 'Fajr 18°, Isha 17° — Europe, Far East, and parts of the Americas',
    fajrAngle: 18,
    ishaAngle: 17,
    midnightMethod: 'standard',
  },
  egyptian: {
    id: 'egyptian',
    name: 'Egyptian General Authority of Survey',
    description: 'Fajr 19.5°, Isha 17.5° — Africa, Egypt, and Levant regions',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    midnightMethod: 'standard',
  },
  karachi: {
    id: 'karachi',
    name: 'Univ. of Islamic Sciences, Karachi',
    description: 'Fajr 18°, Isha 18° — Pakistan, India, Bangladesh, Afghanistan',
    fajrAngle: 18,
    ishaAngle: 18,
    midnightMethod: 'standard',
  },
  tehran: {
    id: 'tehran',
    name: 'Institute of Geophysics, Univ. of Tehran',
    description: 'Fajr 17.7°, Maghrib 4.5°, Isha 14°',
    fajrAngle: 17.7,
    ishaAngle: 14,
    maghribAngle: 4.5,
    midnightMethod: 'jaffari',
  },
  jaffari: {
    id: 'jaffari',
    name: 'Jaffari (Shia Ithna Ashari / Ahlul Bait)',
    description: 'Fajr 16°, Maghrib 4° (Eastern Redness clearance), Isha 14°, Sharia Midnight',
    fajrAngle: 16,
    ishaAngle: 14,
    maghribAngle: 4.0,
    midnightMethod: 'jaffari',
  },
  kemenag: {
    id: 'kemenag',
    name: 'Kemenag RI (Ministry of Religious Affairs Indonesia)',
    description: 'Fajr 20°, Isha 18° — Standard for Indonesia and Southeast Asia',
    fajrAngle: 20,
    ishaAngle: 18,
    midnightMethod: 'standard',
  },
  singapore: {
    id: 'singapore',
    name: 'MUIS (Majlis Ugama Islam Singapura)',
    description: 'Fajr 20°, Isha 18° — Official Singapore prayer schedule',
    fajrAngle: 20,
    ishaAngle: 18,
    midnightMethod: 'standard',
  },
  custom: {
    id: 'custom',
    name: 'Custom Parameter Setting',
    description: 'User-specified twilight angles and offsets',
    fajrAngle: 18,
    ishaAngle: 17,
    midnightMethod: 'standard',
  },
};

export type JuristicMethod = 'standard' | 'hanafi'; // Standard = Shafi'i, Maliki, Hanbali, Jaffari (shadow factor 1), Hanafi (shadow factor 2)
export type HighLatitudeRule = 'middle_of_the_night' | 'seventh_of_the_night' | 'angle_based' | 'none';

export interface PrayerAdjustment {
  imsak: number;
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerSettings {
  method: CalculationMethodId;
  juristic: JuristicMethod;
  highLatitudeRule: HighLatitudeRule;
  adjustments: PrayerAdjustment;
  customFajrAngle?: number;
  customIshaAngle?: number;
  is24Hour: boolean;
  hijriOffsetDays: number;
  soundProfile: 'makkah' | 'takbeer' | 'chime' | 'bowl' | 'silent';
  audioVolume: number; // 0 to 1
  enabledAdhans: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: PrayerSettings = {
  method: 'kemenag',
  juristic: 'standard',
  highLatitudeRule: 'angle_based',
  adjustments: {
    imsak: 0,
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  customFajrAngle: 18,
  customIshaAngle: 17,
  is24Hour: false,
  hijriOffsetDays: 0,
  soundProfile: 'makkah',
  audioVolume: 0.85,
  enabledAdhans: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
};

export interface PrayerTimesResult {
  imsak: Date;
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  sunset: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
  tahajjud: Date;
}

export interface NextPrayerInfo {
  currentKey: string;
  currentName: string;
  nextKey: string;
  nextName: string;
  nextTime: Date;
  secondsRemaining: number;
  totalDurationSeconds: number;
  progressPercent: number;
}

// Kaaba Coordinates
export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
  elevationMeters: 300,
  name: 'Al-Masjid Al-Haram, Makkah',
};

// Trigonometry Helper Utilities
const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;
const sinD = (d: number) => Math.sin(d2r(d));
const cosD = (d: number) => Math.cos(d2r(d));
const tanD = (d: number) => Math.tan(d2r(d));
const asinD = (x: number) => r2d(Math.asin(Math.max(-1, Math.min(1, x))));
const acosD = (x: number) => r2d(Math.acos(Math.max(-1, Math.min(1, x))));
const atan2D = (y: number, x: number) => r2d(Math.atan2(y, x));

/**
 * Calculates Great-circle bearing to Holy Kaaba (Qibla Angle) in degrees (0 - 360)
 */
export function calculateQibla(latitude: number, longitude: number): {
  bearing: number;
  distanceKm: number;
  distanceMiles: number;
  directionName: string;
} {
  const phi1 = d2r(latitude);
  const phi2 = d2r(KAABA_COORDS.latitude);
  const deltaLambda = d2r(KAABA_COORDS.longitude - longitude);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  let bearing = (r2d(Math.atan2(y, x)) + 360) % 360;

  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = phi2 - phi1;
  const dLon = deltaLambda;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);
  const distanceMiles = Math.round(distanceKm * 0.621371);

  // Direction name
  const cardinals = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'
  ];
  const idx = Math.round(bearing / 22.5);
  const directionName = cardinals[idx % 16];

  return {
    bearing: Number(bearing.toFixed(1)),
    distanceKm,
    distanceMiles,
    directionName,
  };
}

/**
 * Solar position computation (Julian Date -> Sun Declination & Equation of Time)
 */
function getSolarCoordinates(julianDate: number) {
  const D = julianDate - 2451545.0; // Days since J2000.0
  const g = 357.529 + 0.98560028 * D;
  const q = 280.459 + 0.98564736 * D;
  const L = q + 1.915 * sinD(g) + 0.02 * sinD(2 * g);
  const e = 23.439 - 0.00000036 * D;

  // Right Ascension & Declination
  const RA = atan2D(cosD(e) * sinD(L), cosD(L)) / 15;
  const declination = asinD(sinD(e) * sinD(L));

  // Equation of Time in hours
  let equationOfTime = q / 15 - (RA + 24 * Math.floor(q / 360 - RA / 24));
  equationOfTime = equationOfTime * 60; // in minutes

  return { declination, equationOfTime };
}

function getJulianDate(date: Date): number {
  const year = date.getFullYear();
  let m = date.getMonth() + 1;
  let y = year;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const d = date.getDate();
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    B -
    1524.5
  );
}

/**
 * Calculates prayer times for a specific date and location
 */
export function calculatePrayerTimes(
  date: Date,
  coords: Coordinates,
  settings: PrayerSettings = DEFAULT_SETTINGS
): PrayerTimesResult {
  const lat = coords.latitude;
  const lng = coords.longitude;

  // Timezone in hours
  const timezoneOffset = -date.getTimezoneOffset() / 60;

  const jd = getJulianDate(date);
  const { declination, equationOfTime } = getSolarCoordinates(jd);

  // Solar Noon (transit) in hours (UTC+timezone)
  const solarNoon = 12 + timezoneOffset - lng / 15 - equationOfTime / 60;

  // Sun hour angle helper for a given altitude angle
  const computeHourAngle = (angle: number): number | null => {
    const val = (sinD(angle) - sinD(lat) * sinD(declination)) / (cosD(lat) * cosD(declination));
    if (val > 1 || val < -1) return null; // Sun does not reach this altitude (extreme latitudes)
    return acosD(val) / 15;
  };

  // Sunrise and Sunset (standard sun angle -0.8333°)
  const sunAngle = -0.8333;
  let sunRiseSetHourAngle = computeHourAngle(sunAngle);
  if (sunRiseSetHourAngle === null) {
    sunRiseSetHourAngle = 6; // fallback fallback for polar regions
  }

  const sunriseHour = solarNoon - sunRiseSetHourAngle;
  const sunsetHour = solarNoon + sunRiseSetHourAngle;
  const dayLengthHours = sunsetHour - sunriseHour;
  const nightLengthHours = 24 - dayLengthHours;

  const methodParams = CALCULATION_METHODS[settings.method] || CALCULATION_METHODS.kemenag;
  const fajrAngle =
    settings.method === 'custom' && settings.customFajrAngle
      ? settings.customFajrAngle
      : methodParams.fajrAngle;
  const ishaAngle =
    settings.method === 'custom' && settings.customIshaAngle
      ? settings.customIshaAngle
      : methodParams.ishaAngle;

  // Fajr hour angle
  let fajrHA = computeHourAngle(-fajrAngle);
  if (fajrHA === null) {
    // High latitude adjustment
    if (settings.highLatitudeRule === 'seventh_of_the_night') {
      fajrHA = sunRiseSetHourAngle + nightLengthHours / 7;
    } else if (settings.highLatitudeRule === 'middle_of_the_night') {
      fajrHA = sunRiseSetHourAngle + nightLengthHours / 2;
    } else {
      fajrHA = sunRiseSetHourAngle + (fajrAngle / 60) * nightLengthHours;
    }
  }
  const fajrHour = solarNoon - fajrHA;

  // Asr hour angle:
  // shadow factor: 1 for Shafi'i/standard/jaffari, 2 for Hanafi
  const shadowFactor = settings.juristic === 'hanafi' ? 2 : 1;
  const asrAltitude = atan2D(1, shadowFactor + tanD(Math.abs(lat - declination)));
  let asrHA = computeHourAngle(asrAltitude);
  if (asrHA === null) {
    asrHA = sunRiseSetHourAngle * 0.65;
  }
  const asrHour = solarNoon + asrHA;

  // Maghrib calculation:
  // For Jaffari and Tehran, Maghrib is when eastern redness clears (approx sun at -4.0° to -4.5°)
  let maghribHour: number;
  if (methodParams.maghribAngle) {
    const maghribHA = computeHourAngle(-methodParams.maghribAngle);
    maghribHour = maghribHA ? solarNoon + maghribHA : sunsetHour + 17 / 60;
  } else if (methodParams.maghribMinutes) {
    maghribHour = sunsetHour + methodParams.maghribMinutes / 60;
  } else {
    // Standard: sunset
    maghribHour = sunsetHour;
  }

  // Isha calculation:
  let ishaHour: number;
  if (methodParams.ishaMinutes) {
    ishaHour = maghribHour + methodParams.ishaMinutes / 60;
  } else {
    let ishaHA = computeHourAngle(-ishaAngle);
    if (ishaHA === null) {
      if (settings.highLatitudeRule === 'seventh_of_the_night') {
        ishaHA = sunRiseSetHourAngle + nightLengthHours / 7;
      } else if (settings.highLatitudeRule === 'middle_of_the_night') {
        ishaHA = sunRiseSetHourAngle + nightLengthHours / 2;
      } else {
        ishaHA = sunRiseSetHourAngle + (ishaAngle / 60) * nightLengthHours;
      }
    }
    ishaHour = solarNoon + ishaHA;
  }

  // Midnight calculation:
  // Jaffari: Midpoint between sunset and next dawn (Fajr)
  // Standard: Midpoint between sunset and sunrise
  let midnightHour: number;
  if (methodParams.midnightMethod === 'jaffari') {
    midnightHour = sunsetHour + (fajrHour + 24 - sunsetHour) / 2;
  } else {
    midnightHour = sunsetHour + (sunriseHour + 24 - sunsetHour) / 2;
  }

  // Tahajjud (Last third of night):
  const nightStart = sunsetHour;
  const nightEnd = fajrHour + 24;
  const tahajjudHour = nightStart + ((nightEnd - nightStart) * 2) / 3;

  // Imsak (10 min before Fajr)
  const imsakHour = fajrHour - 10 / 60;

  // Helper to convert fractional hour to Date
  const toDate = (hourVal: number, extraMinuteAdjustment: number = 0): Date => {
    let normalized = hourVal + extraMinuteAdjustment / 60;
    while (normalized < 0) normalized += 24;
    while (normalized >= 24) normalized -= 24;

    const d = new Date(date);
    const hours = Math.floor(normalized);
    const minutes = Math.floor((normalized - hours) * 60);
    const seconds = Math.floor(((normalized - hours) * 60 - minutes) * 60);
    d.setHours(hours, minutes, seconds, 0);
    return d;
  };

  const adj = settings.adjustments;

  return {
    imsak: toDate(imsakHour, adj.imsak),
    fajr: toDate(fajrHour, adj.fajr),
    sunrise: toDate(sunriseHour, adj.sunrise),
    dhuhr: toDate(solarNoon, adj.dhuhr),
    asr: toDate(asrHour, adj.asr),
    sunset: toDate(sunsetHour, adj.maghrib),
    maghrib: toDate(maghribHour, adj.maghrib),
    isha: toDate(ishaHour, adj.isha),
    midnight: toDate(midnightHour, 0),
    tahajjud: toDate(tahajjudHour, 0),
  };
}

/**
 * Format prayer time into 12-hour or 24-hour string
 */
export function formatPrayerTime(date: Date, is24Hour: boolean = false): string {
  if (is24Hour) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // hour 0 is 12
  return `${h}:${m} ${ampm}`;
}

/**
 * Seconds formatting for countdowns (e.g. 02:45:18 or 45m 12s)
 */
export function formatCountdown(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
  display: string;
} {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { hours, minutes, seconds, display };
}

/**
 * Determine current prayer, next prayer, and remaining time
 */
export function getNextPrayerInfo(
  times: PrayerTimesResult,
  currentTime: Date = new Date()
): NextPrayerInfo {
  const prayers: Array<{ key: string; name: string; date: Date }> = [
    { key: 'fajr', name: 'Fajr', date: times.fajr },
    { key: 'sunrise', name: 'Sunrise', date: times.sunrise },
    { key: 'dhuhr', name: 'Dhuhr', date: times.dhuhr },
    { key: 'asr', name: 'Asr', date: times.asr },
    { key: 'maghrib', name: 'Maghrib', date: times.maghrib },
    { key: 'isha', name: 'Isha', date: times.isha },
  ];

  const nowMs = currentTime.getTime();

  // Find next prayer today
  for (let i = 0; i < prayers.length; i++) {
    const prayer = prayers[i];
    if (prayer.date.getTime() > nowMs) {
      const prevPrayer = i === 0 ? prayers[prayers.length - 1] : prayers[i - 1];
      const prevTimeMs = i === 0 ? prevPrayer.date.getTime() - 24 * 3600 * 1000 : prevPrayer.date.getTime();
      const totalDuration = Math.max(1, (prayer.date.getTime() - prevTimeMs) / 1000);
      const remainingSeconds = Math.max(0, (prayer.date.getTime() - nowMs) / 1000);
      const elapsed = totalDuration - remainingSeconds;
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

      return {
        currentKey: prevPrayer.key,
        currentName: prevPrayer.name,
        nextKey: prayer.key,
        nextName: prayer.name,
        nextTime: prayer.date,
        secondsRemaining: Math.floor(remainingSeconds),
        totalDurationSeconds: Math.floor(totalDuration),
        progressPercent,
      };
    }
  }

  // If all prayers today passed, next prayer is Fajr tomorrow
  const tomorrowFajr = new Date(times.fajr.getTime() + 24 * 3600 * 1000);
  const totalDuration = (tomorrowFajr.getTime() - times.isha.getTime()) / 1000;
  const remainingSeconds = (tomorrowFajr.getTime() - nowMs) / 1000;
  const elapsed = totalDuration - remainingSeconds;
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  return {
    currentKey: 'isha',
    currentName: 'Isha',
    nextKey: 'fajr',
    nextName: 'Fajr',
    nextTime: tomorrowFajr,
    secondsRemaining: Math.max(0, Math.floor(remainingSeconds)),
    totalDurationSeconds: Math.floor(totalDuration),
    progressPercent,
  };
}

/**
 * Islamic Hijri Date arithmetic conversion (Umm al-Qura standard approximation)
 */
export function getHijriDate(date: Date, offsetDays: number = 0): {
  day: number;
  monthName: string;
  monthNameArabic: string;
  monthIndex: number;
  year: number;
  formatted: string;
} {
  const adjusted = new Date(date);
  adjusted.setDate(adjusted.getDate() + offsetDays);

  const monthsEnglish = [
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

  const monthsArabic = [
    'مُحَرَّم',
    'صَفَر',
    'رَبِيع ٱلْأَوَّل',
    'رَبِيع ٱلثَّانِي',
    'جُمَادَىٰ ٱلْأُولَىٰ',
    'جُمَادَىٰ ٱلثَّانِيَة',
    'رَجَب',
    'شَعْبَان',
    'رَمَضَان',
    'شَوَّال',
    'ذُو ٱلْقَعْدَة',
    'ذُو ٱلْحِجَّة',
  ];

  // Arithmetic Julian to Hijri conversion
  const jd = getJulianDate(adjusted);
  const l = Math.floor(jd - 1948440 + 10632);
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  const monthIdx = Math.max(0, Math.min(11, m - 1));
  const monthName = monthsEnglish[monthIdx];
  const monthNameArabic = monthsArabic[monthIdx];

  return {
    day: d,
    monthName,
    monthNameArabic,
    monthIndex: monthIdx,
    year: y,
    formatted: `${d} ${monthName} ${y} AH`,
  };
}

/**
 * Curated list of world cities for quick instant selection
 */
export const POPULAR_CITIES: Array<{
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: number;
}> = [
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, timezone: 3 },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.5247, lng: 39.5692, timezone: 3 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, timezone: 7 },
  { name: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521, timezone: 7 },
  { name: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191, timezone: 7 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869, timezone: 8 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, timezone: 8 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, timezone: 2 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, timezone: 3 },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708, timezone: 4 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, timezone: 0 },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, timezone: -5 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, timezone: -5 },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, timezone: 1 },
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, timezone: 5 },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125, timezone: 6 },
  { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.389, timezone: 3.5 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, timezone: 10 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, timezone: 9 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241, timezone: 2 },
];
