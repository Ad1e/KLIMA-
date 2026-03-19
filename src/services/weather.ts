import { fetchWeatherApi } from 'openmeteo';

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
  { name: 'Lipa Campus', lat: 13.956872, lon: 121.16312 },
  { name: 'Main Campus', lat: 13.754456, lon: 121.053131 },
  { name: 'Malvar Campus', lat: 14.044912, lon: 121.156329 },
  { name: 'Nasugbu Campus', lat: 14.067244, lon: 120.626752 },
];

const FALLBACK_DATA: CampusWeather[] = [
  {
    name: 'Alangilan Campus',
    rain: '0.00',
    rainPossibility: '5%',
    mslp: '1013',
    dewpoint: '18.5',
    heatIndex: '26.3',
    humidity: '65',
    windDirection: 'NE',
    windGust: '12',
    windSpeed: '8',
    visibility: '10',
    cloudCover: '20',
    status: 'Safe',
    warning: false,
  },
  {
    name: 'Lipa Campus',
    rain: '0.00',
    rainPossibility: '3%',
    mslp: '1013',
    dewpoint: '17.2',
    heatIndex: '25.8',
    humidity: '62',
    windDirection: 'E',
    windGust: '10',
    windSpeed: '6',
    visibility: '10',
    cloudCover: '15',
    status: 'Safe',
    warning: false,
  },
  {
    name: 'Main Campus',
    rain: '0.71',
    rainPossibility: '45%',
    mslp: '1012',
    dewpoint: '21.3',
    heatIndex: '28.1',
    humidity: '75',
    windDirection: 'SE',
    windGust: '18',
    windSpeed: '12',
    visibility: '8',
    cloudCover: '60',
    status: 'Monitor',
    warning: true,
  },
  {
    name: 'Malvar Campus',
    rain: '0.00',
    rainPossibility: '8%',
    mslp: '1013',
    dewpoint: '19.1',
    heatIndex: '27.2',
    humidity: '68',
    windDirection: 'NE',
    windGust: '11',
    windSpeed: '7',
    visibility: '10',
    cloudCover: '25',
    status: 'Safe',
    warning: false,
  },
  {
    name: 'Nasugbu Campus',
    rain: '0.00',
    rainPossibility: '2%',
    mslp: '1013',
    dewpoint: '16.8',
    heatIndex: '25.5',
    humidity: '60',
    windDirection: 'N',
    windGust: '9',
    windSpeed: '5',
    visibility: '10',
    cloudCover: '10',
    status: 'Safe',
    warning: false,
  },
];

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = import.meta.env.VITE_WEATHER_API_URL ?? 'https://api.openweathermap.org/data/2.5/weather';
const OPEN_METEO_FORECAST_URL =
  import.meta.env.VITE_OPEN_METEO_FORECAST_API_URL ?? 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_TIMEZONE = import.meta.env.VITE_OPEN_METEO_TIMEZONE ?? 'Asia/Manila';

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

const OPEN_METEO_DAILY_VARIABLES = ['weather_code', 'daylight_duration'] as const;

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
  OPEN_METEO_HOURLY_VARIABLES.reduce((acc, key, index) => {
    acc[key] = index;
    return acc;
  }, {} as Record<(typeof OPEN_METEO_HOURLY_VARIABLES)[number], number>);

const OPEN_METEO_CURRENT_INDEX: Record<(typeof OPEN_METEO_CURRENT_VARIABLES)[number], number> =
  OPEN_METEO_CURRENT_VARIABLES.reduce((acc, key, index) => {
    acc[key] = index;
    return acc;
  }, {} as Record<(typeof OPEN_METEO_CURRENT_VARIABLES)[number], number>);

