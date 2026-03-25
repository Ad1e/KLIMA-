
# Batangas State University Campus Risk & Weather Dashboard

A modern web dashboard for real-time campus risk assessment, live weather monitoring, and tropical cyclone analysis for Batangas State University campuses.

---

## Features

- **Live Weather Forecasts:**
  - Uses Open-Meteo API for up-to-date weather data per campus.
  - Dewpoint, heat index, rainfall, wind, and more.
- **Campus Risk Map:**
  - Interactive map with custom BSU logo markers for each campus.
  - Visualizes risk levels and campus locations.
- **Tropical Cyclone Analysis:**
  - Live typhoon event feed from GDACS and PAGASA.
  - Historical and forecast cyclone tracks.
- **Detailed Site Analysis:**
  - Tabbed view: Observed, Forecast, and Synopsis for each campus.
  - Actionable KPIs and operational notes.
- **Backend API:**
  - Node.js/Express backend for data management and future expansion.

---

## Project Structure

```
CCTVs/
├── backend/         # Node.js/Express backend (DB, API)
├── src/             # React frontend source code
│   ├── components/  # Reusable React components
│   ├── data/        # Static and fallback data
│   ├── services/    # API and data fetching logic
│   └── ...          # Main pages and features
├── public/          # Static assets
├── scripts/         # Data fetch/utility scripts
├── README.md        # This file
└── ...
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Clone the Repository
```sh
git clone <repo-url>
cd CCTVs
```

### 2. Install Dependencies
#### Frontend
```sh
npm install
```
#### Backend
```sh
cd backend
npm install
cd ..
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` in the root folder. Set the following as needed:

- `VITE_OPEN_METEO_FORECAST_API_URL` (default: `https://api.open-meteo.com/v1/forecast`)
- `VITE_GDACS_TYHOON_EVENTS_API_URL` (default: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=TC`)
- `VITE_PAGASA_CYCLONE_DAT_URL` (optional, for direct PAGASA feed)

### 4. Running the App
#### Frontend (React/Vite)
```sh
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173) (or as shown in terminal).

#### Backend (API/DB)
```sh
cd backend
npm start
```

---

## Usage Notes
- **Live Data:**
  - Weather and cyclone data update automatically every few minutes.
  - If live APIs are unavailable, fallback data is used.
- **Map Markers:**
  - Each campus is shown with a custom BSU logo marker.
  - Risk levels are visualized on the map (see RiskMap logic).
- **Custom Scripts:**
  - See `scripts/` for data fetchers and utilities.

---

## Development
- TypeScript, React, Vite for frontend.
- Node.js, Express for backend.
- ESLint, Prettier, and recommended plugins for code quality.
- See `eslint.config.js` and comments for advanced linting setup.

---

## Credits
- [Open-Meteo](https://open-meteo.com/) for weather data
- [GDACS](https://www.gdacs.org/) and [PAGASA](https://bagong.pagasa.dost.gov.ph/) for cyclone feeds
- [Leaflet](https://leafletjs.com/) for interactive maps
- Batangas State University (project context)

---

## License
MIT (or specify your license here)
