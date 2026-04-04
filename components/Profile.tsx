import React, { useState } from 'react';
import {
  User,
  Settings,
  Shield,
  Bell,
  Moon,
  Sun,
  LogOut,
  Trash2,
  ChevronRight,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Info,
  Footprints,
  Plus,
  Star,
  Archive,
  X
} from 'lucide-react';
import { UserProfile, Shoe } from '../types';
import { Input, Select, Button, Card, Modal } from './UIComponents';

interface ProfileProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onReset: () => void;
  theme: string;
  toggleTheme: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSaveProfile, onReset, theme, toggleTheme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);
  const [activeTab, setActiveTab] = useState<'profile' | 'shoes' | 'settings'>('profile');

  const [isAddingShoe, setIsAddingShoe] = useState(false);
  const [newShoe, setNewShoe] = useState<Partial<Shoe>>({
      brand: '',
      model: '',
      maxDistance: 800,
      isDefault: false,
      isRetired: false
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(editProfile);
    setIsEditing(false);
  };

  const handleAddShoe = (e: React.FormEvent) => {
      e.preventDefault();
      const shoe: Shoe = {
          ...newShoe,
          id: Date.now().toString(),
          distance: 0,
      } as Shoe;
      
      const updatedShoes = [...(profile.shoes || []), shoe];
      onSaveProfile({ ...profile, shoes: updatedShoes });
      setIsAddingShoe(false);
      setNewShoe({ brand: '', model: '', maxDistance: 800 });
  };

  const handleSetDefaultShoe = (id: string) => {
      const updatedShoes = (profile.shoes || []).map(s => ({
          ...s,
          isDefault: s.id === id
      }));
      onSaveProfile({ ...profile, shoes: updatedShoes });
  };

  const handleRetireShoe = (id: string) => {
      const updatedShoes = (profile.shoes || []).map(s => ({
          ...s,
          isRetired: s.id === id ? !s.isRetired : s.isRetired,
          isDefault: s.id === id ? false : s.isDefault
      }));
      onSaveProfile({ ...profile, shoes: updatedShoes });
  };

  const handleDeleteShoe = (id: string) => {
      if (window.confirm("Delete this shoe? This will remove it from all associated runs.")) {
          const updatedShoes = (profile.shoes || []).filter(s => s.id !== id);
          onSaveProfile({ ...profile, shoes: updatedShoes });
      }
  };

  const activeShoes = (profile.shoes || []).filter(s => !s.isRetired);
  const retiredShoes = (profile.shoes || []).filter(s => s.isRetired);

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter mb-2">Settings</h2>
          <p className="text-accents-5 text-base">Manage your profile and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
              {[
                  { id: 'profile', label: 'General', icon: User },
                  { id: 'shoes', label: 'Gear Locker', icon: Footprints },
                  { id: 'settings', label: 'Preferences', icon: Settings }
              ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-accents-1 text-foreground' : 'text-accents-5 hover:text-foreground hover:bg-accents-1/50'}`}
                  >
                      <tab.icon size={18} />
                      {tab.label}
                  </button>
              ))}
              <div className="pt-4 mt-4 border-t border-accents-2">
                  <button
                    onClick={onReset}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                  >
                      <Trash2 size={18} />
                      Reset All Data
                  </button>
              </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
              <Card>
                  {activeTab === 'profile' && (
                      <div className="animate-fade-in">
                          <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">Athlete Profile</h3>
                          <form onSubmit={handleSave} className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input label="Display Name" value={editProfile.name} onChange={(e: any) => setEditProfile({...editProfile, name: e.target.value})} />
                                  <Select label="Gender" value={editProfile.sex} onChange={(e: any) => setEditProfile({...editProfile, sex: e.target.value})} options={[{value: '', label: 'Select...'}, {value: 'M', label: 'Male'}, {value: 'F', label: 'Female'}, {value: 'O', label: 'Other'}]} />
                                  <Input label="Age" type="number" value={editProfile.age} onChange={(e: any) => setEditProfile({...editProfile, age: parseInt(e.target.value)})} />
                                  <Input label="Weight (kg)" type="number" value={editProfile.weight} onChange={(e: any) => setEditProfile({...editProfile, weight: parseFloat(e.target.value)})} />
                              </div>
                              <div className="flex justify-end pt-4 border-t border-accents-2">
                                  <Button type="submit">Update Profile</Button>
                              </div>
                          </form>
                      </div>
                  )}

                  {activeTab === 'shoes' && (
                      <div className="animate-fade-in">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-foreground tracking-tight">Gear Locker</h3>
                              <Button variant="secondary" size="sm" onClick={() => setIsAddingShoe(true)}>
                                  <Plus size={16} className="mr-1" /> Add Shoe
                              </Button>
                          </div>

                          <div className="space-y-4">
                              {activeShoes.length === 0 && (
                                  <div className="py-12 text-center border-2 border-dashed border-accents-2 rounded-xl">
                                      <p className="text-accents-5 text-sm">No active shoes in your locker.</p>
                                  </div>
                              )}

                              {activeShoes.map(shoe => {
                                  const progress = Math.min((shoe.distance / shoe.maxDistance) * 100, 100);
                                  return (
                                      <div key={shoe.id} className={`p-5 rounded-xl border ${shoe.isDefault ? 'border-foreground bg-accents-1/30 shadow-sm' : 'border-accents-2'}`}>
                                          <div className="flex justify-between items-start mb-4">
                                              <div className="flex gap-4 items-start">
                                                  <button onClick={() => handleSetDefaultShoe(shoe.id)} className={`mt-1 ${shoe.isDefault ? 'text-primary' : 'text-accents-3 hover:text-primary transition-colors'}`}>
                                                      <Star size={20} fill={shoe.isDefault ? "currentColor" : "none"} />
                                                  </button>
                                                  <div>
                                                      <h4 className="font-bold text-foreground text-lg tracking-tight">{shoe.brand} {shoe.model}</h4>
                                                      <p className="text-[10px] text-accents-5 font-bold uppercase tracking-widest mt-0.5">
                                                          {shoe.isDefault ? 'Primary Shoe' : 'Active'}
                                                      </p>
                                                  </div>
                                              </div>
                                              <div className="flex gap-1">
                                                  <Button variant="ghost" size="sm" onClick={() => handleRetireShoe(shoe.id)} title="Archive"><Archive size={16} /></Button>
                                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteShoe(shoe.id)} className="text-primary hover:text-primary"><Trash2 size={16} /></Button>
                                              </div>
                                          </div>

                                          <div className="space-y-2">
                                              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                                  <span className="text-foreground">{shoe.distance.toFixed(1)} km</span>
                                                  <span className="text-accents-5">Limit: {shoe.maxDistance} km</span>
                                              </div>
                                              <div className="h-1.5 bg-accents-1 rounded-full overflow-hidden border border-accents-2">
                                                  <div
                                                      className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-primary' : progress > 70 ? 'bg-orange-500' : 'bg-foreground'}`}
                                                      style={{ width: `${progress}%` }}
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>

                          {retiredShoes.length > 0 && (
                              <div className="mt-10 pt-10 border-t border-accents-2">
                                  <h4 className="text-xs font-bold text-accents-4 uppercase tracking-widest mb-4">Archived Gear</h4>
                                  <div className="space-y-2 opacity-60">
                                      {retiredShoes.map(shoe => (
                                          <div key={shoe.id} className="flex justify-between items-center p-3 bg-accents-1 rounded-md text-sm">
                                              <span className="font-medium">{shoe.brand} {shoe.model}</span>
                                              <div className="flex gap-4 items-center">
                                                  <span className="text-xs">{shoe.distance.toFixed(0)} km</span>
                                                  <button onClick={() => handleRetireShoe(shoe.id)} className="text-xs font-bold hover:underline">Restore</button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {activeTab === 'settings' && (
                      <div className="animate-fade-in space-y-8">
                          <div>
                              <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">Preferences</h3>
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between p-4 bg-accents-1/50 rounded-lg border border-accents-2">
                                      <div className="flex items-center gap-4">
                                          <div className="text-foreground"><Moon size={20} /></div>
                                          <div>
                                              <p className="text-sm font-bold text-foreground">Dark Mode</p>
                                              <p className="text-xs text-accents-5">Adjust the interface theme.</p>
                                          </div>
                                      </div>
                                      <button
                                        onClick={toggleTheme}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-accents-3'}`}
                                      >
                                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                                      </button>
                                  </div>

                                  <div className="flex items-center justify-between p-4 bg-accents-1/50 rounded-lg border border-accents-2">
                                      <div className="flex items-center gap-4">
                                          <div className="text-foreground"><Bell size={20} /></div>
                                          <div>
                                              <p className="text-sm font-bold text-foreground">Training Reminders</p>
                                              <p className="text-xs text-accents-5">Get notified for upcoming runs.</p>
                                          </div>
                                      </div>
                                      <button className="w-12 h-6 bg-primary rounded-full p-1">
                                          <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </Card>
          </div>
      </div>

      <Modal isOpen={isAddingShoe} onClose={() => setIsAddingShoe(false)} title="Add Running Gear">
          <form onSubmit={handleAddShoe} className="space-y-4">
              <Input label="Brand" value={newShoe.brand} onChange={(e: any) => setNewShoe({...newShoe, brand: e.target.value})} required placeholder="e.g. Nike, Hoka, Saucony" />
              <Input label="Model" value={newShoe.model} onChange={(e: any) => setNewShoe({...newShoe, model: e.target.value})} required placeholder="e.g. Pegasus 40, Speedgoat 5" />
              <Input label="Retirement Distance (km)" type="number" value={newShoe.maxDistance} onChange={(e: any) => setNewShoe({...newShoe, maxDistance: parseInt(e.target.value)})} required />
              <Button type="submit" className="w-full mt-4">Add to Locker</Button>
          </form>
      </Modal>
    </div>
  );
};

export default Profile;
