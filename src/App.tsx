import React, { useState } from 'react';
import { CoffeeAppProvider, useCoffeeApp } from './contexts/CoffeeAppContext';
import { RoleSwitcher } from './components/RoleSwitcher';
import { CustomerExperience } from './components/CustomerExperience';
import { PosExperience } from './components/PosExperience';
import { KitchenExperience } from './components/KitchenExperience';
import { AdminExperience } from './components/AdminExperience';
import { AuthScreen } from './components/AuthScreen';
import { FloatingInstallAppButton } from './components/InstallAppButton';
import { Home, Sparkles, Coffee, ShieldCheck, Database } from 'lucide-react';
import appletConfig from '../firebase-applet-config.json';

const AppContent: React.FC = () => {
  const { currentUser, authLoading, dbStatus, activeWorkspace, settings } = useCoffeeApp();
  const isLight = settings?.branding?.theme === 'light';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f2f2f2] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold font-serif tracking-wide text-white">Syncing Brew & Bloom Registers...</p>
          <p className="text-[10px] text-white/40">Loading Cloud Firestore connection</p>
        </div>
      </div>
    );
  }

  // If not logged in, present the sign in / log in screen directly
  if (!currentUser) {
    return <AuthScreen />;
  }

  const isAdmin = currentUser.role === 'admin';
  // Ensure Admin accounts can never access or view the Customer App
  const activeRoleView = (isAdmin && activeWorkspace && activeWorkspace !== 'customer') 
    ? activeWorkspace 
    : (isAdmin ? 'admin' : currentUser.role);

  // Determine which viewport to render
  const renderRoleViewport = () => {
    switch (activeRoleView) {
      case 'admin':
        return <AdminExperience />;
      case 'cashier':
        return <PosExperience />;
      case 'kitchen':
        return <KitchenExperience />;
      case 'customer':
      default:
        return <CustomerExperience />;
    }
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} flex flex-col font-sans transition-colors duration-300`}>
      {/* ONLY RENDER ADMIN WORKSPACE CONTROLS FOR ADMIN ACCOUNTS */}
      {isAdmin && <RoleSwitcher />}

      {/* MASTER SCREEN ROUTE PORT - PERMITTED PAGE PER ROLE */}
      <div className={`flex-1 ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} flex flex-col`}>
        {renderRoleViewport()}
      </div>

      {/* FLOATING PWA INSTALL ACTION BUTTON */}
      <FloatingInstallAppButton />
    </div>
  );
};

export default function App() {
  return (
    <CoffeeAppProvider>
      <AppContent />
    </CoffeeAppProvider>
  );
}

