
import React, { useState, useEffect, useRef } from 'react';
import { Run } from '../types';
import { formatDuration, formatPace, formatFullDate } from '../utils/formatters';
import { Download, X, Upload, Check, Image as ImageIcon, Type, RefreshCw } from 'lucide-react';
import { Modal } from './UIComponents';

interface SocialShareModalProps {
  run: Run | null;
  onClose: () => void;
}

const THEMES = [
  { id: 'red', label: 'RedLine', color: '#D32F2F', textColor: 'white' },
  { id: 'dark', label: 'Midnight', color: '#050505', textColor: 'white' },
  { id: 'light', label: 'Clean', color: '#FFFFFF', textColor: 'black' },
];

const SocialShareModal: React.FC<SocialShareModalProps> = ({ run, onClose }) => {
  const [theme, setTheme] = useState('red');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (run) {
        setCaption(formatFullDate(run.date).toUpperCase());
    }
  }, [run]);

  // Handle File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImage(event.target.result as string);
          setTheme('photo'); // Switch context to photo
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Draw Canvas
  useEffect(() => {
    if (!run || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas Config (Portrait 4:5 Ratio high res)
    canvas.width = 1080;
    canvas.height = 1350;

    const drawContent = () => {
      // 1. Background
      if (bgImage) {
        const img = new Image();
        img.src = bgImage;
        img.onload = () => {
           // Cover logic
           const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
           const x = (canvas.width / 2) - (img.width / 2) * scale;
           const y = (canvas.height / 2) - (img.height / 2) * scale;
           ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
           
           // Stylish Gradient Overlay - Stronger at bottom for text legibility
           const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
           gradient.addColorStop(0, 'rgba(0,0,0,0)');
           gradient.addColorStop(0.6, 'rgba(0,0,0,0.4)');
           gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
           ctx.fillStyle = gradient;
           ctx.fillRect(0, 0, canvas.width, canvas.height);
           
           finalizeDrawing(ctx, 'white');
        };
      } else {
        // Solid/Gradient Backgrounds
        if (theme === 'red') {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#D32F2F');
            gradient.addColorStop(1, '#8B0000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            finalizeDrawing(ctx, 'white');
        } else if (theme === 'dark') {
            ctx.fillStyle = '#080808';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            finalizeDrawing(ctx, 'white');
        } else {
            ctx.fillStyle = '#F5F5F5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            finalizeDrawing(ctx, 'black');
        }
      }
    };

    const finalizeDrawing = (ctx: CanvasRenderingContext2D, textColor: string) => {
        const padding = 80;
        const contentWidth = canvas.width - (padding * 2);
        const primaryColor = '#D32F2F';
        
        // Reset shadows
        ctx.shadowColor = 'transparent';
        
        // 2. Draw Logo (Top Left)
        ctx.save();
        const logoScale = 0.18; 
        ctx.translate(padding, padding);
        ctx.scale(logoScale, logoScale);
        
        // Draw Box Background for logo
        ctx.fillStyle = textColor === 'white' ? '#FFFFFF' : '#000000';
        ctx.beginPath();
        ctx.roundRect(0, 0, 512, 512, 120);
        ctx.fill();

        // Draw L shape
        ctx.fillStyle = textColor === 'white' ? '#D32F2F' : '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(170, 96);
        ctx.lineTo(270, 96);
        ctx.lineTo(220, 352);
        ctx.lineTo(390, 352);
        ctx.lineTo(390, 432);
        ctx.lineTo(120, 432);
        ctx.lineTo(120, 96);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 3. Header Text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        
        ctx.font = '900 42px "Roboto Flex", sans-serif';
        ctx.fillStyle = textColor;
        ctx.fillText('RedLine', padding + 110, padding + 55);

        ctx.font = '500 28px "Roboto Flex", sans-serif';
        ctx.globalAlpha = 0.8;
        // Truncate caption if too long
        let displayCaption = caption || 'RUN';
        if (displayCaption.length > 25) displayCaption = displayCaption.substring(0, 24) + '...';
        ctx.fillText(displayCaption, padding + 110, padding + 92);
        ctx.globalAlpha = 1.0;

        // 4. Main Metric (Distance)
        const mainMetricBaseY = canvas.height - 450;
        
        // Dynamic Font Sizing for Distance
        let fontSize = 450;
        const distanceText = run.distance.toString();
        
        // Use max weight 1000 for sharpness
        ctx.font = `1000 ${fontSize}px "Roboto Flex", sans-serif`;
        let textMetrics = ctx.measureText(distanceText);
        let textWidth = textMetrics.width;
        
        // Shrink if too wide
        while (textWidth > (contentWidth - 160) && fontSize > 150) {
            fontSize -= 20;
            ctx.font = `1000 ${fontSize}px "Roboto Flex", sans-serif`;
            textMetrics = ctx.measureText(distanceText);
            textWidth = textMetrics.width;
        }

        ctx.fillStyle = textColor;
        // Tight negative spacing for "Poster" look
        ctx.letterSpacing = "-15px";
        ctx.fillText(distanceText, padding - 15, mainMetricBaseY);
        ctx.letterSpacing = "0px";
        
        // Draw KM Unit
        ctx.font = '900 48px "Roboto Flex", sans-serif';
        ctx.fillStyle = textColor === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'; 
        ctx.fillText('KM', padding + textWidth + 5, mainMetricBaseY - 45);

        // 5. Separator Line
        const lineY = canvas.height - 280;
        ctx.beginPath();
        ctx.moveTo(padding, lineY);
        ctx.lineTo(canvas.width - padding, lineY);
        ctx.lineWidth = 2;
        ctx.strokeStyle = textColor;
        ctx.globalAlpha = 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // 6. Sub Metrics Footer
        const subMetricBaselineY = canvas.height - 100;
        const hasHr = run.avgHr > 0;
        const colWidth = hasHr ? 300 : 400;
        
        // Pace
        drawSubMetric(ctx, 'AVG PACE', formatPace(run.distance, run.duration), '/km', padding, subMetricBaselineY, textColor);
        
        // Time
        drawSubMetric(ctx, 'TIME', formatDuration(run.duration), '', padding + colWidth, subMetricBaselineY, textColor);
        
        // HR
        if (hasHr) {
            drawSubMetric(ctx, 'HEART RATE', run.avgHr.toString(), '', padding + (colWidth * 2), subMetricBaselineY, textColor);
        }
    };

    const drawSubMetric = (ctx: CanvasRenderingContext2D, label: string, value: string, unit: string, x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        
        // Label
        ctx.globalAlpha = 0.5;
        ctx.font = '700 18px "Roboto Flex", sans-serif'; 
        ctx.letterSpacing = "1px";
        ctx.fillText(label, x, y - 90);
        ctx.letterSpacing = "0px";
        
        // Value
        ctx.globalAlpha = 1.0;
        ctx.font = '900 80px "Roboto Flex", sans-serif';
        ctx.letterSpacing = "-2px";
        const valueMetrics = ctx.measureText(value);
        ctx.fillText(value, x, y);
        ctx.letterSpacing = "0px";
        
        // Unit
        if (unit) {
             ctx.font = '600 24px "Roboto Flex", sans-serif';
             ctx.globalAlpha = 0.5;
             ctx.fillText(unit, x + valueMetrics.width + 6, y - 12);
        }
    }

    drawContent();

  }, [run, theme, bgImage, caption]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `RedLine_${run?.date}_${run?.distance}km.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  if (!run) return null;

  return (
    <Modal isOpen={!!run} onClose={onClose} title="Share Run">
       <div className="p-4 pb-8 flex flex-col items-center animate-slide-down">
           
           {/* Canvas Preview */}
           <div className="relative w-full max-w-[320px] shadow-2xl rounded-[24px] overflow-hidden mb-6 bg-surface-container-high border border-outline-variant/10 group transform transition-transform hover:scale-[1.02]">
                <canvas 
                    ref={canvasRef} 
                    className="w-full h-auto block"
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-white/10 rounded-[24px]"></div>
           </div>

           {/* Controls */}
           <div className="w-full max-w-md bg-surface-container-low rounded-[24px] p-6 border border-outline-variant/20">
                
                {/* Custom Caption Input */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                         <label className="text-xs font-bold text-surface-on-variant uppercase tracking-wider flex items-center gap-1">
                            <Type size={12} /> Caption
                         </label>
                         <button 
                            onClick={() => setCaption(formatFullDate(run.date).toUpperCase())} 
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                         >
                            <RefreshCw size={10} /> Reset Date
                         </button>
                    </div>
                    <input 
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value.toUpperCase())}
                        placeholder="MORNING RUN"
                        className="w-full bg-surface-container-highest text-surface-on font-bold text-sm px-4 py-3 rounded-xl border-none focus:ring-2 ring-primary outline-none tracking-wide"
                        maxLength={25}
                    />
                </div>

                <div className="h-[1px] bg-outline-variant/10 w-full mb-6"></div>

                <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-surface-on-variant uppercase tracking-wider">Theme</label>
                    {bgImage && <button onClick={() => {setBgImage(null); setTheme('red')}} className="text-xs text-primary font-bold hover:underline">Remove Photo</button>}
                </div>
                
                {/* Swatches */}
                <div className="flex items-center gap-4 justify-center mb-8">
                    {THEMES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); setBgImage(null); }}
                            className={`
                                w-12 h-12 rounded-full shadow-sm border-2 transition-all relative flex items-center justify-center
                                ${theme === t.id && !bgImage ? 'border-primary scale-110 shadow-md ring-2 ring-primary/20' : 'border-outline-variant/20 hover:scale-105'}
                            `}
                            style={{ backgroundColor: t.color }}
                            title={t.label}
                        >
                            {theme === t.id && !bgImage && (
                                <Check size={20} className={t.id === 'light' ? 'text-black' : 'text-white'} />
                            )}
                        </button>
                    ))}
                    
                    <div className="w-[1px] h-8 bg-outline-variant/30 mx-2"></div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center relative overflow-hidden bg-surface-container-highest
                            ${bgImage ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-dashed border-outline-variant hover:border-primary hover:text-primary text-surface-on-variant'}
                        `}
                        title="Upload Photo"
                    >
                        {bgImage ? (
                            <img src={bgImage} className="w-full h-full object-cover opacity-80" alt="Background" />
                        ) : (
                            <ImageIcon size={20} />
                        )}
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </button>
                </div>

                <button 
                    onClick={handleDownload}
                    className="w-full bg-primary text-primary-on py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Download size={20} />
                    Download Image
                </button>
           </div>
       </div>
    </Modal>
  );
};

export default SocialShareModal;
