/**
 * Shared geolocation hook — eliminates duplicated navigator.geolocation +
 * haversine distance logic across AttendanceCheckIn and EmployeePortal.
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface Coords { lat: number; lng: number }

const DEMO_LOCATION: Coords = { lat: 19.0760, lng: 72.8777 }; // Mumbai HQ demo

/** Haversine distance in metres */
export function haversineMeters(a: Coords, b: Coords): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);

  const detect = useCallback(() => {
    setLoading(true);
    if (!navigator.geolocation) {
      setCoords(DEMO_LOCATION);
      setLoading(false);
      toast.info("Geolocation not supported — using demo location");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
        toast.success("Location detected");
      },
      () => {
        setCoords(DEMO_LOCATION);
        setLoading(false);
        toast.info("Unable to get location — using demo location");
      }
    );
  }, []);

  return { coords, loading, detect };
}