const OPEN_METEO_DAILY_INDEX: Record<(typeof OPEN_METEO_DAILY_VARIABLES)[number], number> =
  OPEN_METEO_DAILY_VARIABLES.reduce((acc, key, index) => {
    acc[key] = index;
    return acc;
  }, {} as Record<(typeof OPEN_METEO_DAILY_VARIABLES)[number], number>);

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
  const rainMm = Number(apiData?.rain?.['1h'] ?? 0);
  const cloudCover = Number(apiData?.clouds?.all ?? 0);
  const humidity = Number(apiData?.main?.humidity ?? 0);
  const temp = Number(apiData?.main?.temp ?? 0);
  const mslp = Number(apiData?.main?.pressure ?? 0);
  const dewPoint = computeDewPoint(temp, humidity);
  const windDeg = Number(apiData?.wind?.deg ?? 0);
  const windSpeed = Number(apiData?.wind?.speed ?? 0) * 3.6;
  const windGust = Number(apiData?.wind?.gust ?? apiData?.wind?.speed ?? 0) * 3.6;
  const visibilityKm = Number(apiData?.visibility ?? 10000) / 1000;

  const rainChance = Math.min(100, Math.max(cloudCover, rainMm > 0 ? 40 : 0));
  const warning = rainMm >= 0.5 || rainChance >= 40;

  return {
    name,
    rain: rainMm.toFixed(2),
    rainPossibility: `${Math.round(rainChance)}%`,
    mslp: `${Math.round(mslp)}`,
    dewpoint: dewPoint.toFixed(1),
    heatIndex: Number(apiData?.main?.feels_like ?? temp).toFixed(1),
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

export const hasWeatherApiKey = (): boolean => Boolean(API_KEY);

export const getFallbackCampusWeather = (): CampusWeather[] => FALLBACK_DATA;

export const fetchCampusWeather = async (): Promise<CampusWeather[]> => {
  if (!API_KEY) {
    return FALLBACK_DATA;
  }

  const responses = await Promise.all(
    CAMPUSES.map(async (campus) => {
      const url = `${BASE_URL}?lat=${campus.lat}&lon=${campus.lon}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Weather API failed for ${campus.name}`);
      }
      const data = await res.json();
      return toCampusWeather(campus.name, data);
    }),
  );

  return responses;
};

export const fetchOpenMeteoForecast = async (lat: number, lon: number): Promise<ForecastPayload> => {
  const params = {
    latitude: lat,
    longitude: lon,
    timezone: OPEN_METEO_TIMEZONE,
    forecast_days: 2,
    models: 'best_match',
    current: OPEN_METEO_CURRENT_VARIABLES,
    daily: OPEN_METEO_DAILY_VARIABLES,
    hourly: OPEN_METEO_HOURLY_VARIABLES,
  };

  const responses = await fetchWeatherApi(OPEN_METEO_FORECAST_URL, params);
  const response = responses?.[0];

  if (!response) {
    throw new Error('Open-Meteo forecast request failed');
  }

  const current = response.current();
  const hourly = response.hourly();
  const daily = response.daily();

  if (!hourly) {
    throw new Error('Open-Meteo hourly data is unavailable');
  }

  const startTime = Number(hourly.time());
  const endTime = Number(hourly.timeEnd());
  const intervalSeconds = Number(hourly.interval());
  const itemCount = Math.max(0, Math.floor((endTime - startTime) / intervalSeconds));

  const times = Array.from(
    { length: itemCount },
    (_, index) => new Date((startTime + index * intervalSeconds) * 1000),
  );

  const temps = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.temperature_2m)?.valuesArray());
  const humidities = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.relative_humidity_2m)?.valuesArray());
  const rainChances = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.precipitation_probability)?.valuesArray());
  const precipitations = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.precipitation)?.valuesArray());
  const winds = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.wind_speed_10m)?.valuesArray());
  const gusts = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.wind_gusts_10m)?.valuesArray());
  const weatherCodes = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.weather_code)?.valuesArray());
  const pressures = toNumberArray(hourly.variables(OPEN_METEO_HOURLY_INDEX.surface_pressure)?.valuesArray());

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

  const currentIsDayRaw = current?.variables(OPEN_METEO_CURRENT_INDEX.is_day)?.value();
  const currentWeatherCodeRaw = current?.variables(OPEN_METEO_CURRENT_INDEX.weather_code)?.value();
  const daylightDurationRaw = daily?.variables(OPEN_METEO_DAILY_INDEX.daylight_duration)?.valuesArray()?.[0];

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
