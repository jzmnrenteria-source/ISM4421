# FAU Owl Weather

A Florida Atlantic University–themed weather app that defaults to **Boca Raton, FL** (FAU's main campus).
It uses the free [Open-Meteo](https://open-meteo.com/) APIs, so there are **no API keys, logins, or environment variables** to set up.

## Features
- Current conditions: temperature, feels-like, humidity, wind & gusts, precipitation, UV index, sunrise/sunset
- Hourly forecast for the next 24 hours
- 7-day forecast with rain chance and high/low
- City search (Open-Meteo Geocoding API), "use my location", and a 🦉 button to jump back to Boca
- °F / °C toggle and System / Light / White / Dark themes (remembered in your browser)
- Personalized welcome message for Jazmin
- FAU colors (FAU Blue `#003366`, FAU Red `#CC0000`, silver), mobile-friendly, dark-mode aware

## Project structure
```
index.html        # page markup
styles.css        # FAU theme
app.js            # Open-Meteo API calls + rendering
theme.js          # applies the saved theme before the page draws
assets/           # FAU logo + favicon (SVG)
netlify.toml      # Netlify config (static site, no build step)
```

## Run locally
It's plain HTML/CSS/JS — just open `index.html` in a browser, or serve the folder:
```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy to Netlify
**Option A — connect the GitHub repo (auto-deploys on every push)**
1. Log in at <https://app.netlify.com> → **Add new site** → **Import an existing project** → **GitHub**.
2. Pick this repository and the branch you want to deploy.
3. Leave **Build command** empty and **Publish directory** as `.` (these are already set in `netlify.toml`).
4. Click **Deploy**. Optionally rename the site under *Site configuration → Change site name* (e.g. `fau-owl-weather`).

**Option B — drag and drop**
1. Download/zip this folder.
2. Go to <https://app.netlify.com/drop> and drop the folder in.

**Option C — Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir .
```

## Using the official FAU logo
`assets/fau-logo.svg` is a simple FAU-colored badge. To use the official logo, replace that file
(keeping the same name) with the logo from FAU's brand resources, or update the `<img src>` in `index.html`.

## Credits
Weather data by [Open-Meteo.com](https://open-meteo.com/), licensed CC BY 4.0.
