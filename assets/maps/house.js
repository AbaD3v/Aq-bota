import { loadGeography } from "./geography.js";

const params = new URLSearchParams(location.search);
const root = document.getElementById("plan");
const kazakh = params.get("lang") === "kk";
const pickId = params.get("pickLandmark");
document.documentElement.lang = kazakh ? "kk" : "ru";
document.title = [params.get("title"), params.get("address")].filter(Boolean).join(" · ");
root.setAttribute("aria-label", document.title);

function textElement(text, className) {
  const el = document.createElement("span");
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

function landmarkLocation(point) {
  const match = (point || "")
    .trim()
    .match(/^([+-]?\d{1,2}(?:\.\d+)?)\s*,\s*([+-]?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const [lat, lng] = match.slice(1).map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return null;
  return L.latLng(lat, lng);
}

async function draw() {
  const data = await loadGeography();
  const byKind = (kind) => data.features.filter((feature) => feature.properties.kind === kind);
  const road = byKind("street")[0],
    site = byKind("site")[0];
  const saved = window.frameElement?.dataset.landmarks;
  const cardFrame = !pickId && saved ? window.frameElement : null;
  const rows = saved
    ? JSON.parse(saved)
    : params.has("landmark")
      ? [
          {
            id: pickId || "medical-post",
            title: params.get("landmark"),
            point: params.get("landmarkPoint"),
          },
        ]
      : [];
  const landmarks = rows.map((row) => ({ ...row, point: landmarkLocation(row.point) }));
  const area = L.latLngBounds([49.0205, 72.55], [49.026, 72.559]);
  for (const row of landmarks) if (row.point) area.extend(row.point);
  const map = L.map(root, {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    zoomSnap: 0.25,
    minZoom: 1,
    maxZoom: 21,
    maxBounds: area,
    maxBoundsViscosity: 1,
  });
  L.control
    .zoom({
      position: "topright",
      zoomInTitle: kazakh ? "Жақындату" : "Приблизить",
      zoomOutTitle: kazakh ? "Алыстату" : "Отдалить",
    })
    .addTo(map);
  L.control
    .attribution({ prefix: false })
    .addTo(map)
    .addAttribution(
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
    );

  function paint(features, style) {
    return L.geoJSON(features, { style, interactive: false }).addTo(map);
  }
  paint(byKind("building"), { color: "#baaf9d", weight: 1, fillColor: "#d9d1be", fillOpacity: 1 });
  const roads = [...byKind("road"), road];
  paint(roads, { color: "#ccc8b8", weight: 8 });
  paint(roads, { color: "#fffdf5", weight: 6 });
  paint(byKind("path"), { color: "#b9b49e", weight: 2, dashArray: "3 4" });
  paint(road, { color: "#d7a65a", weight: 8 });
  paint(road, { color: "#f7dfa7", weight: 5 });
  const house = paint(site, {
    color: "#1e5140",
    weight: 2.5,
    fillColor: "#70a78a",
    fillOpacity: 1,
  });
  const center = house.getBounds().getCenter();

  // Place the street label on the surveyed segment nearest the kindergarten.
  const vertices = road.geometry.coordinates.map(([lon, lat]) => L.latLng(lat, lon));
  if (center.distanceTo(vertices[0]) > center.distanceTo(vertices.at(-1))) vertices.reverse();
  const [start, next] = vertices;
  const streetPoint = L.latLng(
    start.lat + (next.lat - start.lat) * 0.28,
    start.lng + (next.lng - start.lng) * 0.28
  );
  function label(at, text, cssClass, offset = [0, 0]) {
    const el = textElement(text, cssClass);
    L.tooltip({ permanent: true, direction: "center", offset, className: "map-label", opacity: 1 })
      .setLatLng(at)
      .setContent(el)
      .addTo(map);
    return el;
  }
  const entranceLabel = cardFrame?.dataset.entranceLabel;
  const houseBadge = document.createElement("span");
  houseBadge.className = "house-badge";
  houseBadge.append(textElement(params.get("house"), "house-number"));
  if (entranceLabel) houseBadge.append(textElement(entranceLabel, "entrance-label"));
  const houseLabel = L.divIcon({
    className: "house-marker",
    html: houseBadge,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
  const address = params.get("address");
  const pin = L.marker(center, {
    icon: houseLabel,
    title: address,
    alt: address,
    interactive: !pickId,
    keyboard: !pickId,
  });
  if (cardFrame?.dataset.entranceCard) bindCard(pin, null, [address, entranceLabel].filter(Boolean).join(" · "));
  else if (!pickId) pin.bindPopup(textElement(address));
  pin.addTo(map);
  // On small scales place the number beside the footprint so the shape stays visible.
  map.on("zoomend", () => {
    const bounds = house.getBounds();
    const width = map.project(bounds.getNorthEast()).x - map.project(bounds.getSouthWest()).x;
    root.classList.toggle("small-footprint", width < 25);
  });
  label(center, params.get("brand"), "site-name", [0, -25]);
  const streetLabel = label(streetPoint, params.get("street"), "street-name");
  const a = map.project(start, 17),
    b = map.project(next, 17);
  let angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  streetLabel.style.transform = "rotate(" + angle + "deg)";

  const markers = new Map();
  const key = document.getElementById("landmark-key");
  const list = document.createElement("ul");
  const numbered = !pickId && landmarks.filter((row) => row.point).length > 1;
  let number = 0;

  function badge(mark) {
    const dot = textElement(mark, "landmark-dot");
    dot.setAttribute("aria-hidden", "true");
    return dot;
  }
  function reportPoint(at) {
    parent.postMessage(
      { type: "aqb-landmark-picked", id: pickId, lat: at.lat, lng: at.lng },
      location.origin
    );
  }
  function openCard(id, opener) {
    opener.focus({ preventScroll: true });
    cardFrame.dispatchEvent(new CustomEvent("aqb-open-landmark", { detail: id }));
  }
  function bindCard(marker, id, title) {
    marker.on("click", () => openCard(id, marker.getElement()));
    marker.on("add", () => {
      const el = marker.getElement();
      el.setAttribute("aria-label", title);
      el.setAttribute("aria-haspopup", "dialog");
      el.onkeydown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        openCard(id, el);
      };
    });
  }
  function addMarker(row, at, mark) {
    const active = row.id === pickId;
    const interactive = !pickId || active;
    const title = row.title || (kazakh ? "Бағдар" : "Ориентир");
    const marker = L.marker(at, {
      icon: L.divIcon({
        className: "landmark-marker" + (interactive ? "" : " landmark-context"),
        html: badge(mark),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      title,
      alt: title,
      interactive,
      keyboard: interactive,
      draggable: active,
      zIndexOffset: active ? 500 : 0,
    });
    if (cardFrame) bindCard(marker, row.id, title);
    else marker.on("add", () => marker.getElement().setAttribute("aria-label", title));
    if (active) marker.on("dragend", () => reportPoint(marker.getLatLng()));
    if (!cardFrame && !pickId) marker.bindPopup(textElement(title));
    markers.set(row.id, marker);
    return marker.addTo(map);
  }
  for (const row of landmarks) {
    const mark = row.point && numbered ? String(++number) : "";
    const marker = row.point ? addMarker(row, row.point, mark) : null;
    if (pickId) continue;
    const point = row.point;
    const entry = document.createElement(cardFrame || point ? "button" : "div");
    entry.className = "landmark-entry";
    const copy = document.createElement("span");
    copy.append(textElement(row.title, "landmark-caption"));
    if (cardFrame || point) {
      entry.type = "button";
      if (cardFrame) entry.setAttribute("aria-haspopup", "dialog");
      entry.addEventListener("click", () => {
        if (point) map.panTo(point, { animate: false });
        if (cardFrame) openCard(row.id, entry);
        else marker.openPopup();
      });
    }
    if (point) {
      entry.append(badge(mark));
    } else {
      copy.append(
        textElement(
          kazakh ? "Картадағы орны нақтылануда" : "Точка на плане уточняется",
          "landmark-note"
        )
      );
    }
    entry.append(copy);
    const li = document.createElement("li");
    li.append(entry);
    list.append(li);
  }
  if (list.childElementCount) {
    key.append(textElement(kazakh ? "Бағдарлар" : "Ориентиры", "landmark-heading"), list);
    key.hidden = false;
  }
  const selected = pickId && landmarks.find((row) => row.id === pickId);
  if (selected) {
    root.classList.add("picking");
    map.on("click", ({ latlng }) => {
      const marker = markers.get(pickId);
      if (marker) marker.setLatLng(latlng);
      else addMarker(selected, latlng, "");
      reportPoint(latlng);
    });
  }
  function fit() {
    const focus = L.latLngBounds(center, streetPoint);
    for (const marker of markers.values()) focus.extend(marker.getLatLng());
    map.setMinZoom(1);
    const right = Math.min(115, root.clientWidth * 0.3);
    map.fitBounds(focus, {
      paddingTopLeft: [Math.min(90, root.clientWidth * 0.18), 48],
      paddingBottomRight: [right, 42],
      maxZoom: 18,
      animate: false,
    });
    map.setMinZoom(Math.min(16, map.getZoom()));
  }
  fit();
  let previousWidth = root.clientWidth,
    previousHeight = root.clientHeight;
  new ResizeObserver(() => {
    map.invalidateSize({ pan: false });
    if (
      Math.abs(root.clientWidth - previousWidth) > 2 ||
      Math.abs(root.clientHeight - previousHeight) > 2
    ) {
      previousWidth = root.clientWidth;
      previousHeight = root.clientHeight;
      fit();
    }
  }).observe(root);
}

draw().catch(() => {
  root.textContent = params.get("address") || document.title;
});
