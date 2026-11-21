let dataset;

export function loadGeography() {
  if (!dataset) {
    dataset = fetch(new URL("aqoy.geojson", import.meta.url))
      .then((response) => {
        if (!response.ok) throw new Error("Local map data unavailable");
        return response.json();
      })
      .catch((error) => {
        dataset = undefined;
        throw error;
      });
  }
  return dataset;
}

export async function featuresAtSite(lon, lat) {
  const { features } = await loadGeography();
  const site = features.find((feature) => feature.properties.kind === "site");
  if (!site) return [];
  const ring = site.geometry.coordinates[0];
  let inside = false;
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1],
      [bx, by] = ring[i];
    if (ay > lat !== by > lat && lon < ((bx - ax) * (lat - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside
    ? features.filter((feature) => ["site", "street"].includes(feature.properties.kind))
    : [];
}
