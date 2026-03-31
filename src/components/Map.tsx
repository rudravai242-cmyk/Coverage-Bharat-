import React, { useEffect, useRef, useState } from 'react';
import { INITIAL_CENTER, INITIAL_ZOOM, TECH_COLORS } from '../constants';
import { CoveragePoint, NetworkTech } from '../types';

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  points: CoveragePoint[];
  onMapLoad: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
}

declare global {
  interface Window {
    mappls: any;
  }
}

const Map: React.FC<MapProps> = ({ center, zoom, points, onMapLoad, onMapClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Mappls Map
    const initMap = () => {
      if (!window.mappls) {
        setTimeout(initMap, 100);
        return;
      }

      mapInstance.current = new window.mappls.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        zoomControl: false,
        hybrid: true,
      });

      mapInstance.current.on('load', () => {
        onMapLoad(mapInstance.current);
      });

      mapInstance.current.on('click', (e: any) => {
        if (e.lngLat) {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        }
      });
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Update center and zoom
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setCenter({ lat: center.lat, lng: center.lng });
      mapInstance.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    points.forEach(point => {
      const marker = new window.mappls.Marker({
        map: mapInstance.current,
        position: { lat: point.lat, lng: point.lng },
        icon_url: `data:image/svg+xml;base64,${btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="${TECH_COLORS[point.tech]}" stroke="white" stroke-width="2" />
          </svg>
        `)}`,
        width: 20,
        height: 20,
        popupHtml: `
          <div style="padding: 10px; font-family: sans-serif;">
            <strong style="color: ${TECH_COLORS[point.tech]}">${point.tech} Coverage</strong><br/>
            <span>Provider: ${point.provider}</span><br/>
            <span>Accuracy: ${point.accuracy.toFixed(1)}m</span>
          </div>
        `,
      });
      markersRef.current.push(marker);
    });
  }, [points]);

  return (
    <div ref={mapRef} className="w-full h-full" id="map-container" />
  );
};

export default Map;
