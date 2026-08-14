import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';

import { CATEGORY_META, Station } from '@/constants/api';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- must not load on web
const WebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

interface StationMapProps {
  stations: Station[];
  mode?: 'stations' | 'area';
  onSelect?: (code: string) => void;
  style?: any;
}

const buildHtml = (stations: Station[], mode: 'stations' | 'area' = 'stations') => {
  const points = stations
    .filter((s) => s.latitude && s.longitude)
    .map((s) => [
      s.latitude,
      s.longitude,
      CATEGORY_META[s.category]?.color ?? '#10b981',
      s.code,
      s.name,
      s.district,
      s.state,
      s.latest_level_mbgl ?? null,
      s.trend_m_per_year ?? null,
      s.anomalies?.length ?? 0,
      s.category,
      s.recharge_mm ?? null,
      s.data_quality ?? null,
    ]);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { box-sizing: border-box; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #eef2f6; overflow: hidden; }
  
  /* Leaflet Controls & Clean Popup Styling */
  .leaflet-control-zoom { display: none !important; }
  .leaflet-popup-content-wrapper { border-radius: 18px; box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.25); padding: 0; border: 1px solid #e2e8f0; }
  .leaflet-popup-content { margin: 16px; font-size: 12px; line-height: 1.5; color: #1e293b; }
  .popup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .popup-title { font-size: 14px; font-weight: 800; color: #0f172a; }
  .popup-sub { font-size: 11px; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 10px; }
  .stat-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
  .stat-val { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px; }
  .btn-link { display: block; text-align: center; background: #2563eb; color: #ffffff !important; padding: 8px 12px; border-radius: 10px; font-size: 11px; font-weight: 700; text-decoration: none; transition: background 0.2s; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3); }
  .btn-link:hover { background: #1d4ed8; }

  /* Floating UI Overlay Widgets (Ultra-compact, sleek & unobtrusive) */
  .overlay-container { position: absolute; inset: 0; pointer-events: none; z-index: 1000; padding: 12px; }
  
  /* Top-Left Intelligence Node Badge */
  .intelligence-node {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 20px;
    padding: 5px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    pointer-events: auto;
  }
  .node-pulse-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2563eb;
    box-shadow: 0 0 6px rgba(37, 99, 235, 0.6);
  }
  .node-text {
    font-size: 11px;
    font-weight: 600;
    color: #334155;
    letter-spacing: -0.01em;
  }
  .node-highlight {
    color: #2563eb;
    font-weight: 700;
  }

  /* Bottom-Left Horizontal Depletion Intensity Legend */
  .intensity-legend {
    position: absolute;
    bottom: 12px;
    left: 12px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 20px;
    padding: 5px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    pointer-events: auto;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 600;
    color: #475569;
  }
  .legend-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Right-Center Vertical Zoom Gauge Capsule with Interactive Line Track */
  .zoom-slider-capsule {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 20px;
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04);
    pointer-events: auto;
    z-index: 1000;
    user-select: none;
  }

  .zoom-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    background: #f8fafc;
    color: #334155;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    line-height: 1;
  }
  .zoom-btn:hover {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
  }

  .zoom-track-container {
    width: 24px;
    height: 88px;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .zoom-track-bg {
    position: absolute;
    width: 4px;
    height: 100%;
    background: #e2e8f0;
    border-radius: 4px;
  }

  .zoom-track-fill {
    position: absolute;
    bottom: 0;
    width: 4px;
    background: #2563eb;
    border-radius: 4px;
    transition: height 0.1s ease-out;
  }

  .zoom-track-thumb {
    position: absolute;
    width: 14px;
    height: 14px;
    background: #2563eb;
    border: 2.5px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
    transform: translateY(50%);
    transition: bottom 0.1s ease-out;
    cursor: grab;
  }
  .zoom-track-thumb:active {
    cursor: grabbing;
    transform: translateY(50%) scale(1.15);
  }
</style>
</head>
<body>
<div id="map"></div>

<!-- Sleek, Unobtrusive Overlay Widgets -->
<div class="overlay-container">
  <!-- Top-Left Compact Intelligence Pill -->
  <div class="intelligence-node">
    <div class="node-pulse-dot"></div>
    <div class="node-text">Monsoon Recharge: <span class="node-highlight">Optimal Infiltration (+14%)</span></div>
  </div>

  <!-- Bottom-Left Compact Horizontal Legend -->
  <div class="intensity-legend">
    <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>Over-Exploited</div>
    <div class="legend-item"><div class="legend-dot" style="background:#f97316"></div>Critical</div>
    <div class="legend-item"><div class="legend-dot" style="background:#eab308"></div>Semi-Critical</div>
    <div class="legend-item"><div class="legend-dot" style="background:#16a34a"></div>Safe</div>
  </div>

  <!-- Right-Center Vertically-Centered Zoom Gauge & Slider Line (Avoids Chatbot Overlap) -->
  <div class="zoom-slider-capsule">
    <button class="zoom-btn" onclick="map.zoomIn()" title="Zoom In">+</button>
    <div class="zoom-track-container" id="zoomTrack" title="Adjust Zoom Level">
      <div class="zoom-track-bg"></div>
      <div class="zoom-track-fill" id="zoomFill"></div>
      <div class="zoom-track-thumb" id="zoomThumb"></div>
    </div>
    <button class="zoom-btn" onclick="map.zoomOut()" title="Zoom Out">−</button>
  </div>
</div>

<script>
var P = ${JSON.stringify(points)};
var MODE = ${JSON.stringify(mode)};

var MIN_ZOOM = 4;
var MAX_ZOOM = 16;

var map = L.map('map', {
  preferCanvas: true,
  zoomControl: false,
  attributionControl: false,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM
}).setView([22.5, 78.9], 5);

// High-contrast clean light tiles matching reference design
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: 18
}).addTo(map);

function send(code) {
  var m = JSON.stringify({ station: code });
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m);
  else parent.postMessage(m, '*');
}

// ── Vertical Zoom Slider Line Logic ─────────────────────────────────
var zoomTrack = document.getElementById('zoomTrack');
var zoomFill = document.getElementById('zoomFill');
var zoomThumb = document.getElementById('zoomThumb');

function updateZoomUi() {
  var z = map.getZoom();
  var pct = Math.max(0, Math.min(100, ((z - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100));
  if (zoomFill) zoomFill.style.height = pct + '%';
  if (zoomThumb) zoomThumb.style.bottom = pct + '%';
}

map.on('zoom zoomend', updateZoomUi);
updateZoomUi();

// Interactive clicking and dragging along the zoom track
var isDraggingZoom = false;

function setZoomFromPointer(e) {
  var rect = zoomTrack.getBoundingClientRect();
  var clientY = e.touches ? e.touches[0].clientY : e.clientY;
  var ratio = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  var targetZoom = Math.round(MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM));
  map.setZoom(targetZoom);
}

if (zoomTrack) {
  zoomTrack.addEventListener('mousedown', function(e) {
    isDraggingZoom = true;
    setZoomFromPointer(e);
  });
  window.addEventListener('mousemove', function(e) {
    if (isDraggingZoom) {
      setZoomFromPointer(e);
    }
  });
  window.addEventListener('mouseup', function() {
    isDraggingZoom = false;
  });

  // Touch support
  zoomTrack.addEventListener('touchstart', function(e) {
    isDraggingZoom = true;
    setZoomFromPointer(e);
  }, { passive: true });
  window.addEventListener('touchmove', function(e) {
    if (isDraggingZoom) {
      setZoomFromPointer(e);
    }
  }, { passive: true });
  window.addEventListener('touchend', function() {
    isDraggingZoom = false;
  });
}

var group = L.featureGroup();

if (MODE === 'area') {
  // Proportional Footprint / Demand Gravity Clusters Mode
  P.forEach(function(p) {
    var lat = p[0], lon = p[1], color = p[2], code = p[3], name = p[4], district = p[5], state = p[6];
    var level = p[7] === null ? '—' : p[7].toFixed(2) + ' m bgl';
    var isCritical = p[10] === 'over_exploited' || p[10] === 'critical';

    // Outer aura
    var aura = L.circleMarker([lat, lon], {
      radius: isCritical ? 24 : 14,
      color: 'transparent',
      fillColor: color,
      fillOpacity: isCritical ? 0.35 : 0.22
    });
    group.addLayer(aura);

    // Inner node
    var m = L.circleMarker([lat, lon], {
      radius: isCritical ? 8 : 5,
      color: '#ffffff',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.95
    });

    var content = '<div class="popup-header"><div class="popup-title">' + name + '</div></div>' +
      '<div class="popup-sub">' + district + ', ' + state + ' • <span style="font-family:monospace">' + code + '</span></div>' +
      '<div class="stat-grid">' +
        '<div class="stat-box"><div class="stat-label">Level</div><div class="stat-val">' + level + '</div></div>' +
        '<div class="stat-box"><div class="stat-label">Status</div><div class="stat-val" style="color:' + color + '">' + (p[10] || 'Safe') + '</div></div>' +
      '</div>' +
      '<a href="#" class="btn-link" onclick="send(\\'' + code + '\\');return false;">Open Deep Analytics &rarr;</a>';

    m.bindPopup(content, { maxWidth: 280 });
    group.addLayer(m);
  });
} else {
  // Live Precise Station Density Mode
  P.forEach(function(p) {
    var lat = p[0], lon = p[1], color = p[2], code = p[3], name = p[4], district = p[5], state = p[6];
    var level = p[7] === null ? '—' : p[7].toFixed(2) + ' m bgl';
    var trend = p[8] === null ? '—' : (Math.abs(p[8]).toFixed(2) + ' m/yr ' + (p[8] > 0 ? 'falling' : 'rising'));
    var isAnom = p[9] > 0;
    var recharge = p[11] === null ? '—' : p[11].toFixed(0) + ' mm';
    var quality = p[12] === null ? '—' : p[12].toFixed(0) + '/100';

    var m = L.circleMarker([lat, lon], {
      radius: isAnom ? 6 : 5,
      color: '#ffffff',
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.9
    });

    var content = '<div class="popup-header"><div class="popup-title">' + name + '</div></div>' +
      '<div class="popup-sub">' + district + ', ' + state + ' • <span style="font-family:monospace">' + code + '</span></div>' +
      '<div class="stat-grid">' +
        '<div class="stat-box"><div class="stat-label">Water Depth</div><div class="stat-val">' + level + '</div></div>' +
        '<div class="stat-box"><div class="stat-label">Trend Rate</div><div class="stat-val">' + trend + '</div></div>' +
        '<div class="stat-box"><div class="stat-label">Est. Recharge</div><div class="stat-val">' + recharge + '</div></div>' +
        '<div class="stat-box"><div class="stat-label">Sensor Health</div><div class="stat-val">' + quality + '</div></div>' +
      '</div>' +
      (isAnom ? '<div style="color:#2563eb; font-size:10px; margin-bottom:8px; font-weight:700;">⚠️ Sensor Anomaly Flagged</div>' : '') +
      '<a href="#" class="btn-link" onclick="send(\\'' + code + '\\');return false;">Open Deep Analytics &rarr;</a>';

    m.bindPopup(content, { maxWidth: 280 });
    group.addLayer(m);
  });
}

group.addTo(map);
if (P.length) {
  try { map.fitBounds(group.getBounds().pad(0.08)); } catch(e) {}
}
</script>
</body>
</html>`;
};

export default function StationMap({
  stations,
  mode = 'stations',
  onSelect,
  style,
}: StationMapProps) {
  const html = useMemo(() => buildHtml(stations, mode), [stations, mode]);
  const cb = useRef(onSelect);
  cb.current = onSelect;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: MessageEvent) => {
      try {
        const code = JSON.parse(e.data)?.station;
        if (code) cb.current?.(code);
      } catch {
        /* ignore non-JSON messages */
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        {React.createElement('iframe', {
          srcDoc: html,
          style: {
            border: 0,
            width: '100%',
            height: '100%',
            borderRadius: 20,
          },
          title: 'DWLR Station GIS Network Map',
        })}
      </View>
    );
  }

  return (
    <View style={style}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        onMessage={(e: any) => {
          try {
            const code = JSON.parse(e.nativeEvent.data)?.station;
            if (code) cb.current?.(code);
          } catch {
            /* ignore */
          }
        }}
      />
    </View>
  );
}
