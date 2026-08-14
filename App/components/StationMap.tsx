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
      s.anomalies?.length ? '#8b5cf6' : (CATEGORY_META[s.category]?.color ?? '#0284c7'),
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
  .btn-link { display: block; text-align: center; background: #0284c7; color: #ffffff !important; padding: 8px 12px; border-radius: 10px; font-size: 11px; font-weight: 700; text-decoration: none; transition: background 0.2s; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3); }
  .btn-link:hover { background: #0369a1; }

  /* Floating UI Overlay Widgets */
  .overlay-container { position: absolute; inset: 0; pointer-events: none; z-index: 1000; padding: 18px; }
  
  /* Top-Left Intelligence Node */
  .intelligence-node {
    position: absolute;
    top: 18px;
    left: 18px;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    color: #fff;
  }
  .node-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(2, 132, 199, 0.2);
    border: 1px solid rgba(56, 189, 248, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #38bdf8;
    font-size: 18px;
  }
  .node-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .node-pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
  }
  .node-status-main {
    font-size: 13px;
    font-weight: 800;
    color: #f8fafc;
    margin-top: 1px;
  }
  .node-status-main span {
    color: #94a3b8;
    font-weight: 500;
  }
  .node-status-sub {
    font-size: 10px;
    font-weight: 800;
    color: #38bdf8;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* Bottom-Left Depletion Intensity Legend */
  .intensity-legend {
    position: absolute;
    bottom: 18px;
    left: 18px;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 12px 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    color: #fff;
    min-width: 140px;
  }
  .legend-header {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    margin-bottom: 8px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 5px;
  }
  .legend-item:last-child { margin-bottom: 0; }
  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Right Vertical Zoom Slider Capsule */
  .zoom-capsule {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 30px;
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.15);
    pointer-events: auto;
    gap: 12px;
    width: 38px;
  }
  .zoom-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: none;
    background: #f1f5f9;
    color: #0f172a;
    font-size: 16px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    user-select: none;
  }
  .zoom-btn:hover { background: #e2e8f0; }
  .zoom-slider-wrapper {
    height: 120px;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .zoom-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100px;
    height: 4px;
    background: #e2e8f0;
    border-radius: 4px;
    outline: none;
    transform: rotate(-90deg);
    cursor: pointer;
  }
  .zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #0284c7;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);
    cursor: pointer;
  }
  .zoom-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #0284c7;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);
    cursor: pointer;
  }
</style>
</head>
<body>
<div id="map"></div>

<!-- Overlay Widgets -->
<div class="overlay-container">
  <!-- Top-Left Intelligence Node -->
  <div class="intelligence-node">
    <div class="node-icon-box">💧</div>
    <div>
      <div class="node-title-row">
        <span>INTELLIGENCE NODE</span>
        <div class="node-pulse-dot"></div>
      </div>
      <div class="node-status-main">Monsoon Recharge <span>• 24.8°C</span></div>
      <div class="node-status-sub">OPTIMAL INFILTRATION (+14% STORAGE SHIFT)</div>
    </div>
  </div>

  <!-- Bottom-Left Depletion Intensity Legend -->
  <div class="intensity-legend">
    <div class="legend-header">DEPLETION INTENSITY</div>
    <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>Critical</div>
    <div class="legend-item"><div class="legend-dot" style="background:#ea580c"></div>High</div>
    <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div>Balanced</div>
    <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div>Baseline</div>
  </div>

  <!-- Right Vertical Zoom Slider Capsule -->
  <div class="zoom-capsule">
    <button class="zoom-btn" onclick="zoomIn()">+</button>
    <div class="zoom-slider-wrapper">
      <input type="range" min="4" max="14" value="5" step="0.5" id="zoomSlider" class="zoom-slider" oninput="onSliderZoom(this.value)">
    </div>
    <button class="zoom-btn" onclick="zoomOut()">−</button>
  </div>
</div>

<script>
var P = ${JSON.stringify(points)};
var MODE = ${JSON.stringify(mode)};

var map = L.map('map', {
  preferCanvas: true,
  zoomControl: false,
  attributionControl: false
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

// Zoom control functions
function updateSlider() {
  var slider = document.getElementById('zoomSlider');
  if (slider) slider.value = map.getZoom();
}
function zoomIn() { map.zoomIn(); updateSlider(); }
function zoomOut() { map.zoomOut(); updateSlider(); }
function onSliderZoom(val) { map.setZoom(Number(val)); }
map.on('zoomend', updateSlider);

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
      (isAnom ? '<div style="color:#0284c7; font-size:10px; margin-bottom:8px; font-weight:700;">⚠️ Sensor Anomaly Flagged</div>' : '') +
      '<a href="#" class="btn-link" onclick="send(\\'' + code + '\\');return false;">Open Deep Analytics &rarr;</a>';

    m.bindPopup(content, { maxWidth: 280 });
    group.addLayer(m);
  });
}

group.addTo(map);
if (P.length) {
  try { map.fitBounds(group.getBounds().pad(0.08)); } catch(e) {}
}
updateSlider();
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
