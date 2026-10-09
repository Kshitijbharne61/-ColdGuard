// ColdGuard weather endpoint. Uses genuine Open-Meteo forecast data; no API key required.
// No forecast is fabricated when the upstream service is unavailable.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const lat = Number(req.query?.lat);
  const lon = Number(req.query?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: "Valid lat and lon query parameters are required." });
  }
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(lat), longitude: String(lon),
      current: "temperature_2m,relative_humidity_2m,precipitation,rain,showers,snowfall,wind_speed_10m,wind_gusts_10m,weather_code",
      hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,wind_speed_10m,wind_gusts_10m,weather_code",
      forecast_days: "2", timezone: "auto"
    }).toString();
    const upstream = await fetch(url, { headers: { Accept: "application/json" } });
    if (!upstream.ok) return res.status(502).json({ error: "Weather provider unavailable", providerStatus: upstream.status });
    const data = await upstream.json();
    if (!data.current || !data.hourly) return res.status(502).json({ error: "Weather provider returned incomplete forecast data." });
    return res.status(200).json({ provider: "Open-Meteo", fetchedAt: new Date().toISOString(), latitude: data.latitude, longitude: data.longitude, timezone: data.timezone, current: data.current, hourly: data.hourly });
  } catch (error) {
    console.error("ColdGuard weather request failed:", error?.message || error);
    return res.status(502).json({ error: "Unable to fetch live weather right now." });
  }
}
