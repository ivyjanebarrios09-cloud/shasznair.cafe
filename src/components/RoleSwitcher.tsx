import React, { useState } from 'react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { CoffeeSvg, ShieldSvg, TerminalSvg, UserSvg, LogOutSvg, XSvg, AlertTriangleSvg, LockSvg } from './SvgIcons';
import { InstallAppButton } from './InstallAppButton';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, activeWorkspace, switchWorkspace, logout, authLoading, settings } = useCoffeeApp();
  const [showAdminWarning, setShowAdminWarning] = useState(false);

  const allRoles = [
    { name: 'Customer App', role: 'customer', icon: UserSvg },
    { name: 'POS Cashier', role: 'cashier', icon: CoffeeSvg },
    { name: 'Kitchen KDS', role: 'kitchen', icon: TerminalSvg },
    { name: 'Admin Dashboard', role: 'admin', icon: ShieldSvg },
  ] as const;

  const currentRole = currentUser?.role || 'customer';
  const isAdmin = currentRole === 'admin';

  // Filter out Customer App for Admin accounts as admins are not allowed access to customer app
  const roles = allRoles.filter((item) => !(isAdmin && item.role === 'customer'));

  const currentView = isAdmin ? (activeWorkspace || 'admin') : currentRole;

  const handleRoleClick = async (role: 'customer' | 'cashier' | 'kitchen' | 'admin') => {
    try {
      await switchWorkspace(role);
    } catch (e) {
      setShowAdminWarning(true);
    }
  };

  return (
    <>
      <div className="bg-[#080808] border-b border-white/10 text-[10px] py-1 px-3 flex flex-wrap gap-1.5 items-center justify-between z-50 sticky top-0 shadow-md shrink-0">
        <div className="flex items-center gap-2 text-white/90 font-medium select-none">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--color-primary)]/60 flex items-center justify-center shadow bg-white">
            {settings.branding.logoUrl ? (
              <img src={settings.branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--color-primary)] flex items-center justify-center text-black font-serif font-black text-[10px]">
                {settings.branding.shopName.charAt(0)}
              </div>
            )}
          </div>
          <span className="font-serif font-extrabold text-[var(--color-primary)] text-[11px] tracking-wide">{settings.branding.shopName}</span>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="text-white/60 hidden sm:inline text-[10px]">
            {authLoading ? 'Sync...' : currentUser ? currentUser.name : 'Admin'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* PWA Download App Button */}
          <InstallAppButton />

          <div className="flex items-center gap-1">
            {roles.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.role;
              const isLocked = !isAdmin && currentRole !== item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => handleRoleClick(item.role)}
                  disabled={authLoading}
                  id={`role-btn-${item.role}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-200 cursor-pointer text-[10px] ${
                    isActive 
                      ? 'bg-[#c5a059] text-black font-semibold shadow-[0_0_8px_rgba(197,160,89,0.2)]' 
                      : isLocked
                        ? 'bg-[#121212]/50 border border-white/5 text-white/40 hover:text-white/60'
                        : 'bg-[#121212] border border-white/10 hover:bg-[#1a1a1a] text-white/75 hover:text-white'
                  }`}
                  title={isLocked ? `Workspace switching is restricted to Admin accounts. You are locked to ${currentRole.toUpperCase()}.` : `Switch to ${item.name}`}
                >
                  {isLocked ? <LockSvg className="w-2.5 h-2.5 text-amber-500/70" /> : <Icon className="w-3 h-3" />}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {currentUser && (
            <button
              onClick={() => logout()}
              title="Sign Out of Session"
              id="role-logout-btn"
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/40 transition-all cursor-pointer text-[10px]"
            >
              <LogOutSvg className="w-3 h-3" />
              <span className="hidden md:inline">Exit</span>
            </button>
          )}
        </div>
      </div>

      {/* SECURITY MODAL WARNING FOR ROLE SWITCHING */}
      {showAdminWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            
            <button
              onClick={() => setShowAdminWarning(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white rounded-full p-1 cursor-pointer"
            >
              <XSvg className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <AlertTriangleSvg className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif">Workspace Switching Restricted</h3>
              <p className="text-xs text-white/70 leading-normal">
                Your current account is logged in as <strong className="text-[#c5a059] uppercase">{currentRole}</strong>.
              </p>
              <p className="text-xs text-white/50 leading-relaxed pt-1">
                POS Cashiers and Kitchen Monitors are restricted to their assigned dashboard. Only <strong>Admin</strong> accounts have permission to toggle between different workspace views.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowAdminWarning(false)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 hover:bg-[#252525] text-white text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Got It
              </button>
              <button
                onClick={async () => {
                  setShowAdminWarning(false);
                  await logout();
                }}
                className="flex-1 bg-rose-900/80 hover:bg-rose-900 text-white text-xs font-bold py-2 px-4 rounded-xl flex justify-center items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOutSvg className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
export default RoleSwitcher;
