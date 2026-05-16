'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { PropertyRow } from '@/app/actions/properties';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Italy center — fallback when no properties have coordinates
const ITALY_CENTER: [number, number] = [12.5, 42.5];
const ITALY_ZOOM = 5.5;

const STAGE_MARKER_COLORS: Record<string, string> = {
  scouted: '#a8a29e',
  analyzing: '#60a5fa',
  shortlisted: '#f59e0b',
  site_visit: '#f97316',
  negotiating: '#a855f7',
  under_contract: '#6366f1',
  closing: '#ec4899',
  acquired: '#22c55e',
  renovating: '#14b8a6',
  complete: '#10b981',
};

interface Props {
  properties: PropertyRow[];
  locale: string;
}

export default function PropertyMap({ properties, locale }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const geoProperties = properties.filter((p) => p.lat != null && p.lng != null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: ITALY_CENTER,
      zoom: ITALY_ZOOM,
    });

    m.addControl(new mapboxgl.NavigationControl(), 'top-right');

    m.on('load', () => {
      setMapReady(true);

      // Add markers
      for (const p of geoProperties) {
        const color = STAGE_MARKER_COLORS[p.pipeline_stage] ?? '#a8a29e';

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;line-height:1.4">
            <a href="/${locale}/property/${p.id}" style="font-weight:600;color:#292524;text-decoration:none;font-size:13px">${p.name}</a>
            <div style="font-size:11px;color:#78716c;margin-top:2px">
              ${[p.commune, p.region].filter(Boolean).join(', ')}
            </div>
            <div style="font-size:13px;font-weight:700;color:#292524;margin-top:4px">
              €${p.listed_price.toLocaleString()}
            </div>
          </div>`,
        );

        new mapboxgl.Marker({ color })
          .setLngLat([p.lng!, p.lat!])
          .setPopup(popup)
          .addTo(m);
      }

      // Fit bounds if multiple properties
      if (geoProperties.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const p of geoProperties) {
          bounds.extend([p.lng!, p.lat!]);
        }
        m.fitBounds(bounds, { padding: 60, maxZoom: 12 });
      } else if (geoProperties.length === 1) {
        m.flyTo({ center: [geoProperties[0].lng!, geoProperties[0].lat!], zoom: 10 });
      }
    });

    map.current = m;

    return () => { m.remove(); map.current = null; };
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center bg-stone-50">
        <p className="text-sm text-stone-500">Map unavailable — set <code className="text-xs bg-stone-100 px-1 py-0.5 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable.</p>
      </div>
    );
  }

  if (geoProperties.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center bg-stone-50">
        <p className="text-sm text-stone-500">No properties have coordinates yet. Add latitude/longitude to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <div ref={mapContainer} style={{ height: 360 }} className="w-full" />
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
        <span className="text-xs text-stone-400">
          {geoProperties.length} of {properties.length} properties mapped
        </span>
        <div className="flex items-center gap-3">
          {Object.entries(STAGE_MARKER_COLORS).slice(0, 5).map(([stage, color]) => (
            <span key={stage} className="flex items-center gap-1 text-xs text-stone-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {stage.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
