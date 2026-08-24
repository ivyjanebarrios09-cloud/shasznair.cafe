import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Product, CartItem, OrderType, PaymentMethod, OrderStatus } from '../types';
import { getQRCodeUrl } from '../utils/qr';
import { InstallAppButton } from './InstallAppButton';
import { CategoryIcon } from '../utils/categoryIcons';
import { 
  Search, ShoppingBag, ArrowRight, User, Award, 
  MapPin, Clock, Star, Gift, Check, QrCode, 
  History, Eye, Trash2, Edit2, X, Plus, Minus,
  AlertCircle, ChevronRight, HelpCircle, Store, Smartphone,
  Flame, ChevronDown, ChevronUp, Coffee, ReceiptText, Sparkles,
  Banknote, CreditCard, Tag, CheckCircle2, UtensilsCrossed,
  Printer, ShieldCheck, Camera, Save, Upload, UserCheck, Layers
} from 'lucide-react';

export const CustomerExperience: React.FC = () => {
  const {
    categories,
    products,
    vouchers,
    orders,
    currentUser,
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    placeOrder,
    settings,
    logout,
    updateUserProfile
  } = useCoffeeApp();

  // Navigation Tabs: 'menu' | 'orders' | 'profile'
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  
  // Modals & Slideovers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBestSellers, setShowBestSellers] = useState(true);

  // Dynamic Best Sellers calculation from real orders & catalog
  const bestSellerItems = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(ord => {
      ord.items?.forEach(item => {
        counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
      });
    });

    const available = products.filter(p => p.available);
    const withSales = available.map(p => ({
      product: p,
      soldCount: counts[p.id] || 0
    }));

    // Only show items that have actual orders, sorted by highest sold count
    const orderedOnly = withSales.filter(item => item.soldCount > 0);
    return orderedOnly.sort((a, b) => b.soldCount - a.soldCount).slice(0, 6);
  }, [orders, products]);

  // Customization state for current selected product
  const [customSize, setCustomSize] = useState<any>(null);
  const [customAddOns, setCustomAddOns] = useState<any[]>([]);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState('');

  // Checkout form state
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [tableNo, setTableNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [phoneLookup, setPhoneLookup] = useState('');

  // Notification / Alert banners
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [orderSubmitted, setOrderSubmitted] = useState<any>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const handleOpenEditProfile = () => {
    setEditName(currentUser?.name || currentUser?.displayName || '');
    setEditPhone(currentUser?.phone || currentUser?.phoneNumber || '');
    setEditAvatar(currentUser?.avatar || currentUser?.photoURL || '');
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    setIsEditingProfile(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileErrorMsg('Image size should be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileErrorMsg('Please enter your full name');
      return;
    }
    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    try {
      await updateUserProfile({
        name: editName.trim(),
        displayName: editName.trim(),
        phone: editPhone.trim(),
        phoneNumber: editPhone.trim(),
        avatar: editAvatar.trim(),
        photoURL: editAvatar.trim()
      });
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setProfileErrorMsg(err?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Filtered menu
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchSearch && matchCat && p.available;
  });

  // Calculate cart metrics
  const cartSubtotal = cart.reduce((sum, item) => {
    const sizePrice = item.selectedSize?.priceAdjustment || 0;
    const addOnsPrice = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
    return sum + ((item.product.price + sizePrice + addOnsPrice) * item.quantity);
  }, 0);

  let cartDiscount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percentage') {
      cartDiscount = Math.round((cartSubtotal * appliedVoucher.discountValue) / 100);
      if (appliedVoucher.maxDiscount > 0) {
        cartDiscount = Math.min(cartDiscount, appliedVoucher.maxDiscount);
      }
    } else {
      cartDiscount = appliedVoucher.discountValue;
    }
  }

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle open customization
  const handleOpenCustomize = (product: Product) => {
    setSelectedProduct(product);
    setCustomSize(product.sizes?.[0] || { name: 'Standard', priceAdjustment: 0 });
    setCustomAddOns([]);
    setCustomQuantity(1);
    setCustomNotes('');
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const item: CartItem = {
      product: selectedProduct,
      quantity: customQuantity,
      selectedSize: customSize,
      selectedAddOns: customAddOns,
      notes: customNotes
    };
    addToCart(item);
    setSelectedProduct(null);
  };

  const toggleAddOn = (addon: any) => {
    if (customAddOns.some(a => a.name === addon.name)) {
      setCustomAddOns(prev => prev.filter(a => a.name !== addon.name));
    } else {
      setCustomAddOns(prev => [...prev, addon]);
    }
  };

  const handleApplyVoucher = () => {
    setVoucherError(null);
    if (!voucherCodeInput) return;
    const err = applyVoucher(voucherCodeInput);
    if (err) {
      setVoucherError(err);
    } else {
      setVoucherCodeInput('');
    }
  };

  const handlePlaceOrder = async () => {
    setErrorBanner(null);
    if (cart.length === 0) return;
    
    if (orderType === 'table' && !tableNo) {
      setErrorBanner("Please specify your table number.");
      return;
    }

    try {
      const result = await placeOrder(orderType, tableNo, paymentMethod, checkoutNotes);
      setOrderSubmitted(result);
      setIsCheckoutOpen(false);
      clearCart();
      setActiveTab('orders');
    } catch (err: any) {
      setErrorBanner(err.message || "Checkout failed. Please retry.");
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isLight = settings?.branding?.theme === 'light';
  const stickyHeaderClass = isAdmin ? `${isLight ? 'bg-stone-100 border-stone-200 text-stone-900' : 'bg-[#050505] border-white/10 text-[#f2f2f2]'} border-b sticky top-9 z-40 px-4 py-3 shadow-md flex items-center justify-between transition-colors` : `${isLight ? 'bg-stone-100 border-stone-200 text-stone-900' : 'bg-[#050505] border-white/10 text-[#f2f2f2]'} border-b sticky top-0 z-40 px-4 py-3 shadow-md flex items-center justify-between transition-colors`;
  const stickyBannerClass = isAdmin ? "bg-rose-950 text-rose-200 border-b border-rose-800 text-sm py-2.5 px-4 sticky top-[69px] z-40 shadow-md flex items-center justify-between animate-slide-down" : "bg-rose-950 text-rose-200 border-b border-rose-800 text-sm py-2.5 px-4 sticky top-14 z-40 shadow-md flex items-center justify-between animate-slide-down";

  // Filter orders for the current user
  const customerOrders = orders.filter(o => o.customerId === (currentUser?.uid || 'guest'));
  const activeOrdersCount = customerOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.orderStatus)).length;

  return (
    <div 
      className={`min-h-screen ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} pb-14 font-sans flex flex-col transition-colors duration-300`}
      style={{ '--color-primary': settings.branding.primaryColor } as React.CSSProperties}
    >
      {/* 1. SHASZNAIR CAFE SHOP BRAND HEADER */}
      <header className={stickyHeaderClass}>
        {/* GOLD TOP GLOW LINE */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-80" />

        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-[var(--color-primary)]/30">
            {settings.branding.logoUrl ? (
              <img src={settings.branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)] flex items-center justify-center text-black font-serif font-black text-base sm:text-lg shadow-md shadow-[var(--color-primary)]/20">
                {settings.branding.shopName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
            <h1 className="text-base sm:text-lg font-black font-serif text-white leading-tight tracking-wider flex items-center gap-1.5 truncate">
              <span className="text-[var(--color-primary)]">{settings.branding.shopName}</span>
            </h1>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border w-fit ${
              settings?.storeStatus?.isOpen !== false
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                : 'bg-rose-950/80 text-rose-300 border-rose-600/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${settings?.storeStatus?.isOpen !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{settings?.storeStatus?.isOpen !== false ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: INSTALL APP + CART FLOATING BUBBLE */}
        <div className="flex items-center gap-2">
          <InstallAppButton />
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ShoppingBag className="w-5.5 h-5.5 text-[#c5a059]" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#c5a059] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* STORE CLOSED BANNER */}
      {settings.storeStatus?.isOpen === false && (
        <div className="bg-rose-950/80 border-b border-rose-900 text-rose-200 text-xs py-2 px-4 sticky top-[56px] z-30 shadow-md flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-center">The store is currently closed. We are not accepting orders right now.</span>
        </div>
      )}

      {/* ERROR BANNER FLOATING */}
      {errorBanner && (
        <div className={stickyBannerClass}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. DYNAMIC TAB INTERFACES */}
      <main className="flex-1 max-w-md sm:max-w-lg mx-auto w-full px-3.5 sm:px-4 pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* SEARCH PRODUCTS BAR */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121212] text-white pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-white/10 outline-none focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/20 shadow-inner transition-all placeholder-white/35"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* BEST SELLER DROPDOWN TOGGLE */}
              {selectedCategory === 'all' && (
                <div className="flex items-center justify-end -mt-1">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBestSellers(!showBestSellers)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-white/90">BEST SELLER</span>
                    {showBestSellers ? (
                      <ChevronUp className="w-3.5 h-3.5 text-white/50" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                    )}
                  </motion.button>
                </div>
              )}

              {/* OVERALL BEST SELLERS CAROUSEL / CONTAINER */}
              <AnimatePresence>
                {selectedCategory === 'all' && showBestSellers && bestSellerItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#fff9f0] border border-[#f5d9a6] rounded-3xl p-3.5 sm:p-4 shadow-lg space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600">
                            <Flame className="w-4 h-4 fill-amber-500/20" />
                          </div>
                          <h3 className="font-black text-xs sm:text-sm text-stone-900 tracking-wider uppercase">
                            OVERALL BEST SELLERS
                          </h3>
                        </div>
                      </div>

                      {/* BEST SELLER CARDS LIST */}
                      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none touch-pan-x">
                        {bestSellerItems.map(({ product: prod, soldCount }) => (
                          <motion.div
                            key={prod.id}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleOpenCustomize(prod)}
                            className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#f5e6d0] shadow-sm hover:shadow-md hover:border-[#e8caa3] transition-shadow flex gap-3 items-center relative min-w-[245px] sm:min-w-[260px] max-w-[280px] shrink-0 cursor-pointer group select-none"
                          >
                            {/* PRODUCT THUMBNAIL WITH FLAME SOLD BADGE */}
                            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                              <img
                                src={prod.image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400'}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-1.5 left-1.5 bg-[#ff5722] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                <Flame className="w-2.5 h-2.5 fill-white/30" />
                                <span>{soldCount} sold</span>
                              </div>
                            </div>

                            {/* DETAILS & + ADD BUTTON */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                              <div>
                                <span className="text-[9px] font-black text-amber-600 tracking-wider uppercase block">
                                  BEST SELLER
                                </span>
                                <h4 className="font-extrabold text-sm text-stone-900 truncate leading-snug mt-0.5">
                                  {prod.name}
                                </h4>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                                  {prod.category}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
                                <span className="text-sm sm:text-base font-black text-[#c5a059]">
                                  ₱{prod.price}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCustomize(prod);
                                  }}
                                  className="bg-[#fff1e0] hover:bg-[#ffe3c2] active:scale-95 text-[#d97706] font-black text-xs px-3 py-1 rounded-full border border-[#fbd38d]/70 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  + ADD
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CATEGORY BAR */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-3.5 sm:-mx-4 px-3.5 sm:px-4 scrollbar-none items-center">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === 'all'
                      ? 'bg-[#c5a059] text-black shadow-[0_0_8px_rgba(197,160,89,0.3)] font-bold'
                      : 'bg-[#121212] border border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Menu</span>
                </motion.button>
                {categories.filter(c => c.active).map(cat => (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-[#c5a059] text-black shadow-[0_0_8px_rgba(197,160,89,0.3)] font-bold'
                        : 'bg-[#121212] border border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* PROMOTION CARD HERO */}
              {selectedCategory === 'all' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-[#121212] to-[#080808] text-white rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden"
                >
                  <div className="relative z-10 space-y-1.5 max-w-[65%]">
                    <span className="bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      <span>Exclusive Promo</span>
                    </span>
                    <h3 className="text-base font-bold font-serif leading-tight text-white tracking-wide">Welcome to SHASZNAIR CAFE</h3>
                    <p className="text-xs text-white/75">Apply voucher <strong className="text-[#c5a059]">WELCOME10</strong> on your checkout for 10% off!</p>
                  </div>
                  <Coffee className="absolute -right-2 -bottom-2 w-28 h-28 stroke-[1] select-none opacity-10 text-[#c5a059] pointer-events-none" />
                </motion.div>
              )}

              {/* PRODUCT CARD LIST - SQUARE GRID */}
              <div className="space-y-3 pb-12">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold text-[#c5a059] uppercase tracking-widest">
                    {selectedCategory === 'all' ? 'All Delights' : categories.find(c => c.id === selectedCategory)?.name}
                  </h2>
                  <span className="text-[10px] text-white/40 font-mono font-medium">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-[#121212] rounded-2xl p-8 border border-white/10 text-center text-white/50 space-y-2">
                    <p className="text-sm font-medium">No results found matching your selection.</p>
                    <p className="text-xs text-white/30">Try adjusting your search filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                    {filteredProducts.map(prod => {
                      const isOutOfStock = prod.stockTracking && prod.stockQuantity === 0;
                      const isLowStock = prod.stockTracking && prod.stockQuantity <= 10 && prod.stockQuantity > 0;
                      const prodCat = categories.find(c => c.id === prod.category)?.name || prod.category;

                      return (
                        <motion.div
                          key={prod.id}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => !isOutOfStock && handleOpenCustomize(prod)}
                          className={`bg-[#121212] rounded-2xl border border-white/10 shadow-md hover:border-[#c5a059]/40 transition-all flex flex-col justify-between overflow-hidden relative group select-none cursor-pointer ${
                            isOutOfStock ? 'opacity-70 cursor-not-allowed border-rose-500/30' : ''
                          }`}
                        >
                          {/* Square Thumbnail */}
                          <div className="w-full aspect-square relative bg-[#080808] overflow-hidden border-b border-white/5">
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Floating Category Pill */}
                            <div className="absolute top-1.5 left-1.5 max-w-[70%]">
                              <span className="inline-block truncate px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-bold text-white/90 border border-white/10 uppercase tracking-tighter shadow-sm">
                                {prodCat}
                              </span>
                            </div>

                            {/* Status Overlay / Badge */}
                            {isOutOfStock ? (
                              <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="bg-rose-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                                  Sold Out
                                </span>
                              </div>
                            ) : isLowStock ? (
                              <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[8px] uppercase tracking-wider shadow">
                                {prod.stockQuantity} left
                              </span>
                            ) : null}
                          </div>

                          {/* Product Details & Actions */}
                          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                            <div className="space-y-0.5">
                              <h3 className="font-bold text-xs text-white truncate leading-tight" title={prod.name}>
                                {prod.name}
                              </h3>
                              {prod.description && (
                                <p className="text-[10px] text-white/50 line-clamp-1 leading-snug">
                                  {prod.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <span className="text-xs sm:text-sm font-extrabold text-[#c5a059]">
                                ₱{prod.price}
                              </span>

                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOutOfStock) handleOpenCustomize(prod);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 ${
                                  isOutOfStock 
                                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                    : 'bg-[#c5a059] text-black hover:bg-[#b08c47]'
                                }`}
                              >
                                <Plus size={11} className="stroke-[3]" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 pb-8"
            >
              <h2 className="text-base font-bold text-white font-serif tracking-wide">Order History & Tracking</h2>

              {customerOrders.length === 0 ? (
                <div className="bg-[#121212] rounded-2xl p-8 border border-white/10 text-center text-white/50 space-y-3 shadow-md">
                  <div className="w-12 h-12 bg-[#c5a059]/10 text-[#c5a059] rounded-2xl flex items-center justify-center mx-auto border border-[#c5a059]/20 shadow-inner">
                    <ReceiptText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">No orders placed yet</p>
                    <p className="text-xs text-white/40">Head over to the menu to order your first brew!</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('menu')}
                    className="bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Browse Menu</span>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map(ord => {
                    const isActive = ['pending', 'preparing', 'ready'].includes(ord.orderStatus);
                    return (
                      <motion.div
                        key={ord.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-[#121212] rounded-xl p-4 border shadow-md space-y-3 ${
                          isActive ? 'border-[#c5a059]/40 ring-1 ring-[#c5a059]/10' : 'border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start text-xs pb-2 border-b border-white/5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-mono text-white/50">{ord.orderNumber}</p>
                              <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                              }`}>
                                {ord.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                                {ord.orderSource === 'pos' ? 'POS Counter' : 'Online App'}
                              </span>
                            </div>
                            <p className="text-white/30 mt-0.5 text-[10px]">
                              {ord.createdAt instanceof Date ? ord.createdAt.toLocaleString() : 'Just now'}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ord.orderStatus === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/30' :
                            ord.orderStatus === 'cancelled' ? 'bg-rose-950 text-rose-300 border border-rose-900/30' :
                            ord.orderStatus === 'ready' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/30 animate-pulse' :
                            ord.orderStatus === 'preparing' ? 'bg-amber-950 text-amber-300 border border-amber-900/30' :
                            'bg-white/5 text-white/70 border border-white/10'
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </div>

                        {/* Item summaries */}
                        <div className="text-xs text-white/80 space-y-2 max-h-32 overflow-y-auto pr-2">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex flex-col">
                              <div className="flex justify-between">
                                <span className="font-medium text-white/90">{it.quantity}x {it.name} <span className="text-white/40">({it.selectedSize})</span></span>
                                <span className="text-[#c5a059]">₱{it.price * it.quantity}</span>
                              </div>
                              {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                                <span className="text-[10px] text-white/40 pl-4 mt-0.5">+ {it.selectedAddOns.join(', ')}</span>
                              )}
                              {it.notes && (
                                <span className="text-[10px] text-white/30 pl-4 italic mt-0.5">"{it.notes}"</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Status Tracker step indicators if order is active */}
                        {isActive && (
                          <div className="bg-[#080808] rounded-lg p-2.5 space-y-2 border border-white/5">
                            <p className="text-[10px] font-bold uppercase text-[#c5a059] flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-spin" /> Live Order Status Progress
                            </p>
                            <div className="grid grid-cols-4 gap-1 relative pt-2">
                              {/* Lines connecting steps */}
                              <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-white/10 z-0">
                                <div 
                                  className="h-full bg-[#c5a059] transition-all duration-500 shadow-[0_0_8px_rgba(197,160,89,0.5)]" 
                                  style={{
                                    width: ord.orderStatus === 'ready' ? '100%' :
                                           ord.orderStatus === 'preparing' ? '66%' :
                                           ord.orderStatus === 'pending' ? '33%' : '0%'
                                  }}
                                />
                              </div>

                              {['Submitted', 'Confirmed', 'Preparing', 'Ready'].map((step, idx) => {
                                const stepMap: Record<OrderStatus, number> = {
                                  pending: 1,
                                  preparing: 2,
                                  ready: 3,
                                  completed: 4,
                                  cancelled: 0
                                };
                                const currentStep = stepMap[ord.orderStatus];
                                const isPastOrCurrent = (idx + 1) <= currentStep;
                                
                                return (
                                  <div key={step} className="flex flex-col items-center z-10">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                                      isPastOrCurrent 
                                        ? 'bg-[#c5a059] text-black shadow' 
                                        : 'bg-white/10 text-white/40'
                                    }`}>
                                      {isPastOrCurrent ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-[9px] mt-1 font-semibold ${
                                      isPastOrCurrent ? 'text-[#c5a059]' : 'text-white/30'
                                    }`}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs pt-1">
                          <div>
                            <p className="text-white/40 text-[10px]">Total Charged</p>
                            <p className="text-sm font-extrabold text-[#c5a059]">₱{ord.total}</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSelectedOrderDetails(ord)}
                            className="border border-white/10 hover:border-[#c5a059] text-white/80 hover:text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer bg-white/5 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 pb-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-serif tracking-wide">Customer Account Profile</h2>
                <button
                  onClick={handleOpenEditProfile}
                  className="px-3 py-1.5 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] hover:bg-[#c5a059]/25 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* PROFILE CARD */}
              <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 shadow-lg space-y-4 text-center">
                {/* AVATAR & HEADER */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#c5a059]/50 shadow-md bg-[#080808] flex items-center justify-center">
                      {currentUser?.avatar || currentUser?.photoURL ? (
                        <img 
                          src={currentUser.avatar || currentUser.photoURL} 
                          alt={currentUser.name || 'User Profile'} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1c1c1c] text-[#c5a059] flex items-center justify-center font-serif text-2xl font-black">
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-8 h-8 opacity-60" />}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleOpenEditProfile}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#c5a059] text-black border-2 border-[#121212] flex items-center justify-center shadow hover:bg-[#b08c47] transition-all cursor-pointer"
                      title="Change Profile Photo"
                      aria-label="Change Profile Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white tracking-wide leading-tight">
                      {currentUser?.name || currentUser?.displayName || "Guest Customer"}
                    </h3>
                    <p className="text-xs text-[#c5a059] font-medium">{currentUser?.email}</p>
                  </div>
                </div>

                {/* COMPACT DIGITAL LOYALTY PASS (QR CODE) */}
                <div className="bg-[#080808] p-3.5 rounded-xl border border-white/5 space-y-2 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase text-[#c5a059] tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Digital Loyalty Pass</span>
                  </div>
                  
                  {/* COMPACT QR IMAGE */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-md relative border border-white/20">
                    <img
                      src={getQRCodeUrl(currentUser?.uid || 'guest_unregistered')}
                      alt="Customer QR Identifier"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-center space-y-0.5">
                    <p className="text-[9.5px] font-mono text-white/40">ID: {currentUser?.uid.slice(0, 12)}...</p>
                    <p className="text-[10px] text-white/60 max-w-[90%] leading-tight mx-auto">
                      Scan at checkout to earn points and claim rewards.
                    </p>
                  </div>
                </div>

                {/* STATS ROW */}
                <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-white/5 py-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 font-semibold block">Total Visited</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#c5a059]">{currentUser?.orderCount || 0} Orders</strong>
                  </div>
                  <div className="space-y-0.5 border-l border-r border-white/5">
                    <span className="text-[10px] text-white/40 font-semibold block">Total Spent</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#c5a059]">₱{currentUser?.lifetimeSpending || 0}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-white/40 font-semibold block">Points Balance</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#c5a059]">{currentUser?.loyaltyPoints || 0} pts</strong>
                  </div>
                </div>

                {/* PERSONAL INFO DETAILS */}
                <div className="text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Full Name</span>
                    <span className="font-bold text-white/90">{currentUser?.name || currentUser?.displayName || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Email Address</span>
                    <span className="font-bold text-white/90">{currentUser?.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-white/40">Mobile Phone</span>
                    <span className="font-bold text-white/90">{currentUser?.phone || currentUser?.phoneNumber || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Member Since</span>
                    <span className="font-bold text-white/90">
                      {currentUser?.createdAt 
                        ? (currentUser.createdAt instanceof Date 
                            ? currentUser.createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                            : new Date(currentUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }))
                        : 'Active Member'}
                    </span>
                  </div>
                </div>

                {/* Quick Edit Profile Action */}
                <button
                  onClick={handleOpenEditProfile}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Update Name, Phone & Photo</span>
                </button>

                {/* Secure logout button for regular users */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => logout()}
                  id="customer-logout-btn"
                  className="w-full bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/30 text-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  Sign Out of Account
                </motion.button>
              </div>

              {/* EDIT PROFILE MODAL */}
              <AnimatePresence>
                {isEditingProfile && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => !isSavingProfile && setIsEditingProfile(false)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
                    />

                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 15 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 15 }}
                      className="relative z-10 bg-[#141414] border border-white/15 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 overflow-hidden text-left"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center border border-[#c5a059]/30">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white">Edit Profile Details</h3>
                            <p className="text-[10px] text-white/40">Update your account information</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          disabled={isSavingProfile}
                          className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {profileSuccessMsg && (
                        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{profileSuccessMsg}</span>
                        </div>
                      )}

                      {profileErrorMsg && (
                        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{profileErrorMsg}</span>
                        </div>
                      )}

                      <form onSubmit={handleSaveProfile} className="space-y-3.5">
                        {/* PROFILE PHOTO EDIT / UPLOAD */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/60 block">
                            Profile Photo
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 bg-[#080808] flex items-center justify-center shrink-0">
                              {editAvatar ? (
                                <img 
                                  src={editAvatar} 
                                  alt="Preview" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <User className="w-6 h-6 text-white/30" />
                              )}
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 cursor-pointer transition-all active:scale-95">
                                <Upload className="w-3.5 h-3.5 text-[#c5a059]" />
                                <span>Upload Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAvatarFileChange}
                                  className="hidden"
                                />
                              </label>
                              {editAvatar && (
                                <button
                                  type="button"
                                  onClick={() => setEditAvatar('')}
                                  className="text-[10px] text-rose-400 hover:text-rose-300 block font-medium"
                                >
                                  Remove photo
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Image URL fallback input */}
                          <div className="pt-1">
                            <input
                              type="url"
                              value={editAvatar}
                              onChange={(e) => setEditAvatar(e.target.value)}
                              placeholder="Or paste image URL (e.g. https://...)"
                              className="w-full bg-[#0a0a0a] border border-white/10 text-white text-xs px-3 py-1.5 rounded-xl placeholder-white/30 focus:outline-none focus:border-[#c5a059]/60"
                            />
                          </div>
                        </div>

                        {/* NAME INPUT */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/60 block">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g. Maria Santos"
                            className="w-full bg-[#0a0a0a] border border-white/10 text-white text-xs px-3 py-2 rounded-xl placeholder-white/30 focus:outline-none focus:border-[#c5a059]/60 font-medium"
                          />
                        </div>

                        {/* PHONE NUMBER INPUT */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/60 block">
                            Mobile Phone Number
                          </label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="e.g. +63 912 345 6789"
                            className="w-full bg-[#0a0a0a] border border-white/10 text-white text-xs px-3 py-2 rounded-xl placeholder-white/30 focus:outline-none focus:border-[#c5a059]/60 font-medium"
                          />
                        </div>

                        {/* FORM ACTIONS */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            disabled={isSavingProfile}
                            onClick={() => setIsEditingProfile(false)}
                            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="flex-1 py-2 rounded-xl bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isSavingProfile ? (
                              <span>Saving...</span>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. PRODUCT CUSTOMIZATION BOTTOM SHEET / MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal / Sheet Container */}
            <motion.div 
              initial={{ y: '100%', opacity: 0.5, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="relative z-10 bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden"
            >
              {/* Header image */}
              <div className="relative h-44 flex-shrink-0 bg-stone-100">
                <img
                  src={selectedProduct.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-stone-900 leading-tight">{selectedProduct.name}</h3>
                  <p className="text-xs text-stone-500">{selectedProduct.description}</p>
                </div>

                {/* SIZE OPTIONS */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Select Beverage Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.sizes.map(size => (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={size.name}
                          onClick={() => setCustomSize(size)}
                          className={`py-2 px-3 border rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                            customSize?.name === size.name
                              ? 'bg-amber-50 border-amber-800 text-amber-950 ring-1 ring-amber-800/30 shadow-xs'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <p className="font-bold">{size.name}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {size.priceAdjustment === 0 ? 'Base' : `+₱${size.priceAdjustment}`}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADD ONS OPTIONS */}
                {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Milk Substitute & Sweetener Syrups</label>
                    <div className="space-y-2">
                      {selectedProduct.addOns.map(addon => {
                        const isSelected = customAddOns.some(a => a.name === addon.name);
                        return (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            key={addon.name}
                            onClick={() => toggleAddOn(addon)}
                            className={`w-full flex items-center justify-between p-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50/50 border-amber-800/40 text-amber-950'
                                : 'bg-white border-stone-100 hover:border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-amber-900 border-amber-900 text-white' : 'border-stone-300'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span>{addon.name}</span>
                            </div>
                            <span className="text-stone-500 font-extrabold">+₱{addon.price}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SPECIAL PREPARATION NOTES */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Special Instructions</label>
                  <textarea
                    placeholder="E.g. Extra hot, no sugar, split shot, oat milk substitute..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200 outline-none focus:border-amber-700 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Bottom button block */}
              <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center gap-3 flex-shrink-0">
                {/* QUANTITY ROW */}
                <div className="flex items-center gap-2 bg-white border border-stone-200 p-1 rounded-xl">
                  <button
                    onClick={() => setCustomQuantity(q => Math.max(1, q - 1))}
                    className="p-1 rounded bg-stone-50 text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-stone-900 w-5 text-center text-xs">{customQuantity}</span>
                  <button
                    onClick={() => setCustomQuantity(q => q + 1)}
                    className="p-1 rounded bg-stone-50 text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* PRICE CALCULATOR & SUBMIT BUTTON */}
                <motion.button
                  whileTap={settings.storeStatus?.isOpen === false ? {} : { scale: 0.96 }}
                  onClick={settings.storeStatus?.isOpen === false ? undefined : handleAddToCart}
                  disabled={settings.storeStatus?.isOpen === false}
                  className={`flex-1 text-white text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center transition-all shadow-sm ${settings.storeStatus?.isOpen === false ? 'bg-stone-400 cursor-not-allowed opacity-75' : 'bg-amber-900 hover:bg-amber-950 cursor-pointer'}`}
                >
                  <span>{settings.storeStatus?.isOpen === false ? 'Store Closed' : 'Add Item to Bag'}</span>
                  <span className={`${settings.storeStatus?.isOpen === false ? 'bg-stone-500' : 'bg-amber-800'} py-0.5 px-2 rounded-md font-extrabold`}>
                    ₱{((selectedProduct.price + (customSize?.priceAdjustment || 0) + customAddOns.reduce((sum, a) => sum + a.price, 0)) * customQuantity)}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. CART SLIDEOVER PANEL */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="relative z-10 bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-950" />
                  <h3 className="text-base font-bold text-stone-900">Your Coffee Bag</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-stone-100 rounded-full cursor-pointer">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-3 text-stone-500">
                    <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/50 flex items-center justify-center mx-auto text-amber-800 shadow-inner">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-bold text-stone-800">Your bag is currently empty</p>
                    <p className="text-xs text-stone-400">Add customizable beverages or pastries to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => {
                      const sizePrice = item.selectedSize?.priceAdjustment || 0;
                      const addOnsPrice = item.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
                      const unitPrice = item.product.price + sizePrice + addOnsPrice;

                      return (
                        <div key={index} className="flex gap-3 p-3 border border-stone-150 rounded-xl relative bg-stone-50/40">
                          <img
                            src={item.product.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200'}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-stone-950 truncate pr-4">{item.product.name}</h4>
                                <button
                                  onClick={() => removeFromCart(index)}
                                  className="text-stone-400 hover:text-rose-600 p-0.5 absolute top-2 right-2 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                                Size: {item.selectedSize?.name || 'Standard'}
                              </p>
                              {item.selectedAddOns.length > 0 && (
                                <p className="text-[9px] text-stone-500 mt-0.5 truncate">
                                  + {item.selectedAddOns.map(a => a.name).join(', ')}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-[9px] text-stone-400 italic mt-0.5 truncate">
                                  "{item.notes}"
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-stone-100">
                              {/* Quantity toggler */}
                              <div className="flex items-center gap-2 bg-white border border-stone-200 px-1.5 py-0.5 rounded-lg">
                                <button
                                  onClick={() => {
                                    if (item.quantity > 1) {
                                      updateCartItem(index, { ...item, quantity: item.quantity - 1 });
                                    } else {
                                      removeFromCart(index);
                                    }
                                  }}
                                  className="text-stone-500 hover:text-stone-800"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-[10px] font-bold text-stone-900 w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartItem(index, { ...item, quantity: item.quantity + 1 })}
                                  className="text-stone-500 hover:text-stone-800"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              <span className="text-xs font-extrabold text-amber-950">₱{unitPrice * item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary block */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-stone-100 bg-stone-50 space-y-4 flex-shrink-0">
                  {/* VOUCHER PROMO INPUT */}
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Promo Code (e.g. WELCOME10)"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        disabled={!!appliedVoucher}
                        className="flex-1 text-xs bg-white border border-stone-200 outline-none py-2 px-3 rounded-xl uppercase font-mono placeholder:normal-case focus:border-amber-800 disabled:bg-stone-100 disabled:text-stone-400"
                      />
                      {appliedVoucher ? (
                        <button
                          onClick={removeVoucher}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                      ) : (
                        <button
                          onClick={handleApplyVoucher}
                          className="bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {voucherError && <p className="text-[10px] text-rose-600 font-semibold">{voucherError}</p>}
                    
                    {appliedVoucher && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg flex justify-between items-center text-xs">
                        <span className="font-bold font-mono">Promo {appliedVoucher.code} Activated!</span>
                        <span>-{appliedVoucher.discountType === 'percentage' ? `${appliedVoucher.discountValue}%` : `₱${appliedVoucher.discountValue}`}</span>
                      </div>
                    )}
                  </div>

                  {/* RECEIPTS CALCS */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Cart Subtotal</span>
                      <span className="font-semibold">₱{cartSubtotal}</span>
                    </div>
                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Promo Discount</span>
                        <span>-₱{cartDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-200/80 pt-2 text-sm font-extrabold text-stone-900">
                      <span>Est. Total To Pay</span>
                      <span className="text-amber-950">₱{cartTotal}</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center transition-all shadow-md cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CHECKOUT SYSTEM DIALOG */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="relative z-10 bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">Configure Checkout</h3>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-1 hover:bg-stone-100 rounded-full cursor-pointer">
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              {/* Form body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* ORDER TYPE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Fulfillment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'pickup', label: 'Store Pickup', desc: 'No queue', icon: ShoppingBag },
                      { id: 'dine_in', label: 'Dine-In', desc: 'In-store seat', icon: Coffee },
                      { id: 'table', label: 'Table Order', desc: 'Served to table', icon: UtensilsCrossed }
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={t.id}
                          onClick={() => setOrderType(t.id as OrderType)}
                          className={`py-2 px-1.5 border rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                            orderType === t.id
                              ? 'bg-amber-50 border-amber-800 text-amber-950 shadow-xs'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1 ${
                            orderType === t.id ? 'bg-amber-800/10 text-amber-900' : 'bg-stone-100 text-stone-500'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[11px] font-bold leading-tight">{t.label}</p>
                          <p className="text-[8.5px] text-stone-400 mt-0.5">{t.desc}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* TABLE NUMBER CONDITIONAL */}
                {orderType === 'table' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Table Number</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter table number (e.g. TABLE-04)"
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200 outline-none focus:border-amber-700 focus:bg-white"
                    />
                  </motion.div>
                )}

                {/* PAYMENT CONFIGS */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">Payment Channel</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(settings.paymentMethods || []).filter(m => m.active).map(p => (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        key={p.id}
                        onClick={() => setPaymentMethod(p.id)}
                        className={`p-2.5 border rounded-xl flex items-center gap-2.5 cursor-pointer text-left transition-all ${
                          paymentMethod === p.id
                            ? 'bg-amber-50 border-amber-800 text-amber-950 shadow-xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          paymentMethod === p.id ? 'bg-amber-800/10 text-amber-900' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {p.type === 'cash' ? (
                            <Banknote className="w-4.5 h-4.5 text-emerald-600" />
                          ) : p.type === 'card' ? (
                            <CreditCard className="w-4.5 h-4.5 text-indigo-600" />
                          ) : p.type === 'qr' ? (
                            <QrCode className="w-4.5 h-4.5 text-amber-600" />
                          ) : (
                            <Smartphone className="w-4.5 h-4.5 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{p.name}</p>
                          <p className="text-[9px] text-stone-400 capitalize">{p.type} payment</p>
                        </div>
                      </motion.button>
                    ))}
                    {(settings.paymentMethods || []).filter(m => m.active).length === 0 && (
                      <p className="text-xs text-rose-500 font-bold col-span-2 text-center py-2">No active payment methods configured.</p>
                    )}
                  </div>
                  
                  {/* Dynamic QR Code Display for selected payment method */}
                  {(() => {
                    const selectedMethod = (settings.paymentMethods || []).find(m => m.id === paymentMethod);
                    if (selectedMethod?.qrCodeUrl) {
                      return (
                        <div className="mt-3 p-4 bg-white border border-stone-200 rounded-xl flex flex-col items-center text-center space-y-2 animate-fade-in">
                          <p className="text-xs font-bold text-stone-700">Scan to pay via {selectedMethod.name}</p>
                          <img src={selectedMethod.qrCodeUrl} alt={`${selectedMethod.name} QR Code`} className="w-32 h-32 object-contain" />
                          <p className="text-[10px] text-stone-500">Please prepare your payment proof for verification at the counter.</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* SPECIAL NOTES */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-stone-700 tracking-wider">Fulfillment Notes</label>
                  <textarea
                    placeholder="Leave any message for the cashier or barista..."
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-50 text-stone-900 border border-stone-300 outline-none focus:border-amber-700 focus:bg-white resize-none placeholder-stone-500 font-medium"
                  />
                </div>

                {/* ORDER SUMMARY */}
                <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-2 text-xs">
                  <h4 className="font-extrabold text-stone-900 uppercase text-[10px] tracking-wider">Receipt Summary</h4>
                  <div className="space-y-1.5 text-stone-700 font-medium">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₱{cartSubtotal}</span>
                    </div>
                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Discount</span>
                        <span>-₱{cartDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-200/80 pt-1.5 text-xs font-bold text-stone-900">
                      <span>Total To Settle</span>
                      <span>₱{cartTotal}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout footer */}
              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <motion.button
                  whileTap={settings.storeStatus?.isOpen === false ? {} : { scale: 0.97 }}
                  onClick={settings.storeStatus?.isOpen === false ? undefined : handlePlaceOrder}
                  disabled={settings.storeStatus?.isOpen === false}
                  className={`w-full text-white text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center transition-all shadow-md ${settings.storeStatus?.isOpen === false ? 'bg-stone-400 cursor-not-allowed opacity-75' : 'bg-amber-900 hover:bg-amber-950 cursor-pointer'}`}
                >
                  <span>{settings.storeStatus?.isOpen === false ? 'Store Closed' : 'Confirm & Send Order'}</span>
                  <span className={`font-extrabold font-mono text-[11px] ${settings.storeStatus?.isOpen === false ? 'bg-stone-500' : 'bg-amber-800'} py-0.5 px-2 rounded-md`}>
                    ₱{cartTotal}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. ORDER DETAIL SYSTEM MODAL */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute inset-0 bg-black/65 backdrop-blur-xs cursor-pointer"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative z-10 bg-white w-full max-w-sm rounded-2xl shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm">Receipt Order Ticket</h3>
                <button onClick={() => setSelectedOrderDetails(null)} className="p-1 hover:bg-stone-100 rounded-full cursor-pointer">
                  <X className="w-5 h-5 text-stone-700" />
                </button>
              </div>

              <div className="text-center font-mono space-y-1 text-xs text-stone-900">
                <h2 className="text-base font-black tracking-tight text-amber-950 uppercase">{settings.branding.shopName}</h2>
                <p className="text-stone-700 font-medium">{settings.businessInfo.address}</p>
                <p className="text-stone-700 font-medium">{settings.businessInfo.contactNumber}</p>
                <div className="border-t border-dashed border-stone-300 my-2" />

                <div className="text-left space-y-1 text-[11px] text-stone-800 font-medium">
                  <p><strong className="text-stone-900">Order No:</strong> {selectedOrderDetails.orderNumber}</p>
                  <p><strong className="text-stone-900">Origin:</strong> {selectedOrderDetails.orderSource === 'pos' ? 'POS Counter (In-Store)' : 'Customer Online Web App'}</p>
                  <p><strong className="text-stone-900">Fulfillment:</strong> {selectedOrderDetails.orderType.toUpperCase()}</p>
                  {selectedOrderDetails.tableNo && <p><strong className="text-stone-900">Table No:</strong> {selectedOrderDetails.tableNo}</p>}
                  <p><strong className="text-stone-900">Customer:</strong> {selectedOrderDetails.customerName}</p>
                  <p><strong className="text-stone-900">Payment:</strong> {selectedOrderDetails.paymentMethod.toUpperCase()} ({selectedOrderDetails.paymentStatus.toUpperCase()})</p>
                  <p><strong className="text-stone-900">Date:</strong> {selectedOrderDetails.createdAt instanceof Date ? selectedOrderDetails.createdAt.toLocaleString() : 'Just now'}</p>
                </div>

                <div className="border-t border-dashed border-stone-300 my-2" />

                <div className="space-y-2 text-left text-[11px] text-stone-900">
                  {selectedOrderDetails.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex flex-col">
                      <div className="flex justify-between font-semibold">
                        <span>
                          {it.quantity}x {it.name} <span className="text-stone-600 text-[10px]">({it.selectedSize})</span>
                        </span>
                        <span>₱{it.price * it.quantity}</span>
                      </div>
                      {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                        <span className="text-[10px] text-stone-700 pl-4 mt-0.5 font-medium">+ {it.selectedAddOns.join(', ')}</span>
                      )}
                      {it.notes && (
                        <span className="text-[10px] text-stone-700 pl-4 italic mt-0.5 font-medium">"{it.notes}"</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-stone-300 my-2" />

                <div className="space-y-1 text-right text-[11px] pr-2 text-stone-900 font-semibold">
                  <p>Subtotal: ₱{selectedOrderDetails.subtotal}</p>
                  {selectedOrderDetails.discount > 0 && <p className="text-emerald-700 font-bold">Discount: -₱{selectedOrderDetails.discount}</p>}
                  <p className="text-xs font-black text-stone-900 pt-0.5">Final Total: ₱{selectedOrderDetails.total}</p>
                  {selectedOrderDetails.cashReceived !== undefined && (
                    <>
                      <p>Cash Rendered: ₱{selectedOrderDetails.cashReceived}</p>
                      <p className="text-emerald-700">Change Due: ₱{selectedOrderDetails.change}</p>
                    </>
                  )}
                  {selectedOrderDetails.pointsEarned > 0 && (
                    <p className="text-amber-900 font-extrabold mt-1">★ Points Earned: +{selectedOrderDetails.pointsEarned} pts</p>
                  )}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedOrderDetails(null);
                  window.print();
                }}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt Document</span>
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING CART NOTIFICATION PILL ABOVE BOTTOM BAR */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && !isCheckoutOpen && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-14 left-0 right-0 z-40 max-w-sm mx-auto px-3 pointer-events-none"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full pointer-events-auto bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:from-[#b8934c] hover:to-[#d2ad65] text-black font-extrabold py-2 px-3.5 rounded-xl shadow-[0_6px_20px_rgba(197,160,89,0.35)] flex items-center justify-between cursor-pointer border border-[#f5d9a6]/50"
            >
              <div className="flex items-center gap-2">
                <div className="bg-black text-[#c5a059] text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </div>
                <span className="text-[11px] tracking-wide">View Bag Items</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-black">
                <span>₱{cartTotal}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. PERSISTENT MOBILE NAVIGATION BAR (COMPACT) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0e14]/95 backdrop-blur-xl border-t border-[#c5a059]/20 shadow-[0_-8px_25px_rgba(0,0,0,0.8)] px-2 py-1 max-w-sm sm:max-w-md mx-auto">
        {/* Subtle Ambient Gold Glow Top Edge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/60 to-transparent" />

        <div className="flex items-center justify-around">
          {[
            { 
              id: 'menu', 
              label: 'Menu', 
              icon: Coffee,
              badge: null
            },
            { 
              id: 'orders', 
              label: 'Orders', 
              icon: ReceiptText,
              badge: activeOrdersCount > 0 ? (
                <span className="absolute -top-0.5 -right-1 bg-amber-500 text-black text-[7.5px] font-black w-3 h-3 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {activeOrdersCount}
                </span>
              ) : null
            },
            { 
              id: 'profile', 
              label: 'VIP Pass', 
              icon: QrCode,
              badge: null
            }
          ].map((tab, idx) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.88 }}
                whileHover={{ y: -1 }}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsCartOpen(false);
                }}
                className={`relative flex flex-col items-center gap-0 py-0.5 px-2 rounded-xl cursor-pointer group select-none ${
                  isSelected 
                    ? 'text-white' 
                    : 'text-white/40 hover:text-white/80'
                }`}
              >
                {/* FLOATING ICON DOCK CONTAINER */}
                <motion.div 
                  className="relative"
                  animate={
                    isSelected 
                      ? { y: [-0.5, -3, -0.5] } 
                      : { y: [0, -1.5, 0] }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: isSelected ? 2.4 : 3.2,
                    ease: "easeInOut",
                    delay: isSelected ? 0 : idx * 0.3
                  }}
                >
                  {/* Subtle Glowing Aura for Active Tab */}
                  {isSelected && (
                    <motion.div
                      animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.25, 0.5, 0.25] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                      className="absolute inset-0 bg-[#c5a059]/35 rounded-lg blur-xs -z-10"
                    />
                  )}

                  {isSelected && (
                    <motion.div
                      layoutId="activeDockPill"
                      className="absolute inset-0 bg-gradient-to-b from-[#c5a059] to-[#8f6d2b] rounded-lg shadow-sm shadow-[#c5a059]/30 ring-1 ring-[#f5d9a6]/50"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  <div className={`relative z-10 p-1 w-6.5 h-6.5 rounded-lg transition-all duration-150 flex items-center justify-center ${
                    isSelected
                      ? 'text-black font-extrabold'
                      : 'bg-white/[0.04] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white/90'
                  }`}>
                    <Icon className={`w-3 h-3 transition-transform ${isSelected ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
                    {tab.badge}
                  </div>
                </motion.div>

                {/* LABEL */}
                <span className={`text-[8.5px] tracking-wider uppercase font-bold mt-0.5 leading-none transition-colors ${
                  isSelected ? 'text-[#c5a059] font-black' : 'text-white/40 group-hover:text-white/70'
                }`}>
                  {tab.label}
                </span>

                {/* ACTIVE GLOW DOT */}
                {isSelected && (
                  <motion.span 
                    layoutId="activeDockDot"
                    className="w-0.5 h-0.5 rounded-full bg-[#c5a059] shadow-[0_0_4px_#c5a059] mt-0.5"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
export default CustomerExperience;
