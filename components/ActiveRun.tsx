import React, { useState, useEffect, useRef } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Pause, Square, Mic, MicOff, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import { formatDuration as formatDurationOriginal, displayDistance, displayPaceFromStr } from '../utils/formatters';




// Our ActiveRun duration is in seconds. The formatter expects minutes.
const formatDuration = (seconds: number): string => {
  return formatDurationOriginal(seconds / 60);
};


// Custom RedLine marker icon
const redMarkerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background-color: #EE0000;
      box-sizing: border-box;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

interface ActiveRunProps {
  unit?: "km" | "mi";
  onFinish: (runData: any) => void;
  onCancel: () => void;
}

const COUNTDOWN_TIME = 3;

// A component to automatically center the map on the latest position
const MapRecenter = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

export const ActiveRun: React.FC<ActiveRunProps> = ({ onFinish, onCancel, unit = "km" as "km" | "mi" }) => {
  const [countdown, setCountdown] = useState<number | null>(COUNTDOWN_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [distance, setDistance] = useState(0); // in meters
  const [duration, setDuration] = useState(0); // in seconds
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [splits, setSplits] = useState<number[]>([]); // Durations in seconds at each unit mark
  const lastSplitDistanceRef = useRef(0);
  const lastSplitTimeRef = useRef(0);

  const watchIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown logic
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startRun();
    }
  }, [countdown]);

  const startRun = async () => {
    setIsRunning(true);
    setIsPaused(false);

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // Start GPS tracking
    try {
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, maximumAge: 0 },
        (position, err) => {
          if (err) {
            console.error('GPS Error:', err);
            setGpsError('Lost GPS signal. Searching...');
            return;
          }
          if (position) {
            setGpsError(null);
            setPositions(prev => {
              const newPositions = [...prev, position];
              if (prev.length > 0) {
                const lastPos = prev[prev.length - 1];
                const newDist = calculateDistance(
                  lastPos.coords.latitude, lastPos.coords.longitude,
                  position.coords.latitude, position.coords.longitude
                );
                setDistance(d => {
                const newTotal = d + newDist;

                // Check if we crossed a new unit threshold
                // Calculate distance in user's preferred unit
                const KM_TO_MILES = 0.621371;
                const distInUnit = unit === 'mi' ? (newTotal / 1000) * KM_TO_MILES : (newTotal / 1000);
                const currentFloor = Math.floor(distInUnit);

                if (currentFloor > lastSplitDistanceRef.current) {
                   const splitDuration = duration - lastSplitTimeRef.current;
                   setSplits(prev => [...prev, splitDuration]);
                   lastSplitDistanceRef.current = currentFloor;
                   lastSplitTimeRef.current = duration;
                }

                return newTotal;
              });
              }
              return newPositions;
            });
          }
        }
      );
      watchIdRef.current = id;
    } catch (e) {
      setGpsError('Could not access GPS. Please check permissions.');
    }
  };

  const pauseRun = async () => {
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
  };

  const resumeRun = () => {
    startRun(); // This restarts the timer and watchPosition
  };

  const stopRun = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
    }

    // Format run data to pass back
    const runData = {
      distance: distance / 1000, // convert to km
      duration,
      positions,
      calories: Math.round((distance / 1000) * 60),
      splits // Rough estimate
    };
    onFinish(runData);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current) Geolocation.clearWatch({ id: watchIdRef.current });
    };
  }, []);

  // Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center">
        <h1 className="text-9xl font-bold text-primary animate-pulse">{countdown || 'GO!'}</h1>
        <p className="mt-8 text-xl text-surface-on-variant">Get ready to run...</p>
      </div>
    );
  }

  const routeCoordinates: [number, number][] = positions.map(p => [p.coords.latitude, p.coords.longitude]);
  const currentPosition = routeCoordinates.length > 0 ? routeCoordinates[routeCoordinates.length - 1] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-safe z-[1000] flex justify-end items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-3 rounded-full shadow-lg backdrop-blur pointer-events-auto ${voiceEnabled ? 'bg-primary text-white' : 'bg-surface/80 text-surface-on'}`}
        >
          {voiceEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
      </div>

      {gpsError && (
        <div className="absolute top-24 left-4 right-4 z-[1000] bg-orange-500 text-white p-3 rounded-xl flex items-center gap-2 shadow-lg">
          <AlertCircle size={20} />
          <span className="font-semibold text-sm">{gpsError}</span>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={currentPosition || [0, 0]}
          zoom={16}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {currentPosition && <MapRecenter position={currentPosition} />}
          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="#EE0000" weight={5} opacity={0.8} />
          )}
          {currentPosition && (
            <Marker position={currentPosition} icon={redMarkerIcon} />
          )}
        </MapContainer>
      </div>

      {/* Stats & Controls Area */}
      <div className="bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-20 pb-safe pb-8">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center">
            <p className="text-surface-on-variant text-sm font-medium uppercase tracking-wider mb-1">Distance</p>
            <p className="text-4xl font-bold text-surface-on font-mono">{displayDistance(distance / 1000, unit)} <span className="text-xl">{unit}</span></p>
          </div>
          <div className="text-center">
            <p className="text-surface-on-variant text-sm font-medium uppercase tracking-wider mb-1">Time</p>
            <p className="text-4xl font-bold text-surface-on font-mono">{formatDuration(duration)}</p>
          </div>
          <div className="text-center">
            <p className="text-surface-on-variant text-sm font-medium uppercase tracking-wider mb-1">Pace</p>
            <p className="text-2xl font-bold text-surface-on font-mono">{duration > 0 && distance > 0 ? displayPaceFromStr(formatDurationOriginal(duration / (distance / 1000) / 60), unit) : '--:--'} <span className="text-base">/{unit}</span></p>
          </div>
          <div className="text-center">
            <p className="text-surface-on-variant text-sm font-medium uppercase tracking-wider mb-1">Calories</p>
            <p className="text-2xl font-bold text-surface-on font-mono">{Math.round((distance / 1000) * 60)}</p>
          </div>
        </div>

        <div className="flex justify-center gap-6 items-center">
          {isPaused ? (
            <>
              <button
                onClick={stopRun}
                className="w-20 h-20 bg-surface border-4 border-primary/20 text-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Square size={32} fill="currentColor" />
              </button>
              <button
                onClick={resumeRun}
                className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-transform"
              >
                <Play size={40} fill="currentColor" />
              </button>
            </>
          ) : (
            <button
              onClick={pauseRun}
              className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-transform"
            >
              <Pause size={40} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveRun;
