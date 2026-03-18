export interface CampusSeed {
  name: string;
  lat: number;
  lon: number;
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
  { name: 'Alangilan Campus', lat: 13.7846, lon: 121.0735 },
  { name: 'Lipa Campus', lat: 13.9411, lon: 121.1631 },
  { name: 'Main Campus', lat: 13.7565, lon: 121.0583 },
  { name: 'Malvar Campus', lat: 14.0453, lon: 121.1604 },
  { name: 'Nasugbu Campus', lat: 14.0723, lon: 120.6311 },
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
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_STREET = import.meta.env.VITE_MAPBOX_STYLE_STREET ?? 'mapbox/streets-v12';
const MAPBOX_STYLE_SATELLITE =
  import.meta.env.VITE_MAPBOX_STYLE_SATELLITE ?? 'mapbox/satellite-streets-v12';
const MAPBOX_STYLE_DARK = import.meta.env.VITE_MAPBOX_STYLE_DARK ?? 'mapbox/dark-v11';

const asCardinalDirection = (degrees: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return dirs[index];
};

const computeDewPoint = (tempC: number, humidityPct: number): number => {
  // Quick approximation suitable for dashboard display.
  return tempC - (100 - humidityPct) / 5;
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
export const hasMapboxToken = (): boolean => Boolean(MAPBOX_TOKEN);

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

const styleFromMode = (mode: string): string => {
  if (mode === 'satellite') return MAPBOX_STYLE_SATELLITE;
  if (mode === 'dark') return MAPBOX_STYLE_DARK;
  return MAPBOX_STYLE_STREET;
};

export const getMapboxStaticPreviewUrl = (
  mode: string,
  weatherData: CampusWeather[],
): string | null => {
  if (!MAPBOX_TOKEN) return null;

  const style = styleFromMode(mode);
  const markers = CAMPUSES.map((campus) => {
    const weather = weatherData.find((item) => item.name === campus.name);
    const color = weather?.warning ? 'b91c1c' : '16a34a';
    return `pin-s+${color}(${campus.lon},${campus.lat})`;
  }).join(',');

  const centerLon = 121.02;
  const centerLat = 13.93;
  const zoom = 8.2;
  const size = '1200x650';

  return `https://api.mapbox.com/styles/v1/${style}/static/${markers}/${centerLon},${centerLat},${zoom}/${size}?access_token=${MAPBOX_TOKEN}`;
};
