import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

export const LayoutDashboard = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Rect width="7" height="9" x="3" y="3" rx="1" />
    <Rect width="7" height="5" x="14" y="3" rx="1" />
    <Rect width="7" height="9" x="14" y="12" rx="1" />
    <Rect width="7" height="5" x="3" y="16" rx="1" />
  </Svg>
);

export const TrendingUp = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <Polyline points="16 7 22 7 22 13" />
  </Svg>
);

export const TrendingDown = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <Polyline points="16 17 22 17 22 11" />
  </Svg>
);

export const Map = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
    <Path d="M15 5.764v15" />
    <Path d="M9 3.236v15" />
  </Svg>
);

export const AlertTriangle = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <Line x1="12" x2="12" y1="9" y2="13" />
    <Line x1="12" x2="12.01" y1="17" y2="17" />
  </Svg>
);

export const Award = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="8" r="6" />
    <Path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </Svg>
);

export const Droplets = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
    <Path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
  </Svg>
);

export const Droplet = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </Svg>
);

export const Activity = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Svg>
);

export const ShieldCheck = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

export const User = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export const LogOut = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" x2="9" y1="12" y2="12" />
  </Svg>
);

export const ChevronRight = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

export const ChevronLeft = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

export const ChevronDown = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

export const Filter = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Svg>
);

export const ArrowRight = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M5 12h14" />
    <Path d="m12 5 7 7-7 7" />
  </Svg>
);

export const ArrowUp = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m5 12 7-7 7 7" />
    <Path d="M12 19V5" />
  </Svg>
);

export const ArrowDown = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M12 5v14" />
    <Path d="m19 12-7 7-7-7" />
  </Svg>
);

export const ArrowUpCircle = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m16 12-4-4-4 4" />
    <Path d="M12 16V8" />
  </Svg>
);

export const ArrowDownCircle = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m8 12 4 4 4-4" />
    <Path d="M12 8v8" />
  </Svg>
);

export const Search = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
  </Svg>
);

export const X = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M18 6 6 18" />
    <Path d="m6 6 12 12" />
  </Svg>
);

export const Radio = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="2" />
    <Path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </Svg>
);

export const Grid = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Rect width="18" height="18" x="3" y="3" rx="2" />
    <Path d="M3 9h18" />
    <Path d="M3 15h18" />
    <Path d="M9 3v18" />
    <Path d="M15 3v18" />
  </Svg>
);

export const Sparkles = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <Path d="M5 3v4" />
    <Path d="M19 17v4" />
    <Path d="M3 5h4" />
    <Path d="M17 19h4" />
  </Svg>
);

export const Cpu = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Rect width="16" height="16" x="4" y="4" rx="2" />
    <Rect width="6" height="6" x="9" y="9" rx="1" />
    <Path d="M15 2v2" />
    <Path d="M15 20v2" />
    <Path d="M2 15h2" />
    <Path d="M2 9h2" />
    <Path d="M20 15h2" />
    <Path d="M20 9h2" />
    <Path d="M9 2v2" />
    <Path d="M9 20v2" />
  </Svg>
);

export const Building2 = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <Path d="M10 6h4" />
    <Path d="M10 10h4" />
    <Path d="M10 14h4" />
    <Path d="M10 18h4" />
  </Svg>
);

export const MapPin = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const Clock = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const CloudRain = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <Path d="M16 14v6" />
    <Path d="M8 14v6" />
    <Path d="M12 16v6" />
  </Svg>
);

export const Sun = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v2" />
    <Path d="M12 20v2" />
    <Path d="m4.93 4.93 1.41 1.41" />
    <Path d="m17.66 17.66 1.41 1.41" />
    <Path d="M2 12h2" />
    <Path d="M20 12h2" />
    <Path d="m6.34 17.66-1.41 1.41" />
    <Path d="m19.07 4.93-1.41 1.41" />
  </Svg>
);

export const Moon = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Svg>
);

export const Layers = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Polygon points="12 2 2 7 12 12 22 7 12 2" />
    <Path d="m2 17 10 5 10-5" />
    <Path d="m2 12 10 5 10-5" />
  </Svg>
);

function Polygon({ points }: { points: string }) {
  // `points` is a flat list of x y x y. Joining on every space makes each
  // coordinate its own lineto, so the path is rejected and the icon vanishes.
  const pairs = points.trim().match(/\S+\s+\S+/g) ?? [];
  return <Path d={`M${pairs.join('L')}Z`} />;
}

export const Server = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <Rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <Line x1="6" x2="6.01" y1="6" y2="6" />
    <Line x1="6" x2="6.01" y1="18" y2="18" />
  </Svg>
);

export const Info = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4" />
    <Path d="M12 8h.01" />
  </Svg>
);

export const PieChart = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <Path d="M22 12A10 10 0 0 0 12 2v10z" />
  </Svg>
);

export const AlertCircle = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" x2="12" y1="8" y2="12" />
    <Line x1="12" x2="12.01" y1="16" y2="16" />
  </Svg>
);

export const Wrench = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </Svg>
);

export const Calculator = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Rect width="16" height="20" x="4" y="2" rx="2" />
    <Line x1="8" x2="16" y1="6" y2="6" />
    <Line x1="16" x2="16" y1="14" y2="18" />
    <Path d="M16 10h.01" />
    <Path d="M12 10h.01" />
    <Path d="M8 10h.01" />
    <Path d="M12 14h.01" />
    <Path d="M8 14h.01" />
    <Path d="M12 18h.01" />
    <Path d="M8 18h.01" />
  </Svg>
);

export const CheckCircle2 = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

export const List = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Line x1="8" x2="21" y1="6" y2="6" />
    <Line x1="8" x2="21" y1="12" y2="12" />
    <Line x1="8" x2="21" y1="18" y2="18" />
    <Line x1="3" x2="3.01" y1="6" y2="6" />
    <Line x1="3" x2="3.01" y1="12" y2="12" />
    <Line x1="3" x2="3.01" y1="18" y2="18" />
  </Svg>
);

export const WifiOff = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Line x1="2" x2="22" y1="2" y2="22" />
    <Path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <Path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
    <Path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
    <Path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
    <Path d="M5 13a10 10 0 0 1 5.24-2.76" />
    <Line x1="12" x2="12.01" y1="20" y2="20" />
  </Svg>
);

export const HelpCircle = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Line x1="12" x2="12.01" y1="17" y2="17" />
  </Svg>
);

export const MessageCircle = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Svg>
);

export const Send = ({ size = 20, color = '#64748b', strokeWidth = 2, style }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);
