export interface ForecastPoint {
  time: string;
  temp: number;
  rain: number;
  wind: number;
  gust: number;
  humidity: number;
  pressure: number;
  chanceRain: number;
  condition: 'Partly Cloudy' | 'Light Rain' | 'Moderate Rain' | 'Cloudy';
}

export const forecastData: ForecastPoint[] = [
  {
    time: '00:00',
    temp: 26.4,
    rain: 0.1,
    wind: 10,
    gust: 15,
    humidity: 82,
    pressure: 1012,
    chanceRain: 28,
    condition: 'Partly Cloudy',
  },
  {
    time: '03:00',
    temp: 25.8,
    rain: 0.4,
    wind: 12,
    gust: 18,
    humidity: 84,
    pressure: 1011,
    chanceRain: 36,
    condition: 'Cloudy',
  },
  {
    time: '06:00',
    temp: 26.9,
    rain: 1.1,
    wind: 14,
    gust: 22,
    humidity: 86,
    pressure: 1010,
    chanceRain: 54,
    condition: 'Light Rain',
  },
  {
    time: '09:00',
    temp: 29.2,
    rain: 1.8,
    wind: 18,
    gust: 27,
    humidity: 83,
    pressure: 1009,
    chanceRain: 68,
    condition: 'Moderate Rain',
  },
  {
    time: '12:00',
    temp: 31.1,
    rain: 2.3,
    wind: 22,
    gust: 33,
    humidity: 80,
    pressure: 1008,
    chanceRain: 76,
    condition: 'Moderate Rain',
  },
  {
    time: '15:00',
    temp: 30.3,
    rain: 1.6,
    wind: 20,
    gust: 30,
    humidity: 81,
    pressure: 1009,
    chanceRain: 64,
    condition: 'Light Rain',
  },
  {
    time: '18:00',
    temp: 28.1,
    rain: 0.7,
    wind: 16,
    gust: 24,
    humidity: 83,
    pressure: 1010,
    chanceRain: 46,
    condition: 'Cloudy',
  },
  {
    time: '21:00',
    temp: 27.0,
    rain: 0.3,
    wind: 13,
    gust: 19,
    humidity: 84,
    pressure: 1011,
    chanceRain: 32,
    condition: 'Partly Cloudy',
  },
];

export const timelineData = forecastData.slice(0, 6);
