// FAU Owl Weather — powered by the free Open-Meteo APIs (no API key needed).
(() => {
  "use strict";

  const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

  // Default location: FAU Boca Raton campus.
  const BOCA = { name: "Boca Raton", admin1: "Florida", country: "United States", latitude: 26.3705, longitude: -80.1022 };

  // WMO weather interpretation codes -> [description, day icon, night icon]
  const WMO = {
    0: ["Clear sky", "☀️", "🌙"],
    1: ["Mainly clear", "🌤️", "🌙"],
    2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"],
    45: ["Fog", "🌫️", "🌫️"],
    48: ["Depositing rime fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"],
    53: ["Drizzle", "🌦️", "🌧️"],
    55: ["Dense drizzle", "🌧️", "🌧️"],
    56: ["Freezing drizzle", "🌧️", "🌧️"],
    57: ["Dense freezing drizzle", "🌧️", "🌧️"],
    61: ["Light rain", "🌦️", "🌧️"],
    63: ["Rain", "🌧️", "🌧️"],
    65: ["Heavy rain", "🌧️", "🌧️"],
    66: ["Freezing rain", "🌧️", "🌧️"],
    67: ["Heavy freezing rain", "🌧️", "🌧️"],
    71: ["Light snow", "🌨️", "🌨️"],
    73: ["Snow", "🌨️", "🌨️"],
    75: ["Heavy snow", "❄️", "❄️"],
    77: ["Snow grains", "🌨️", "🌨️"],
    80: ["Light showers", "🌦️", "🌧️"],
    81: ["Showers", "🌧️", "🌧️"],
    82: ["Violent showers", "⛈️", "⛈️"],
    85: ["Snow showers", "🌨️", "🌨️"],
    86: ["Heavy snow showers", "❄️", "❄️"],
    95: ["Thunderstorm", "⛈️", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️", "⛈️"],
    99: ["Severe thunderstorm with hail", "⛈️", "⛈️"],
  };

  const $ = (id) => document.getElementById(id);
  const state = {
    unit: loadPref("unit", "fahrenheit"),
    place: BOCA,
  };

  function loadPref(key, fallback) {
    try { return localStorage.getItem("fauwx:" + key) || fallback; } catch { return fallback; }
  }
  function savePref(key, value) {
    try { localStorage.setItem("fauwx:" + key, value); } catch { /* ignore */ }
  }

  function weather(code, isDay = 1) {
    const w = WMO[code] || ["Unknown", "🌡️", "🌡️"];
    return { desc: w[0], icon: isDay ? w[1] : w[2] };
  }

  function setStatus(msg, isError = false) {
    const el = $("status");
    el.textContent = msg;
    el.classList.toggle("error", isError);
  }

  function placeLabel(p) {
    return [p.name, p.admin1, p.country && p.country !== "United States" ? p.country : null]
      .filter(Boolean)
      .join(", ");
  }

  // Open-Meteo returns local times like "2026-09-28T14:00" when timezone=auto.
  // Parse the parts directly so the display always shows the location's local time.
  function parseLocal(iso) {
    const [d, t = "00:00"] = iso.split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [hh, mm] = t.split(":").map(Number);
    return new Date(y, m - 1, day, hh, mm);
  }
  const fmtHour = (iso) => parseLocal(iso).toLocaleTimeString([], { hour: "numeric" });
  const fmtTime = (iso) => parseLocal(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const fmtDay = (iso, i) => (i === 0 ? "Today" : parseLocal(iso).toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" }));

  function compassDir(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  }

  async function fetchForecast(place) {
    const imperial = state.unit === "fahrenheit";
    const params = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
      temperature_unit: state.unit,
      wind_speed_unit: imperial ? "mph" : "kmh",
      precipitation_unit: imperial ? "inch" : "mm",
      timezone: "auto",
      forecast_days: "7",
    });
    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
    return res.json();
  }

  async function searchPlaces(query) {
    const params = new URLSearchParams({ name: query, count: "6", language: "en", format: "json" });
    const res = await fetch(`${GEOCODE_URL}?${params}`);
    if (!res.ok) throw new Error(`Location search failed (${res.status})`);
    const data = await res.json();
    return data.results || [];
  }

  function render(data) {
    const u = data.current_units;
    const c = data.current;
    const d = data.daily;
    const h = data.hourly;
    const deg = "°";

    // Current conditions
    const now = weather(c.weather_code, c.is_day);
    $("location-name").textContent = placeLabel(state.place);
    $("updated").textContent = `Updated ${fmtTime(c.time)} local time`;
    $("current-icon").textContent = now.icon;
    $("current-temp").textContent = `${Math.round(c.temperature_2m)}${deg}`;
    $("current-desc").textContent = `${now.desc} · H ${Math.round(d.temperature_2m_max[0])}${deg} / L ${Math.round(d.temperature_2m_min[0])}${deg}`;
    $("feels-like").textContent = `${Math.round(c.apparent_temperature)}${deg}`;
    $("humidity").textContent = `${c.relative_humidity_2m}%`;
    $("wind").textContent = `${Math.round(c.wind_speed_10m)} ${u.wind_speed_10m} ${compassDir(c.wind_direction_10m)} (gusts ${Math.round(c.wind_gusts_10m)})`;
    $("precip").textContent = `${c.precipitation} ${u.precipitation === "inch" ? "in" : u.precipitation} · ${d.precipitation_probability_max[0] ?? 0}% chance`;
    $("uv").textContent = d.uv_index_max[0] != null ? `${Math.round(d.uv_index_max[0])}` : "—";
    $("sun").textContent = `${fmtTime(d.sunrise[0])} / ${fmtTime(d.sunset[0])}`;

    // Next 24 hours, starting at the current hour
    const currentHour = c.time.slice(0, 13);
    let start = h.time.findIndex((t) => t.slice(0, 13) >= currentHour);
    if (start < 0) start = 0;
    const hourly = $("hourly");
    hourly.replaceChildren();
    for (let i = start; i < Math.min(start + 24, h.time.length); i++) {
      const w = weather(h.weather_code[i], h.is_day[i]);
      const el = document.createElement("div");
      el.className = "hour";
      el.title = w.desc;
      el.innerHTML = `
        <div class="h-time">${i === start ? "Now" : fmtHour(h.time[i])}</div>
        <div class="h-icon" aria-hidden="true">${w.icon}</div>
        <div class="h-temp">${Math.round(h.temperature_2m[i])}${deg}</div>
        <div class="h-rain">💧 ${h.precipitation_probability[i] ?? 0}%</div>`;
      hourly.appendChild(el);
    }

    // 7-day forecast
    const daily = $("daily");
    daily.replaceChildren();
    d.time.forEach((t, i) => {
      const w = weather(d.weather_code[i], 1);
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="d-day">${fmtDay(t, i)}</span>
        <span class="d-icon" aria-hidden="true">${w.icon}</span>
        <span class="d-desc">${w.desc}</span>
        <span class="d-rain">💧 ${d.precipitation_probability_max[i] ?? 0}%</span>
        <span class="d-range">
          <span class="lo">${Math.round(d.temperature_2m_min[i])}${deg}</span>
          <span class="bar" aria-hidden="true"></span>
          <span class="hi">${Math.round(d.temperature_2m_max[i])}${deg}</span>
        </span>`;
      daily.appendChild(li);
    });

    ["current", "hourly-section", "daily-section"].forEach((id) => ($(id).hidden = false));
  }

  async function load(place = state.place) {
    state.place = place;
    setStatus(`Loading weather for ${placeLabel(place)}…`);
    try {
      const data = await fetchForecast(place);
      render(data);
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(`Couldn't load the weather. ${err.message}. Please try again.`, true);
    }
  }

  // --- Search ---
  const results = $("search-results");

  function showResults(places) {
    results.replaceChildren();
    if (!places.length) {
      results.hidden = true;
      setStatus("No matching places found. Try another search.", true);
      return;
    }
    places.forEach((p) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = p.name;
      const small = document.createElement("small");
      small.textContent = " " + [p.admin1, p.country].filter(Boolean).join(", ");
      btn.appendChild(small);
      btn.addEventListener("click", () => {
        results.hidden = true;
        $("search-input").value = "";
        load(p);
      });
      li.appendChild(btn);
      results.appendChild(li);
    });
    results.hidden = false;
    setStatus("");
  }

  $("search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("search-input").value.trim();
    if (q.length < 2) {
      setStatus("Type at least 2 characters to search.", true);
      return;
    }
    setStatus("Searching…");
    try {
      showResults(await searchPlaces(q));
    } catch (err) {
      setStatus(err.message, true);
    }
  });

  document.addEventListener("click", (e) => {
    if (!$("search-form").contains(e.target)) results.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") results.hidden = true;
  });

  $("home-btn").addEventListener("click", () => load(BOCA));

  $("locate-btn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation isn't supported by your browser.", true);
      return;
    }
    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => load({
        name: "My location",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
      () => setStatus("Couldn't get your location. Check your browser's location permission.", true),
      { timeout: 10000 }
    );
  });

  // --- Units ---
  function syncUnitButtons() {
    document.querySelectorAll(".unit-toggle button").forEach((b) => {
      const active = b.dataset.unit === state.unit;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  document.querySelectorAll(".unit-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.unit === state.unit) return;
      state.unit = btn.dataset.unit;
      savePref("unit", state.unit);
      syncUnitButtons();
      load();
    });
  });

  // --- Theme (initial theme is applied early by theme.js) ---
  const themePicker = $("theme-picker");
  themePicker.value = document.documentElement.dataset.theme || "system";
  themePicker.addEventListener("change", () => {
    document.documentElement.dataset.theme = themePicker.value;
    savePref("theme", themePicker.value);
  });

  // --- Welcome message ---
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  $("welcome-title").textContent = `${greeting}, Jazmin! Welcome back.`;

  syncUnitButtons();
  load(BOCA);
})();
