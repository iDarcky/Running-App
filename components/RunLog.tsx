import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  MapPin,
  Zap,
  ChevronDown,
  Heart,
  Activity,
  AlertTriangle,
  Info,
  Share2,
  ExternalLink,
  Footprints,
  Download
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { displayDistance, displayPaceFromStr } from '../utils/formatters';
import { Run, UserProfile, Shoe } from '../types';
import RunForm from './RunForm';
import { Modal, Input, Button, Card } from './UIComponents';
import { SocialShareModal } from './SocialShareModal';

interface RunLogProps {
  runs: Run[];
  onAddRun: (run: Run) => void;
  onAddRuns: (runs: Run[]) => void;
  onUpdateRun: (run: Run) => void;
  onDeleteRun: (id: string) => void;
  onAddShoe: (shoe: Shoe) => void;
  profile: UserProfile;
}

const RunLog: React.FC<RunLogProps> = ({ runs, onAddRun, onAddRuns, onUpdateRun, onDeleteRun, onAddShoe, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [shareRun, setShareRun] = useState<Run | null>(null);
  


  const filteredRuns = runs.filter(run =>
    run.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (run: Run) => {
    setEditingId(run.id);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (run: Run) => {
    if (editingId) {
      onUpdateRun({ ...run, id: editingId });
    } else {
      onAddRun({ ...run, id: Date.now().toString() });
    }
    setIsFormOpen(false);
    setEditingId(null);
  };

  const editingRun = editingId ? runs.find(r => r.id === editingId) : undefined;

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
         <div>
             <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-2">Training Log</h2>
             <p className="text-accents-5 text-base">Your complete running history.</p>
         </div>

         <div className="flex gap-2 w-full md:w-auto">
             <Button size="sm" onClick={() => setIsFormOpen(true)}>
                 <Plus size={16} className="mr-1" /> Log Run
             </Button>
         </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-accents-4" size={16} />
              <input
                type="text"
                placeholder="Search runs, locations, notes..."
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-accents-2 rounded-md text-sm focus:border-foreground focus:outline-none transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <Button variant="secondary" className="flex gap-2">
              <Filter size={16} /> Filter
          </Button>
      </div>

      <div className="space-y-4">
        {filteredRuns.length === 0 ? (
            <div className="text-center py-20 bg-accents-1 rounded-xl border border-accents-2 border-dashed">
                <Calendar size={48} className="mx-auto text-accents-3 mb-4" />
                <p className="text-accents-5 font-medium">No runs found.</p>
            </div>
        ) : (
            filteredRuns.map((run) => (
                <Card key={run.id} className="p-0 overflow-hidden hover:border-accents-3">
                    <div
                        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                        onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                    >
                        <div className="flex items-center gap-5">
                            <div className="bg-accents-1 w-12 h-12 rounded-lg flex flex-col items-center justify-center border border-accents-2 shrink-0">
                                <span className="text-[10px] font-bold text-accents-5 uppercase leading-none mb-0.5">{format(new Date(run.date), 'MMM')}</span>
                                <span className="text-lg font-bold text-foreground leading-none">{format(new Date(run.date), 'dd')}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-1.5 py-0.5 bg-accents-2 text-accents-6 text-[9px] font-bold rounded uppercase tracking-wider">{run.type}</span>
                                    <h3 className="font-bold text-foreground tracking-tight">{run.location || 'Morning Run'}</h3>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-accents-5 font-medium">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {run.duration}m</span>
                                    {run.avgHr && <span className="flex items-center gap-1"><Heart size={12} className="text-primary" /> {run.avgHr} bpm</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-10">
                            <div className="text-right">
                                <p className="text-2xl font-bold text-foreground tracking-tighter leading-none mb-1">{displayDistance(run.distance, profile.preferredUnits)} <span className="text-xs text-accents-4">{profile.preferredUnits || "km"}</span></p>
                                <p className="text-xs text-accents-5 font-medium uppercase tracking-widest">{displayPaceFromStr(run.pace, profile.preferredUnits)} /{profile.preferredUnits || 'km'}</p>
                            </div>
                            <ChevronDown size={20} className={`text-accents-3 transition-transform ${expandedRunId === run.id ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {expandedRunId === run.id && (
                        <div className="px-5 pb-5 pt-2 border-t border-accents-2 bg-accents-1/30 animate-fade-in">

                            {run.splits && run.splits.length > 0 && (
                                <div className="mt-6 mb-4">
                                    <h4 className="text-xs font-bold text-accents-5 uppercase tracking-widest mb-3">Splits</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {run.splits.map((split, i) => (
                                            <div key={i} className="bg-background p-2 rounded border border-accents-2 flex justify-between items-center">
                                                <span className="text-xs font-bold text-accents-4">{i + 1}</span>
                                                <span className="text-sm font-mono font-bold">{Math.floor(split/60)}:{(Math.round(split%60)).toString().padStart(2, '0')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {run.positions && run.positions.length > 0 && (
                                <div className="mb-6 h-48 w-full rounded-xl overflow-hidden border border-accents-2 z-0 relative">
                                    <MapContainer
                                      center={[run.positions[0].coords.latitude, run.positions[0].coords.longitude]}
                                      zoom={14}
                                      zoomControl={false}
                                      dragging={false}
                                      scrollWheelZoom={false}
                                      doubleClickZoom={false}
                                      className="w-full h-full"
                                    >
                                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                      <Polyline positions={run.positions.map(p => [p.coords.latitude, p.coords.longitude])} color="#EE0000" weight={4} opacity={0.8} />
                                    </MapContainer>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-4">
                                <div className="bg-background p-3 rounded-lg border border-accents-2">
                                    <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-1">Elevation</p>
                                    <p className="text-sm font-bold text-foreground">{run.elevation || 0} m</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border border-accents-2">
                                    <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-1">Shoes</p>
                                    <p className="text-sm font-bold text-foreground truncate">{profile.shoes?.find(s => s.id === run.shoeId)?.name || 'Default'}</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border border-accents-2">
                                    <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-1">Source</p>
                                    <p className="text-sm font-bold text-foreground">{run.source || 'Manual'}</p>
                                </div>
                                <div className="bg-background p-3 rounded-lg border border-accents-2">
                                    <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-1">Effort</p>
                                    <p className="text-sm font-bold text-foreground">{run.effort || 5}/10</p>
                                </div>
                            </div>

                            {run.notes && (
                                <div className="mb-6">
                                    <p className="text-[9px] font-bold text-accents-4 uppercase tracking-widest mb-2">Notes</p>
                                    <p className="text-sm text-accents-6 leading-relaxed italic border-l-2 border-accents-2 pl-4">"{run.notes}"</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-accents-2">
                                <Button variant="secondary" size="sm" onClick={() => setShareRun(run)}>
                                    <Share2 size={14} className="mr-1.5" /> Share
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleEditClick(run)}>
                                    <Pencil size={14} className="mr-1.5" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => onDeleteRun(run.id)}>
                                    <Trash2 size={14} className="mr-1.5" /> Delete
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            ))
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingId(null); }} title={editingId ? 'Edit Run' : 'Log Run'}>
          <RunForm 
            initialData={editingRun} 
            onSubmit={handleFormSubmit}
            isEditing={!!editingId}
            profile={profile}
            onAddShoe={onAddShoe}
          />
      </Modal>
      
      {shareRun && <SocialShareModal run={shareRun} onClose={() => setShareRun(null)} />}
    </div>
  );
};

export default RunLog;
