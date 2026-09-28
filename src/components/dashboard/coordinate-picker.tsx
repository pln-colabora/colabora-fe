"use client";

import { useEffect, useRef, useState } from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { Input } from "@/components/ui/input";

// Bundlers rewrite Leaflet's default icon paths, so point them at the bundled
// assets explicitly or the marker renders blank.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

export type Coordinate = { latitude: number; longitude: number };

// Default view: Surabaya.
const SURABAYA: [number, number] = [-7.2575, 112.7521];
const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

export function CoordinatePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Coordinate | null;
  onChange: (value: Coordinate | null) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const disabledRef = useRef(disabled);
  const onChangeRef = useRef(onChange);
  const [lat, setLat] = useState(value ? String(value.latitude) : "");
  const [lng, setLng] = useState(value ? String(value.longitude) : "");

  useEffect(() => {
    disabledRef.current = disabled;
    onChangeRef.current = onChange;
  }, [disabled, onChange]);

  function placeMarker(latitude: number, longitude: number) {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
    else markerRef.current = L.marker([latitude, longitude]).addTo(map);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView(
      value ? [value.latitude, value.longitude] : SURABAYA,
      13,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (event) => {
      if (disabledRef.current) return;
      const latitude = round(event.latlng.lat);
      const longitude = round(event.latlng.lng);
      setLat(String(latitude));
      setLng(String(longitude));
      placeMarker(latitude, longitude);
      onChangeRef.current({ latitude, longitude });
    });
    mapRef.current = map;
    if (value) placeMarker(value.latitude, value.longitude);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Init once; live updates go through refs and the manual inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitManual(nextLat: string, nextLng: string) {
    const latitude = Number(nextLat);
    const longitude = Number(nextLng);
    const valid =
      nextLat !== "" &&
      nextLng !== "" &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;
    if (valid) {
      placeMarker(latitude, longitude);
      mapRef.current?.setView([latitude, longitude]);
      onChange({ latitude, longitude });
    } else {
      onChange(null);
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="border-border h-64 w-full overflow-hidden rounded-lg border"
        aria-label="Peta pemilih koordinat"
      />
      <p className="text-muted-foreground text-xs">
        Klik peta untuk menandai lokasi, atau isi koordinat manual di bawah.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="coord-lat">
            Latitude
          </label>
          <Input
            id="coord-lat"
            inputMode="decimal"
            placeholder="-7.2575"
            className="h-11"
            value={lat}
            disabled={disabled}
            onChange={(event) => {
              setLat(event.target.value);
              commitManual(event.target.value, lng);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="coord-lng">
            Longitude
          </label>
          <Input
            id="coord-lng"
            inputMode="decimal"
            placeholder="112.7521"
            className="h-11"
            value={lng}
            disabled={disabled}
            onChange={(event) => {
              setLng(event.target.value);
              commitManual(lat, event.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}
