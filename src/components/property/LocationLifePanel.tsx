'use client';

import { useState, useEffect, useRef } from 'react';
import type { LocationIntelligence, RegulatoryLight, DistanceCard, TransportHub } from '@/types/location-intelligence';
import { DISTANCE_CATEGORY_LABELS, type DistanceCategory } from '@/types/location-intelligence';

interface Props {
  propertyId: string;
  lat: number | null;
  lng: number | null;
  commune: string;
  initial: LocationIntelligence | null;
}

type Status = 'idle' | 'generating' | 'done' | 'error';

const LIGHT_COLORS: Record<RegulatoryLight, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-500' },
};

const LIGHT_EMOJI: Record<RegulatoryLight, string> = {
  green: '\u{1F7E2}',
  yellow: '\u{1F7E1}',
  red: '\u{1F534}',
};

function DistanceIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    supermarket: '\u{1F6D2}',
    bakery: '\u{1F35E}',
    pharmacy: '\u{1F48A}',
    hospital: '\u{1F3E5}',
    veterinarian: '\u{1F43E}',
    train_station: '\u{1F689}',
    airport: '\u{2708}️',
  };
  return <span className="text-lg">{icons[category] ?? '\u{1F4CD}'}</span>;
}

const ROUTE_COLORS = {
  service: '#7a8c5e',
  train_station: '#3b82f6',
  airport: '#6366f1',
} as const;

async function fetchRouteGeometry(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
  token: string,
): Promise<GeoJSON.LineString | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&access_token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.routes?.[0]?.geometry ?? null;
  } catch {
    return null;
  }
}

