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

  // If not logged in, present the sign in / log in screen directly
  if (!currentUser && !authLoading) {
    return <AuthScreen />;
  }

  // If still loading, we might want to show a minimal placeholder or nothing
  if (authLoading && !currentUser) {
    return <AuthScreen />; // Show AuthScreen even while loading
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

