import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';

import { CATEGORY_META, Station } from '@/constants/api';

// react-native-maps has no web build, and this app has to demo in a browser.
// Leaflet renders the same map on every platform: WebView on native, a plain
// iframe on web (react-native-web renders DOM elements as-is).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- must not load on web
const WebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;

const buildHtml = (stations: Station[]) => {
  const points = stations
    .filter((s) => s.latitude && s.longitude)
    .map((s) => [
      s.latitude,
      s.longitude,
      // A flagged recorder's category is not trustworthy, so it must not be
      // painted as if it were — grey it out like the other excluded stations.
      s.anomalies?.length ? '#94a3b8' : (CATEGORY_META[s.category]?.color ?? '#94a3b8'),
      s.code,
      s.name,
      s.district,
      s.state,
      s.latest_level_mbgl ?? null,
      s.trend_m_per_year ?? null,
      s.anomalies?.length ?? 0,
    ]);

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{height:100%;margin:0;background:#eef2f7;font-family:-apple-system,system-ui,sans-serif}
  .leaflet-popup-content{margin:10px 12px;font-size:12px;line-height:1.5}
  .leaflet-popup-content b{font-size:13px}
  .legend{background:#fff;padding:8px 10px;border-radius:8px;font-size:11px;line-height:1.6;box-shadow:0 1px 4px rgba(0,0,0,.2)}
  .legend i{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px}
</style></head><body><div id="map"></div><script>
var P = ${JSON.stringify(points)};
var map = L.map('map', { preferCanvas: true }).setView([22.6, 79.5], 4);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap, &copy; CARTO | Data: India-WRIS / CGWB', maxZoom: 18
}).addTo(map);

function send(code){
  var m = JSON.stringify({ station: code });
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m);
  else parent.postMessage(m, '*');
}

var group = L.featureGroup();
P.forEach(function(p){
  var level = p[7] === null ? 'n/a' : p[7].toFixed(2) + ' m below ground';
  var trend = p[8] === null ? 'not enough data'
    : (Math.abs(p[8]).toFixed(2) + ' m/yr ' + (p[8] > 0 ? 'falling' : 'rising'));
  var note = p[9] ? '<br><i>Sensor flagged - excluded from statistics</i>' : '';
  var m = L.circleMarker([p[0], p[1]], {
    radius: 5, color: '#fff', weight: 1, fillColor: p[2], fillOpacity: 0.9
  }).bindPopup(
    '<b>' + p[4] + '</b><br>' + p[5] + ', ' + p[6] +
    '<br>Code: ' + p[3] + '<br>Level: ' + level + '<br>Trend: ' + trend + note +
    '<br><a href="#" onclick="send(\\'' + p[3] + '\\');return false;">Open analytics &rarr;</a>'
  );
  m.on('click', function(){ send(p[3]); });
  group.addLayer(m);
});
group.addTo(map);
if (P.length) { try { map.fitBounds(group.getBounds().pad(0.1)); } catch(e){} }

var legend = L.control({position:'bottomright'});
legend.onAdd = function(){
  var d = L.DomUtil.create('div','legend');
  d.innerHTML = ${JSON.stringify(
    (['safe', 'semi_critical', 'critical', 'over_exploited'] as const)
      .map((c) => `<i style="background:${CATEGORY_META[c].color}"></i>${CATEGORY_META[c].label}<br>`)
      .join('') + '<i style="background:#94a3b8"></i>Excluded (faulty / no trend)'
  )};
  return d;
};
legend.addTo(map);
</script></body></html>`;
};

export default function StationMap({
  stations,
  onSelect,
  style,
}: {
  stations: Station[];
  onSelect?: (code: string) => void;
  style?: any;
}) {
  const html = useMemo(() => buildHtml(stations), [stations]);
  const cb = useRef(onSelect);
  cb.current = onSelect;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: MessageEvent) => {
      try {
        const code = JSON.parse(e.data)?.station;
        if (code) cb.current?.(code);
      } catch {
        /* other frames post their own noise; ignore */
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
          style: { border: 0, width: '100%', height: '100%', borderRadius: 12 },
          title: 'DWLR station map',
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
