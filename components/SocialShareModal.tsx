import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2, X, Image as ImageIcon, Check, RefreshCw, Type } from 'lucide-react';
import { Run } from '../types';
import { Modal, Button, Input } from './UIComponents';
import { formatPace, formatDuration, formatFullDate } from '../utils/formatters';

interface SocialShareModalProps {
  run: Run;
  onClose: () => void;
}

const THEMES = [
  { id: 'transparent', color: 'transparent', text: '#FFFFFF', label: 'Overlay' },
  { id: 'dark', color: '#000000', text: '#FFFFFF', label: 'Classic Black' },
  { id: 'light', color: '#FFFFFF', text: '#000000', label: 'Clean White' },
  { id: 'red', color: '#EE0000', text: '#FFFFFF', label: 'RedLine Red' }
];

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ run, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState('dark');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [caption, setCaption] = useState(formatFullDate(run.date).toUpperCase());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
          setBgImage(ev.target?.result as string);
          setTheme('dark'); // Default to dark overlay for photos
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !run) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawContent = async () => {
        canvas.width = 1080;
        canvas.height = 1350;
        const padding = 80;
        const contentWidth = canvas.width - (padding * 2);

        const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
        const textColor = currentTheme.text;
        const bgColor = currentTheme.color;

        // 1. Background
        if (bgImage) {
            const img = new Image();
            img.src = bgImage;
            await new Promise((resolve) => { img.onload = resolve; });

            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Scrim overlay
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            if (theme === 'transparent') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // 2. Logo
        ctx.save();
        ctx.translate(padding, padding);
        ctx.fillStyle = theme === 'red' ? '#FFFFFF' : '#EE0000';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(80, 0);
        ctx.lineTo(40, 200);
        ctx.lineTo(170, 200);
        ctx.lineTo(170, 260);
        ctx.lineTo(-40, 260);
        ctx.lineTo(-40, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 3. Header Text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = textColor;

        ctx.font = '900 48px "Geist Sans", sans-serif';
        ctx.fillText('REDLINE', padding + 140, padding + 55);

        ctx.font = '600 24px "Geist Sans", sans-serif';
        ctx.globalAlpha = 0.7;
        ctx.fillText(caption || 'RUN', padding + 140, padding + 95);

        // Draw distance metric text with shadow for better visibility on transparent backgrounds

        ctx.globalAlpha = 1.0;

        // 4. Main Metric (Distance)
        const mainMetricBaseY = canvas.height / 2 + 100;

        ctx.shadowColor = theme === 'transparent' ? 'rgba(0,0,0,0.5)' : 'transparent';
        ctx.shadowBlur = theme === 'transparent' ? 5 : 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.font = '900 420px "Geist Sans", sans-serif';
        ctx.letterSpacing = "-20px";
        const distanceText = run.distance.toString();
        const metrics = ctx.measureText(distanceText);
        ctx.fillText(distanceText, padding - 20, mainMetricBaseY);
        
        ctx.letterSpacing = "0px";
        ctx.font = '900 48px "Geist Sans", sans-serif';
        ctx.fillText('KM', padding + metrics.width + 10, mainMetricBaseY - 40);


        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // 4.5 Map Outline
        if (run.positions && run.positions.length > 0) {
            const lats = run.positions.map(p => p.coords.latitude);
            const lons = run.positions.map(p => p.coords.longitude);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);

            const mapWidth = 350;
            const mapHeight = 350;
            const mapX = canvas.width - mapWidth - padding;
            const mapY = padding;

            const latRange = maxLat - minLat;
            const lonRange = maxLon - minLon;

            // Handle edge case where route is too short to form an area
            if (latRange > 0 && lonRange > 0) {
                // Determine scale to fit within bounding box while preserving aspect ratio
                // Note: Longitude needs scaling by cos(latitude) for accurate aspect ratio, but simple scaling is ok for rough outline
                const centerLat = (minLat + maxLat) / 2;
                const lonCorrection = Math.cos(centerLat * Math.PI / 180);

                const adjustedLonRange = lonRange * lonCorrection;

                const scaleX = mapWidth / adjustedLonRange;
                const scaleY = mapHeight / latRange;
                const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some padding

                const drawRoute = (xOffset, yOffset, strokeColor, lineWidth) => {
                    ctx.beginPath();
                    for (let i = 0; i < run.positions.length; i++) {
                        const p = run.positions[i];

                        // Normalize coordinates (0 to 1)
                        const normalizedX = (p.coords.longitude - minLon) * lonCorrection / adjustedLonRange;
                        const normalizedY = 1 - ((p.coords.latitude - minLat) / latRange); // Invert Y as canvas Y goes down

                        // Scale and translate
                        // Center within the mapWidth/mapHeight box
                        const routeWidth = adjustedLonRange * scale;
                        const routeHeight = latRange * scale;

                        const startX = mapX + (mapWidth - routeWidth) / 2;
                        const startY = mapY + (mapHeight - routeHeight) / 2;

                        const x = startX + normalizedX * routeWidth + xOffset;
                        const y = startY + normalizedY * routeHeight + yOffset;

                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = lineWidth;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';
                    ctx.stroke();
                };

                // Draw outline (glow/shadow effect)
                drawRoute(0, 0, theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.5)', 12);

                // Draw main route line
                drawRoute(0, 0, theme === 'red' ? '#FFFFFF' : '#EE0000', 6);
            }
        }

        // 5. Bottom metrics
        const footerY = canvas.height - padding;
        const colWidth = contentWidth / 3;

        // Reset shadow for bottom metrics and map
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        const drawMetric = (label: string, value: string, x: number) => {
            ctx.globalAlpha = 0.5;
            ctx.font = '700 18px "Geist Sans", sans-serif';
            ctx.letterSpacing = "2px";
            ctx.fillText(label.toUpperCase(), x, footerY - 90);

            ctx.globalAlpha = 1.0;
            ctx.letterSpacing = "-2px";
            ctx.font = '900 84px "Geist Sans", sans-serif';
            ctx.fillText(value, x, footerY);
        };

        drawMetric('Pace', run.pace, padding);
        drawMetric('Time', `${run.duration}m`, padding + colWidth);
        if (run.avgHr) drawMetric('Heart Rate', run.avgHr.toString(), padding + colWidth * 2);
    };

    drawContent();
  }, [run, theme, bgImage, caption]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `RedLine_${run?.date}_${run?.distance}km.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <Modal isOpen={!!run} onClose={onClose} title="Share Performance">
       <div className="space-y-8 animate-fade-in">
           <div className="relative w-full max-w-[340px] mx-auto shadow-2xl rounded-xl overflow-hidden border border-accents-2">
                <canvas ref={canvasRef} className="w-full h-auto block" />
           </div>

           <div className="space-y-6">
                <Input
                    label="Custom Caption"
                    value={caption}
                    onChange={(e: any) => setCaption(e.target.value.toUpperCase())}
                    placeholder="MORNING RUN"
                    maxLength={25}
                />

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-accents-5 uppercase tracking-widest ml-1">Poster Theme</label>
                    <div className="flex items-center gap-4 justify-between bg-accents-1 p-4 rounded-xl border border-accents-2">
                        <div className="flex gap-3">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTheme(t.id); setBgImage(null); }}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${theme === t.id && !bgImage ? 'border-primary scale-110 shadow-md' : 'border-accents-2 hover:scale-105'}`}
                                    style={t.id === 'transparent' ? { backgroundImage: 'conic-gradient(#ccc 25%, white 25%, white 50%, #ccc 50%, #ccc 75%, white 75%, white)', backgroundSize: '8px 8px' } : { backgroundColor: t.color }}
                                />
                            ))}
                        </div>
                        <div className="h-6 w-px bg-accents-2" />
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon size={16} className="mr-2" /> {bgImage ? 'Change Photo' : 'Upload Photo'}
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                </div>

                <Button onClick={handleDownload} className="w-full h-12">
                    <Download size={18} className="mr-2" /> Download Image
                </Button>
           </div>
       </div>
    </Modal>
  );
};
