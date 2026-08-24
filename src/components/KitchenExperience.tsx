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
      <div key={idx} className="bg-[#12131a]/80 p-2.5 rounded-xl border border-white/5 space-y-1.5 transition-all hover:border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-xs font-semibold text-white/90 flex items-center justify-between">
              <span>
                <strong className="text-[#c5a059] font-mono mr-1">{it.quantity}x</strong> {it.name}
              </span>
              <span className="text-[10px] font-mono text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 ml-1">
                {it.selectedSize}
              </span>
            </div>
            {it.selectedAddOns && it.selectedAddOns.length > 0 && (
              <p className="text-[10px] text-white/40 italic pl-1 mt-0.5">
                + {it.selectedAddOns.join(', ')}
              </p>
            )}
            {it.notes && (
              <p className="text-[10px] text-amber-300/80 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/30 mt-1 italic">
                Note: {it.notes}
              </p>
            )}
          </div>
        </div>

        {/* Item Status Toggle Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 gap-1">
          <span className="text-[9px] font-mono text-white/40 uppercase font-bold tracking-wider">
            Item:
          </span>
          <div className="inline-flex rounded-lg bg-[#07080c] p-0.5 border border-white/10 gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleItemStatusChange(ord.id, idx, 'pending');
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                itemStatus === 'pending'
                  ? 'bg-rose-950 text-rose-300 border border-rose-600/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
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
                  ? 'bg-amber-950 text-amber-300 border border-amber-600/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
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
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
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
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                {settings.branding.logoUrl ? (
                  <img src={settings.branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-primary)] flex items-center justify-center text-black font-serif font-black">
                    {settings.branding.shopName.charAt(0)}
                  </div>
                )}
            </div>
            <h1 className="font-serif font-black tracking-wider text-[var(--color-primary)] text-base">{settings.branding.shopName}</h1>
            <div className="flex items-center gap-1.5 bg-[#12131a] px-2 py-0.5 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">SYSTEM LIVE</span>
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              settings?.storeStatus?.isOpen !== false
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                : 'bg-rose-950/80 text-rose-300 border-rose-600/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${settings?.storeStatus?.isOpen !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{settings?.storeStatus?.isOpen !== false ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InstallAppButton />
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/60 font-mono">
            <span>Station: <strong className="text-[var(--color-primary)] uppercase">{currentUser?.name || 'KDS-01'}</strong></span>
          </div>
        </div>
      </div>

      {/* STORE CLOSED BANNER */}
      {settings.storeStatus?.isOpen === false && (
        <div className="bg-rose-950/90 border-b border-rose-900 text-rose-200 text-xs py-2 px-4 sticky top-[57px] z-40 shadow-md flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="font-bold text-center">Store Operations Status: <strong className="text-white uppercase">CLOSED</strong>. KDS Kitchen Station is in standby mode.</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* HEADER SECTION */}
        <div className="space-y-1.5">
          <div className="inline-block bg-[#161821] border border-[#c5a059]/30 text-[#c5a059] text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full font-bold">
            PRODUCTION
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white uppercase flex items-center gap-2">
              KITCHEN <span className="text-white/40 font-normal">DISPLAY</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-6 h-1 bg-[#c5a059] rounded-full" />
            <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase font-bold">COMMAND CENTER QUEUE</span>
          </div>
        </div>

        {/* STATUS FILTER PILLS BAR */}
        <div className="bg-[#0b0c10] border border-white/10 p-3 rounded-2xl flex flex-wrap gap-2 items-center shadow-md">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${activeFilter === 'all' ? 'bg-[#c5a059]/20 border-[#c5a059]/50 text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.2)]' : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'}`}
          >
            ALL QUEUE ({activeOrdersCount})
          </button>
          <button 
            onClick={() => setActiveFilter('incoming')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${activeFilter === 'incoming' ? 'bg-[#c5a059]/20 border-[#c5a059]/50 text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.2)]' : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'}`}
          >
            <div className="w-2 h-2 rounded-full bg-[#c5a059]" /> INCOMING ({newOrders.length})
          </button>
          <button 
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${activeFilter === 'active' ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'}`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" /> ACTIVE ({preparingOrders.length})
          </button>
          <button 
            onClick={() => setActiveFilter('ready')}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${activeFilter === 'ready' ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-[#12131a] border-white/5 text-white/50 hover:text-white/80'}`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> READY ({readyOrders.length})
          </button>
        </div>

        {/* QUEUE MODE SWITCHER */}
        <div className="bg-[#0b0c10] border border-white/10 p-4 rounded-2xl space-y-3 shadow-md">
          <div className="text-[10px] font-mono font-bold tracking-widest text-white/40 uppercase">
            QUEUE MODE: <span className="text-[#c5a059]">{queueMode === 'tabular' ? 'TABULAR ROW' : 'CARD GRID'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQueueMode('tabular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${queueMode === 'tabular' ? 'bg-[#c5a059] text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]' : 'bg-[#12131a] border border-white/5 text-white/70 hover:text-white'}`}
            >
              <Table className="w-4 h-4" /> ROW TABLE
            </button>
            <button
              onClick={() => setQueueMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${queueMode === 'grid' ? 'bg-[#c5a059] text-black shadow-[0_0_12px_rgba(197,160,89,0.3)]' : 'bg-[#12131a] border border-white/5 text-white/70 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> CARD GRID
            </button>
          </div>
        </div>

        {/* CONTENT AREA / ALL CLEAR OR ORDERS */}
        {dataLoading ? (
          <div className="bg-[#0b0c10] border border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-center shadow-xl">
            <div className="w-10 h-10 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-white/50 tracking-wider">Loading command center telemetry...</p>
          </div>
        ) : activeOrdersCount === 0 ? (
          <div className="bg-[#0b0c10] border border-white/10 rounded-3xl p-16 sm:p-24 flex flex-col items-center justify-center space-y-4 text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-[#12131a] border border-[#c5a059]/40 flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.15)] relative">
              <div className="absolute inset-0 rounded-full border border-[#c5a059]/20 animate-ping opacity-25" />
              <CheckCircle2 className="w-10 h-10 text-[#c5a059]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black italic tracking-wider text-white uppercase">ALL CLEAR</h3>
              <p className="text-xs font-mono text-white/40 uppercase tracking-widest">THE ORBIT IS EMPTY</p>
            </div>
          </div>
        ) : queueMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* NEW / INCOMING ORDERS */}
            {(activeFilter === 'all' || activeFilter === 'incoming') && (
              <div className="space-y-3">
                <div className="bg-[#0b0c10] p-3 rounded-xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white/80 uppercase">Incoming ({newOrders.length})</span>
                </div>
                {newOrders.map(ord => (
                  <div key={ord.id} className="bg-[#0b0c10] border border-white/15 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex justify-between items-start text-xs border-b border-white/5 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-bold text-white">#{ord.orderNumber.slice(-4)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2 h-2" /> : <Smartphone className="w-2 h-2" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#c5a059] mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> {ord.customerName}
                        </p>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{getElapsedTime(ord.createdAt)}</p>
                      </div>
                      <span className="bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                        {ord.orderType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* ITEMS LIST WITH ITEM STATUS TOGGLE */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-wider">
                        Order Items & Status
                      </p>
                      {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    </div>

                    {ord.notes && (
                      <p className="text-[10px] text-amber-300/80 bg-amber-950/30 p-1.5 rounded-lg border border-amber-800/30">
                        Note: {ord.notes}
                      </p>
                    )}

                    {/* Order Level Status Toggle */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <p className="text-[9px] font-mono text-white/40 uppercase font-bold">Overall Order Status:</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'pending')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'pending'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'preparing'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
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
                <div className="bg-[#0b0c10] p-3 rounded-xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white/80 uppercase">Active ({preparingOrders.length})</span>
                </div>
                {preparingOrders.map(ord => (
                  <div key={ord.id} className="bg-[#0b0c10] border border-white/15 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex justify-between items-start text-xs border-b border-white/5 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-bold text-white">#{ord.orderNumber.slice(-4)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2 h-2" /> : <Smartphone className="w-2 h-2" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#c5a059] mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> {ord.customerName}
                        </p>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{getElapsedTime(ord.createdAt)}</p>
                      </div>
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                        Preparing
                      </span>
                    </div>

                    {/* ITEMS LIST WITH ITEM STATUS TOGGLE */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-wider">
                        Order Items & Status
                      </p>
                      {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    </div>

                    {ord.notes && (
                      <p className="text-[10px] text-amber-300/80 bg-amber-950/30 p-1.5 rounded-lg border border-amber-800/30">
                        Note: {ord.notes}
                      </p>
                    )}

                    {/* Order Level Status Toggle */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <p className="text-[9px] font-mono text-white/40 uppercase font-bold">Overall Order Status:</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'pending')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'pending'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'preparing'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
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
                <div className="bg-[#0b0c10] p-3 rounded-xl border border-white/10 flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white/80 uppercase">Ready ({readyOrders.length})</span>
                </div>
                {readyOrders.map(ord => (
                  <div key={ord.id} className="bg-[#0b0c10] border border-white/15 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex justify-between items-start text-xs border-b border-white/5 pb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-bold text-white">#{ord.orderNumber.slice(-4)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2 h-2" /> : <Smartphone className="w-2 h-2" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#c5a059] mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" /> {ord.customerName}
                        </p>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{getElapsedTime(ord.createdAt)}</p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded text-[9px] uppercase">
                        Ready
                      </span>
                    </div>

                    {/* ITEMS LIST WITH ITEM STATUS TOGGLE */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-wider">
                        Order Items & Status
                      </p>
                      {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    </div>

                    {/* Order Level Status Toggle */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <p className="text-[9px] font-mono text-white/40 uppercase font-bold">Overall Order Status:</p>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'pending')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'pending'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'preparing'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
                          }`}
                        >
                          Preparing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ready')}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            ord.orderStatus === 'ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                              : 'bg-[#12131a] text-white/50 border border-white/5 hover:text-white'
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
                <div key={ord.id} className="bg-[#0b0c10] border border-white/15 rounded-2xl p-4 space-y-3 shadow-lg font-mono">
                  <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">#{ord.orderNumber.slice(-4)}</span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                        }`}>
                          {ord.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                          {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#c5a059] flex items-center gap-1">
                        <User className="w-3 h-3 text-white/40" /> {ord.customerName}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold inline-block ${ord.orderStatus === 'pending' ? 'bg-rose-950/50 text-rose-300 border border-rose-800/40' : ord.orderStatus === 'preparing' ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'}`}>
                        {ord.orderStatus}
                      </span>
                      <p className="text-[10px] text-white/40">{getElapsedTime(ord.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/70 bg-[#12131a] px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="uppercase font-bold text-[#c5a059]">{ord.orderType.replace('_', ' ')}</span>
                  </div>

                  <div className="space-y-2 text-xs text-white/90 bg-[#12131a]/50 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-wider">
                      Order Items & Status:
                    </p>
                    {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                    {ord.notes && <p className="text-[10px] text-amber-300/90 bg-amber-950/30 p-1.5 rounded-lg border border-amber-800/30 mt-2">Note: {ord.notes}</p>}
                  </div>

                  {/* Order Level Status Selector */}
                  <div className="pt-1 space-y-1.5">
                    <p className="text-[9px] font-mono text-white/40 uppercase font-bold">Overall Order Status:</p>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'pending')}
                        className={`py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all ${
                          ord.orderStatus === 'pending'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow'
                            : 'bg-[#12131a] text-white/50 border border-white/5'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                        className={`py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all ${
                          ord.orderStatus === 'preparing'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/60 shadow'
                            : 'bg-[#12131a] text-white/50 border border-white/5'
                        }`}
                      >
                        Preparing
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'ready')}
                        className={`py-2 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer transition-all ${
                          ord.orderStatus === 'ready'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow'
                            : 'bg-[#12131a] text-white/50 border border-white/5'
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
            <div className="hidden md:block bg-[#0b0c10] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#12131a] border-b border-white/10 text-white/50 uppercase text-[10px]">
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
                  <tbody className="divide-y divide-white/5">
                    {orders.filter(o => {
                      if (activeFilter === 'incoming') return o.orderStatus === 'pending';
                      if (activeFilter === 'active') return o.orderStatus === 'preparing';
                      if (activeFilter === 'ready') return o.orderStatus === 'ready';
                      return ['pending', 'preparing', 'ready'].includes(o.orderStatus);
                    }).map(ord => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-white">#{ord.orderNumber.slice(-4)}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                            {ord.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-[#c5a059] flex items-center gap-1">
                            <User className="w-3 h-3 text-white/40" /> {ord.customerName}
                          </p>
                        </td>
                        <td className="p-3 uppercase text-white/80">{ord.orderType.replace('_', ' ')}</td>
                        <td className="p-3 text-white/80 space-y-2">
                          <div className="space-y-1.5">
                            {ord.items.map((it, idx) => renderItemWithStatus(ord, it, idx))}
                          </div>
                          {ord.notes && <p className="text-[10px] text-amber-300/80 bg-amber-950/20 p-1.5 rounded border border-amber-800/20">Note: {ord.notes}</p>}
                        </td>
                        <td className="p-3 text-white/40">{getElapsedTime(ord.createdAt)}</td>
                        <td className="p-3">
                          <div className="inline-flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold text-center ${ord.orderStatus === 'pending' ? 'bg-rose-950/50 text-rose-300 border border-rose-800/40' : ord.orderStatus === 'preparing' ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'}`}>
                              {ord.orderStatus}
                            </span>
                            <div className="flex gap-0.5 mt-1">
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'pending')}
                                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer ${ord.orderStatus === 'pending' ? 'bg-rose-900 text-rose-200' : 'bg-white/5 text-white/40 hover:text-white'}`}
                              >
                                Pend
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer ${ord.orderStatus === 'preparing' ? 'bg-amber-900 text-amber-200' : 'bg-white/5 text-white/40 hover:text-white'}`}
                              >
                                Prep
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'ready')}
                                className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer ${ord.orderStatus === 'ready' ? 'bg-emerald-900 text-emerald-200' : 'bg-white/5 text-white/40 hover:text-white'}`}
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
                              className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold px-3 py-1.5 rounded text-[10px] uppercase cursor-pointer"
                            >
                              Start
                            </button>
                          )}
                          {ord.orderStatus === 'preparing' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'ready')}
                              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 rounded text-[10px] uppercase cursor-pointer"
                            >
                              Ready
                            </button>
                          )}
                          {ord.orderStatus === 'ready' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-[10px] uppercase cursor-pointer"
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
      <div className="bg-[#0b0c10] border-t border-white/10 px-4 py-2.5 flex justify-between items-center shadow-lg text-[11px] font-mono text-white/50">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Real-time command center telemetry active</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => logout()}
            className="text-[10px] font-bold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 px-3 py-1 rounded flex items-center gap-1 cursor-pointer transition-all"
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
