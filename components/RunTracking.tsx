import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  CardBody,
  useDisclosure,
  RadioGroup,
  Radio,
  Divider
} from '@heroui/react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Play, Square, MapPin, Activity, Zap, Flag, TrendingUp, Trophy, ChevronRight } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { RunType } from '../types';
import { RUN_TYPE_ORDER } from '../constants';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RunTrackingProps {
    onRunComplete: (runData: any) => void;
}

export const RunTrackingFAB: React.FC<RunTrackingProps> = ({ onRunComplete }) => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [step, setStep] = useState<'setup' | 'countdown' | 'active' | 'summary'>('setup');
    const [runType, setRunType] = useState<RunType>('Easy');
    const [countdown, setCountdown] = useState(5);
    const [isActive, setIsActive] = useState(false);

    // Stats
    const [time, setTime] = useState(0);
    const [distance, setDistance] = useState(0);
    const [pace, setPace] = useState('0:00');
    const [path, setPath] = useState<[number, number][]>([]);

    const timerRef = useRef<any>(null);
    const watchIdRef = useRef<string | null>(null);
    const lastPosRef = useRef<[number, number] | null>(null);
    const wakeLockRef = useRef<any>(null);
    const lastMilestoneRef = useRef<number>(0);
    const mapRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);

    // Voice Feedback
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Wake Lock Implementation
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            }
        } catch (err) {
            console.error(`Wake Lock error: ${err}`);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    const startRunSetup = () => {
        setStep('setup');
        onOpen();
    };

    const startCountdown = () => {
        setStep('countdown');
        setCountdown(5);
        speak("Starting in 5");
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    startActiveRun();
                    return 0;
                }
                if (prev === 4) speak("3");
                if (prev === 2) speak("1");
                return prev - 1;
            });
        }, 1000);
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const initMap = (lat: number, lng: number) => {
        const container = document.getElementById('tracking-map');
        if (!container || mapRef.current) return;

        mapRef.current = L.map(container, {
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lng], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

        polylineRef.current = L.polyline([], {
            color: '#EE0000',
            weight: 5,
            opacity: 0.8
        }).addTo(mapRef.current);
    };

    const startActiveRun = async () => {
        setStep('active');
        setIsActive(true);
        setTime(0);
        setDistance(0);
        setPath([]);
        lastPosRef.current = null;
        lastMilestoneRef.current = 0;

        speak("Run started. Enjoy your workout.");
        await requestWakeLock();

        // Start Timer
        timerRef.current = setInterval(() => {
            setTime(prev => prev + 1);
        }, 1000);

        // Start GPS Tracking
        try {
            const watchId = await Geolocation.watchPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 3000
            }, (position, err) => {
                if (err || !position) return;

                const { latitude, longitude } = position.coords;
                const newPos: [number, number] = [latitude, longitude];

                setPath(prev => [...prev, newPos]);

                // Update Map
                if (!mapRef.current) {
                    initMap(latitude, longitude);
                } else if (mapRef.current) {
                    mapRef.current.setView([latitude, longitude]);
                    if (polylineRef.current) {
                        polylineRef.current.addLatLng([latitude, longitude]);
                    }
                }

                if (lastPosRef.current) {
                    const d = calculateDistance(
                        lastPosRef.current[0], lastPosRef.current[1],
                        latitude, longitude
                    );
                    if (d > 0.001 && d < 0.1) {
                        setDistance(prev => {
                            const newDistance = prev + d;
                            if (Math.floor(newDistance) > lastMilestoneRef.current) {
                                lastMilestoneRef.current = Math.floor(newDistance);
                                speak(`${lastMilestoneRef.current} kilometer completed.`);
                            }
                            return newDistance;
                        });
                    }
                }
                lastPosRef.current = newPos;
            });
            watchIdRef.current = watchId;
        } catch (e) {
            console.error("Geolocation error", e);
        }
    };

    useEffect(() => {
        if (time > 0 && distance > 0) {
            const totalMinutes = time / 60;
            const paceValue = totalMinutes / distance;
            const paceMins = Math.floor(paceValue);
            const paceSecs = Math.floor((paceValue - paceMins) * 60);
            setPace(`${paceMins}:${paceSecs.toString().padStart(2, '0')}`);
        }
    }, [time, distance]);

    const stopRun = () => {
        clearInterval(timerRef.current);
        if (watchIdRef.current) {
            Geolocation.clearWatch({ id: watchIdRef.current });
        }
        releaseWakeLock();
        setIsActive(false);
        setStep('summary');
        speak("Run completed. Great job.");

        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    };

    const saveRun = () => {
        const runData = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            distance: parseFloat(distance.toFixed(2)),
            duration: Math.floor(time / 60),
            type: runType,
            pace: pace,
            location: 'GPS Run',
            source: 'RedLine GPS',
            path: path
        };
        onRunComplete(runData);
        onOpenChange();
        setStep('setup');
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <div className="fixed bottom-32 right-8 z-[9999]">
                <Button
                    isIconOnly
                    color="primary"
                    radius="full"
                    className="w-16 h-16 shadow-2xl animate-bounce"
                    onPress={startRunSetup}
                    data-testid="run-fab"
                >
                    <Play fill="currentColor" size={32} />
                </Button>
            </div>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                hideCloseButton={step === 'active' || step === 'countdown'}
                isDismissable={step !== 'active' && step !== 'countdown'}
                size="full"
                classNames={{
                    base: "bg-background",
                    header: "border-b border-accents-2",
                    body: "p-0",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            {step === 'setup' && (
                                <>
                                    <ModalHeader className="flex flex-col gap-1">
                                        <h2 className="text-2xl font-bold tracking-tight">Ready to Run?</h2>
                                        <p className="text-sm text-accents-5 font-normal">Select your workout type to begin</p>
                                    </ModalHeader>
                                    <ModalBody className="p-6">
                                        <RadioGroup
                                            label="Run Type"
                                            value={runType}
                                            onValueChange={(val) => setRunType(val as RunType)}
                                            classNames={{
                                                wrapper: "gap-4"
                                            }}
                                        >
                                            {RUN_TYPE_ORDER.map(type => (
                                                <Radio
                                                    key={type}
                                                    value={type}
                                                    className={`max-w-full inline-flex m-0 bg-accents-1 hover:bg-accents-2 items-center justify-between flex-row-reverse cursor-pointer rounded-xl gap-4 p-4 border-2 border-transparent data-[selected=true]:border-primary`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-background rounded-lg text-primary">
                                                            {type === 'Easy' && <Activity size={20} />}
                                                            {type === 'Intervals' && <Zap size={20} />}
                                                            {type === 'Long Run' && <Flag size={20} />}
                                                            {type === 'Tempo' && <TrendingUp size={20} />}
                                                            {type === 'Race' && <Trophy size={20} />}
                                                        </div>
                                                        <span className="font-bold text-lg">{type}</span>
                                                    </div>
                                                </Radio>
                                            ))}
                                        </RadioGroup>
                                    </ModalBody>
                                    <ModalFooter className="border-t border-accents-2 p-6">
                                        <Button color="primary" className="w-full h-14 text-xl font-bold" onPress={startCountdown}>
                                            Start Running <ChevronRight />
                                        </Button>
                                    </ModalFooter>
                                </>
                            )}

                            {step === 'countdown' && (
                                <ModalBody className="flex flex-col items-center justify-center p-6 bg-black text-white">
                                    <div className="text-[12rem] font-black animate-pulse leading-none">{countdown}</div>
                                    <p className="text-2xl font-bold tracking-widest uppercase opacity-50">Get Ready</p>
                                </ModalBody>
                            )}

                            {step === 'active' && (
                                <ModalBody className="flex flex-col p-0 h-full">
                                    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white p-8">
                                        <div className="text-8xl font-black tracking-tighter tabular-nums mb-2">{formatTime(time)}</div>
                                        <div className="text-2xl font-bold opacity-50 uppercase tracking-widest mb-12">Duration</div>

                                        <div className="grid grid-cols-2 w-full gap-8">
                                            <div className="text-center">
                                                <div className="text-5xl font-black tabular-nums">{distance.toFixed(2)}</div>
                                                <div className="text-sm font-bold opacity-50 uppercase tracking-widest">Kilometers</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-5xl font-black tabular-nums">{pace}</div>
                                                <div className="text-sm font-bold opacity-50 uppercase tracking-widest">Avg Pace /km</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="tracking-map" className="h-1/3 bg-accents-8 border-t border-accents-2 relative">
                                        {/* Leaflet Map renders here */}
                                    </div>
                                    <div className="p-8 bg-background border-t border-accents-2 flex justify-center">
                                        <Button
                                            isIconOnly
                                            color="danger"
                                            radius="full"
                                            className="w-24 h-24 shadow-2xl"
                                            onPress={stopRun}
                                        >
                                            <Square fill="currentColor" size={32} />
                                        </Button>
                                    </div>
                                </ModalBody>
                            )}

                            {step === 'summary' && (
                                <>
                                    <ModalHeader className="flex flex-col gap-1">
                                        <h2 className="text-2xl font-bold tracking-tight">Run Complete!</h2>
                                        <p className="text-sm text-accents-5 font-normal">Nice work. Here are your stats.</p>
                                    </ModalHeader>
                                    <ModalBody className="p-6">
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <Card shadow="sm" className="bg-accents-1 border-none">
                                                <CardBody className="p-4 flex flex-col items-center">
                                                    <span className="text-3xl font-black">{distance.toFixed(2)}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-accents-5">Distance (km)</span>
                                                </CardBody>
                                            </Card>
                                            <Card shadow="sm" className="bg-accents-1 border-none">
                                                <CardBody className="p-4 flex flex-col items-center">
                                                    <span className="text-3xl font-black">{formatTime(time)}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-accents-5">Time</span>
                                                </CardBody>
                                            </Card>
                                        </div>
                                        <Divider className="my-6" />
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-accents-5">Average Pace</span>
                                                <span className="font-bold">{pace} /km</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-accents-5">Workout Type</span>
                                                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold uppercase">{runType}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-accents-5">GPS Waypoints</span>
                                                <span className="font-bold">{path.length}</span>
                                            </div>
                                        </div>
                                    </ModalBody>
                                    <ModalFooter className="border-t border-accents-2 p-6 gap-3">
                                        <Button variant="bordered" className="flex-1" onPress={() => { setStep('setup'); onOpenChange(); }}>Discard</Button>
                                        <Button color="primary" className="flex-[2] font-bold" onPress={saveRun}>Save Workout</Button>
                                    </ModalFooter>
                                </>
                            )}
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
};
