import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import "./WeatherDashboard.css";


const AdvancedNASAScene = ({ weatherData, isDarkMode }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const animationRef = useRef(null);
    const earthRef = useRef(null);
    const cloudsRef = useRef(null);
    const satellitesRef = useRef([]);
    const particlesRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        // Add OrbitControls for interactivity
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.minDistance = 3;
        controls.maxDistance = 10;

        // Enhanced Earth with multiple layers
        const earthGroup = new THREE.Group();
        scene.add(earthGroup);

        // Earth core
        const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
        const earthTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
        const earthBumpMap = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg');
        const earthSpecularMap = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');

        const earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: earthBumpMap,
            bumpScale: 0.05,
            specularMap: earthSpecularMap,
            specular: new THREE.Color(0x333333),
            shininess: 10,
            transparent: true,
            opacity: 1
        });

        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earthGroup.add(earth);
        earthRef.current = earth;

        // Enhanced clouds layer
        const cloudGeometry = new THREE.SphereGeometry(2.05, 64, 64);
        const cloudTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });

        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        earthGroup.add(clouds);
        cloudsRef.current = clouds;

        // Atmosphere glow effect
        const atmosphereGeometry = new THREE.SphereGeometry(2.2, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00aaff) },
                viewVector: { value: camera.position }
            },
            vertexShader: `
        uniform vec3 viewVector;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(0.6 - dot(vNormal, vNormel), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        earthGroup.add(atmosphere);

        // Enhanced starfield with multiple sizes and colors
        const starCount = 10000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            // Random positions in a sphere
            const radius = 500 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i3 + 2] = radius * Math.cos(phi);

            // Random colors (mostly white/blue with some orange/red)
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                starColors[i3] = 1; // White
                starColors[i3 + 1] = 1;
                starColors[i3 + 2] = 1;
            } else if (colorChoice < 0.85) {
                starColors[i3] = 0.5; // Blue
                starColors[i3 + 1] = 0.7;
                starColors[i3 + 2] = 1;
            } else {
                starColors[i3] = 1; // Orange/Red
                starColors[i3 + 1] = 0.6;
                starColors[i3 + 2] = 0.3;
            }

            // Random sizes
            starSizes[i] = Math.random() * 2 + 0.1;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Satellite system
        const createSatellite = (orbitRadius, speed, color, size = 0.05) => {
            const satelliteGroup = new THREE.Group();

            // Satellite body
            const satelliteGeometry = new THREE.SphereGeometry(size, 8, 8);
            const satelliteMaterial = new THREE.MeshBasicMaterial({ color });
            const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial);

            // Solar panels
            const panelGeometry = new THREE.BoxGeometry(size * 3, size * 0.1, size * 2);
            const panelMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

            const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            leftPanel.position.x = -size * 2;
            const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            rightPanel.position.x = size * 2;

            satelliteGroup.add(satellite);
            satelliteGroup.add(leftPanel);
            satelliteGroup.add(rightPanel);

            // Position in orbit
            const angle = Math.random() * Math.PI * 2;
            satelliteGroup.position.set(
                Math.cos(angle) * orbitRadius,
                Math.sin(angle) * orbitRadius * 0.3,
                Math.sin(angle) * orbitRadius * 0.7
            );

            scene.add(satelliteGroup);

            return {
                group: satelliteGroup,
                orbitRadius,
                speed,
                angle,
                color
            };
        };

        // Create multiple satellites
        const satellites = [
            createSatellite(3.5, 0.002, 0xff4444, 0.06), // ISS-like
            createSatellite(4.0, 0.0015, 0x44ff44, 0.04), // GPS
            createSatellite(2.8, 0.003, 0x4444ff, 0.03), // Low orbit
            createSatellite(5.0, 0.001, 0xffff44, 0.05) // Geostationary
        ];

        satellitesRef.current = satellites;

        // Particle system for space dust
        const particleCount = 5000;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            const radius = 3 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i + 2] = radius * Math.cos(phi);
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x8888ff,
            size: 0.02,
            transparent: true,
            opacity: 0.6
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        particlesRef.current = particles;

        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0x333333, 0.4);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 5, 5);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0x4477ff, 0.3);
        fillLight.position.set(-5, -3, -5);
        scene.add(fillLight);

        // Animation loop
        const clock = new THREE.Clock();

        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);

            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();

            // Update controls
            controls.update();

            // Rotate Earth and clouds at different speeds
            if (earthRef.current) {
                earthRef.current.rotation.y += 0.001;
            }

            if (cloudsRef.current) {
                cloudsRef.current.rotation.y += 0.0012;
            }

            // Animate satellites
            satellitesRef.current.forEach((satellite, index) => {
                satellite.angle += satellite.speed;
                const orbitRadius = satellite.orbitRadius + Math.sin(elapsedTime * 0.5 + index) * 0.1;

                satellite.group.position.x = Math.cos(satellite.angle) * orbitRadius;
                satellite.group.position.y = Math.sin(satellite.angle) * orbitRadius * 0.3;
                satellite.group.position.z = Math.sin(satellite.angle) * orbitRadius * 0.7;

                // Always face the Earth
                satellite.group.lookAt(0, 0, 0);

                // Rotate solar panels
                satellite.group.rotation.y += 0.02;
            });

            // Rotate stars slowly
            stars.rotation.y += 0.00005;

            // Animate particles
            if (particlesRef.current) {
                particlesRef.current.rotation.y += 0.0002;
                particlesRef.current.rotation.x += 0.0001;
            }

            // Weather-based effects
            if (weatherData) {
                const temp = weatherData.main.temp;
                const humidity = weatherData.main.humidity;
                const windSpeed = weatherData.wind.speed;

                // Adjust cloud opacity based on humidity
                if (cloudsRef.current) {
                    const targetOpacity = Math.min(humidity / 150 + 0.3, 0.8);
                    cloudsRef.current.material.opacity += (targetOpacity - cloudsRef.current.material.opacity) * 0.1;
                }

                // Adjust Earth color tint based on temperature
                if (earthRef.current) {
                    const tempColor = temp > 25 ? 0xff4444 : 0x4444ff;
                    const intensity = Math.min(Math.abs(temp - 20) / 30, 0.3);
                    earthRef.current.material.color.lerp(
                        new THREE.Color().setHSL(0, 0, 1).lerp(new THREE.Color(tempColor), intensity),
                        0.1
                    );
                }

                // Adjust rotation speed based on wind
                const windEffect = 1 + (windSpeed / 20) * 0.5;
                if (earthRef.current) earthRef.current.rotation.y += 0.001 * windEffect;
                if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0012 * windEffect;
            }

            // Pulsing atmosphere effect
            if (atmosphere.material.uniforms.glowColor) {
                const pulse = Math.sin(elapsedTime * 2) * 0.2 + 0.8;
                atmosphere.material.uniforms.glowColor.value.setRGB(0, 0.6 * pulse, 1 * pulse);
            }

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current) return;

            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            controls.dispose();
            renderer.dispose();

            // Dispose of geometries and materials
            [earthGeometry, cloudGeometry, atmosphereGeometry, starGeometry, particleGeometry].forEach(geo => {
                if (geo) geo.dispose();
            });

            [earthMaterial, cloudMaterial, atmosphereMaterial, starMaterial, particleMaterial].forEach(mat => {
                if (mat && mat.dispose) mat.dispose();
            });
        };
    }, [weatherData, isDarkMode]);

    return <div ref={mountRef} className="nasa-scene" />;
};

// Chart Components (unchanged from previous version)
const TemperatureChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((day, index) => ({
        name: day.day,
        high: day.high,
        low: day.low,
        avg: day.temp
    }));

    return (
        <div className="chart-container">
            <h3>🌡️ Temperature Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Area type="monotone" dataKey="high" stackId="1" stroke="#ff4444" fill="#ff4444" fillOpacity={0.3} name="High" />
                    <Area type="monotone" dataKey="avg" stackId="2" stroke="#ffaa00" fill="#ffaa00" fillOpacity={0.3} name="Average" />
                    <Area type="monotone" dataKey="low" stackId="3" stroke="#4444ff" fill="#4444ff" fillOpacity={0.3} name="Low" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const HumidityChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((day, index) => ({
        name: day.day,
        humidity: day.humidity
    }));

    return (
        <div className="chart-container">
            <h3>💧 Humidity Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Bar dataKey="humidity" fill="#00aaff" name="Humidity %" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const WindChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((day, index) => ({
        name: day.day,
        wind: day.wind
    }));

    return (
        <div className="chart-container">
            <h3>💨 Wind Speed Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Line type="monotone" dataKey="wind" stroke="#00ff88" strokeWidth={2} name="Wind Speed (m/s)" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const PrecipitationChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((day, index) => ({
        name: day.day,
        precipitation: day.rain
    }));

    return (
        <div className="chart-container">
            <h3>🌧️ Precipitation Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Bar dataKey="precipitation" fill="#8844ff" name="Precipitation (mm)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const WeatherDashboard = () => {
    const [city, setCity] = useState("");
    const [weather, setWeather] = useState(null);
    const [hourlyForecast, setHourlyForecast] = useState([]);
    const [dailyForecast, setDailyForecast] = useState([]);
    const [error, setError] = useState("");
    const [mode, setMode] = useState("dark");
    const [loading, setLoading] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [exportFormat, setExportFormat] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [trendData, setTrendData] = useState(null);
    const [showNASA, setShowNASA] = useState(true);

    const API_KEY = import.meta.env.VITE_WEATHER_KEY || "2b88e236788105a55c15df0b08aa9cb2";

    // Fix for dark/light mode - properly initialize and toggle
    useEffect(() => {
        const savedHistory = localStorage.getItem("weatherSearchHistory");
        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }

        // Check system preference and saved preference
        const savedMode = localStorage.getItem("weatherDashboardMode");
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedMode) {
            setMode(savedMode);
        } else {
            setMode(systemPrefersDark ? "dark" : "light");
        }
    }, []);

    // Save mode to localStorage when it changes
    useEffect(() => {
        localStorage.setItem("weatherDashboardMode", mode);
        // Apply mode to document for CSS variables
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
    }, [searchHistory]);

    const getWeather = async () => {
        if (!city.trim()) {
            setError("⚠️ Please enter a city name");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const [weatherRes, forecastRes] = await Promise.all([
                axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`),
                axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`)
            ]);

            setWeather(weatherRes.data);

            // Add to search history
            const newSearch = {
                city: weatherRes.data.name,
                country: weatherRes.data.sys.country,
                timestamp: new Date().toISOString()
            };

            setSearchHistory(prev => {
                const filtered = prev.filter(item =>
                    !(item.city === newSearch.city && item.country === newSearch.country)
                );
                return [newSearch, ...filtered].slice(0, 5);
            });

            // Process hourly forecast (next 24 hours)
            const next24Hours = forecastRes.data.list.slice(0, 8);
            const hourly = next24Hours.map((h, index) => {
                const date = new Date(h.dt * 1000);
                return {
                    time: index === 0 ? "Now" : date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
                    temp: Math.round(h.main.temp),
                    icon: h.weather[0].icon,
                    humidity: h.main.humidity,
                    wind: h.wind.speed,
                    rain: h.rain ? h.rain["3h"] : 0,
                    description: h.weather[0].description,
                    feels_like: Math.round(h.main.feels_like)
                };
            });

            setHourlyForecast(hourly);

            // Process 7-day forecast
            const dailyData = processDailyForecast(forecastRes.data.list);
            setDailyForecast(dailyData);

            // Generate trend analysis
            generateTrendAnalysis(dailyData, weatherRes.data);

        } catch (err) {
            setError("❌ City not found or API error. Please try again.");
            setWeather(null);
            setHourlyForecast([]);
            setDailyForecast([]);
        } finally {
            setLoading(false);
        }
    };

    const processDailyForecast = (list) => {
        const dailyData = [];
        const daysMap = new Map();

        list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();

            if (!daysMap.has(dayKey)) {
                daysMap.set(dayKey, {
                    date: date,
                    temps: [],
                    humidity: [],
                    wind: [],
                    rain: [],
                    icons: [],
                    descriptions: []
                });
            }

            const dayData = daysMap.get(dayKey);
            dayData.temps.push(item.main.temp);
            dayData.humidity.push(item.main.humidity);
            dayData.wind.push(item.wind.speed);
            dayData.rain.push(item.rain ? item.rain["3h"] : 0);
            dayData.icons.push(item.weather[0].icon);
            dayData.descriptions.push(item.weather[0].description);
        });

        let dayCount = 0;
        const result = [];
        for (let [key, dayData] of daysMap) {
            if (dayCount >= 7) break;

            const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length);
            const maxTemp = Math.round(Math.max(...dayData.temps));
            const minTemp = Math.round(Math.min(...dayData.temps));
            const avgHumidity = Math.round(dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length);
            const avgWind = Math.round((dayData.wind.reduce((a, b) => a + b, 0) / dayData.wind.length) * 10) / 10;
            const totalRain = dayData.rain.reduce((a, b) => a + b, 0);

            const iconCounts = {};
            dayData.icons.forEach(icon => {
                iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            });
            const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) =>
                iconCounts[a] > iconCounts[b] ? a : b
            );

            const descCounts = {};
            dayData.descriptions.forEach(desc => {
                descCounts[desc] = (descCounts[desc] || 0) + 1;
            });
            const mostCommonDesc = Object.keys(descCounts).reduce((a, b) =>
                descCounts[a] > descCounts[b] ? a : b
            );

            result.push({
                day: dayData.date.toLocaleDateString("en-US", { weekday: "short" }),
                date: dayData.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                temp: avgTemp,
                high: maxTemp,
                low: minTemp,
                humidity: avgHumidity,
                wind: avgWind,
                rain: totalRain,
                icon: mostCommonIcon,
                description: mostCommonDesc
            });

            dayCount++;
        }
        return result;
    };

    const generateTrendAnalysis = (dailyData, currentWeather) => {
        const tempTrend = dailyData.map(day => day.temp);
        const humidityTrend = dailyData.map(day => day.humidity);
        const windTrend = dailyData.map(day => day.wind);

        const avgTemp = tempTrend.reduce((a, b) => a + b, 0) / tempTrend.length;
        const avgHumidity = humidityTrend.reduce((a, b) => a + b, 0) / humidityTrend.length;
        const avgWind = windTrend.reduce((a, b) => a + b, 0) / windTrend.length;

        const tempTrendDirection = tempTrend[tempTrend.length - 1] > tempTrend[0] ? "rising" : "falling";
        const humidityTrendDirection = humidityTrend[humidityTrend.length - 1] > humidityTrend[0] ? "rising" : "falling";

        setTrendData({
            avgTemp: Math.round(avgTemp),
            avgHumidity: Math.round(avgHumidity),
            avgWind: Math.round(avgWind * 10) / 10,
            tempTrend: tempTrendDirection,
            humidityTrend: humidityTrendDirection,
            recommendation: generateSmartRecommendation(currentWeather, dailyData),
            chartData: dailyData
        });
    };

    const generateSmartRecommendation = (currentWeather, forecast) => {
        const recommendations = [];
        const currentTemp = currentWeather.main.temp;
        const conditions = currentWeather.weather[0].main.toLowerCase();
        const humidity = currentWeather.main.humidity;
        const windSpeed = currentWeather.wind.speed;

        if (currentTemp > 30) {
            recommendations.push({ icon: "☀️", text: "High temperature! Stay hydrated and use sunscreen", priority: "high" });
        } else if (currentTemp < 10) {
            recommendations.push({ icon: "🧥", text: "Low temperature! Wear warm layers", priority: "high" });
        }

        if (conditions.includes("rain")) {
            recommendations.push({ icon: "🌂", text: "Rain expected! Carry an umbrella", priority: "high" });
        }
        if (conditions.includes("snow")) {
            recommendations.push({ icon: "🧤", text: "Snow conditions! Wear appropriate footwear", priority: "high" });
        }
        if (windSpeed > 15) {
            recommendations.push({ icon: "💨", text: "Strong winds! Secure outdoor items", priority: "medium" });
        }
        if (humidity > 80) {
            recommendations.push({ icon: "💧", text: "High humidity! Stay in ventilated areas", priority: "medium" });
        }

        const tomorrow = forecast[1];
        if (tomorrow) {
            if (tomorrow.rain > 5) {
                recommendations.push({ icon: "🌧️", text: "Heavy rain tomorrow! Plan indoor activities", priority: "medium" });
            }
        }

        return recommendations.slice(0, 3);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") getWeather();
    };

    const toggleMode = () => {
        setMode(prevMode => {
            const newMode = prevMode === "dark" ? "light" : "dark";
            return newMode;
        });
    };

    const handleSearchFromHistory = (cityName) => {
        setCity(cityName);
        setTimeout(() => getWeather(), 10);
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
    };

    const exportData = (format) => {
        if (!weather) {
            setError("No weather data to export");
            return;
        }

        const data = {
            current: weather,
            hourly: hourlyForecast,
            daily: dailyForecast,
            trend: trendData,
            exportedAt: new Date().toISOString()
        };

        switch (format) {
            case 'json':
                const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadBlob(jsonBlob, `nasa-weather-data-${weather.name}.json`);
                break;

            case 'csv':
                const csvContent = convertToCSV(data);
                const csvBlob = new Blob([csvContent], { type: 'text/csv' });
                downloadBlob(csvBlob, `nasa-weather-data-${weather.name}.csv`);
                break;

            case 'pdf':
                generatePDF(data);
                break;
        }

        setShowExportMenu(false);
    };

    const convertToCSV = (data) => {
        const headers = ['Date', 'High Temp (°C)', 'Low Temp (°C)', 'Condition', 'Humidity (%)', 'Wind Speed (m/s)', 'Precipitation (mm)'];
        const rows = data.daily.map(day => [
            day.date,
            day.high,
            day.low,
            day.description,
            day.humidity,
            day.wind,
            day.rain
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generatePDF = (data) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>NASA Weather Report - ${data.current.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; background: #0a0a2a; color: white; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #005288; padding-bottom: 20px; }
                        .nasa-logo { color: #005288; font-size: 2em; margin-bottom: 10px; }
                        .section { margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #005288; padding: 8px; text-align: left; }
                        th { background-color: #005288; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="nasa-logo">🚀 NASA WEATHER ANALYTICS</div>
                        <h1>Weather Report - ${data.current.name}</h1>
                        <p>Generated on ${new Date().toLocaleString()}</p>
                    </div>
                    <div class="section">
                        <h2>Current Weather</h2>
                        <p>Temperature: ${Math.round(data.current.main.temp)}°C</p>
                        <p>Condition: ${data.current.weather[0].description}</p>
                        <p>Humidity: ${data.current.main.humidity}%</p>
                        <p>Wind: ${data.current.wind.speed} m/s</p>
                    </div>
                    <div class="section">
                        <h2>7-Day Forecast Analysis</h2>
                        <table>
                            <tr>
                                <th>Day</th>
                                <th>High/Low</th>
                                <th>Condition</th>
                                <th>Humidity</th>
                                <th>Wind</th>
                            </tr>
                            ${data.daily.map(day => `
                                <tr>
                                    <td>${day.day}</td>
                                    <td>${day.high}°/${day.low}°</td>
                                    <td>${day.description}</td>
                                    <td>${day.humidity}%</td>
                                    <td>${day.wind} m/s</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Render components
    const renderWeatherMetrics = () => {
        if (!weather) return null;

        const metrics = [
            { icon: "👁️", label: "Visibility", value: `${(weather.visibility / 1000).toFixed(1)} km`, status: "Good" },
            { icon: "📊", label: "Pressure", value: `${weather.main.pressure} hPa`, status: "Stable" },
            { icon: "🌫️", label: "AQI", value: "Moderate", status: "Moderate" },
            { icon: "☀️", label: "UV Index", value: "8", status: "Very High" },
            { icon: "💨", label: "Wind", value: `${weather.wind.speed} m/s`, subValue: `Direction: ${weather.wind.deg}°`, status: "Light Breeze" },
            { icon: "💧", label: "Humidity", value: `${weather.main.humidity}%`, status: "Comfortable" },
            { icon: "🌡️", label: "Dew Point", value: `${Math.round(weather.main.feels_like)}°C`, status: "Normal" },
            { icon: "🌅", label: "Sunrise & Sunset", value: `${new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} / ${new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: "" }
        ];

        return (
            <motion.div
                className="weather-metrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="section-title">Weather Details</h2>
                <div className="metrics-grid">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={index}
                            className="metric-item"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="metric-icon">{metric.icon}</div>
                            <div className="metric-content">
                                <div className="metric-label">{metric.label}</div>
                                <div className="metric-value">{metric.value}</div>
                                {metric.subValue && <div className="metric-subvalue">{metric.subValue}</div>}
                                {metric.status && <div className="metric-status">{metric.status}</div>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    };

    const renderHourlyForecast = () => {
        if (!hourlyForecast.length) return null;

        return (
            <motion.div
                className="hourly-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="section-title">24-Hour Forecast</h2>
                <div className="hourly-scroll-container">
                    <div className="hourly-forecast-cards">
                        {hourlyForecast.map((hour, index) => (
                            <motion.div
                                key={index}
                                className="hourly-card"
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="hourly-time">{hour.time}</div>
                                <img
                                    src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                                    alt={hour.description}
                                    className="hourly-icon"
                                />
                                <div className="hourly-temp">{hour.temp}°</div>
                                <div className="hourly-details">
                                    <div className="hourly-detail">
                                        <span>💧</span> {hour.humidity}%
                                    </div>
                                    <div className="hourly-detail">
                                        <span>💨</span> {hour.wind} m/s
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderDailyForecast = () => {
        if (!dailyForecast.length) return null;

        return (
            <motion.div
                className="daily-section"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="section-title">7-Day Forecast</h2>
                <div className="daily-forecast-cards">
                    {dailyForecast.map((day, index) => (
                        <motion.div
                            key={index}
                            className="daily-card"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="daily-date">
                                <div className="daily-day">{day.day}</div>
                                <div className="daily-date-num">{day.date}</div>
                            </div>
                            <img
                                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                                alt={day.description}
                                className="daily-icon"
                            />
                            <div className="daily-desc">{day.description}</div>
                            <div className="daily-temps">
                                <span className="daily-high">{day.high}°</span>
                                <span className="daily-low">{day.low}°</span>
                            </div>
                            <div className="daily-details">
                                <div className="daily-detail">
                                    <span>💧</span> {day.humidity}%
                                </div>
                                <div className="daily-detail">
                                    <span>💨</span> {day.wind} m/s
                                </div>
                                {day.rain > 0 && (
                                    <div className="daily-detail rain">
                                        <span>🌧️</span> {day.rain} mm
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    };

    const renderSmartRecommendations = () => {
        if (!trendData) return null;

        return (
            <motion.div
                className="recommendations-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h2 className="section-title">🚀 NASA Smart Recommendations</h2>
                <div className="recommendations-grid">
                    {trendData.recommendation.map((rec, index) => (
                        <motion.div
                            key={index}
                            className={`recommendation-card priority-${rec.priority}`}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="recommendation-icon">{rec.icon}</div>
                            <div className="recommendation-text">{rec.text}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    };

    const renderTrendAnalysis = () => {
        if (!trendData || !trendData.chartData) return null;

        return (
            <motion.div
                className="trend-analysis-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <h2 className="section-title">📈 NASA Climate Trend Analysis</h2>

                <div className="trend-summary">
                    <div className="trend-metric">
                        <div className="trend-value">{trendData.avgTemp}°C</div>
                        <div className="trend-label">Avg Temperature</div>
                        <div className={`trend-direction ${trendData.tempTrend}`}>
                            {trendData.tempTrend === 'rising' ? '↗️ Rising' : '↘️ Falling'}
                        </div>
                    </div>
                    <div className="trend-metric">
                        <div className="trend-value">{trendData.avgHumidity}%</div>
                        <div className="trend-label">Avg Humidity</div>
                        <div className={`trend-direction ${trendData.humidityTrend}`}>
                            {trendData.humidityTrend === 'rising' ? '↗️ Rising' : '↘️ Falling'}
                        </div>
                    </div>
                    <div className="trend-metric">
                        <div className="trend-value">{trendData.avgWind} m/s</div>
                        <div className="trend-label">Avg Wind Speed</div>
                        <div className="trend-direction">🌬️ Steady</div>
                    </div>
                </div>

                <div className="charts-grid">
                    <TemperatureChart data={trendData.chartData} />
                    <HumidityChart data={trendData.chartData} />
                    <WindChart data={trendData.chartData} />
                    <PrecipitationChart data={trendData.chartData} />
                </div>
            </motion.div>
        );
    };

    return (
        <div className={`dashboard-container ${mode}-mode nasa-theme`}>
            <div className="dashboard-header">
                <div className="header-content">
                    <motion.h1
                        className="dashboard-title"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="title-icon">🚀</span>
                        NASA Weather Analytics
                    </motion.h1>

                    <div className="header-actions">
                        <motion.button
                            className="action-btn nasa-btn"
                            onClick={() => setShowNASA(!showNASA)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {showNASA ? "🌎 Hide Globe" : "🛰️ Show Globe"}
                        </motion.button>

                        <div className="export-dropdown">
                            <motion.button
                                className="action-btn export-btn"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                📊 Export Data
                            </motion.button>
                            {showExportMenu && (
                                <motion.div
                                    className="export-menu"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <button onClick={() => exportData('json')}>📄 JSON</button>
                                    <button onClick={() => exportData('csv')}>📋 CSV</button>
                                    <button onClick={() => exportData('pdf')}>📑 PDF Report</button>
                                </motion.div>
                            )}
                        </div>

                        <motion.button
                            className="mode-toggle"
                            onClick={toggleMode}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {mode === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                        </motion.button>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {showNASA && (
                    <motion.div
                        className="nasa-scene-container"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <AdvancedNASAScene weatherData={weather} isDarkMode={mode === "dark"} />
                    </motion.div>
                )}

                <motion.div
                    className="search-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Enter city name for weather analysis..."
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="search-input"
                            />
                            <motion.button
                                onClick={getWeather}
                                className="search-button"
                                disabled={loading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {loading ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    "🚀 Analyze Weather"
                                )}
                            </motion.button>
                        </div>

                        {searchHistory.length > 0 && (
                            <div className="search-history">
                                <div className="search-history-header">
                                    <span>📚 Recent Analysis</span>
                                    <button
                                        className="clear-history-btn"
                                        onClick={clearSearchHistory}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="search-history-items">
                                    {searchHistory.map((item, index) => (
                                        <motion.button
                                            key={index}
                                            className="history-item"
                                            onClick={() => handleSearchFromHistory(item.city)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {item.city}, {item.country}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {error}
                    </motion.div>
                )}

                {weather && (
                    <div className="weather-data">
                        <motion.div
                            className="current-weather-section"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="location-info">
                                <h2 className="city-name">
                                    {weather.name}, {weather.sys.country}
                                </h2>
                                <div className="current-time">
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="last-updated">
                                    NASA Weather Data - Live
                                </div>
                            </div>

                            <div className="current-weather-main">
                                <div className="weather-icon-temp">
                                    <motion.img
                                        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                                        alt={weather.weather[0].description}
                                        className="current-weather-icon"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                    <div className="current-temp">
                                        {Math.round(weather.main.temp)}°
                                    </div>
                                </div>
                                <div className="weather-details">
                                    <div className="weather-description">
                                        {weather.weather[0].description}
                                    </div>
                                    <div className="high-low">
                                        H: {Math.round(weather.main.temp_max)}° • L: {Math.round(weather.main.temp_min)}°
                                    </div>
                                    <div className="feels-like">
                                        Feels like: {Math.round(weather.main.feels_like)}°
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {renderSmartRecommendations()}
                        {renderTrendAnalysis()}
                        {renderHourlyForecast()}
                        {renderWeatherMetrics()}
                        {renderDailyForecast()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherDashboard;