

export interface CampusSeed {
  name: string;
  lat: number;
  lon: number;
}

export interface ForecastPoint {
  time: string;
  temp: number;
  rain: number;
  wind: number;
  gust: number;
  humidity: number;
  pressure: number;
  chanceRain: number;
  condition: 'Partly Cloudy' | 'Light Rain' | 'Moderate Rain' | 'Cloudy' | 'Thunderstorm';
}

export interface ForecastPayload {
  points: ForecastPoint[];
  currentIsDay: boolean | null;
  daylightDurationSeconds: number | null;
  currentWeatherCode: number | null;
}

export interface CampusWeather {
  name: string;
  rain: string;
  rainPossibility: string;
  mslp: string;
  dewpoint: string;
  heatIndex: string;
  humidity: string;
  windDirection: string;
  windGust: string;
  windSpeed: string;
  visibility: string;
  cloudCover: string;
  status: 'Safe' | 'Monitor';
  warning: boolean;
}

export const CAMPUSES: CampusSeed[] = [
  { name: 'Alangilan Campus', lat: 13.784295, lon: 121.07428 },
  { name: 'Lipa City Campus', lat: 13.9555, lon: 121.1633 }, // Brgy. Marawoy, Lipa City
  { name: 'Main Campus', lat: 13.754456, lon: 121.053131 },
  { name: 'Malvar Campus', lat: 14.044912, lon: 121.156329 },
  { name: 'Nasugbu Campus', lat: 14.067244, lon: 120.626752 },
  { name: 'Balayan Campus', lat: 13.9405, lon: 120.7251 }, // Brgy. Caloocan, Balayan
  { name: 'San Juan Campus', lat: 13.8268, lon: 121.3952 }, // Brgy. Talahiban II, San Juan
  { name: 'Lobo Campus', lat: 13.6492, lon: 121.2063 }, // Brgy. Masaguitsuit, Lobo
];


const OPEN_METEO_FORECAST_URL =
  import.meta.env.VITE_OPEN_METEO_FORECAST_API_URL ?? 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_TIMEZONE = import.meta.env.VITE_OPEN_METEO_TIMEZONE ?? 'Asia/Manila';



const OPEN_METEO_DAILY_VARIABLES = ['weather_code', 'daylight_duration'] as const;

// --- Variable definitions (no duplicates) ---
const OPEN_METEO_CURRENT_VARIABLES = [
  'is_day',
  'rain',
  'relative_humidity_2m',
  'temperature_2m',
  'apparent_temperature',
  'wind_gusts_10m',
  'wind_direction_10m',
  'wind_speed_10m',
  'weather_code',
] as const;

const OPEN_METEO_HOURLY_VARIABLES = [
  'temperature_2m',
  'dew_point_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'rain',
  'showers',
  'cloud_cover',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
  'visibility',
  'wind_speed_10m',
  'wind_speed_80m',
  'wind_speed_120m',
  'wind_speed_180m',
  'wind_direction_10m',
  'wind_direction_80m',
  'wind_direction_120m',
  'wind_direction_180m',
  'wind_gusts_10m',
  'temperature_80m',
  'temperature_120m',
  'temperature_180m',
  'weather_code',
  'surface_pressure',
] as const;

const OPEN_METEO_HOURLY_INDEX: Record<(typeof OPEN_METEO_HOURLY_VARIABLES)[number], number> =
  OPEN_METEO_HOURLY_VARIABLES.reduce((acc, key, idx) => {
    acc[key] = idx;
    return acc;
  }, {} as Record<(typeof OPEN_METEO_HOURLY_VARIABLES)[number], number>);

const OPEN_METEO_CURRENT_INDEX: Record<(typeof OPEN_METEO_CURRENT_VARIABLES)[number], number> =
  (OPEN_METEO_CURRENT_VARIABLES as readonly string[]).reduce((acc, key, idx) => {
    acc[key as typeof OPEN_METEO_CURRENT_VARIABLES[number]] = idx;
    return acc;
  }, {} as Record<(typeof OPEN_METEO_CURRENT_VARIABLES)[number], number>);

