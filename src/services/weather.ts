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
