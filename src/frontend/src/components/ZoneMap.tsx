import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { Threshold } from '../types';

// Fix Leaflet default icon paths broken by Vite bundler
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const _defaultIcon = L.icon({ iconUrl, shadowUrl: iconShadowUrl });
L.Marker.prototype.options.icon = _defaultIcon;

// Hardcoded zone centres — McMaster / Hamilton ON area
const ZONE_COORDS: Record<string, [number, number]> = {
  'zone-a': [43.2634, -79.9196],
  'zone-b': [43.2585, -79.9045],
  'zone-c': [43.2648, -79.9110],
  'zone-d': [43.2562, -79.9215],
};

const SEVERITY_COLOUR: Record<string, string> = {
  low:      '#22c55e',
  medium:   '#eab308',
  high:     '#f97316',
  critical: '#ef4444',
};

interface ZoneInfo {
  zone: string;
  coords: [number, number];
  activeCount: number;
  worstSeverity: string | null;
}

function buildZoneInfo(thresholds: Threshold[]): ZoneInfo[] {
  return Object.entries(ZONE_COORDS).map(([zone, coords]) => {
    const active = thresholds.filter(t => t.zone === zone && t.is_active);
    const ORDER = ['critical', 'high', 'medium', 'low'];
    const worst = ORDER.find(s => active.some(t => t.severity === s)) ?? null;
    return { zone, coords, activeCount: active.length, worstSeverity: worst };
  });
}

interface Props {
  thresholds: Threshold[];
  selectedZone: string | null;
  onZoneClick: (zone: string) => void;
}

export default function ZoneMap({ thresholds, selectedZone, onZoneClick }: Props) {
  const zones = buildZoneInfo(thresholds);

  // Suppress Leaflet's missing-image console warning (Vite asset handling)
  useEffect(() => {
    // Leaflet icon fix is applied at module level above; nothing dynamic needed here
  }, []);

  return (
    <MapContainer
      center={[43.2610, -79.9130]}
      zoom={14}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {zones.map(({ zone, coords, activeCount, worstSeverity }) => {
        const colour = worstSeverity ? SEVERITY_COLOUR[worstSeverity] : '#94a3b8';
        const isSelected = selectedZone === zone;

        return (
          <CircleMarker
            key={zone}
            center={coords}
            radius={isSelected ? 32 : 24}
            pathOptions={{
              color:       isSelected ? '#1d4ed8' : colour,
              fillColor:   colour,
              fillOpacity: isSelected ? 0.85 : 0.55,
              weight:      isSelected ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onZoneClick(zone === selectedZone ? '' : zone) }}
          >
            <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none">
              <div className="text-center pointer-events-none select-none">
                <div className="text-[10px] font-bold text-white drop-shadow">{zone}</div>
                <div className="text-[9px] text-white/80 drop-shadow">{activeCount} active</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
