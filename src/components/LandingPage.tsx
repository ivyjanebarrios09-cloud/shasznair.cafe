import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, ShoppingBag, Search, Plus, Minus, Flame, 
  ChevronDown, ArrowRight, User, LogIn, Sparkles, 
  X, Check, AlertCircle, Eye, EyeOff, Shield,
  Layers, CupSoda, Croissant, Cake, Sandwich, Cookie, Pizza,
  UtensilsCrossed, Clock, ReceiptText, Banknote, CreditCard,
  QrCode, Smartphone, MapPin, Store, CheckCircle2, UserCheck, Tag, Upload
} from 'lucide-react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Product, CartItem, UserRole, OrderType, PaymentMethod, Order, getPaymentMethodDisplayName } from '../types';
import { InstallAppButton } from './InstallAppButton';
import { CategoryIcon } from '../utils/categoryIcons';
import { ImageUpload } from './ImageUpload';
import { getQRCodeUrl } from '../utils/qr';

export const LandingPage: React.FC = () => {
  const { 
    products, 
    categories, 
    orders,
    settings, 
    cart, 
    addToCart, 
    clearCart,
    placeOrder,
    login, 
    register, 
    dbStatus
  } = useCoffeeApp();

  const isLight = settings?.branding?.theme === 'light';
  const isStoreClosed = settings?.storeStatus?.isOpen === false;

  // Navigation & Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBestSellers, setShowBestSellers] = useState<boolean>(true);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Guest Checkout State
  const [isGuestCheckoutOpen, setIsGuestCheckoutOpen] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestOrderType, setGuestOrderType] = useState<OrderType>('dine_in');
  const [guestTableNo, setGuestTableNo] = useState<string>('');
  const [guestPaymentMethod, setGuestPaymentMethod] = useState<PaymentMethod>('cash');
  const [guestNotes, setGuestNotes] = useState<string>('');
  const [guestReceiptUrl, setGuestReceiptUrl] = useState<string>('');
  const [guestLoading, setGuestLoading] = useState<boolean>(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [lastPlacedGuestOrder, setLastPlacedGuestOrder] = useState<Order | null>(null);
  const [isGuestSuccessModalOpen, setIsGuestSuccessModalOpen] = useState<boolean>(false);

  // Customization State
  const [customSize, setCustomSize] = useState<{ name: string; priceAdjustment: number }>({ name: 'Regular', priceAdjustment: 0 });
  const [customSugar, setCustomSugar] = useState<string>('100%');
  const [customTemp, setCustomTemp] = useState<string>('Hot');
  const [customAddons, setCustomAddons] = useState<{ name: string; price: number }[]>([]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Auth Form State
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Cart Metrics
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const sizePrice = typeof item.selectedSize === 'object' ? (item.selectedSize?.priceAdjustment || 0) : 0;
    const addOnsPrice = item.selectedAddOns?.reduce((acc, a) => acc + (typeof a === 'object' ? a.price : 0), 0) || 0;
    const itemUnitPrice = (item.product?.price || 0) + sizePrice + addOnsPrice;
    return sum + itemUnitPrice * item.quantity;
  }, 0);

  // Active Categories
  const activeCategories = useMemo(() => {
    const list = categories.filter(c => c.isActive !== false);
    if (list.length === 0) {
      return [
        { id: 'coffee', name: 'Coffee', icon: 'coffee', displayOrder: 1, isActive: true },
        { id: 'non-coffee', name: 'Non-Coffee', icon: 'cup-soda', displayOrder: 2, isActive: true },
        { id: 'frappe', name: 'Frappe', icon: 'sparkles', displayOrder: 3, isActive: true },
        { id: 'pastries', name: 'Pastries', icon: 'croissant', displayOrder: 4, isActive: true }
      ];
    }
    return list;
  }, [categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.isAvailable === false) return false;
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [products, searchQuery]);

  // Best Sellers (Computed from real orders / sales data)
  const bestSellerItems = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(ord => {
      if (ord.orderStatus === 'cancelled') return;
      ord.items?.forEach(item => {
        const id = item.productId || products.find(p => p.name.toLowerCase() === item.name?.toLowerCase())?.id;
        if (id) {
          counts[id] = (counts[id] || 0) + (item.quantity || 1);
        }
      });
    });

    const available = products.filter(p => p.available !== false && p.isAvailable !== false);
    const withSales = available.map(p => ({
      product: p,
      soldCount: counts[p.id] || 0
    }));

    // Only show items that have actual verified orders, sorted by highest sold count
    const orderedOnly = withSales.filter(item => item.soldCount > 0);
    return orderedOnly.sort((a, b) => b.soldCount - a.soldCount).slice(0, 6);
  }, [orders, products]);

  // Open Customize Sheet
  const handleOpenCustomize = (product: Product) => {
    setSelectedProduct(product);
    setCustomSize(product.sizes?.[0] || { name: 'Regular', priceAdjustment: 0 });
    setCustomSugar('100%');
    setCustomTemp(product.category?.toLowerCase().includes('iced') ? 'Iced' : 'Hot');
    setCustomAddons([]);
    setCustomNotes('');
    setQuantity(1);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const combinedNotes = [
      customTemp !== 'Hot' ? `Temp: ${customTemp}` : '',
      customSugar !== '100%' ? `Sugar: ${customSugar}` : '',
      customNotes.trim()
    ].filter(Boolean).join(' | ');

    const item: CartItem = {
      product: selectedProduct,
      quantity,
      selectedSize: customSize,
      selectedAddOns: customAddons,
      notes: combinedNotes
    };

    addToCart(item);
    setSelectedProduct(null);
  };

  // Guest Checkout Submission
  const handleGuestCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError(null);
    if (cart.length === 0) {
      setGuestError("Your order tray is empty.");
      return;
    }
    if (isStoreClosed) {
      setGuestError("The store is currently closed for incoming orders.");
      return;
    }
    if ((guestOrderType === 'table' || guestOrderType === 'dine_in') && guestOrderType === 'table' && !guestTableNo.trim()) {
      setGuestError("Please specify your table number.");
      return;
    }

    setGuestLoading(true);
    try {
      const effectiveName = guestName.trim() || 'Online Guest';
      const effectivePhone = guestPhone.trim() || undefined;
      const effectiveTable = (guestOrderType === 'table' || guestOrderType === 'dine_in') ? (guestTableNo.trim() || 'Dine-In') : '';

      const order = await placeOrder(
        guestOrderType,
        effectiveTable,
        guestPaymentMethod,
        guestNotes.trim(),
        effectivePhone,
        undefined, // customCart
        undefined, // customVoucher
        effectiveName,
        'web_app',
        undefined, // cashReceived
        undefined, // change
        guestReceiptUrl || undefined
      );

      setLastPlacedGuestOrder(order);
      setIsGuestCheckoutOpen(false);
      setIsCartOpen(false);
      setIsGuestSuccessModalOpen(true);
      clearCart();
      setGuestReceiptUrl('');
      setGuestNotes('');
      setGuestTableNo('');
    } catch (err: any) {
      setGuestError(err.message || 'Unable to submit guest order. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  // Auth Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
 
    try {
      if (authMode === 'login') {
        await login(authEmail.trim(), authPassword);
      } else {
        await register(
          authEmail.trim(), 
          authPassword, 
          authName.trim() || 'Valued Guest', 
          authPhone.trim() || '+639123456789', 
          'customer'
        );
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const primaryColor = settings?.branding?.primaryColor || '#c5a059';
  const secondaryColor = settings?.branding?.secondaryColor || '#1c1917';
  const accentColor = settings?.branding?.accentColor || '#10b981';

  const calculateCustomTotal = () => {
    if (!selectedProduct) return 0;
    let unitPrice = selectedProduct.price + (customSize.priceAdjustment || 0);
    unitPrice += customAddons.reduce((acc, a) => acc + a.price, 0);
    return unitPrice * quantity;
  };

  return (
    <div 
      className={`h-screen w-full overflow-hidden ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} font-sans flex transition-colors select-none`}
      style={{ 
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
        '--color-accent': accentColor,
      } as React.CSSProperties}
    >
      {/* 1. SIDEBAR NAVIGATION - MATCHING SCREENSHOT EXACTLY */}
      <aside className={`w-16 sm:w-20 md:w-24 h-screen flex-shrink-0 flex flex-col items-center py-6 border-r ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-2xl'} z-30`}>
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto scrollbar-none py-3 items-center w-full">
          {/* "ALL" CATEGORY */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setSelectedCategory('all')}
            className="relative group flex flex-col items-center gap-1.5 cursor-pointer w-full"
          >
            {selectedCategory === 'all' && (
              <motion.div 
                layoutId="landingSidebarActive"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-9 rounded-r-full"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 12px ${primaryColor}cc` }}
              />
            )}
            <div 
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'font-black' 
                  : isLight ? 'bg-stone-100 text-stone-500 hover:bg-stone-200' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: primaryColor, color: '#000', boxShadow: `0 0 20px ${primaryColor}66` } : undefined}
            >
              <Coffee className="w-5 h-5" />
            </div>
            <span 
              className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] [writing-mode:vertical-lr] transition-colors mt-0.5 ${
                selectedCategory === 'all' ? '' : isLight ? 'text-stone-400' : 'text-white/30'
              }`}
              style={selectedCategory === 'all' ? { color: primaryColor } : undefined}
            >
              ALL
            </span>
          </motion.button>

          {/* ACTIVE CATEGORIES LIST */}
          {activeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const shortLabel = cat.name.length > 9 ? cat.name.slice(0, 8) + '..' : cat.name;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedCategory(cat.id)}
                className="relative group flex flex-col items-center gap-1.5 cursor-pointer w-full"
              >
                {isSelected && (
                  <motion.div 
                    layoutId="landingSidebarActive"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-9 rounded-r-full"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 0 12px ${primaryColor}cc` }}
                  />
                )}

                <div 
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? 'font-black' 
                      : isLight ? 'bg-stone-100 text-stone-500 hover:bg-stone-200' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor, color: '#000', boxShadow: `0 0 20px ${primaryColor}66` } : undefined}
                >
                  <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-5 h-5" />
                </div>
                
                <span 
                  className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] [writing-mode:vertical-lr] transition-colors mt-0.5 ${
                    isSelected ? '' : isLight ? 'text-stone-400' : 'text-white/30'
                  }`}
                  style={isSelected ? { color: primaryColor } : undefined}
                >
                  {shortLabel}
                </span>
              </motion.button>
            );
          })}
        </div>
      </aside>

      {/* 2. MAIN CONTENT CONTAINER */}
      <div className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden relative ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'}`}>
        {/* TOP BRAND HEADER (NO BURGER MENU) */}
        <header className={`${isLight ? 'bg-white/90 border-stone-200 text-stone-900' : 'bg-[#121212]/95 border-white/10 text-white'} backdrop-blur-xl shrink-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between border-b transition-colors`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Branding Logo */}
            <div 
              style={{ borderColor: `${primaryColor}50` }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-black/40 border shadow-[0_0_15px_rgba(197,160,89,0.2)] flex items-center justify-center shrink-0"
            >
              {settings?.branding?.logoUrl ? (
                <img 
                  src={settings.branding.logoUrl} 
                  alt={settings.branding.shopName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  style={{ backgroundColor: primaryColor }}
                  className="w-full h-full text-black font-serif font-black text-sm sm:text-lg flex items-center justify-center"
                >
                  {settings?.branding?.shopName?.charAt(0) || 'C'}
                </div>
              )}
            </div>
            
            {/* Shop Name & Status */}
            <div className="flex flex-col min-w-0">
              <h1 className={`text-xs sm:text-base font-black font-serif tracking-widest ${isLight ? 'text-stone-900' : 'text-white'} uppercase truncate`}>
                {settings?.branding?.shopName || 'CAIDOZ'}
              </h1>
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" 
                  style={{ 
                    backgroundColor: settings?.storeStatus?.isOpen !== false ? accentColor : '#ef4444',
                    boxShadow: `0 0 6px ${settings?.storeStatus?.isOpen !== false ? accentColor : '#ef4444'}`
                  }}
                />
                <span className={`text-[8.5px] sm:text-[9px] font-extrabold ${isLight ? 'text-stone-500' : 'text-white/50'} tracking-wider uppercase truncate`}>
                  • SYSTEM {settings?.storeStatus?.isOpen !== false ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <InstallAppButton />

            {/* Member Sign In Button */}
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-all shrink-0"
            >
              <User size={13} style={{ color: primaryColor }} className="shrink-0" />
              <span className="hidden xs:inline whitespace-nowrap">Sign In</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}15`, color: primaryColor }}
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center hover:opacity-80 transition-all cursor-pointer shadow-sm shrink-0"
              title="Order Tray"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {cart.length > 0 && (
                <span 
                  style={{ backgroundColor: primaryColor, color: '#000' }}
                  className="absolute -top-1 -right-1 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* SCROLLABLE STORE VIEW */}
        <main className="flex-1 overflow-y-auto scrollbar-none px-3.5 sm:px-6 py-4 space-y-6 pb-28">
          {isStoreClosed ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4 py-8 space-y-6"
            >
              <div 
                className="w-20 h-20 rounded-3xl flex items-center justify-center border shadow-xl"
                style={{ 
                  backgroundColor: `${primaryColor}15`, 
                  borderColor: `${primaryColor}40`,
                  color: primaryColor 
                }}
              >
                <Store className="w-10 h-10 stroke-[1.5]" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Store is Currently Closed
                </div>
                <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  We're Currently Closed
                </h2>
                <p className={`text-xs sm:text-sm leading-relaxed max-w-md ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                  Our coffee bar is currently closed and not accepting new orders. The menu catalog is temporarily unavailable while our team prepares for the next opening hours.
                </p>
              </div>

              {/* Business Hours & Contact Details */}
              <div className={`w-full rounded-2xl p-4 border text-left space-y-2.5 ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10'}`}>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className={`font-semibold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Operating Hours</span>
                  <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {settings?.businessInfo?.businessHours || '7:00 AM - 10:00 PM'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className={`font-semibold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Contact Number</span>
                  <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {settings?.businessInfo?.contactNumber || '+63 917 123 4567'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Location</span>
                  <span className={`font-bold truncate max-w-[220px] ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {settings?.businessInfo?.address || 'SHASZNAIR CAFE, Manila'}
                  </span>
                </div>
              </div>

              {/* Action Button to Sign in */}
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                style={{ backgroundColor: primaryColor, color: '#000' }}
                className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all hover:brightness-110 flex items-center gap-2"
              >
                <LogIn size={15} />
                <span>Sign In to VIP Account</span>
              </button>
            </motion.div>
          ) : (
            <>
              {/* CATEGORY TITLE WITH ORANGE ACCENT */}
              <div className="flex items-center gap-2 pt-1">
            <div 
              style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}cc` }}
              className="w-1.5 h-5 rounded-full" 
            />
            <h2 className={`text-base sm:text-lg font-black uppercase tracking-wider ${isLight ? 'text-stone-900' : 'text-white'}`}>
              {selectedCategory === 'all' ? 'FULL CATALOG' : (categories.find(c => c.id === selectedCategory)?.name || selectedCategory)}
            </h2>
          </div>

          {/* SEARCH BAR & BEST SELLER DROPDOWN ROW */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 ${isLight ? 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400' : 'bg-[#121212] border-white/10 text-white placeholder:text-white/30'} border rounded-2xl text-xs sm:text-sm outline-none transition-all`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => setShowBestSellers(!showBestSellers)}
              className={`shrink-0 px-3.5 py-3 rounded-2xl ${isLight ? 'bg-white border-stone-200 text-stone-800 hover:text-stone-950' : 'bg-[#121212] border-white/10 text-white/80 hover:text-white'} border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all`}
            >
              <Flame className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span className="hidden xs:inline">BEST SELLER</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBestSellers ? 'rotate-180' : ''}`} style={showBestSellers ? { color: primaryColor } : undefined} />
            </button>
          </div>

          {/* OVERALL BEST SELLERS SECTION */}
          {showBestSellers && bestSellerItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={isLight ? { borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}0d` } : { borderColor: `${primaryColor}40`, backgroundColor: '#121212' }}
              className="border backdrop-blur-md rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className={`text-xs sm:text-sm font-black tracking-wider uppercase ${isLight ? 'text-stone-900' : 'text-white'}`}>OVERALL BEST SELLERS</h3>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {bestSellerItems.map(({ product: prod, soldCount }) => (
                  <motion.div
                    key={prod.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenCustomize(prod)}
                    className={`min-w-[240px] sm:min-w-[260px] ${isLight ? 'bg-white border-stone-200' : 'bg-[#18181b] border-white/5 hover:bg-[#202024]'} border rounded-2xl p-2.5 sm:p-3 flex gap-3 items-center cursor-pointer transition-all shadow-md group`}
                  >
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/5">
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div 
                        style={{ backgroundColor: primaryColor, color: '#000' }}
                        className="absolute top-1.5 left-1.5 text-[7.5px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md"
                      >
                        <Flame size={7} /> {soldCount} sold
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <span style={{ color: primaryColor }} className="text-[8px] font-black uppercase tracking-widest block">BEST SELLER</span>
                        <h4 className={`text-xs sm:text-sm font-bold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>{prod.name}</h4>
                        <p className={`text-[9px] uppercase truncate ${isLight ? 'text-stone-400' : 'text-white/40'}`}>{prod.category}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span style={{ color: primaryColor }} className="text-sm sm:text-base font-black">₱{prod.price}</span>
                        <span 
                          style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}
                          className="text-[9px] font-extrabold px-2 py-1 rounded-lg border transition-all"
                        >
                          + ADD
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PRODUCT GRID - 2 COLUMNS ON MOBILE */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pb-12">
            {activeCategories.map(cat => {
              const catProducts = filteredProducts.filter(p => {
                const pCat = (p.category || '').toLowerCase().trim();
                return pCat === cat.id.toLowerCase() || pCat === cat.name.toLowerCase();
              });
              
              if (catProducts.length === 0 || (selectedCategory !== 'all' && selectedCategory !== cat.id)) return null;

              return catProducts.map(prod => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenCustomize(prod)}
                  className={`${isLight ? 'bg-white border-stone-200 hover:bg-stone-50' : 'bg-[#121212] border-white/5 hover:bg-[#18181b]'} border rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex flex-col justify-between group cursor-pointer transition-all shadow-xl`}
                >
                  <div>
                    {/* Product Image Box */}
                    <div className="relative aspect-[4/3] sm:aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 border border-white/5 mb-2.5">
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      {/* BEST SELLER BADGE */}
                      {bestSellerItems.some(item => item.product.id === prod.id) && (
                        <div 
                          style={{ backgroundColor: primaryColor, color: '#000' }}
                          className="absolute bottom-2 left-2 flex items-center gap-1 backdrop-blur-xs text-[7.5px] sm:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md"
                        >
                          <Flame size={8} fill="currentColor" /> BEST SELLER
                        </div>
                      )}
                    </div>

                    {/* Product Information */}
                    <div className="space-y-1 px-1">
                      <h4 className={`text-xs sm:text-sm font-bold leading-tight line-clamp-1 ${isLight ? 'text-stone-900' : 'text-white'}`}>
                        {prod.name}
                      </h4>
                      <p className={`text-[9.5px] sm:text-[11px] line-clamp-2 leading-snug ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                        {prod.description || `${prod.name} crafted with our artisan signature recipe`}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className={`pt-3 px-1 flex items-center justify-between border-t mt-2 ${isLight ? 'border-stone-100' : 'border-white/5'}`}>
                    <div className="flex flex-col">
                      <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none ${isLight ? 'text-stone-400' : 'text-white/30'}`}>PRICE</span>
                      <span style={{ color: primaryColor }} className="text-sm sm:text-base font-black mt-0.5">₱{prod.price}</span>
                    </div>
                    <button 
                      style={{ color: isLight ? '#444' : '#fff' }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-500/10 border border-stone-500/20 flex items-center justify-center group-hover:opacity-100 transition-all shadow-md"
                    >
                      <Plus size={14} className="stroke-[2.5]" />
                    </button>
                  </div>
                </motion.div>
              ));
            })}
          </div>
            </>
          )}
        </main>

        {/* 3. FLOATING ACTION BUTTON (FAB) */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsCartOpen(true)}
          title="Open Bag"
          style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 4px 22px ${primaryColor}90`, borderColor: `${primaryColor}80` }}
          className="fixed bottom-6 right-4 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer border"
        >
          <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          {cartCount > 0 && (
            <span 
              style={{ backgroundColor: '#000', color: primaryColor, borderColor: primaryColor }}
              className="absolute -top-1 -right-1 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-md"
            >
              {cartCount}
            </span>
          )}
        </motion.button>

        {/* FLOATING CART NOTIFICATION PILL */}
        <AnimatePresence>
          {cart.length > 0 && !isCartOpen && (
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="fixed bottom-6 left-4 right-16 z-40 max-w-xs mx-auto pointer-events-none"
            >
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCartOpen(true)}
                style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 6px 20px ${primaryColor}70`, borderColor: `${primaryColor}80` }}
                className="w-full pointer-events-auto font-black py-2 px-3.5 rounded-2xl flex items-center justify-between cursor-pointer border"
              >
                <div className="flex items-center gap-2">
                  <div style={{ backgroundColor: '#000', color: primaryColor }} className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </div>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold">View Order Tray</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-black">
                  <span>₱{cartTotal}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. PRODUCT CUSTOMIZATION SHEET MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`relative w-full max-w-lg ${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#121212] border-white/10 text-white'} border rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto scrollbar-none shadow-2xl z-10 space-y-6`}
            >
              {/* Product Header */}
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <img 
                    src={selectedProduct.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span style={{ color: primaryColor }} className="text-[9px] font-black uppercase tracking-widest block">{selectedProduct.category}</span>
                  <h3 className={`text-lg font-black ${isLight ? 'text-stone-900' : 'text-white'}`}>{selectedProduct.name}</h3>
                  <p className={`text-xs line-clamp-2 mt-0.5 ${isLight ? 'text-stone-500' : 'text-white/50'}`}>{selectedProduct.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isLight ? 'bg-stone-100 text-stone-500 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Customization Options */}
              <div className="space-y-4 pt-2">
                {/* Size Selection */}
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/50'}`}>Cup Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedProduct.sizes && selectedProduct.sizes.length > 0 ? selectedProduct.sizes : [
                      { name: 'Regular', priceAdjustment: 0 },
                      { name: 'Large', priceAdjustment: 20 },
                      { name: 'Venti', priceAdjustment: 30 }
                    ]).map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setCustomSize(s)}
                        style={customSize.name === s.name ? { backgroundColor: primaryColor, color: '#000', borderColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}50` } : undefined}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customSize.name === s.name
                            ? 'font-black'
                            : isLight ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {s.name} {s.priceAdjustment > 0 ? `(+₱${s.priceAdjustment})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sweetness */}
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/50'}`}>Sweetness Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['100%', '70%', '50%', '0%'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCustomSugar(lvl as any)}
                        style={customSugar === lvl ? { backgroundColor: primaryColor, color: '#000', borderColor: primaryColor } : undefined}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customSugar === lvl
                            ? 'font-black'
                            : isLight ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/50'}`}>Temperature</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Hot', 'Iced'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomTemp(t as any)}
                        style={customTemp === t ? { backgroundColor: primaryColor, color: '#000', borderColor: primaryColor } : undefined}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          customTemp === t
                            ? 'font-black'
                            : isLight ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & Notes */}
                <div className="space-y-2 pt-2">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/50'}`}>Special Instructions</label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Extra hot, separate lid..."
                    className={`w-full px-4 py-2.5 border rounded-xl text-xs outline-none ${isLight ? 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'}`}
                  />
                </div>
              </div>

              {/* Bottom Sheet Actions */}
              <div className={`pt-4 border-t flex items-center gap-4 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
                <div className={`flex items-center gap-2 border rounded-xl p-1 ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${isLight ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className={`w-6 text-center text-sm font-black ${isLight ? 'text-stone-900' : 'text-white'}`}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${isLight ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 8px 25px ${primaryColor}50` }}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-between cursor-pointer"
                >
                  <span>Add to Order Tray</span>
                  <span>₱{calculateCustomTotal()}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. GUEST CART TRAY MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`relative w-full max-w-md ${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#121212] border-white/10 text-white'} border-l h-full p-6 flex flex-col justify-between shadow-2xl z-10`}
            >
              <div className="space-y-4">
                <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
                  <div className="flex items-center gap-2.5">
                    <div 
                      style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}
                      className="w-8 h-8 rounded-xl border flex items-center justify-center"
                    >
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <h3 className={`text-base font-black ${isLight ? 'text-stone-900' : 'text-white'}`}>Your Order Tray</h3>
                      <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{cartCount} items selected</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isLight ? 'bg-stone-100 text-stone-500 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="space-y-3 max-h-[55vh] overflow-y-auto scrollbar-none pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Coffee className="w-10 h-10 text-white/20 mx-auto" />
                      <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Your order tray is currently empty</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`border rounded-2xl p-3 flex gap-3 items-center justify-between ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/5'}`}
                      >
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>{item.product.name}</h4>
                          <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{typeof item.selectedSize === 'object' ? (item.selectedSize as any)?.name : item.selectedSize} • {item.selectedTemp} • {item.selectedSugar}</p>
                          <span style={{ color: primaryColor }} className="text-xs font-black mt-1 block">₱{item.itemTotal}</span>
                        </div>
                        <div className={`text-xs font-black px-2.5 py-1 rounded-lg ${isLight ? 'bg-stone-200 text-stone-800' : 'bg-white/10 text-white/80'}`}>
                          x{item.quantity}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Checkout / Guest Order Action Panel */}
              <div className={`border-t pt-4 space-y-3 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
                <div className="flex justify-between items-center text-sm">
                  <span className={`font-bold ${isLight ? 'text-stone-600' : 'text-white/60'}`}>Total Amount</span>
                  <span style={{ color: primaryColor }} className="text-lg font-black">₱{cartTotal}</span>
                </div>

                {isStoreClosed ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-2xl flex items-center gap-2.5">
                    <Store className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold">Store is Currently Closed</p>
                      <p className="text-[10px] text-rose-200/70">Orders are paused while our coffee bar prepares for opening.</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}
                    className="border rounded-2xl p-2.5 flex items-center gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                    <p style={{ color: primaryColor }} className="text-[9.5px] leading-snug font-medium">
                      Order as guest immediately, or sign in to earn loyalty points on every purchase!
                    </p>
                  </div>
                )}

                {/* Primary Action: Order as Guest */}
                <button
                  disabled={cart.length === 0 || isStoreClosed}
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsGuestCheckoutOpen(true);
                  }}
                  style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 8px 25px ${primaryColor}50` }}
                  className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110"
                >
                  <UserCheck size={16} />
                  <span>Order as Guest (No Account Required)</span>
                </button>

                {/* Secondary Action: Member Sign In */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className={`w-full py-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isLight 
                      ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <LogIn size={13} />
                  <span>Sign In to VIP Account & Earn Points</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. GUEST CHECKOUT DRAWER / MODAL */}
      <AnimatePresence>
        {isGuestCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !guestLoading && setIsGuestCheckoutOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`relative w-full max-w-md ${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#121212] border-white/10 text-white'} border-l h-full flex flex-col justify-between shadow-2xl z-10`}
            >
              {/* Header */}
              <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
                <div className="flex items-center gap-2.5">
                  <div 
                    style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center"
                  >
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className={`text-base font-black ${isLight ? 'text-stone-900' : 'text-white'}`}>Guest Checkout</h3>
                    <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Fast ordering without account registration</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsGuestCheckoutOpen(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isLight ? 'bg-stone-100 text-stone-500 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form id="guestCheckoutForm" onSubmit={handleGuestCheckoutSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-none">
                {/* Guest Error Alert */}
                {guestError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{guestError}</span>
                  </div>
                )}

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Customer Details</h4>
                  
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold block ${isLight ? 'text-stone-700' : 'text-white/80'}`}>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos / Guest"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold block ${isLight ? 'text-stone-700' : 'text-white/80'}`}>Phone Number (Optional for order SMS)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 0912 345 6789"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30'}`}
                    />
                  </div>
                </div>

                {/* Fulfillment Method */}
                <div className="space-y-2 pt-1">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Fulfillment Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'dine_in' as OrderType, label: 'Dine-In', desc: 'In-Store', icon: Coffee },
                      { id: 'takeout' as OrderType, label: 'Takeout', desc: 'To Go', icon: ShoppingBag },
                      { id: 'pickup' as OrderType, label: 'Pickup', desc: 'Curbside', icon: Clock }
                    ].map(t => {
                      const Icon = t.icon;
                      const isSelected = guestOrderType === t.id;
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setGuestOrderType(t.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'border-2 font-black shadow-md'
                              : isLight ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                          }`}
                          style={isSelected ? { backgroundColor: `${primaryColor}18`, borderColor: primaryColor, color: isLight ? '#000' : '#fff' } : undefined}
                        >
                          <Icon size={16} style={isSelected ? { color: primaryColor } : undefined} />
                          <span className="text-[11px] font-bold">{t.label}</span>
                          <span className="text-[8.5px] opacity-60">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Table Number (if Dine In) */}
                {guestOrderType === 'dine_in' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1 overflow-hidden"
                  >
                    <label className={`text-[10px] font-bold block ${isLight ? 'text-stone-700' : 'text-white/80'}`}>Table Number / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Table 04 or Counter"
                      value={guestTableNo}
                      onChange={(e) => setGuestTableNo(e.target.value)}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30'}`}
                    />
                  </motion.div>
                )}

                {/* Payment Method Selector - Dynamic from Admin Settings */}
                <div className="space-y-2 pt-1">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Payment Option</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(settings.paymentMethods || []).filter(m => m.active).map(p => {
                      const isSelected = guestPaymentMethod === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setGuestPaymentMethod(p.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'border-2 font-black shadow-md'
                              : isLight ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10'
                          }`}
                          style={isSelected ? { backgroundColor: `${primaryColor}18`, borderColor: primaryColor, color: isLight ? '#000' : '#fff' } : undefined}
                        >
                          {p.type === 'qr' ? <QrCode size={16} style={isSelected ? { color: primaryColor } : undefined} /> :
                           p.type === 'cash' ? <Banknote size={16} style={isSelected ? { color: primaryColor } : undefined} /> :
                           <CreditCard size={16} style={isSelected ? { color: primaryColor } : undefined} />}
                          <span className="text-[11px] font-bold">{p.name}</span>
                        </button>
                      );
                    })}
                    {(settings.paymentMethods || []).filter(m => m.active).length === 0 && (
                      <p className="col-span-2 text-xs text-stone-400 italic p-2 text-center">No payment methods configured by admin.</p>
                    )}
                  </div>

                  {/* QR Code / Admin Payment Method Notice */}
                  {(() => {
                    const selectedMethod = (settings.paymentMethods || []).find(m => m.id === guestPaymentMethod);
                    if (!selectedMethod || selectedMethod.type === 'cash') return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3.5 rounded-2xl border text-center space-y-2.5 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {selectedMethod.qrCodeUrl ? (
                            <div className="p-2 bg-white rounded-xl shadow-md inline-block">
                              <img 
                                src={selectedMethod.qrCodeUrl} 
                                alt={selectedMethod.name} 
                                className="w-28 h-28 object-contain"
                              />
                            </div>
                          ) : (
                            <p className="text-xs text-amber-600 font-medium">Please transfer to account below:</p>
                          )}
                          <p className={`text-[10px] font-bold ${isLight ? 'text-stone-700' : 'text-white/80'}`}>
                            {selectedMethod.name} • Account: <span style={{ color: primaryColor }} className="font-mono text-xs">{selectedMethod.accountNumber || 'N/A'}</span> ({selectedMethod.accountName || 'Store Account'})
                          </p>
                        </div>

                        <div className="text-left space-y-1 pt-1 border-t border-white/5">
                          <label className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/50'}`}>Upload Payment Screenshot (Required for verification)</label>
                          <div className="flex items-center gap-2">
                            {guestReceiptUrl && (
                              <img src={guestReceiptUrl} alt="Receipt" className="w-10 h-10 rounded-lg object-cover border border-stone-300 bg-white shrink-0" />
                            )}
                            <div className="flex-1">
                              <ImageUpload
                                label="Attach Proof"
                                folder="receipts"
                                onUploadSuccess={(url) => setGuestReceiptUrl(url)}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>

                {/* Special Instructions */}
                <div className="space-y-1 pt-1">
                  <label className={`text-[10px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Order Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Extra hot, separate lid, call when ready..."
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium resize-none ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30'}`}
                  />
                </div>

                {/* Order Summary */}
                <div className={`p-3.5 rounded-2xl border space-y-2 text-xs ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/5'}`}>
                  <h5 className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/50'}`}>Order Overview</h5>
                  <div className="space-y-1">
                    {cart.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className={`truncate max-w-[220px] ${isLight ? 'text-stone-700' : 'text-white/70'}`}>
                          {it.quantity}x {it.product.name} ({typeof it.selectedSize === 'object' ? (it.selectedSize as any)?.name : it.selectedSize})
                        </span>
                        <span className="font-bold">₱{it.itemTotal}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`pt-2 border-t flex justify-between font-black text-sm ${isLight ? 'border-stone-200 text-stone-900' : 'border-white/10 text-white'}`}>
                    <span>Total Amount</span>
                    <span style={{ color: primaryColor }}>₱{cartTotal}</span>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className={`p-4 sm:p-5 border-t space-y-2 ${isLight ? 'border-stone-200 bg-white' : 'border-white/10 bg-[#121212]'}`}>
                <button
                  type="submit"
                  form="guestCheckoutForm"
                  disabled={guestLoading || cart.length === 0}
                  style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 8px 25px ${primaryColor}50` }}
                  className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:brightness-110"
                >
                  {guestLoading ? (
                    <span>Placing Guest Order...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Place Order (₱{cartTotal})</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. GUEST ORDER SUCCESS & LIVE STATUS TRACKER MODAL */}
      <AnimatePresence>
        {isGuestSuccessModalOpen && lastPlacedGuestOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuestSuccessModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#121212] border-white/10 text-white'} border rounded-3xl p-6 shadow-2xl z-10 space-y-5 text-center`}
            >
              {/* Checkmark Animation Icon */}
              <div 
                style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor }}
                className="w-16 h-16 rounded-full border-2 mx-auto flex items-center justify-center shadow-lg"
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                  Order Received by Kitchen
                </span>
                <h3 className={`text-xl font-black font-serif uppercase tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  Thank You, {lastPlacedGuestOrder.customerName || 'Valued Guest'}!
                </h3>
                <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-white/50'}`}>
                  Your order has been queued and is being prepared by our baristas.
                </p>
              </div>

              {/* Order Number & Tracker Card */}
              <div className={`p-4 rounded-2xl border text-left space-y-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Order Number</span>
                  <span className="text-sm font-black" style={{ color: primaryColor }}>
                    #{lastPlacedGuestOrder.orderNumber || lastPlacedGuestOrder.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Fulfillment</span>
                  <span className={`font-bold capitalize ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {lastPlacedGuestOrder.orderType.replace('_', ' ')} {lastPlacedGuestOrder.tableNumber ? `(${lastPlacedGuestOrder.tableNumber})` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Payment</span>
                  <span className={`font-bold uppercase ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {getPaymentMethodDisplayName(lastPlacedGuestOrder.paymentMethod)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Total Settle</span>
                  <span className="text-base font-black" style={{ color: primaryColor }}>
                    ₱{lastPlacedGuestOrder.total}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setIsGuestSuccessModalOpen(false)}
                  style={{ backgroundColor: primaryColor, color: '#000' }}
                  className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all hover:brightness-110"
                >
                  Return to Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. IOS AUTHENTICATION POPUP MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !authLoading && setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#121212] border-white/10 text-white'} border rounded-3xl p-6 shadow-2xl z-10 space-y-5`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {settings?.branding?.logoUrl ? (
                    <img 
                      src={settings.branding.logoUrl} 
                      alt={settings?.branding?.shopName || 'Logo'} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-2xl object-cover border border-white/10 shadow-md"
                    />
                  ) : (
                    <div 
                      style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}
                      className="w-10 h-10 rounded-2xl border flex items-center justify-center font-serif font-black text-lg"
                    >
                      {settings?.branding?.shopName?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 className={`text-sm font-black font-serif tracking-wider uppercase ${isLight ? 'text-stone-900' : 'text-white'}`}>
                      {settings?.branding?.shopName || 'CAIDOZ'}
                    </h3>
                    <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>VIP Customer & Staff Portal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${isLight ? 'bg-stone-100 text-stone-500 hover:text-stone-900' : 'bg-white/5 text-white/40 hover:text-white'}`}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className={`grid grid-cols-2 p-1 border rounded-2xl ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/5'}`}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  style={authMode === 'login' ? { backgroundColor: primaryColor, color: '#000' } : undefined}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'shadow-md'
                      : isLight ? 'text-stone-600 hover:text-stone-900' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(null); }}
                  style={authMode === 'register' ? { backgroundColor: primaryColor, color: '#000' } : undefined}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'shadow-md'
                      : isLight ? 'text-stone-600 hover:text-stone-900' : 'text-white/50 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Error Alert */}
              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Maria Santos"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="e.g. +63 912 345 6789"
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'}`}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-3.5 pr-10 py-2.5 border rounded-xl text-xs outline-none font-medium ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400' : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${isLight ? 'text-stone-400 hover:text-stone-700' : 'text-white/40 hover:text-white'}`}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{ backgroundColor: primaryColor, color: '#000', boxShadow: `0 8px 25px ${primaryColor}50` }}
                  className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {authLoading ? (
                    <span>Processing...</span>
                  ) : (
                    <span>{authMode === 'login' ? 'Sign In to Account' : 'Create VIP Account'}</span>
                  )}
                </button>
              </form>

              {/* Order as Guest Direct Option */}
              {cart.length > 0 && !isStoreClosed && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setIsGuestCheckoutOpen(true);
                  }}
                  style={{ color: primaryColor }}
                  className="w-full py-2 text-center text-xs font-black underline cursor-pointer hover:opacity-80"
                >
                  Or Continue & Order as Guest (Skip Login)
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