export default function LocationLifePanel({ propertyId, lat, lng, commune, initial }: Props) {
  const [status, setStatus] = useState<Status>(initial ? 'done' : 'idle');
  const [data, setData] = useState<LocationIntelligence | null>(initial);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  async function generate() {
    setStatus('generating');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/location-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? 'Generation failed');
        setStatus('error');
        return;
      }
      setData(json.locationIntelligence);
      setStatus('done');
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('error');
    }
  }

  const transportHubs = data?.transport_hubs ?? [];
  const trainStations = transportHubs.filter((h) => h.type === 'train_station');
  const airports = transportHubs.filter((h) => h.type === 'airport');

  // Map with isochrones, POI markers, transport hubs, and driving routes
  useEffect(() => {
    if (!data || lat == null || lng == null || !mapContainer.current) return;
    if (mapInstance.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = token;

      const m = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [lng, lat],
        zoom: 11,
      });

      m.addControl(new mapboxgl.NavigationControl(), 'top-right');

      m.on('load', async () => {
        // ── Property marker ──
        new mapboxgl.Marker({ color: '#c0622f' })
          .setLngLat([lng, lat])
          .addTo(m);

        // ── Service POI markers (green) ──
        for (const d of data.distances) {
          const el = document.createElement('div');
          el.style.cssText = 'width:24px;height:24px;background:#fff;border:2px solid #7a8c5e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer';
          el.textContent = LIGHT_EMOJI.green;

          const popup = new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(
            `<div style="font-family:system-ui;font-size:12px;line-height:1.4">
              <strong>${d.name}</strong><br/>
              ${d.drive_minutes} min drive &middot; ${d.distance_km} km
            </div>`,
          );

          new mapboxgl.Marker(el)
            .setLngLat([d.lng, d.lat])
            .setPopup(popup)
            .addTo(m);
        }

        // ── Transport hub markers ──
        const hubs = data.transport_hubs ?? [];
        for (const hub of hubs) {
          const isTrain = hub.type === 'train_station';
          const el = document.createElement('div');
          el.style.cssText = `width:30px;height:30px;background:${isTrain ? '#eff6ff' : '#eef2ff'};border:2px solid ${isTrain ? '#3b82f6' : '#6366f1'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.15)`;
          el.textContent = isTrain ? '\u{1F689}' : '\u{2708}️';

          const connectionsHtml = hub.connections.length > 0
            ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px">${hub.connections.map((c) => `<span style="background:${isTrain ? '#dbeafe' : '#e0e7ff'};color:${isTrain ? '#1e40af' : '#3730a3'};padding:1px 6px;border-radius:9999px;font-size:10px">${c}</span>`).join('')}</div>`
            : '';

          const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, maxWidth: '280px' }).setHTML(
            `<div style="font-family:system-ui;font-size:12px;line-height:1.4">
              <strong>${isTrain ? '\u{1F689}' : '\u{2708}️'} ${hub.name}</strong><br/>
              ${hub.drive_minutes} min drive &middot; ${hub.distance_km} km
              ${connectionsHtml}
            </div>`,
          );

          new mapboxgl.Marker(el)
            .setLngLat([hub.lng, hub.lat])
            .setPopup(popup)
            .addTo(m);
        }

        // ── Isochrone overlays ──
        const ISOCHRONE_COLORS = ['rgba(192,98,47,0.08)', 'rgba(192,98,47,0.05)', 'rgba(192,98,47,0.03)'];
        const ISOCHRONE_BORDERS = ['rgba(192,98,47,0.4)', 'rgba(192,98,47,0.25)', 'rgba(192,98,47,0.15)'];

        for (let i = data.isochrone_minutes.length - 1; i >= 0; i--) {
          const mins = data.isochrone_minutes[i];
          try {
            const isoUrl = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${lng},${lat}?contours_minutes=${mins}&polygons=true&access_token=${token}`;
            const res = await fetch(isoUrl);
            if (!res.ok) continue;
            const geojson = await res.json();

            m.addSource(`isochrone-${mins}`, { type: 'geojson', data: geojson });
            m.addLayer({
              id: `isochrone-fill-${mins}`,
              type: 'fill',
              source: `isochrone-${mins}`,
              paint: { 'fill-color': ISOCHRONE_COLORS[i], 'fill-opacity': 1 },
            });
            m.addLayer({
              id: `isochrone-line-${mins}`,
              type: 'line',
              source: `isochrone-${mins}`,
              paint: { 'line-color': ISOCHRONE_BORDERS[i], 'line-width': 1.5, 'line-dasharray': [4, 2] },
            });
          } catch {
            // silently skip failed isochrone
          }
        }

        // ── Driving route polylines ──
        const routeTargets = [
          ...data.distances.map((d) => ({
            lng: d.lng, lat: d.lat, color: ROUTE_COLORS.service, id: `svc-${d.category}`, width: 2,
          })),
          ...hubs.map((h, i) => ({
            lng: h.lng, lat: h.lat,
            color: h.type === 'train_station' ? ROUTE_COLORS.train_station : ROUTE_COLORS.airport,
            id: `hub-${i}`, width: 2.5,
          })),
        ];

        const routeResults = await Promise.all(
          routeTargets.map(async (pt) => {
            const geometry = await fetchRouteGeometry(lng, lat, pt.lng, pt.lat, token);
            return { ...pt, geometry };
          }),
        );

        for (const route of routeResults) {
          if (!route.geometry) continue;
          m.addSource(`route-${route.id}`, {
            type: 'geojson',
            data: { type: 'Feature' as const, properties: {}, geometry: route.geometry },
          });
          m.addLayer({
            id: `route-line-${route.id}`,
            type: 'line',
            source: `route-${route.id}`,
            paint: {
              'line-color': route.color,
              'line-width': route.width,
              'line-opacity': 0.45,
            },
            layout: { 'line-cap': 'round', 'line-join': 'round' },
          });
        }

        // ── Fit bounds to include all markers ──
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([lng, lat]);
        for (const d of data.distances) bounds.extend([d.lng, d.lat]);
        for (const h of hubs) bounds.extend([h.lng, h.lat]);
        m.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      });

      mapInstance.current = m;
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [data, lat, lng]);

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Location &amp; Life</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Regulatory feasibility, distances, community profile, and accessibility map for {commune || 'this property'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs text-stone-400">
              {new Date(data.generated_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={generate}
            disabled={status === 'generating'}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'generating' ? 'Analyzing location…' : data ? 'Refresh' : 'Analyze Location'}
          </button>
        </div>
      </div>

      {status === 'generating' && (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-sm text-stone-500 mt-4">Researching {commune || 'location'}…</p>
          <p className="text-xs text-stone-400 mt-1">AI regulatory analysis + Mapbox distance lookup</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {data && status === 'done' && (
        <>
          {/* Regulatory Feasibility Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
              Regulatory Feasibility
            </h3>
            <div className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
              {data.regulatory_checklist.map((item, i) => {
                const colors = LIGHT_COLORS[item.status];
                return (
                  <div key={i} className={`px-4 py-3 ${colors.bg}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5 shrink-0">{LIGHT_EMOJI[item.status]}</span>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${colors.text}`}>{item.question}</p>
                        <p className="text-xs text-stone-600 mt-1">{item.detail}</p>
                        <p className="text-xs text-stone-400 mt-0.5 italic">Verify with: {item.source_hint}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distance Cards */}
          {data.distances.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
                Nearest Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.distances.map((d) => (
                  <div
                    key={d.category}
                    className="rounded-lg border border-stone-200 bg-white px-4 py-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <DistanceIcon category={d.category} />
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                        {DISTANCE_CATEGORY_LABELS[d.category as DistanceCategory] ?? d.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-stone-900 truncate">{d.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-lg font-bold tabular-nums ${
                        d.drive_minutes <= 10 ? 'text-green-700' :
                        d.drive_minutes <= 25 ? 'text-amber-700' :
                        'text-red-700'
                      }`}>
                        {d.drive_minutes} min
                      </span>
                      <span className="text-xs text-stone-400">{d.distance_km} km</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transport Connections */}
          {transportHubs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
                Transport Connections
              </h3>

              {/* Train Stations */}
              {trainStations.length > 0 && (
                <div className="space-y-2">
                  {trainStations.map((hub, i) => (
                    <div key={`train-${i}`} className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{'\u{1F689}'}</span>
                        <span className="text-sm font-semibold text-stone-900">{hub.name}</span>
                        <span className="ml-auto flex items-baseline gap-2">
                          <span className={`text-base font-bold tabular-nums ${
                            hub.drive_minutes <= 20 ? 'text-green-700' :
                            hub.drive_minutes <= 45 ? 'text-blue-700' :
                            'text-amber-700'
                          }`}>
                            {hub.drive_minutes} min
                          </span>
                          <span className="text-xs text-stone-400">{hub.distance_km} km</span>
                        </span>
                      </div>
                      {hub.connections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {hub.connections.map((c, j) => (
                            <span key={j} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Airports */}
              {airports.length > 0 && (
                <div className="space-y-2">
                  {airports.map((hub, i) => (
                    <div key={`air-${i}`} className="rounded-lg border border-indigo-200 bg-indigo-50/30 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{'\u{2708}'}️</span>
                        <span className="text-sm font-semibold text-stone-900">{hub.name}</span>
                        <span className="ml-auto flex items-baseline gap-2">
                          <span className={`text-base font-bold tabular-nums ${
                            hub.drive_minutes <= 60 ? 'text-green-700' :
                            hub.drive_minutes <= 120 ? 'text-indigo-700' :
                            'text-amber-700'
                          }`}>
                            {hub.drive_minutes} min
                          </span>
                          <span className="text-xs text-stone-400">{hub.distance_km} km</span>
                        </span>
                      </div>
                      {hub.connections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {hub.connections.map((c, j) => (
                            <span key={j} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Community Profile */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
              Community Profile
            </h3>
            <div className="rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-5 py-4 bg-stone-50 border-b border-stone-100">
                <p className="text-sm text-stone-800 font-medium italic">
                  &ldquo;{data.community.overall_vibe}&rdquo;
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                {([
                  ['Expat Presence', data.community.expat_presence],
                  ['Demographics', data.community.demographics],
                  ['Language', data.community.language_environment],
                  ['Local Events', data.community.local_events],
                  ['Outdoor Activities', data.community.outdoor_activities],
                  ['Cycling', data.community.cycling],
                  ['Internet', data.community.internet_connectivity],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="px-4 py-3">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Isochrone Map */}
          {lat != null && lng != null && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">
                Accessibility Map
              </h3>
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div ref={mapContainer} style={{ height: 440 }} className="w-full" />
                <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs text-stone-400">Isochrones:</span>
                  {data.isochrone_minutes.map((m, i) => (
                    <span key={m} className="flex items-center gap-1.5 text-xs text-stone-500">
                      <span
                        className="w-3 h-3 rounded-sm border"
                        style={{
                          backgroundColor: ['rgba(192,98,47,0.15)', 'rgba(192,98,47,0.10)', 'rgba(192,98,47,0.05)'][i],
                          borderColor: ['rgba(192,98,47,0.5)', 'rgba(192,98,47,0.3)', 'rgba(192,98,47,0.15)'][i],
                        }}
                      />
                      {m} min
                    </span>
                  ))}
                  <span className="text-xs text-stone-300">|</span>
                  <span className="text-xs text-stone-400">Routes:</span>
                  <span className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="w-4 h-0.5 rounded" style={{ backgroundColor: ROUTE_COLORS.service }} />
                    Services
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="w-4 h-0.5 rounded" style={{ backgroundColor: ROUTE_COLORS.train_station }} />
                    Train
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-stone-500">
                    <span className="w-4 h-0.5 rounded" style={{ backgroundColor: ROUTE_COLORS.airport }} />
                    Airport
                  </span>
                </div>
              </div>
            </div>
          )}

          {lat == null && (
            <div className="rounded-lg border border-dashed border-stone-300 p-6 text-center bg-stone-50">
              <p className="text-sm text-stone-500">
                Add latitude/longitude to this property to see the accessibility map and distance cards.
              </p>
            </div>
          )}
        </>
      )}

      {status === 'idle' && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
          <p className="text-sm text-stone-600 mb-1">
            No location intelligence generated yet.
          </p>
          <p className="text-xs text-stone-400">
            Click &ldquo;Analyze Location&rdquo; to research regulatory feasibility, nearby services, and community profile for {commune || 'this property'}.
          </p>
        </div>
      )}
    </section>
  );
}
