import React, { useState } from "react";
import axios from "axios";
import "./Api.css";

const Weather = () => {
    const [city, setCity] = useState("");
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState("");

    const API_KEY =
        import.meta.env.VITE_WEATHER_KEY || "2b88e236788105a55c15df0b08aa9cb2";

    const getWeather = async () => {
        if (!city.trim()) {
            setError("⚠️ Please enter a city name");
            return;
        }
        try {
            setError("");
            const res = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
            );
            setWeather(res.data);
        } catch {
            setError("❌ City not found. Try again!");
            setWeather(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") getWeather();
    };

    return (
        <div className="weather-container">
            <h1 className="weather-heading">⚡ Weather Wizard</h1>

            <div className="input-section">
                <input
                    type="text"
                    placeholder="Enter city name..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="weather-input"
                />
                <button onClick={getWeather} className="weather-button">
                    Get Weather
                </button>
            </div>

            {error && <p className="weather-error">{error}</p>}

            {weather && (
                <div className="weather-card">
                    <h2 className="city-name">
                        {weather.name}, {weather.sys.country}
                    </h2>
                    <img
                        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                        alt="weather icon"
                        className="weather-icon"
                    />
                    <h3 className="temp">
                        {Math.round(weather.main.temp)}°C
                    </h3>
                    <p className="desc">{weather.weather[0].description}</p>
                    <div className="extra-info">
                        <p>💧 Humidity: {weather.main.humidity}%</p>
                        <p>🌬 Wind: {weather.wind.speed} m/s</p>
                        <p>🌡 Feels like: {Math.round(weather.main.feels_like)}°C</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Weather;
