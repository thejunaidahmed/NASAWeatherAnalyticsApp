# NASA Weather Analytics App

NASA Weather Analytics App is a modern weather dashboard built with React.js and Vite.
It fetches real-time weather data from the OpenWeather API and enhances the user experience with animations, 3D effects, and charts.
The app is deployed on Netlify for fast and reliable hosting.

---

## Features

* Search weather by city name
* Displays:

  * Temperature (°C)
  * Feels like temperature (°C)
  * Humidity (%)
  * Wind speed (m/s)
  * Weather condition (description and icon)
* Error handling for empty or invalid city names
* Interactive data visualization with Recharts
* Smooth animations using Framer Motion
* 3D elements and visual effects with Three.js
* Responsive and clean UI design

---

## Tech Stack

* React.js — component-based UI library
* Vite — fast build tool with HMR
* Axios — HTTP client for API requests
* Framer Motion — animations and transitions
* Three.js — 3D visuals and rendering
* Recharts — data visualization
* CSS3 — styling and animations
* OpenWeather API — weather data provider
* Netlify — deployment platform

---

## Project Structure


src/
├── App.js
├── assets/
│   └── weather/
│       ├── WeatherDashboard.js
│       ├── Weather.js
│       └── Api.css


---

## Setup & Installation

1. Clone the repository

   bash
   git clone https://github.com/your-username/nasa-weather-app.git
   cd nasa-weather-app
   

2. Install dependencies

   bash
   npm install
   

3. Configure environment variables
   Create a .env file in the project root and add your OpenWeather API key:

   
   VITE_WEATHER_KEY=your_api_key_here
   

   You can get a free API key from [OpenWeather](https://openweathermap.org/api).

4. Start the development server

   bash
   npm run dev
   

   The app will run on:

   
   http://localhost:5173/
   

---

## How It Works

1. User enters a city name in the input field.
2. The input is validated.
3. If valid, Axios sends a request to the OpenWeather API.
4. On success, weather data is displayed in a styled weather card.
5. On failure, an error message is shown.
6. Weather information is enhanced with animations (Framer Motion), charts (Recharts), and 3D effects (Three.js).

---

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

* [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
* [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performance.
To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled.
Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [typescript-eslint](https://typescript-eslint.io) in your project.

---

## Future Improvements

* Geolocation-based automatic weather detection
* Five-day forecast with interactive charts
* Dark/Light mode toggle
* Multi-language support

---

## License

This project is licensed under the MIT License.