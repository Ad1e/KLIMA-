# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Live Weather Forecast Setup

The Detailed Site Analysis forecast view can use live Open-Meteo forecast data.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_OPEN_METEO_FORECAST_API_URL` (default: `https://api.open-meteo.com/v1/forecast`).
3. Keep your existing weather variables if you still use OpenWeather for campus observation cards.

## Live Tropical Cyclone Feed Setup

Tropical Cyclone Analysis can pull live typhoon event updates from GDACS.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_GDACS_TYHOON_EVENTS_API_URL` (default: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtype=TC`).
3. (Optional but recommended) Set `VITE_PAGASA_CYCLONE_DAT_URL` to PAGASA's direct text feed:
  - `https://pubfiles.pagasa.dost.gov.ph/tamss/weather/cyclone.dat`
4. The TC UI reads these feeds directly; manual `pagasa:bulletin` execution is not required for normal dashboard display.
5. Restart the Vite dev server after updating environment variables.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