// Daily variables are read directly from data.daily by name in fetchOpenMeteoForecast
const _OPEN_METEO_DAILY_INDEX: Record<(typeof OPEN_METEO_DAILY_VARIABLES)[number], number> =
  OPEN_METEO_DAILY_VARIABLES.reduce((acc, key, index) => {
    acc[key] = index;
    return acc;
  }, {} as Record<(typeof OPEN_METEO_DAILY_VARIABLES)[number], number>);
void _OPEN_METEO_DAILY_INDEX;



const asCardinalDirection = (degrees: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return dirs[index];
};

const computeDewPoint = (tempC: number, humidityPct: number): number => {
  // Quick approximation suitable for dashboard display.
  return tempC - (100 - humidityPct) / 5;
};

const mapWeatherCodeToCondition = (
  weatherCode: number,
): ForecastPoint['condition'] => {
  if ([95, 96, 99].includes(weatherCode)) {
    return 'Thunderstorm';
  }

  if ([63, 65, 82].includes(weatherCode)) {
    return 'Moderate Rain';
  }

  if ([51, 53, 55, 56, 57, 61, 80, 81].includes(weatherCode)) {
    return 'Light Rain';
  }

  if ([1, 2, 3, 45, 48].includes(weatherCode)) {
    return 'Cloudy';
  }

  return 'Partly Cloudy';
};

