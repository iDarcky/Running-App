import React, { useState, useEffect } from 'react';
import { Run, Goal, UserProfile } from './types';
import { SAMPLE_RUNS, SAMPLE_GOALS } from './constants';
import Dashboard from './components/Dashboard';
import RunLog from './components/RunLog';
import CoachInsights from './components/CoachInsights';
import Profile from './components/Profile';
import { LayoutDashboard, List, BrainCircuit, Activity, User } from 'lucide-react';

// Moved outside App to prevent re-creation on every render
const NavButton = ({ tab, activeTab, icon: Icon, label, onClick, mobile = false }: { tab: string, activeTab: string, icon: any, label: string, onClick: (t: any) => void, mobile?: boolean }) => {
    const isActive = activeTab === tab;
    return (
        <button 
            onClick={() => onClick(tab)}
            className={`
                flex items-center gap-2 transition-all duration-300 group