import { Router } from 'express';

const router = Router();

// ── Campus definitions (keep in sync with frontend CAMPUSES) ──────────────────
const CAMPUSES = [
  { name: 'Alangilan Campus',  lat: 13.784295, lon: 121.07428   },
  { name: 'Lipa City Campus',  lat: 13.9555,   lon: 121.1633    },
  { name: 'Main Campus',       lat: 13.754456, lon: 121.053131  },
  { name: 'Malvar Campus',     lat: 14.044912, lon: 121.156329  },
  { name: 'Nasugbu Campus',    lat: 14.067244, lon: 120.626752  },
  { name: 'Balayan Campus',    lat: 13.9405,   lon: 120.7251    },
  { name: 'San Juan Campus',   lat: 13.8268,   lon: 121.3952    },
  { name: 'Lobo Campus',       lat: 13.6492,   lon: 121.2063    },
];

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS   = 10 * 60 * 1000; // 10 minutes

// Current variables requested from the API
const CURRENT_VARS = [
  'is_day', 'rain', 'relative_humidity_2m', 'temperature_2m',
  'apparent_temperature', 'wind_gusts_10m', 'wind_direction_10m',
  'wind_speed_10m', 'weather_code',
];

// Hourly variables requested from the API
const HOURLY_VARS = [
  'temperature_2m', 'dew_point_2m', 'relative_humidity_2m',
  'apparent_temperature', 'precipitation_probability', 'precipitation',
  'rain', 'showers', 'cloud_cover', 'cloud_cover_low', 'cloud_cover_mid',
  'cloud_cover_high', 'visibility', 'wind_speed_10m', 'wind_speed_80m',
  'wind_speed_120m', 'wind_speed_180m', 'wind_direction_10m',
  'wind_direction_80m', 'wind_direction_120m', 'wind_direction_180m',
  'wind_gusts_10m', 'temperature_80m', 'temperature_120m',
  'temperature_180m', 'weather_code', 'surface_pressure',
];

// ── In-memory cache ───────────────────────────────────────────────────────────
let _cache = null; // { data: any[], ts: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a URL keeping commas literal (not %2C). */
function buildUrl(scalarParams, arrayParams) {
  const scalar = new URLSearchParams(scalarParams).toString();
  const arrays = Object.entries(arrayParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${v}`)
    .join('&');
  return `${OPEN_METEO_URL}?${scalar}&${arrays}`;
}

/** Fetch with up to 3 retries on HTTP 429 using exponential back-off. */
async function fetchWithBackoff(url, maxRetries = 3) {
  let delay = 1500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url);
    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res;
    const retryAfter = res.headers.get('Retry-After');
    const wait = retryAfter ? Number(retryAfter) * 1000 : delay;
    await new Promise(r => setTimeout(r, wait));
    delay *= 2;
  }
}

// ── Route: GET /api/weather/current ──────────────────────────────────────────
router.get('/current', async (_req, res) => {
  // Return cached data if still fresh
  if (_cache && Date.now() - _cache.ts < CACHE_TTL_MS) {
    return res.json({ ok: true, data: _cache.data, cached: true, ts: _cache.ts });
  }

  try {
    const url = buildUrl(
      { timezone: 'Asia/Manila', forecast_days: '1' },
      {
        latitude:  CAMPUSES.map(c => c.lat).join(','),
        longitude: CAMPUSES.map(c => c.lon).join(','),
        current:   CURRENT_VARS.join(','),
        hourly:    HOURLY_VARS.join(','),
      },
    );

    const apiRes = await fetchWithBackoff(url);
    if (!apiRes.ok) {
      return res.status(502).json({
        ok: false,
        message: `Open-Meteo returned ${apiRes.status}`,
      });
    }

    const raw = await apiRes.json();
    // Open-Meteo returns an array when multiple lat/lon are provided
    const dataArray = Array.isArray(raw) ? raw : [raw];

    // Attach campus names for the frontend
    const data = dataArray.map((item, idx) => ({
      ...item,
      _campusName: CAMPUSES[idx]?.name ?? `Campus ${idx + 1}`,
    }));

    _cache = { data, ts: Date.now() };
    return res.json({ ok: true, data, cached: false, ts: _cache.ts });
  } catch (err) {
    return res.status(500).json({ ok: false, message: String(err?.message ?? err) });
  }
});

export default router;
