'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Gaushala {
  id: number;
  name: string;
  state: string;
  district: string;
  description: string;
  cow_count: number | null;
  website: string | null;
  latitude: number;
  longitude: number;
  is_verified: boolean;
}

interface Props {
  gaushalas: Gaushala[];
  onSelect: (g: Gaushala) => void;
  selected: Gaushala | null;
}

export default function MapComponent({ gaushalas, onSelect, selected }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { center: [22.5, 82.5], zoom: 5 });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    gaushalas.forEach(g => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${g.is_verified ? 14 : 11}px;height:${g.is_verified ? 14 : 11}px;border-radius:50%;background:${g.is_verified ? '#27500A' : '#3B6D11'};border:2px solid ${g.is_verified ? '#C0DD97' : '#fff'};box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([g.latitude, g.longitude], { icon }).addTo(map);
      marker.on('click', () => onSelect(g));
      marker.bindTooltip(g.name, { direction: 'top', offset: [0, -8] });
    });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [gaushalas, onSelect]);

  useEffect(() => {
    if (!mapInstanceRef.current || !selected) return;
    mapInstanceRef.current.setView([selected.latitude, selected.longitude], 12);
  }, [selected]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