const formatHourLabel = (timestamp: Date): string => {
  try {
    return timestamp.toLocaleTimeString([], {
      timeZone: OPEN_METEO_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timestamp.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
};

const toNumberArray = (values: Float32Array | null | undefined): number[] => {
  if (!values) return [];
  return Array.from(values, (value) => Number(value));
};

const toCampusWeather = (name: string, apiData: any): CampusWeather => {
  const current = apiData?.current?.();
  const hourly = apiData?.hourly?.();

  const currentRain = Number(current?.variables(OPEN_METEO_CURRENT_INDEX.rain)?.value() ?? 0);
  const humidity = Number(
    current?.variables(OPEN_METEO_CURRENT_INDEX.relative_humidity_2m)?.value() ?? 0,
  );
  const temp = Number(current?.variables(OPEN_METEO_CURRENT_INDEX.temperature_2m)?.value() ?? 0);
  const heatIndex = Number(
    current?.variables(OPEN_METEO_CURRENT_INDEX.apparent_temperature)?.value() ?? temp,
  );
  const windDeg = Number(current?.variables(OPEN_METEO_CURRENT_INDEX.wind_direction_10m)?.value() ?? 0);
  const windSpeed = Number(current?.variables(OPEN_METEO_CURRENT_INDEX.wind_speed_10m)?.value() ?? 0);
  const windGust = Number(
    current?.variables(OPEN_METEO_CURRENT_INDEX.wind_gusts_10m)?.value() ?? windSpeed,
  );

  const rainSeries = toNumberArray(
    hourly?.variables(OPEN_METEO_HOURLY_INDEX.rain)?.valuesArray(),
  );
  const chanceSeries = toNumberArray(
    hourly?.variables(OPEN_METEO_HOURLY_INDEX.precipitation_probability)?.valuesArray(),
  );
  const cloudSeries = toNumberArray(
    hourly?.variables(OPEN_METEO_HOURLY_INDEX.cloud_cover)?.valuesArray(),
  );
  const visibilitySeries = toNumberArray(
    hourly?.variables(OPEN_METEO_HOURLY_INDEX.visibility)?.valuesArray(),
  );
  const pressureSeries = toNumberArray(
    hourly?.variables(OPEN_METEO_HOURLY_INDEX.surface_pressure)?.valuesArray(),
  );
  const dewPointSeries = toNumberArray(
    hourly?.variables(OPEN_METEO_HOURLY_INDEX.dew_point_2m)?.valuesArray(),
  );

  const rainMm = currentRain > 0 ? currentRain : Number(rainSeries[0] ?? 0);
  const cloudCover = Number(cloudSeries[0] ?? 0);
  const rainChanceBase = Number(chanceSeries[0] ?? Math.max(cloudCover, rainMm > 0 ? 45 : 20));
  const rainChance = Math.max(0, Math.min(100, Math.round(rainChanceBase)));
  const visibilityKm = Number(visibilitySeries[0] ?? 10000) / 1000;
  const mslp = Number(pressureSeries[0] ?? 1013);
  const dewPoint = Number(dewPointSeries[0] ?? computeDewPoint(temp, humidity));

  const warning = rainMm >= 0.5 || rainChance >= 45 || windGust >= 30;

  return {
    name,
    rain: rainMm.toFixed(2),
    rainPossibility: `${rainChance}%`,
    mslp: `${Math.round(mslp)}`,
    dewpoint: dewPoint.toFixed(1),
    heatIndex: heatIndex.toFixed(1),
    humidity: `${Math.round(humidity)}`,
    windDirection: asCardinalDirection(windDeg),
    windGust: windGust.toFixed(0),
    windSpeed: windSpeed.toFixed(0),
    visibility: visibilityKm.toFixed(1),
    cloudCover: `${Math.round(cloudCover)}`,
    status: warning ? 'Monitor' : 'Safe',
    warning,
  };
};

// Fallback data used when the live API is unreachable
export const generateFallbackCampusWeather = (): CampusWeather[] =>
  CAMPUSES.map((campus) => ({
    name: campus.name,
    rain: '0.00',
    rainPossibility: '20%',
    mslp: '1012',
    dewpoint: '22.0',
    heatIndex: '29.5',
    humidity: '72',
    windDirection: 'E',
    windGust: '18',
    windSpeed: '12',
    visibility: '10.0',
    cloudCover: '35',
    status: 'Safe' as const,
    warning: false,
  }));


// ── In-memory cache to avoid hammering the free-tier rate limit ──────────────
let _campusWeatherCache: { data: CampusWeather[]; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Build a URL for Open-Meteo that keeps commas as literal characters.
 * URLSearchParams encodes commas as %2C which breaks the multi-location
 * batch feature (Open-Meteo expects raw commas in latitude/longitude arrays).
 */
const buildOpenMeteoUrl = (
  base: string,
  arrayParams: Record<string, string>,
  scalarParams: Record<string, string>,
): string => {
  // Scalar params can go through URLSearchParams safely
  const scalar = new URLSearchParams(scalarParams).toString();
  // Array params must keep their commas literal
  const arrays = Object.entries(arrayParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${v}`)
    .join('&');
  return `${base}?${scalar}&${arrays}`;
};

/** Fetch with exponential back-off on 429 (up to 3 retries). */
const fetchWithBackoff = async (url: string, maxRetries = 3): Promise<Response> => {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url);
    if (response.status !== 429) return response;
    if (attempt === maxRetries) return response;
    // Honour Retry-After header if present
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter ? Number(retryAfter) * 1000 : delay;
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    delay *= 2;
  }
  throw new Error('Unreachable');
};

// Backend proxy URL — all Open-Meteo calls are routed through the backend
// to avoid browser-side 429 rate limits.
const WEATHER_PROXY_URL =
  import.meta.env.VITE_WEATHER_PROXY_URL ?? 'http://localhost:4000/api/weather/current';

export const fetchCampusWeather = async (): Promise<CampusWeather[]> => {
  // Return cached result if still fresh
  if (_campusWeatherCache && Date.now() - _campusWeatherCache.ts < CACHE_TTL_MS) {
    return _campusWeatherCache.data;
  }

  // Fetch via backend proxy (server caches for 10 min, no 429 from browser)
  const response = await fetch(WEATHER_PROXY_URL);
  if (!response.ok) {
    throw new Error(`Weather proxy failed: ${response.status}`);
  }

  const payload = await response.json() as { ok: boolean; data: any[]; ts: number };
  if (!payload.ok || !Array.isArray(payload.data)) {
    throw new Error('Invalid response from weather proxy');
  }

  const results = payload.data.map((data: any, idx: number) => {
    const campusName = data._campusName ?? CAMPUSES[idx]?.name ?? `Campus ${idx + 1}`;
    return toCampusWeather(campusName, {
      current: () => ({
        variables: (i: number) => ({ value: () => data.current?.[OPEN_METEO_CURRENT_VARIABLES[i]] }),
      }),
      hourly: () => ({
        variables: (i: number) => ({ valuesArray: () => data.hourly?.[OPEN_METEO_HOURLY_VARIABLES[i]] }),
      }),
    });
  });

  _campusWeatherCache = { data: results, ts: Date.now() };
  return results;
};

/** Call this to force-invalidate the cache (e.g. on manual refresh). */
export const invalidateCampusWeatherCache = (): void => {
  _campusWeatherCache = null;
};


export const fetchOpenMeteoForecast = async (lat: number, lon: number): Promise<ForecastPayload> => {
  // Use buildOpenMeteoUrl to keep commas in variable lists unencoded
  const url = buildOpenMeteoUrl(
    OPEN_METEO_FORECAST_URL,
    {
      current: OPEN_METEO_CURRENT_VARIABLES.join(','),
      daily: OPEN_METEO_DAILY_VARIABLES.join(','),
      hourly: OPEN_METEO_HOURLY_VARIABLES.join(','),
    },
    {
      latitude: lat.toString(),
      longitude: lon.toString(),
      timezone: OPEN_METEO_TIMEZONE,
      forecast_days: '2',
      models: 'best_match',
    },
  );
  const response = await fetchWithBackoff(url);
  if (!response.ok) {
    throw new Error('Open-Meteo forecast request failed');
  }
  const data = await response.json();
  const times = (data.hourly.time || []).map((t: string) => new Date(t));
  const temps = data.hourly.temperature_2m || [];
  const humidities = data.hourly.relative_humidity_2m || [];
  const rainChances = data.hourly.precipitation_probability || [];
  const precipitations = data.hourly.precipitation || [];
  const winds = data.hourly.wind_speed_10m || [];
  const gusts = data.hourly.wind_gusts_10m || [];
  const weatherCodes = data.hourly.weather_code || [];
  const pressures = data.hourly.surface_pressure || [];

  // Sample every 6 hours and keep enough points for multi-horizon charts.
  const sampledPointCount = Math.floor((times.length - 1) / 6) + 1;
  const totalPoints = Math.min(9, sampledPointCount);
  if (totalPoints < 2) {
    throw new Error('Insufficient forecast points from Open-Meteo');
  }
  const points = Array.from({ length: totalPoints }, (_, index) => {
    const sourceIndex = index * 6;
    const rain = Number(precipitations[sourceIndex] ?? 0);
    const chanceRain = Number(rainChances[sourceIndex] ?? (rain > 0 ? 45 : 20));
    const weatherCode = Number(weatherCodes[sourceIndex] ?? 0);
    return {
      time: formatHourLabel(times[sourceIndex]),
      temp: Number(temps[sourceIndex] ?? 0),
      rain,
      wind: Math.round(Number(winds[sourceIndex] ?? 0)),
      gust: Math.round(Number(gusts[sourceIndex] ?? winds[sourceIndex] ?? 0)),
      humidity: Math.round(Number(humidities[sourceIndex] ?? 0)),
      pressure: Number(pressures[sourceIndex] ?? 1010),
      chanceRain: Math.max(0, Math.min(100, Math.round(chanceRain))),
      condition: mapWeatherCodeToCondition(weatherCode),
    };
  });
  const currentIsDayRaw = data.current?.is_day;
  const currentWeatherCodeRaw = data.current?.weather_code;
  const daylightDurationRaw = data.daily?.daylight_duration?.[0];
  if (currentWeatherCodeRaw !== null && currentWeatherCodeRaw !== undefined && points.length > 0) {
    points[0] = {
      ...points[0],
      condition: mapWeatherCodeToCondition(Number(currentWeatherCodeRaw)),
    };
  }
  return {
    points,
    currentIsDay:
      currentIsDayRaw === null || currentIsDayRaw === undefined ? null : Number(currentIsDayRaw) === 1,
    daylightDurationSeconds:
      daylightDurationRaw === null || daylightDurationRaw === undefined ? null : Number(daylightDurationRaw),
    currentWeatherCode:
      currentWeatherCodeRaw === null || currentWeatherCodeRaw === undefined
        ? null
        : Number(currentWeatherCodeRaw),
  };
};

export interface CycloneTrackPoint {
  lat: number;
  lon: number;
  windKph: number;
  label: string;
  timestampIso: string;
}

export interface LiveTyphoonFeed {
  stormName: string;
  sourceLabel: string;
  pagasaTrack: CycloneTrackPoint[];
  jtwcTrack: CycloneTrackPoint[];
  updatedAtIso: string;
  hasActivePhilippineTyphoon: boolean;
  pagasa: {
    stormName: string;
    source: string;
    advisoryFromIso: string | null;
    advisoryToIso: string | null;
    alertLevel: string;
    maxWindKph: number | null;
    detailsSummary: string;
  };
  jtwc: {
    stormName: string;
    source: string;
    advisoryFromIso: string | null;
    advisoryToIso: string | null;
    alertLevel: string;
    maxWindKph: number | null;
    detailsSummary: string;
  };
  recentPhilippineTyphoons: Array<{
    name: string;
    source: string;
    fromIso: string | null;
    toIso: string | null;
    alertLevel: string;
    maxWindKph: number | null;
    isActive: boolean;
  }>;
}

interface PagasaCycloneDatResult {
  stormName: string;
  track: CycloneTrackPoint[];
  latestTimestampIso: string | null;
  isActive: boolean;
}

interface GdacsFeature {
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    eventtype?: string;
    source?: string;
    name?: string;
    alertlevel?: string;
    episodealertlevel?: string;
    glide?: string;
    country?: string;
    iscurrent?: boolean | string;
    fromdate?: string;
    todate?: string;
    affectedcountries?: Array<{ iso2?: string; iso3?: string; countryname?: string }>;
    severitydata?: { severity?: number | string; severitytext?: string };
    url?: {
      details?: string;
    };
    episodes?: Array<{
      details?: string;
    }>;
  };
}

const GDACS_TYHOON_EVENTS_URL =
  import.meta.env.VITE_GDACS_TYHOON_EVENTS_API_URL ??
  'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=TC';
const PAGASA_CYCLONE_DAT_URL =
  import.meta.env.VITE_PAGASA_CYCLONE_DAT_URL ??
  'https://pubfiles.pagasa.dost.gov.ph/tamss/weather/cyclone.dat';

const PH_ISO2 = 'PH';
const PH_ISO3 = 'PHL';
const ACTIVE_TO_DATE_MAX_AGE_MS = 72 * 60 * 60 * 1000;
const ACTIVE_FROM_DATE_MAX_AGE_MS = 10 * 24 * 60 * 60 * 1000;

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseGdacsFeatures = (payload: unknown): GdacsFeature[] => {
  if (!payload || typeof payload !== 'object') return [];

  const featureCollection = payload as { features?: unknown };
  if (Array.isArray(featureCollection.features)) {
    return featureCollection.features as GdacsFeature[];
  }

  if (Array.isArray(payload)) {
    return payload as GdacsFeature[];
  }

  const singleFeature = payload as GdacsFeature;
  if (singleFeature?.properties?.eventtype) {
    return [singleFeature];
  }

  return [];
};

const isPhilippinesRelevant = (feature: GdacsFeature): boolean => {
  const props = feature.properties;
  if (!props) return false;

  const countries = props.affectedcountries ?? [];
  const affected = countries.some((country) => {
    const iso2 = (country.iso2 ?? '').toUpperCase();
    const iso3 = (country.iso3 ?? '').toUpperCase();
    return iso2 === PH_ISO2 || iso3 === PH_ISO3;
  });

  if (affected) return true;

  const countryText = `${props.country ?? ''} ${props.glide ?? ''}`.toUpperCase();
  return countryText.includes('PHILIPPINES') || countryText.includes(PH_ISO3);
};

const isLikelyActive = (feature: GdacsFeature): boolean => {
  const props = feature.properties;
  if (!props) return false;
  if (toBoolean(props.iscurrent)) return true;

  const now = Date.now();
  const from = Date.parse(props.fromdate ?? '');
  const to = Date.parse(props.todate ?? '');
  const withinRecentWindow = Number.isFinite(from) && now - from <= ACTIVE_FROM_DATE_MAX_AGE_MS;
  const notTooOld = Number.isFinite(to) ? now - to <= ACTIVE_TO_DATE_MAX_AGE_MS : withinRecentWindow;

  return withinRecentWindow || notTooOld;
};

const sortByRecency = (a: GdacsFeature, b: GdacsFeature): number => {
  const aDate = Date.parse(a.properties?.fromdate ?? '') || 0;
  const bDate = Date.parse(b.properties?.fromdate ?? '') || 0;
  return bDate - aDate;
};

const buildLabel = (index: number, total: number, timestampIso: string): string => {
  if (index === total - 1) return 'Current';

  const date = new Date(timestampIso);
  if (Number.isNaN(date.getTime())) {
    return `${Math.max(0, total - index - 1) * 6}h Ago`;
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseStormNameFromHeader = (headerLine: string): string => {
  const cleaned = headerLine.trim();
  if (!cleaned) return 'PAGASA Tropical Cyclone';
  const braceStart = cleaned.indexOf('{');
  if (braceStart < 0) return cleaned;
  return cleaned.slice(0, braceStart).trim() || 'PAGASA Tropical Cyclone';
};

const mapPagasaClassToWindKph = (classification: string): number => {
  const key = classification.trim().toUpperCase();
  if (key === 'LPA') return 28;
  if (key === 'TD') return 50;
  if (key === 'TS') return 80;
  if (key === 'STS') return 105;
  if (key === 'TY') return 140;
  if (key === 'STY') return 190;
  return 70;
};

const parsePagasaCycloneDat = (text: string): PagasaCycloneDatResult | null => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return null;

  const stormName = parseStormNameFromHeader(lines[0]);
  const rawTrack = lines.slice(1).map((line) => {
    const parts = line.split(',').map((part) => part.trim());
    if (parts.length < 5) return null;

    const classification = parts[0] ?? 'TS';
    const datePart = parts[1] ?? '';
    const timePart = parts[2] ?? '00:00';
    const lat = Number(parts[3]);
    const lon = Number(parts[4]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const timestampIso = new Date(`${datePart}T${timePart}:00+08:00`).toISOString();
    return {
      lat,
      lon,
      windKph: mapPagasaClassToWindKph(classification),
      label: 'Point',
      timestampIso,
    } satisfies CycloneTrackPoint;
  }).filter((point): point is CycloneTrackPoint => point !== null);

  if (rawTrack.length < 2) return null;

  const track = rawTrack
    .sort((a, b) => Date.parse(a.timestampIso) - Date.parse(b.timestampIso))
    .map((point, index, arr) => ({
      ...point,
      label: buildLabel(index, arr.length, point.timestampIso),
    }));

  const latestTimestampIso = track[track.length - 1]?.timestampIso ?? null;
  const latestMs = latestTimestampIso ? Date.parse(latestTimestampIso) : NaN;
  const isActive = Number.isFinite(latestMs) && Date.now() - latestMs <= ACTIVE_TO_DATE_MAX_AGE_MS;

  return {
    stormName,
    track,
    latestTimestampIso,
    isActive,
  };
};

const fetchPagasaCycloneDat = async (): Promise<PagasaCycloneDatResult | null> => {
  try {
    const response = await fetch(PAGASA_CYCLONE_DAT_URL);
    if (!response.ok) return null;
    const text = await response.text();
    return parsePagasaCycloneDat(text);
  } catch {
    return null;
  }
};

const parseTrackPointFromFeature = (feature: GdacsFeature): CycloneTrackPoint | null => {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const lon = toNumber(coords[0], NaN);
  const lat = toNumber(coords[1], NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const props = feature.properties ?? {};
  const windKph = Math.max(20, Math.round(toNumber(props.severitydata?.severity, 80)));
  const timestampIso = props.fromdate ?? new Date().toISOString();

  return {
    lat,
    lon,
    windKph,
    label: 'Point',
    timestampIso,
  };
};

const toTyphoonInfo = (feature: GdacsFeature | undefined, fallbackName: string, fallbackSource: string) => {
  const props = feature?.properties;
  const severityRaw = props?.severitydata?.severity;
  const severity = Number(severityRaw);

  return {
    stormName: props?.name ?? fallbackName,
    source: props?.source ?? fallbackSource,
    advisoryFromIso: props?.fromdate ?? null,
    advisoryToIso: props?.todate ?? null,
    alertLevel: props?.alertlevel ?? props?.episodealertlevel ?? 'N/A',
    maxWindKph: Number.isFinite(severity) ? Math.round(severity) : null,
    detailsSummary: props?.severitydata?.severitytext ?? 'No detailed summary available.',
  };
};

const toRecentTyphoonItem = (feature: GdacsFeature) => {
  const props = feature.properties;
  const severity = Number(props?.severitydata?.severity);

  return {
    name: props?.name ?? 'Unnamed Tropical Cyclone',
    source: props?.source ?? 'GDACS',
    fromIso: props?.fromdate ?? null,
    toIso: props?.todate ?? null,
    alertLevel: props?.alertlevel ?? props?.episodealertlevel ?? 'N/A',
    maxWindKph: Number.isFinite(severity) ? Math.round(severity) : null,
    isActive: isLikelyActive(feature),
  };
};

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const buildTrackFromEvent = async (eventFeature: GdacsFeature): Promise<CycloneTrackPoint[]> => {
  const detailUrl = eventFeature.properties?.url?.details;
  if (!detailUrl) {
    const point = parseTrackPointFromFeature(eventFeature);
    return point ? [point] : [];
  }

  const detailPayload = await fetchJson(detailUrl);
  const detailFeatures = parseGdacsFeatures(detailPayload);
  const detail = detailFeatures[0] ?? (detailPayload as GdacsFeature);

  const episodeUrls = (detail?.properties?.episodes ?? [])
    .map((episode) => episode.details)
    .filter((url): url is string => Boolean(url))
    .slice(-8);

  if (episodeUrls.length === 0) {
    const point = parseTrackPointFromFeature(detail ?? eventFeature);
    return point ? [point] : [];
  }

  const episodePayloads = await Promise.all(
    episodeUrls.map(async (url) => {
      try {
        return await fetchJson(url);
      } catch {
        return null;
      }
    }),
  );

  const rawPoints = episodePayloads
    .filter((payload): payload is unknown => payload !== null)
    .map((payload) => parseGdacsFeatures(payload)[0] ?? (payload as GdacsFeature))
    .map((feature) => parseTrackPointFromFeature(feature))
    .filter((point): point is CycloneTrackPoint => point !== null)
    .sort((a, b) => Date.parse(a.timestampIso) - Date.parse(b.timestampIso));

  return rawPoints.map((point, index) => ({
    ...point,
    label: buildLabel(index, rawPoints.length, point.timestampIso),
  }));
};

const fallbackTrack = (
  points: Array<{ lat: number; lon: number; windKph: number; label: string }>,
): CycloneTrackPoint[] => {
  const now = Date.now();
  return points.map((point, index) => ({
    ...point,
    timestampIso: new Date(now - (points.length - index - 1) * 6 * 60 * 60 * 1000).toISOString(),
  }));
};

const FALLBACK_PAGASA_TRACK = fallbackTrack([
  { lat: 13.0, lon: 125.0, windKph: 65, label: '24h Ago' },
  { lat: 13.45, lon: 123.1, windKph: 72, label: '12h Ago' },
  { lat: 13.82, lon: 121.25, windKph: 78, label: 'Current' },
]);

const FALLBACK_JTWC_TRACK = fallbackTrack([
  { lat: 13.2, lon: 125.2, windKph: 62, label: '24h Ago' },
  { lat: 13.7, lon: 123.35, windKph: 70, label: '12h Ago' },
  { lat: 14.02, lon: 121.62, windKph: 76, label: 'Current' },
]);

export const fetchLiveTyphoonFeed = async (): Promise<LiveTyphoonFeed> => {
  const pagasaDat = await fetchPagasaCycloneDat();
  const payload = await fetchJson(GDACS_TYHOON_EVENTS_URL);
  const allFeatures = parseGdacsFeatures(payload)
    .filter((feature) => (feature.properties?.eventtype ?? '').toUpperCase() === 'TC');

  const relevant = allFeatures.filter((feature) => isPhilippinesRelevant(feature));
  const recentPhilippineTyphoons = [...relevant]
    .sort(sortByRecency)
    .slice(0, 8)
    .map((feature) => toRecentTyphoonItem(feature));

  if (pagasaDat) {
    recentPhilippineTyphoons.unshift({
      name: pagasaDat.stormName,
      source: 'PAGASA cyclone.dat',
      fromIso: pagasaDat.track[0]?.timestampIso ?? null,
      toIso: pagasaDat.latestTimestampIso,
      alertLevel: pagasaDat.isActive ? 'Monitoring' : 'Inactive',
      maxWindKph: Math.max(...pagasaDat.track.map((point) => point.windKph)),
      isActive: pagasaDat.isActive,
    });
  }
  const activeRelevant = relevant.filter((feature) => isLikelyActive(feature));
  const hasActivePhilippineTyphoon = activeRelevant.length > 0;
  const candidatePool = (hasActivePhilippineTyphoon ? activeRelevant : relevant).sort(sortByRecency);

  const jtwcEvent =
    candidatePool.find((feature) => (feature.properties?.source ?? '').toUpperCase().includes('JTWC')) ??
    candidatePool[0];
  const pagasaEvent =
    candidatePool.find((feature) => (feature.properties?.source ?? '').toUpperCase().includes('PAGASA')) ??
    jtwcEvent;

  if (!jtwcEvent) {
    return {
      stormName: 'No Active Philippine Typhoon Advisory',
      sourceLabel: 'Fallback Dataset',
      pagasaTrack: pagasaDat?.track && pagasaDat.track.length >= 2 ? pagasaDat.track : FALLBACK_PAGASA_TRACK,
      jtwcTrack: FALLBACK_JTWC_TRACK,
      updatedAtIso: new Date().toISOString(),
      hasActivePhilippineTyphoon: Boolean(pagasaDat?.isActive),
      pagasa: {
        stormName: pagasaDat?.stormName ?? 'No active PAGASA advisory',
        source: 'PAGASA cyclone.dat',
        advisoryFromIso: pagasaDat?.track?.[0]?.timestampIso ?? null,
        advisoryToIso: pagasaDat?.latestTimestampIso ?? null,
        alertLevel: pagasaDat?.isActive ? 'Monitoring' : 'Inactive',
        maxWindKph: pagasaDat?.track?.length ? Math.max(...pagasaDat.track.map((point) => point.windKph)) : null,
        detailsSummary: pagasaDat
          ? 'PAGASA cyclone.dat trajectory feed parsed successfully.'
          : 'No active Philippines-relevant tropical cyclone advisory was detected.',
      },
      jtwc: {
        stormName: 'No active JTWC advisory',
        source: 'JTWC',
        advisoryFromIso: null,
        advisoryToIso: null,
        alertLevel: 'N/A',
        maxWindKph: null,
        detailsSummary: 'No active Philippines-relevant tropical cyclone advisory was detected.',
      },
      recentPhilippineTyphoons,
    };
  }

  const [pagasaTrackRaw, jtwcTrackRaw] = await Promise.all([
    pagasaEvent ? buildTrackFromEvent(pagasaEvent) : Promise.resolve([]),
    buildTrackFromEvent(jtwcEvent),
  ]);

  const pagasaTrack = pagasaTrackRaw.length >= 2 ? pagasaTrackRaw : FALLBACK_PAGASA_TRACK;
  const jtwcTrack = jtwcTrackRaw.length >= 2 ? jtwcTrackRaw : FALLBACK_JTWC_TRACK;
  const stormName = hasActivePhilippineTyphoon
    ? jtwcEvent.properties?.name ?? 'Tropical Cyclone'
    : 'No Active Philippine Typhoon Advisory';
  const pagasaInfo = pagasaDat
    ? {
        stormName: pagasaDat.stormName,
        source: 'PAGASA cyclone.dat',
        advisoryFromIso: pagasaDat.track[0]?.timestampIso ?? null,
        advisoryToIso: pagasaDat.latestTimestampIso,
        alertLevel: pagasaDat.isActive ? 'Monitoring' : 'Inactive',
        maxWindKph: Math.max(...pagasaDat.track.map((point) => point.windKph)),
        detailsSummary: pagasaDat.isActive
          ? 'Active PAGASA trajectory detected from cyclone.dat feed.'
          : 'Latest PAGASA trajectory is not currently active based on timestamp.',
      }
    : toTyphoonInfo(pagasaEvent, stormName, 'PAGASA');
  const jtwcInfo = toTyphoonInfo(jtwcEvent, stormName, 'JTWC');

  return {
    stormName,
    sourceLabel: jtwcEvent.properties?.source ?? 'GDACS',
    pagasaTrack: pagasaDat?.track && pagasaDat.track.length >= 2 ? pagasaDat.track : pagasaTrack,
    jtwcTrack,
    updatedAtIso: new Date().toISOString(),
    hasActivePhilippineTyphoon: hasActivePhilippineTyphoon || Boolean(pagasaDat?.isActive),
    pagasa: pagasaInfo,
    jtwc: jtwcInfo,
    recentPhilippineTyphoons,
  };
};
