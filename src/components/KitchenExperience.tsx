import React, { useState } from 'react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Order, OrderStatus, OrderItem } from '../types';
import { InstallAppButton } from './InstallAppButton';
import { Clock, Play, CheckCircle, Package, MapPin, Check, MessageSquare, AlertCircle, LogOut, Menu, Download, Table, LayoutGrid, CheckCircle2, User, Store, Smartphone } from 'lucide-react';

export const KitchenExperience: React.FC = () => {
  const { orders, updateOrderStatus, updateOrderItemStatus, dataLoading, currentUser, logout, settings } = useCoffeeApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'pay' | 'verify' | 'incoming' | 'active' | 'ready'>('all');
  const [queueMode, setQueueMode] = useState<'tabular' | 'grid'>('tabular');

  // Filter orders by active kitchen stages
  const newOrders = orders.filter(o => o.orderStatus === 'pending');
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'ready');
  const activeOrdersCount = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.orderStatus)).length;

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemStatusChange = async (orderId: string, itemIdx: number, newStatus: 'pending' | 'preparing' | 'ready') => {
    try {
      await updateOrderItemStatus(orderId, itemIdx, newStatus);
    } catch (e) {
      console.error("Failed to change item status:", e);
    }
  };

  const getElapsedTime = (createdAt: any) => {
    if (!createdAt) return '0m';
    const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const diffMs = Math.abs(new Date().getTime() - created.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins}m ago`;
  };

  const isLight = settings?.branding?.theme === 'light';

  // Render function for order items with individual status toggle buttons
  const renderItemWithStatus = (ord: Order, it: OrderItem, idx: number) => {
    const itemStatus = it.itemStatus || (ord.orderStatus === 'preparing' ? 'preparing' : ord.orderStatus === 'ready' ? 'ready' : 'pending');

    return (
      <div key={idx} className={`${isLight ? 'bg-stone-50 border-stone-200 hover:border-stone-300' : 'bg-[#12131a]/80 border-white/5 hover:border-white/10'} p-2.5 rounded-xl border space-y-1.5 transition-all`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className={`text-xs font-semibold flex items-center justify-between ${isLight ? 'text-stone-900' : 'text-white/90'}`}>
              <span>
                <strong className={`${isLight ? 'text-[#b08c47]' : 'text-[#c5a059]'} font-mono mr-1`}>{it.quantity}x</strong> {it.name}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ml-1 ${isLight ? 'text-stone-700 bg-stone-200/80 border-stone-300 font-semibold' : 'text-white/50 bg-white/5 border-white/5'}`}>
                {it.selectedSize}
              </span>
            </div>
            {it.selectedAddOns && it.selectedAddOns.length > 0 && (
              <p className={`text-[10px] italic pl-1 mt-0.5 ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>
                + {it.selectedAddOns.join(', ')}
              </p>
            )}
            {it.notes && (
              <p className={`text-[10px] px-1.5 py-0.5 rounded border mt-1 italic ${isLight ? 'text-amber-900 bg-amber-100/90 border-amber-300 font-medium' : 'text-amber-300/80 bg-amber-950/30 border-amber-800/30'}`}>
                Note: {it.notes}
              </p>
            )}
          </div>
        </div>

        {/* Item Status Toggle Buttons */}
        <div className={`flex items-center justify-between pt-1 border-t gap-1 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
          <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
            Item:
          </span>
          <div className={`inline-flex rounded-lg p-0.5 border gap-0.5 ${isLight ? 'bg-stone-200/80 border-stone-300' : 'bg-[#07080c] border-white/10'}`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleItemStatusChange(ord.id, idx, 'pending');
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                itemStatus === 'pending'
                  ? isLight
                    ? 'bg-rose-200 text-rose-950 border border-rose-400 font-extrabold shadow-sm'
                    : 'bg-rose-950 text-rose-300 border border-rose-600/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : isLight
                    ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-300'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
              title="Set item status to Pending"
            >
              Pending
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleItemStatusChange(ord.id, idx, 'preparing');
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                itemStatus === 'preparing'
                  ? isLight
                    ? 'bg-amber-200 text-amber-950 border border-amber-400 font-extrabold shadow-sm'
                    : 'bg-amber-950 text-amber-300 border border-amber-600/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : isLight
                    ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-300'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
              title="Set item status to Preparing"
            >
              Preparing
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleItemStatusChange(ord.id, idx, 'ready');
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                itemStatus === 'ready'
                  ? isLight
                    ? 'bg-emerald-200 text-emerald-950 border border-emerald-500 font-extrabold shadow-sm'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-600/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : isLight
                    ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-300'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
              title="Set item status to Ready"
            >
              Ready
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#07080c] text-[#f2f2f2]'} flex flex-col font-sans select-none overflow-x-hidden transition-colors duration-300`}
      style={{ '--color-primary': settings.branding.primaryColor } as React.CSSProperties}
    >
      {/* TOP NAVIGATION BAR */}
      <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#0b0c10] border-white/10 text-white'} border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg transition-colors`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 border border-stone-200">
                {settings.branding.logoUrl ? (
                  <img src={settings.branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-primary)] flex items-center justify-center text-black font-serif font-black">
                    {settings.branding.shopName.charAt(0)}
                  </div>
                )}
            </div>
            <h1 className="font-serif font-black tracking-wider text-[var(--color-primary)] text-base">{settings.branding.shopName}</h1>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isLight ? 'bg-stone-100 border-stone-300' : 'bg-[#12131a] border-white/5'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={`text-[10px] font-mono tracking-widest font-bold uppercase ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>SYSTEM LIVE</span>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              settings?.storeStatus?.isOpen !== false
                ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                : isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/80 text-rose-300 border-rose-600/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${settings?.storeStatus?.isOpen !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{settings?.storeStatus?.isOpen !== false ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InstallAppButton />
          <div className={`hidden sm:flex items-center gap-2 text-xs font-mono ${isLight ? 'text-stone-700 font-semibold' : 'text-white/60'}`}>
            <span>Station: <strong className={`${isLight ? 'text-[#b08c47]' : 'text-[var(--color-primary)]'} uppercase`}>{currentUser?.name || 'KDS-01'}</strong></span>
          </div>
        </div>
      </div>

      {/* STORE CLOSED BANNER */}
      {settings.storeStatus?.isOpen === false && (
        <div className={`border-b text-xs py-2 px-4 sticky top-[57px] z-40 shadow-md flex items-center justify-center gap-2 ${isLight ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-rose-950/90 border-rose-900 text-rose-200'}`}>
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-bold text-center">Store Operations Status: <strong className="uppercase">CLOSED</strong>. KDS Kitchen Station is in standby mode.</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* HEADER SECTION */}
        <div className="space-y-1.5">
          <div className={`inline-block text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full font-bold border ${isLight ? 'bg-stone-200 border-amber-600/40 text-amber-900' : 'bg-[#161821] border-[#c5a059]/30 text-[#c5a059]'}`}>
            PRODUCTION
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <h2 className={`text-2xl sm:text-3xl font-black italic tracking-wide uppercase flex items-center gap-2 ${isLight ? 'text-stone-900' : 'text-white'}`}>
              KITCHEN <span className={`${isLight ? 'text-stone-500 font-normal' : 'text-white/40 font-normal'}`}>DISPLAY</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <div className={`w-6 h-1 rounded-full ${isLight ? 'bg-[#b08c47]' : 'bg-[#c5a059]'}`} />
            <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${isLight ? 'text-stone-600' : 'text-white/50'}`}>COMMAND CENTER QUEUE</span>
          </div>
        </div>

        {/* STATUS FILTER PILLS BAR */}
        <div className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#0b0c10] border-white/10 shadow-md'} border p-3 rounded-2xl flex flex-wrap gap-2 items-center transition-colors`}>
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeFilter === 'all' 
                ? isLight 
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-extrabold shadow-sm' 
                  : 'bg-[#c5a059]/20 border-[#c5a059]/50 text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.2)]' 
                : isLight 
                  ? 'bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200' 
                  : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'
            }`}
          >
            ALL QUEUE ({activeOrdersCount})
          </button>
          <button 
            onClick={() => setActiveFilter('incoming')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeFilter === 'incoming' 
                ? isLight 
                  ? 'bg-amber-100 border-amber-400 text-amber-950 font-extrabold shadow-sm' 
                  : 'bg-[#c5a059]/20 border-[#c5a059]/50 text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.2)]' 
                : isLight 
                  ? 'bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200' 
                  : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-[#c5a059]" /> INCOMING ({newOrders.length})
          </button>
          <button 
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeFilter === 'active' 
                ? isLight 
                  ? 'bg-blue-100 border-blue-400 text-blue-950 font-extrabold shadow-sm' 
                  : 'bg-blue-950/60 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                : isLight 
                  ? 'bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200' 
                  : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" /> ACTIVE ({preparingOrders.length})
          </button>
          <button 
            onClick={() => setActiveFilter('ready')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              activeFilter === 'ready' 
                ? isLight 
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-extrabold shadow-sm' 
                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                : isLight 
                  ? 'bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200' 
                  : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> READY ({readyOrders.length})
          </button>
        </div>

        {/* QUEUE MODE SWITCHER */}
        <div className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#0b0c10] border-white/10 shadow-md'} border p-4 rounded-2xl space-y-3 transition-colors`}>
          <div className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
            QUEUE MODE: <span className={`${isLight ? 'text-[#b08c47]' : 'text-[#c5a059]'}`}>{queueMode === 'tabular' ? 'TABULAR ROW' : 'CARD GRID'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQueueMode('tabular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                queueMode === 'tabular' 
                  ? 'bg-[#c5a059] text-black shadow-md font-extrabold' 
                  : isLight 
                    ? 'bg-stone-100 border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200' 
                    : 'bg-[#12131a] border border-white/5 text-white/70 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" /> ROW TABLE
            </button>
            <button
              onClick={() => setQueueMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                queueMode === 'grid' 
                  ? 'bg-[#c5a059] text-black shadow-md font-extrabold' 
                  : isLight 
                    ? 'bg-stone-100 border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-200' 
                    : 'bg-[#12131a] border border-white/5 text-white/70 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> CARD GRID
            </button>
          </div>
        </div>

        {/* CONTENT AREA / ALL CLEAR OR ORDERS */}
        {dataLoading ? (
          <div className={`${isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'} border rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-center shadow-xl`}>
            <div className="w-10 h-10 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            <p className={`text-xs font-mono tracking-wider ${isLight ? 'text-stone-600' : 'text-white/50'}`}>Loading command center telemetry...</p>
          </div>
        ) : activeOrdersCount === 0 ? (
          <div className={`${isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'} border rounded-3xl p-16 sm:p-24 flex flex-col items-center justify-center space-y-4 text-center shadow-xl transition-colors`}>
            <div className={`w-20 h-20 rounded-full border flex items-center justify-center relative ${isLight ? 'bg-amber-50 border-amber-300' : 'bg-[#12131a] border-[#c5a059]/40'}`}>
              <div className="absolute inset-0 rounded-full border border-[#c5a059]/20 animate-ping opacity-25" />
              <CheckCircle2 className="w-10 h-10 text-[#c5a059]" />
            </div>
            <div className="space-y-1">
              <h3 className={`text-2xl font-black italic tracking-wider uppercase ${isLight ? 'text-stone-900' : 'text-white'}`}>ALL CLEAR</h3>
              <p className={`text-xs font-mono uppercase tracking-widest ${isLight ? 'text-stone-600' : 'text-white/40'}`}>THE ORBIT IS EMPTY</p>
            </div>
          </div>
        ) : queueMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* NEW / INCOMING ORDERS */}
            {(activeFilter === 'all' || activeFilter === 'incoming') && (
              <div className="space-y-3">
                <div className={`${isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'} p-3 rounded-xl border flex justify-between items-center transition-colors`}>
                  <span className={`text-xs font-mono font-bold uppercase ${isLight ? 'text-stone-800' : 'text-white/80'}`}>Incoming ({newOrders.length})</span>
                </div>
                {newOrders.map(ord => (
                  <div key={ord.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#0b0c10] border-white/15 text-white'} border rounded-2xl p-4 space-y-3 shadow-lg transition-colors`}>
                    <div className={`flex justify-between items-start text-xs border-b pb-2 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className={`font-mono font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>#{ord.orderNumber.slice(-4)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            ord.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-950/70 text-blue-300 border border-blue-800/40' 
                              : isLight ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2 h-2" /> : <Smartphone className="w-2 h-2" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#c5a059] mt-0.5 flex items-center gap-1">
                          <User className={`w-3 h-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`} /> {ord.customerName}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-stone-500 font-semibold' : 'text-white/40'}`}>{getElapsedTime(ord.createdAt)}</p>
                      </div>
                      <span className="bg-[#c5a059]/10 text-[#a37a2c] border border-[#c5a059]/30 font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                        {ord.orderType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* ITEMS LIST WITH ITEM STATUS TOGGLE */}
                    <div className="space-y-2">
                      <p className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
                        Order Items & Status
                      </p>
                      {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    </div>

                    {ord.notes && (
                      <p className={`text-[10px] p-1.5 rounded-lg border ${isLight ? 'text-amber-900 bg-amber-100/90 border-amber-300 font-medium' : 'text-amber-300/80 bg-amber-950/30 border-amber-800/30'}`}>
                        Note: {ord.notes}
                      </p>
                    )}

                    {/* Order Level Status Toggle */}
                    <div className={`space-y-1.5 pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <p className={`text-[9px] font-mono uppercase font-bold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Overall Order Status:</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'pending')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'pending'
                              ? isLight ? 'bg-rose-100 text-rose-900 border border-rose-400 font-bold' : 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'preparing'
                              ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold' : 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'ready'
                              ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Ready
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                        className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-mono font-bold py-2 rounded-xl text-xs uppercase tracking-wider flex justify-center items-center gap-1 cursor-pointer transition-all shadow mt-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" /> Start Preparing Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVE / PREPARING ORDERS */}
            {(activeFilter === 'all' || activeFilter === 'active') && (
              <div className="space-y-3">
                <div className={`${isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'} p-3 rounded-xl border flex justify-between items-center transition-colors`}>
                  <span className={`text-xs font-mono font-bold uppercase ${isLight ? 'text-stone-800' : 'text-white/80'}`}>Active ({preparingOrders.length})</span>
                </div>
                {preparingOrders.map(ord => (
                  <div key={ord.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#0b0c10] border-white/15 text-white'} border rounded-2xl p-4 space-y-3 shadow-lg transition-colors`}>
                    <div className={`flex justify-between items-start text-xs border-b pb-2 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className={`font-mono font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>#{ord.orderNumber.slice(-4)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            ord.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-950/70 text-blue-300 border border-blue-800/40' 
                              : isLight ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2 h-2" /> : <Smartphone className="w-2 h-2" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#c5a059] mt-0.5 flex items-center gap-1">
                          <User className={`w-3 h-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`} /> {ord.customerName}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-stone-500 font-semibold' : 'text-white/40'}`}>{getElapsedTime(ord.createdAt)}</p>
                      </div>
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/30 font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                        Preparing
                      </span>
                    </div>

                    {/* ITEMS LIST WITH ITEM STATUS TOGGLE */}
                    <div className="space-y-2">
                      <p className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
                        Order Items & Status
                      </p>
                      {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    </div>

                    {ord.notes && (
                      <p className={`text-[10px] p-1.5 rounded-lg border ${isLight ? 'text-amber-900 bg-amber-100/90 border-amber-300 font-medium' : 'text-amber-300/80 bg-amber-950/30 border-amber-800/30'}`}>
                        Note: {ord.notes}
                      </p>
                    )}

                    {/* Order Level Status Toggle */}
                    <div className={`space-y-1.5 pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <p className={`text-[9px] font-mono uppercase font-bold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Overall Order Status:</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'pending')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'pending'
                              ? isLight ? 'bg-rose-100 text-rose-900 border border-rose-400 font-bold' : 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'preparing'
                              ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold' : 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'ready'
                              ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Ready
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'ready')}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold py-2 rounded-xl text-xs uppercase tracking-wider flex justify-center items-center gap-1 cursor-pointer transition-all shadow mt-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Order Ready
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* READY ORDERS */}
            {(activeFilter === 'all' || activeFilter === 'ready') && (
              <div className="space-y-3">
                <div className={`${isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'} p-3 rounded-xl border flex justify-between items-center transition-colors`}>
                  <span className={`text-xs font-mono font-bold uppercase ${isLight ? 'text-stone-800' : 'text-white/80'}`}>Ready ({readyOrders.length})</span>
                </div>
                {readyOrders.map(ord => (
                  <div key={ord.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#0b0c10] border-white/15 text-white'} border rounded-2xl p-4 space-y-3 shadow-lg transition-colors`}>
                    <div className={`flex justify-between items-start text-xs border-b pb-2 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className={`font-mono font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>#{ord.orderNumber.slice(-4)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            ord.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-950/70 text-blue-300 border border-blue-800/40' 
                              : isLight ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2 h-2" /> : <Smartphone className="w-2 h-2" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#c5a059] mt-0.5 flex items-center gap-1">
                          <User className={`w-3 h-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`} /> {ord.customerName}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-stone-500 font-semibold' : 'text-white/40'}`}>{getElapsedTime(ord.createdAt)}</p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                        Ready
                      </span>
                    </div>

                    {/* ITEMS LIST WITH ITEM STATUS TOGGLE */}
                    <div className="space-y-2">
                      <p className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
                        Order Items & Status
                      </p>
                      {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    </div>

                    {/* Order Level Status Toggle */}
                    <div className={`space-y-1.5 pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <p className={`text-[9px] font-mono uppercase font-bold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Overall Order Status:</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'pending')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'pending'
                              ? isLight ? 'bg-rose-100 text-rose-900 border border-rose-400 font-bold' : 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'preparing'
                              ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold' : 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'ready'
                              ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Ready
                        </button>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'completed')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold py-2 rounded-xl text-xs uppercase tracking-wider flex justify-center items-center gap-1 cursor-pointer transition-all shadow mt-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Complete Handover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TABULAR ROW VIEW (RESPONSIVE FOR MOBILE & DESKTOP) */
          <div className="space-y-3">
            {/* Mobile / Card Stack View (< md) */}
            <div className="block md:hidden space-y-3">
              {orders.filter(o => {
                if (activeFilter === 'incoming') return o.orderStatus === 'pending';
                if (activeFilter === 'active') return o.orderStatus === 'preparing';
                if (activeFilter === 'ready') return o.orderStatus === 'ready';
                return ['pending', 'preparing', 'ready'].includes(o.orderStatus);
              }).map(ord => (
                <div key={ord.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-md' : 'bg-[#0b0c10] border-white/15 text-white shadow-lg'} border rounded-2xl p-4 space-y-3 font-mono transition-colors`}>
                  <div className={`flex justify-between items-start border-b pb-2.5 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>#{ord.orderNumber.slice(-4)}</span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          ord.orderSource === 'pos' 
                            ? isLight ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-950/70 text-blue-300 border border-blue-800/40' 
                            : isLight ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                        }`}>
                          {ord.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                          {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#c5a059] flex items-center gap-1">
                        <User className={`w-3 h-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`} /> {ord.customerName}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold inline-block ${
                        ord.orderStatus === 'pending'
                          ? isLight ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                          : ord.orderStatus === 'preparing'
                            ? isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950/50 text-amber-300 border border-amber-800/40'
                            : isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {ord.orderStatus}
                      </span>
                      <p className={`text-[10px] ${isLight ? 'text-stone-500 font-semibold' : 'text-white/40'}`}>{getElapsedTime(ord.createdAt)}</p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl border ${isLight ? 'bg-stone-100 border-stone-200 text-stone-800' : 'bg-[#12131a] border-white/5 text-white/70'}`}>
                    <span className="uppercase font-bold text-[#b08c47]">{ord.orderType.replace('_', ' ')}</span>
                  </div>

                  <div className={`space-y-2 text-xs p-3 rounded-xl border ${isLight ? 'bg-stone-50 border-stone-200 text-stone-900' : 'bg-[#12131a]/50 border-white/5 text-white/90'}`}>
                    <p className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
                      Order Items & Status:
                    </p>
                    {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    {ord.notes && <p className={`text-[10px] p-1.5 rounded-lg border mt-2 ${isLight ? 'text-amber-900 bg-amber-100/90 border-amber-300 font-medium' : 'text-amber-300/90 bg-amber-950/30 border-amber-800/30'}`}>Note: {ord.notes}</p>}
                  </div>

                  {/* Order Level Status Selector */}
                  <div className="pt-1 space-y-1.5">
                    <p className={`text-[9px] font-mono uppercase font-bold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Overall Order Status:</p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'pending')}
                        className={`py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all ${
                          ord.orderStatus === 'pending'
                            ? isLight ? 'bg-rose-100 text-rose-900 border border-rose-400 font-bold' : 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow'
                            : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                        className={`py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all ${
                          ord.orderStatus === 'preparing'
                            ? isLight ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold' : 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow'
                            : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5'
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'ready')}
                        className={`py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all ${
                          ord.orderStatus === 'ready'
                            ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow'
                            : isLight ? 'bg-stone-100 text-stone-600 border border-stone-200' : 'bg-[#12131a] text-white/50 border border-white/5'
                        }`}
                      >
                        Ready
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className={`${isLight ? 'bg-white border-stone-200 shadow-xl' : 'bg-[#0b0c10] border-white/10 shadow-xl'} border rounded-2xl overflow-hidden transition-colors`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`${isLight ? 'bg-stone-100 border-stone-200 text-stone-700 font-bold' : 'bg-[#12131a] border-white/10 text-white/50'} border-b uppercase text-[10px]`}>
                    <tr>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Origin</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 min-w-[320px]">Items & Status</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-stone-200' : 'divide-white/5'}`}>
                    {orders.filter(o => {
                      if (activeFilter === 'incoming') return o.orderStatus === 'pending';
                      if (activeFilter === 'active') return o.orderStatus === 'preparing';
                      if (activeFilter === 'ready') return o.orderStatus === 'ready';
                      return ['pending', 'preparing', 'ready'].includes(o.orderStatus);
                    }).map(ord => (
                      <tr key={ord.id} className={`${isLight ? 'hover:bg-stone-50 text-stone-900' : 'hover:bg-white/[0.02] text-white'} transition-colors`}>
                        <td className={`p-3 font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>#{ord.orderNumber.slice(-4)}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ord.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-blue-950/70 text-blue-300 border border-blue-800/40' 
                              : isLight ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-[#c5a059] flex items-center gap-1">
                            <User className={`w-3 h-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`} /> {ord.customerName}
                          </p>
                        </td>
                        <td className={`p-3 uppercase ${isLight ? 'text-stone-700 font-semibold' : 'text-white/80'}`}>{ord.orderType.replace('_', ' ')}</td>
                        <td className={`p-3 space-y-2 ${isLight ? 'text-stone-900' : 'text-white/80'}`}>
                          <div className="space-y-1.5">
                            {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                          </div>
                          {ord.notes && <p className={`text-[10px] p-1.5 rounded border ${isLight ? 'text-amber-900 bg-amber-100/90 border-amber-300 font-medium' : 'text-amber-300/80 bg-amber-950/20 border-amber-800/20'}`}>Note: {ord.notes}</p>}
                        </td>
                        <td className={`p-3 ${isLight ? 'text-stone-600 font-semibold' : 'text-white/40'}`}>{getElapsedTime(ord.createdAt)}</td>
                        <td className="p-3">
                          <div className="inline-flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold text-center ${
                              ord.orderStatus === 'pending'
                                ? isLight ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                                : ord.orderStatus === 'preparing'
                                  ? isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950/50 text-amber-300 border border-amber-800/40'
                                  : isLight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                            }`}>
                              {ord.orderStatus}
                            </span>
                            <div className="flex gap-0.5 mt-1">
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'pending')}
                                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer ${
                                  ord.orderStatus === 'pending'
                                    ? isLight ? 'bg-rose-200 text-rose-950 font-bold' : 'bg-rose-900 text-rose-200'
                                    : isLight ? 'bg-stone-200 text-stone-600 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'
                                }`}
                              >
                                Pend
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer ${
                                  ord.orderStatus === 'preparing'
                                    ? isLight ? 'bg-amber-200 text-amber-950 font-bold' : 'bg-amber-900 text-amber-200'
                                    : isLight ? 'bg-stone-200 text-stone-600 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'
                                }`}
                              >
                                Prep
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'ready')}
                                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer ${
                                  ord.orderStatus === 'ready'
                                    ? isLight ? 'bg-emerald-200 text-emerald-950 font-bold' : 'bg-emerald-900 text-emerald-200'
                                    : isLight ? 'bg-stone-200 text-stone-600 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'
                                }`}
                              >
                                Ready
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {ord.orderStatus === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                              className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold px-3 py-1.5 rounded text-[10px] uppercase cursor-pointer shadow"
                            >
                              Start
                            </button>
                          )}
                          {ord.orderStatus === 'preparing' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'ready')}
                              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 rounded text-[10px] uppercase cursor-pointer shadow"
                            >
                              Ready
                            </button>
                          )}
                          {ord.orderStatus === 'ready' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-[10px] uppercase cursor-pointer shadow"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div className={`${isLight ? 'bg-white border-stone-200 text-stone-700 shadow-lg' : 'bg-[#0b0c10] border-white/10 text-white/50 shadow-lg'} border-t px-4 py-2.5 flex justify-between items-center text-[11px] font-mono transition-colors`}>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Real-time command center telemetry active</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className={`text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 cursor-pointer transition-all ${
              isLight 
                ? 'bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800' 
                : 'bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200'
            }`}
          >
            <LogOut className="w-3 h-3" />
            <span>Exit Station</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KitchenExperience;
