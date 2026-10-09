// ColdGuard route comparison endpoint.
// OSRM provides real road-route alternatives; Open-Meteo supplies genuine forecast samples.
// This endpoint does not provide authoritative flood, closure, or live-traffic data.
const WEATHER_BASE = "https://api.open-meteo.com/v1/forecast";
async function weatherAt(lat, lon) {
  const url = new URL(WEATHER_BASE);
  url.search = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: "precipitation,rain,showers,wind_speed_10m,wind_gusts_10m,weather_code",
    hourly: "precipitation_probability,precipitation,rain,showers,wind_speed_10m,weather_code",
    forecast_days: "1", timezone: "auto"
  }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather provider returned " + response.status);
  const data = await response.json();
  const now = data.current || {};
  const times = data.hourly?.time || [];
  const idx = Math.max(0, times.findIndex(t => new Date(t).getTime() >= Date.now()));
  return {
    precipitationMm: Number(now.precipitation ?? now.rain ?? now.showers ?? 0),
    windKmh: Number(now.wind_speed_10m ?? 0),
    gustKmh: Number(now.wind_gusts_10m ?? 0),
    rainProbability: Number(data.hourly?.precipitation_probability?.[idx] ?? 0),
    forecastTime: times[idx] || null,
    weatherCode: now.weather_code ?? null
  };
}
function samples(coords, count = 5) {
  if (!Array.isArray(coords) || !coords.length) return [];
  const result = [];
  const n = Math.min(count, coords.length);
  for (let i = 0; i < n; i++) {
    const p = coords[Math.round(i * (coords.length - 1) / Math.max(1, n - 1))];
    if (Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) result.push(p);
  }
  return result;
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=30");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const originLat = Number(req.query?.originLat);
  const originLon = Number(req.query?.originLon);
  const destLat = Number(req.query?.destLat);
  const destLon = Number(req.query?.destLon);
  const values = [originLat, originLon, destLat, destLon];
  if (!values.every(Number.isFinite) || originLat < -90 || originLat > 90 || destLat < -90 || destLat > 90 || originLon < -180 || originLon > 180 || destLon < -180 || destLon > 180) {
    return res.status(400).json({ error: "Valid origin and destination coordinates are required." });
  }
  try {
    const routeUrl = new URL("https://router.project-osrm.org/route/v1/driving/" + originLon + "," + originLat + ";" + destLon + "," + destLat);
    routeUrl.search = new URLSearchParams({ alternatives: "3", steps: "false", overview: "full", geometries: "geojson" }).toString();
    const routeResponse = await fetch(routeUrl, { headers: { Accept: "application/json" } });
    if (!routeResponse.ok) return res.status(502).json({ error: "Routing provider unavailable", providerStatus: routeResponse.status });
    const routeData = await routeResponse.json();
    if (routeData.code !== "Ok" || !Array.isArray(routeData.routes) || !routeData.routes.length) {
      return res.status(502).json({ error: "No route alternatives returned by the routing provider." });
    }
    const routes = [];
    for (let i = 0; i < Math.min(3, routeData.routes.length); i++) {
      const route = routeData.routes[i];
      const coords = route.geometry?.coordinates || [];
      let weatherRisk = 0;
      let weatherAvailable = true;
      const weatherSamples = [];
      try {
        for (const [lon, lat] of samples(coords)) {
          const w = await weatherAt(lat, lon);
          weatherSamples.push({ lat, lon, ...w });
          weatherRisk += Math.min(100, w.rainProbability * 0.45 + w.precipitationMm * 6 + w.windKmh * 0.25 + Math.max(0, w.gustKmh - 40) * 0.35);
        }
      } catch (error) {
        weatherAvailable = false;
      }
      const avgRisk = weatherAvailable && weatherSamples.length ? Math.min(100, Math.round(weatherRisk / weatherSamples.length)) : null;
      const durationMinutes = Math.round(route.duration / 60);
      const distanceKm = Math.round(route.distance / 100) / 10;
      // A transparent heuristic, not a certified road-safety determination.
      const score = weatherAvailable && avgRisk !== null ? Math.round(avgRisk * 0.7 + Math.min(100, durationMinutes / 3) * 0.3) : null;
      routes.push({
        id: "route-" + (i + 1), distanceKm, durationMinutes, geometry: coords,
        weatherRiskScore: avgRisk, recommendationScore: score, weatherAvailable,
        weatherSamples, provider: "OSRM + Open-Meteo",
        limitations: ["No authoritative flood-risk feed", "No live traffic or road-closure feed"]
      });
    }
    const comparable = routes.filter(r => r.recommendationScore !== null);
    const recommendedId = comparable.length ? comparable.reduce((best, r) => r.recommendationScore < best.recommendationScore ? r : best).id : null;
    return res.status(200).json({ provider: "OSRM + Open-Meteo", fetchedAt: new Date().toISOString(), origin: { lat: originLat, lon: originLon }, destination: { lat: destLat, lon: destLon }, recommendedId, routes, disclaimer: "Recommendation compares sampled weather and estimated travel time only. It cannot certify roads as flood-free or safe; live traffic, closures, and authoritative flood alerts are not included." });
  } catch (error) {
    console.error("ColdGuard route request failed:", error?.message || error);
    return res.status(502).json({ error: "Unable to calculate weather-aware routes right now." });
  }
}
