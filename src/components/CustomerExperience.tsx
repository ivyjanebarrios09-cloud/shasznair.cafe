import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageUpload } from './ImageUpload';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Product, CartItem, OrderType, PaymentMethod, OrderStatus, getPaymentMethodDisplayName } from '../types';
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
  Printer, ShieldCheck, Camera, Save, Upload, UserCheck, Layers, Ticket
} from 'lucide-react';

export const CustomerExperience: React.FC = () => {
  const {
    categories,
    products,
    vouchers,
    userVouchers,
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
    claimVoucher,
    placeOrder,
    settings,
    logout,
    updateUserProfile,
    updateDocument,
    loyaltyTransactions
  } = useCoffeeApp();

  // Navigation Tabs: 'menu' | 'orders' | 'profile'
  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
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
  const [checkoutReceiptUrl, setCheckoutReceiptUrl] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);

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
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

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
    const matchSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || 
                     p.category === selectedCategory ||
                     categories.some(c => (c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()) && 
                                          (c.id === p.category || c.name.toLowerCase() === (p.category || '').toLowerCase()));
    return matchSearch && matchCat && p.available !== false;
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
    } else if (appliedVoucher.discountType === 'free_item') {
      const freeItem = cart.find(item => item.product.name.toLowerCase() === appliedVoucher.freeItemName?.toLowerCase());
      if (freeItem) {
        // Discount the price of one instance of the product (base price + size adjustment + addons)
        const itemUnitPrice = freeItem.product.price + (freeItem.selectedSize?.priceAdjustment || 0) + freeItem.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
        cartDiscount = itemUnitPrice;
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
      const result = await placeOrder(
        orderType, 
        tableNo, 
        paymentMethod, 
        checkoutNotes,
        undefined,
        undefined,
        undefined,
        undefined,
        'web_app',
        undefined,
        undefined,
        checkoutReceiptUrl
      );
      setOrderSubmitted(result);
      setIsCheckoutOpen(false);
      clearCart();
      setCheckoutReceiptUrl('');
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
            <h1 className={`text-base sm:text-lg font-black font-serif leading-tight tracking-wider flex items-center gap-1.5 truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>
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
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-stone-400' : 'text-white/35'}`} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border outline-none focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/20 shadow-inner transition-all ${
                    isLight 
                      ? 'bg-white text-stone-900 border-stone-300 placeholder-stone-400 shadow-stone-100' 
                      : 'bg-[#121212] text-white border-white/10 placeholder-white/35'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      isLight ? 'text-stone-400 hover:text-stone-800 hover:bg-stone-200' : 'text-white/40 hover:text-white hover:bg-white/10'
                    }`}
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
                    className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer py-1 px-2 rounded-lg transition-colors ${
                      isLight ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60' : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-stone-800' : 'text-white/90'}`}>BEST SELLER</span>
                    {showBestSellers ? (
                      <ChevronUp className={`w-3.5 h-3.5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
                    ) : (
                      <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
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
                      : isLight
                        ? 'bg-white border border-stone-300 text-stone-700 hover:text-stone-900 shadow-xs'
                        : 'bg-[#121212] border border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Menu</span>
                </motion.button>
                {categories.filter(c => c.active !== false).map(cat => (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-[#c5a059] text-black shadow-[0_0_8px_rgba(197,160,89,0.3)] font-bold'
                        : isLight
                          ? 'bg-white border border-stone-300 text-stone-700 hover:text-stone-900 shadow-xs'
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
                  className={`rounded-2xl p-4 border shadow-lg relative overflow-hidden text-white ${
                    isLight 
                      ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 border-amber-900/30' 
                      : 'bg-gradient-to-br from-[#121212] to-[#080808] border-white/10'
                  }`}
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
              <div className="space-y-8 pb-12">
                
                {/* Loop Categories */}
                {(() => {
                  const activeCats = categories.filter(c => c.active !== false);
                  
                  // If a specific category is selected, just show that single category section
                  const renderedCats = selectedCategory === 'all' 
                    ? activeCats 
                    : activeCats.filter(c => c.id === selectedCategory);
                    
                  // Gather products that don't match any active category
                  const uncategorized = filteredProducts.filter(p => {
                    return !activeCats.some(cat => {
                      const pCat = (p.category || '').toLowerCase().trim();
                      const cId = (cat.id || '').toLowerCase().trim();
                      const cName = (cat.name || '').toLowerCase().trim();
                      return pCat === cId || pCat === cName;
                    });
                  });

                  // We check if we have any matching products inside selected categories
                  const totalMatchedCount = renderedCats.reduce((sum, cat) => {
                    const countForCat = filteredProducts.filter(p => {
                      const pCat = (p.category || '').toLowerCase().trim();
                      const cId = (cat.id || '').toLowerCase().trim();
                      const cName = (cat.name || '').toLowerCase().trim();
                      return pCat === cId || pCat === cName;
                    }).length;
                    return sum + countForCat;
                  }, 0);

                  if (totalMatchedCount === 0 && uncategorized.length === 0) {
                    return (
                      <div className={`rounded-2xl p-8 border text-center space-y-2 ${isLight ? 'bg-white border-stone-200 text-stone-700 shadow-sm' : 'bg-[#121212] border-white/10 text-white/50'}`}>
                        <p className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>No results found matching your selection.</p>
                        <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-white/30'}`}>Try adjusting your search filters.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {renderedCats.map(cat => {
                        const catProducts = filteredProducts.filter(p => {
                          const pCat = (p.category || '').toLowerCase().trim();
                          const cId = (cat.id || '').toLowerCase().trim();
                          const cName = (cat.name || '').toLowerCase().trim();
                          return pCat === cId || pCat === cName;
                        });

                        if (catProducts.length === 0) {
                          if (selectedCategory === cat.id) {
                            return (
                              <div key={cat.id} className={`rounded-2xl p-8 border text-center space-y-2 ${isLight ? 'bg-white border-stone-200 text-stone-700 shadow-sm' : 'bg-[#121212] border-white/10 text-white/50'}`}>
                                <p className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>No products found in "{cat.name}".</p>
                              </div>
                            );
                          }
                          return null;
                        }

                        return (
                          <div key={cat.id} className="space-y-3">
                            <div className="flex items-center justify-between border-b pb-1.5 px-1 border-stone-200/50 dark:border-white/5">
                              <div className="flex items-center gap-1.5">
                                <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-3.5 h-3.5 text-[#c5a059]" />
                                <h3 className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-stone-800' : 'text-white/90'}`}>
                                  {cat.name}
                                </h3>
                              </div>
                              <span className={`text-[9px] font-mono font-medium ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                                {catProducts.length} {catProducts.length === 1 ? 'item' : 'items'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                              {catProducts.map(prod => {
                                const isOutOfStock = prod.stockTracking && prod.stockQuantity === 0;
                                const isLowStock = prod.stockTracking && prod.stockQuantity <= 10 && prod.stockQuantity > 0;
                                const prodCat = categories.find(c => c.id === prod.category)?.name || prod.category;

                                return (
                                  <motion.div
                                    key={prod.id}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => !isOutOfStock && handleOpenCustomize(prod)}
                                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative group select-none cursor-pointer ${
                                      isLight 
                                        ? 'bg-white border-stone-200/90 shadow-sm hover:shadow-md hover:border-[#c5a059]' 
                                        : 'bg-[#121212] border-white/10 shadow-md hover:border-[#c5a059]/40'
                                    } ${
                                      isOutOfStock ? 'opacity-70 cursor-not-allowed border-rose-500/30' : ''
                                    }`}
                                  >
                                    {/* Square Thumbnail */}
                                    <div className={`w-full aspect-square relative overflow-hidden border-b ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-[#080808] border-white/5'}`}>
                                      <img
                                        src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'}
                                        alt={prod.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />

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
                                        <h3 className={`font-bold text-xs truncate leading-tight ${isLight ? 'text-stone-900' : 'text-white'}`} title={prod.name}>
                                          {prod.name}
                                        </h3>
                                        {prod.description && (
                                          <p className={`text-[10px] line-clamp-1 leading-snug ${isLight ? 'text-stone-600' : 'text-white/50'}`}>
                                            {prod.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className={`flex items-center justify-between pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
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
                                              ? isLight ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-white/5 text-white/30 cursor-not-allowed'
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
                          </div>
                        );
                      })}

                      {/* Render Uncategorized items if any and selectedCategory is all */}
                      {selectedCategory === 'all' && uncategorized.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-1.5 px-1 border-stone-200/50 dark:border-white/5">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                              <h3 className={`text-xs font-black uppercase tracking-widest ${isLight ? 'text-stone-800' : 'text-white/90'}`}>
                                Other Creations
                              </h3>
                            </div>
                            <span className={`text-[9px] font-mono font-medium ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                              {uncategorized.length} {uncategorized.length === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                            {uncategorized.map(prod => {
                              const isOutOfStock = prod.stockTracking && prod.stockQuantity === 0;
                              const isLowStock = prod.stockTracking && prod.stockQuantity <= 10 && prod.stockQuantity > 0;

                              return (
                                  <motion.div
                                    key={prod.id}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => !isOutOfStock && handleOpenCustomize(prod)}
                                    className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative group select-none cursor-pointer ${
                                      isLight 
                                        ? 'bg-white border-stone-200/90 shadow-sm hover:shadow-md hover:border-[#c5a059]' 
                                        : 'bg-[#121212] border-white/10 shadow-md hover:border-[#c5a059]/40'
                                    } ${
                                      isOutOfStock ? 'opacity-70 cursor-not-allowed border-rose-500/30' : ''
                                    }`}
                                  >
                                    {/* Square Thumbnail */}
                                    <div className={`w-full aspect-square relative overflow-hidden border-b ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-[#080808] border-white/5'}`}>
                                      <img
                                        src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'}
                                        alt={prod.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />

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
                                        <h3 className={`font-bold text-xs truncate leading-tight ${isLight ? 'text-stone-900' : 'text-white'}`} title={prod.name}>
                                          {prod.name}
                                        </h3>
                                        {prod.description && (
                                          <p className={`text-[10px] line-clamp-1 leading-snug ${isLight ? 'text-stone-600' : 'text-white/50'}`}>
                                            {prod.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className={`flex items-center justify-between pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
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
                                              ? isLight ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-white/5 text-white/30 cursor-not-allowed'
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
                        </div>
                      )}
                    </>
                  );
                })()}
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
              <h2 className={`text-base font-bold font-serif tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>Order History & Tracking</h2>

              {customerOrders.length === 0 ? (
                <div className={`rounded-2xl p-8 border text-center space-y-3 shadow-md ${isLight ? 'bg-white border-stone-200 text-stone-600' : 'bg-[#121212] border-white/10 text-white/50'}`}>
                  <div className="w-12 h-12 bg-[#c5a059]/10 text-[#c5a059] rounded-2xl flex items-center justify-center mx-auto border border-[#c5a059]/20 shadow-inner">
                    <ReceiptText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>No orders placed yet</p>
                    <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Head over to the menu to order your first brew!</p>
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
                        className={`rounded-xl p-4 border shadow-md space-y-3 ${
                          isLight ? 'bg-white' : 'bg-[#121212]'
                        } ${
                          isActive ? 'border-[#c5a059]/60 ring-1 ring-[#c5a059]/20' : isLight ? 'border-stone-200' : 'border-white/10'
                        }`}
                      >
                        <div className={`flex justify-between items-start text-xs pb-2 border-b ${isLight ? 'border-stone-100' : 'border-white/5'}`}>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className={`font-mono font-semibold ${isLight ? 'text-stone-700' : 'text-white/50'}`}>{ord.orderNumber}</p>
                              <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                              }`}>
                                {ord.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                                {ord.orderSource === 'pos' ? 'POS Counter' : 'Online App'}
                              </span>
                            </div>
                            <p className={`${isLight ? 'text-stone-500' : 'text-white/30'} mt-0.5 text-[10px]`}>
                              {ord.createdAt instanceof Date ? ord.createdAt.toLocaleString() : 'Just now'}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ord.orderStatus === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/30' :
                            ord.orderStatus === 'cancelled' ? 'bg-rose-950 text-rose-300 border border-rose-900/30' :
                            ord.orderStatus === 'ready' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/30 animate-pulse' :
                            ord.orderStatus === 'preparing' ? 'bg-amber-950 text-amber-300 border border-amber-900/30' :
                            isLight ? 'bg-stone-100 text-stone-800 border border-stone-300' : 'bg-white/5 text-white/70 border border-white/10'
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </div>

                        {/* Item summaries */}
                        <div className={`text-xs space-y-2 max-h-32 overflow-y-auto pr-2 ${isLight ? 'text-stone-800' : 'text-white/80'}`}>
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex flex-col">
                              <div className="flex justify-between">
                                <span className={`font-medium ${isLight ? 'text-stone-900' : 'text-white/90'}`}>{it.quantity}x {it.name} <span className={isLight ? 'text-stone-500' : 'text-white/40'}>({it.selectedSize})</span></span>
                                <span className="text-[#c5a059] font-bold">₱{it.price * it.quantity}</span>
                              </div>
                              {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                                <span className={`text-[10px] pl-4 mt-0.5 ${isLight ? 'text-stone-600' : 'text-white/40'}`}>+ {it.selectedAddOns.join(', ')}</span>
                              )}
                              {it.notes && (
                                <span className={`text-[10px] pl-4 italic mt-0.5 ${isLight ? 'text-stone-500' : 'text-white/30'}`}>"{it.notes}"</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Status Tracker step indicators if order is active */}
                        {isActive && (
                          <div className={`rounded-lg p-2.5 space-y-2 border ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#080808] border-white/5'}`}>
                            <p className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-spin text-amber-700" /> Live Order Status Progress
                            </p>
                            <div className="grid grid-cols-4 gap-1 relative pt-2">
                              {/* Lines connecting steps */}
                              <div className={`absolute top-4 left-[12%] right-[12%] h-0.5 z-0 ${isLight ? 'bg-stone-300' : 'bg-white/10'}`}>
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
                                        : isLight ? 'bg-stone-200 text-stone-500' : 'bg-white/10 text-white/40'
                                    }`}>
                                      {isPastOrCurrent ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-[9px] mt-1 font-semibold ${
                                      isPastOrCurrent ? 'text-amber-800 font-bold' : isLight ? 'text-stone-500' : 'text-white/30'
                                    }`}>{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs pt-1">
                          <div>
                            <p className={`${isLight ? 'text-stone-500' : 'text-white/40'} text-[10px]`}>Total Charged</p>
                            <p className="text-sm font-extrabold text-[#c5a059]">₱{ord.total}</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setSelectedOrderDetails(ord)}
                            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer border transition-all ${
                              isLight 
                                ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800' 
                                : 'bg-white/5 hover:border-[#c5a059] border-white/10 text-white/80 hover:text-white'
                            }`}
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
                <h2 className={`text-base font-bold font-serif tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>Customer Account Profile</h2>
                <button
                  onClick={handleOpenEditProfile}
                  className="px-3 py-1.5 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] hover:bg-[#c5a059]/25 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* PROFILE CARD */}
              <div className={`rounded-2xl p-5 border shadow-lg space-y-4 text-center ${isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'}`}>
                {/* AVATAR & HEADER */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div className={`w-20 h-20 rounded-full overflow-hidden border-2 border-[#c5a059]/50 shadow-md flex items-center justify-center ${isLight ? 'bg-stone-100' : 'bg-[#080808]'}`}>
                      {currentUser?.avatar || currentUser?.photoURL ? (
                        <img 
                          src={currentUser.avatar || currentUser.photoURL} 
                          alt={currentUser.name || 'User Profile'} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-serif text-2xl font-black ${isLight ? 'bg-stone-100 text-[#c5a059]' : 'bg-[#1c1c1c] text-[#c5a059]'}`}>
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-8 h-8 opacity-60" />}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleOpenEditProfile}
                      className={`absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#c5a059] text-black border-2 flex items-center justify-center shadow hover:bg-[#b08c47] transition-all cursor-pointer ${isLight ? 'border-white' : 'border-[#121212]'}`}
                      title="Change Profile Photo"
                      aria-label="Change Profile Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className={`text-base font-bold tracking-wide leading-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
                      {currentUser?.name || currentUser?.displayName || "Guest Customer"}
                    </h3>
                    <p className="text-xs text-[#c5a059] font-medium">{currentUser?.email}</p>
                  </div>
                </div>

                {/* COMPACT DIGITAL LOYALTY PASS (QR CODE) */}
                <div className={`p-3.5 rounded-xl border space-y-2 flex flex-col items-center ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/5'}`}>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase text-amber-800 tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Digital Loyalty Pass</span>
                  </div>
                  
                  {/* COMPACT QR IMAGE */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-md relative border border-stone-200">
                    <img
                      src={getQRCodeUrl(currentUser?.uid || 'guest_unregistered')}
                      alt="Customer QR Identifier"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-center space-y-0.5">
                    <p className={`text-[9.5px] font-mono ${isLight ? 'text-stone-500' : 'text-white/40'}`}>ID: {currentUser?.uid.slice(0, 12)}...</p>
                    <p className={`text-[10px] max-w-[90%] leading-tight mx-auto ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                      Scan at checkout to earn points and claim rewards.
                    </p>
                  </div>
                </div>

                {/* STATS ROW */}
                <div className={`grid grid-cols-3 gap-2 text-center border-t border-b py-3 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                  <div className="space-y-0.5">
                    <span className={`text-[10px] font-semibold block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Total Visited</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#c5a059]">{currentUser?.orderCount || 0} Orders</strong>
                  </div>
                  <div className={`space-y-0.5 border-l border-r ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                    <span className={`text-[10px] font-semibold block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Total Spent</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#c5a059]">₱{currentUser?.lifetimeSpending || 0}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className={`text-[10px] font-semibold block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Points Balance</span>
                    <strong className="text-xs sm:text-sm font-extrabold text-[#c5a059]">{currentUser?.loyaltyPoints || 0} pts</strong>
                  </div>
                </div>

                {/* POINTS HISTORY */}
                <div className="space-y-2">
                  <button 
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex items-center justify-between w-full"
                  >
                    <h4 className={`text-xs font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>Points History</h4>
                    {isHistoryExpanded ? <ChevronUp size={16} className={isLight ? 'text-stone-900' : 'text-white'} /> : <ChevronDown size={16} className={isLight ? 'text-stone-900' : 'text-white'} />}
                  </button>
                  {isHistoryExpanded && (
                    <div className={`rounded-xl border ${isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'}`}>
                      {loyaltyTransactions.length === 0 ? (
                        <p className="p-4 text-center text-xs text-stone-500">No points history yet.</p>
                      ) : (
                        loyaltyTransactions.map((tx) => (
                          <div key={tx.id} className={`p-3 border-b last:border-0 ${isLight ? 'border-stone-100' : 'border-white/5'} flex justify-between`}>
                            <div>
                              <p className={`text-xs font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{tx.description}</p>
                              <p className="text-[10px] text-stone-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-xs font-bold ${tx.pointsChanged > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {tx.pointsChanged > 0 ? '+' : ''}{tx.pointsChanged}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* PERSONAL INFO DETAILS */}
                <div className="text-left space-y-2 text-xs">
                  <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                    <span className={isLight ? 'text-stone-500' : 'text-white/40'}>Full Name</span>
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white/90'}`}>{currentUser?.name || currentUser?.displayName || 'Not Specified'}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                    <span className={isLight ? 'text-stone-500' : 'text-white/40'}>Email Address</span>
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white/90'}`}>{currentUser?.email}</span>
                  </div>
                  <div className={`flex justify-between border-b pb-1.5 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                    <span className={isLight ? 'text-stone-500' : 'text-white/40'}>Mobile Phone</span>
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white/90'}`}>{currentUser?.phone || currentUser?.phoneNumber || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isLight ? 'text-stone-500' : 'text-white/40'}>Member Since</span>
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white/90'}`}>
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
                  className={`w-full font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 border ${
                    isLight ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Update Name, Phone & Photo</span>
                </button>

                {/* Secure logout button for regular users */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => logout()}
                  id="customer-logout-btn"
                  className={`w-full font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 ${
                    isLight ? 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700' : 'bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/30 text-rose-300'
                  }`}
                >
                  Sign Out of Account
                </motion.button>
              </div>

              {/* LOYALTY REWARDS / VOUCHERS CLAIM SECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Gift className="w-4 h-4 text-[#c5a059]" />
                  <h3 className={`font-serif font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>Available Loyalty Rewards</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {vouchers.filter(v => v.active && v.claimableViaPoints).length === 0 ? (
                    <div className={`p-8 text-center rounded-2xl border border-dashed ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                      <p className={`text-xs ${isLight ? 'text-stone-400' : 'text-white/30'}`}>No point-based rewards available at the moment.</p>
                    </div>
                  ) : (
                    vouchers.filter(v => v.active && v.claimableViaPoints).map(v => {
                      const canAfford = (currentUser?.loyaltyPoints || 0) >= (v.pointCost || 0);
                      return (
                        <div key={v.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-md'}`}>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold bg-[#c5a059]/10 text-[#c5a059] px-2 py-0.5 rounded border border-[#c5a059]/20">
                                {v.code}
                              </span>
                              <h4 className={`text-xs font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{v.name}</h4>
                            </div>
                            <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{v.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                v.discountType === 'free_item' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#c5a059]/10 text-[#c5a059]'
                              }`}>
                                {v.discountType === 'free_item' ? `Free ${v.freeItemName}` : v.discountType === 'percentage' ? `${v.discountValue}% OFF` : `₱${v.discountValue} OFF`}
                              </span>
                              <span className="text-[10px] font-bold text-stone-400">• {v.pointCost} points</span>
                            </div>
                          </div>

                          <button
                            disabled={!canAfford || isClaiming === v.id}
                            onClick={async () => {
                              if (window.confirm(`Confirm redemption: Spend ${v.pointCost} points for "${v.name}"?`)) {
                                setIsClaiming(v.id);
                                try {
                                  await claimVoucher(v.id);
                                  alert("Success! Your reward has been added to your account.");
                                } catch (err: any) {
                                  alert(err.message || "Failed to claim voucher.");
                                } finally {
                                  setIsClaiming(null);
                                }
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                              canAfford 
                                ? 'bg-amber-900 hover:bg-amber-950 text-white shadow-sm active:scale-95' 
                                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            {isClaiming === v.id ? 'Claiming...' : canAfford ? 'Claim Reward' : 'Not Enough Points'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* MY CLAIMED VOUCHERS */}
              {userVouchers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Ticket className="w-4 h-4 text-emerald-600" />
                    <h3 className={`font-serif font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>My Claimed Vouchers</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {userVouchers.map(uv => (
                      <div key={uv.id} className={`p-4 rounded-2xl border relative overflow-hidden ${isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'}`}>
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                          <Ticket className="w-12 h-12 -rotate-12" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className={`text-xs font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{uv.name}</h4>
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                              {uv.instanceCode}
                            </span>
                          </div>
                          <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{uv.description}</p>
                          <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
                            <span className="text-[9px] text-stone-400 italic">Valid until {uv.expirationDate}</span>
                            <button
                              onClick={() => {
                                setVoucherCodeInput(uv.instanceCode);
                                setIsCartOpen(true);
                                setActiveTab('menu');
                              }}
                              className="text-[#c5a059] text-[10px] font-bold hover:underline cursor-pointer"
                            >
                              Use in Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      className={`relative z-10 border w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 overflow-hidden text-left ${
                        isLight ? 'bg-white border-stone-200' : 'bg-[#141414] border-white/15'
                      }`}
                    >
                      <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center border border-[#c5a059]/30">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className={`font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>Edit Profile Details</h3>
                            <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Update your account information</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          disabled={isSavingProfile}
                          className={`p-1 rounded-lg transition-colors ${
                            isLight ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                          }`}
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
                          <label className={`text-[10px] font-extrabold uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                            Profile Photo
                          </label>
                          <div className="flex items-center gap-3">
                            <div className={`w-14 h-14 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ${
                              isLight ? 'border-stone-300 bg-stone-100' : 'border-white/20 bg-[#080808]'
                            }`}>
                              {editAvatar ? (
                                <img 
                                  src={editAvatar} 
                                  alt="Preview" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <User className={`w-6 h-6 ${isLight ? 'text-stone-400' : 'text-white/30'}`} />
                              )}
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-95 ${
                                isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300' : 'bg-white/10 hover:bg-white/15 text-white border-white/10'
                              }`}>
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
                                  className="text-[10px] text-rose-500 hover:text-rose-600 block font-semibold"
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
                              className={`w-full border text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#c5a059]/60 ${
                                isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400' : 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/30'
                              }`}
                            />
                          </div>
                        </div>

                        {/* NAME INPUT */}
                        <div className="space-y-1">
                          <label className={`text-[10px] font-extrabold uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g. Maria Santos"
                            className={`w-full border text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#c5a059]/60 font-medium ${
                              isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400' : 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/30'
                            }`}
                          />
                        </div>

                        {/* PHONE NUMBER INPUT */}
                        <div className="space-y-1">
                          <label className={`text-[10px] font-extrabold uppercase tracking-wider block ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                            Mobile Phone Number
                          </label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="e.g. +63 912 345 6789"
                            className={`w-full border text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#c5a059]/60 font-medium ${
                              isLight ? 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400' : 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/30'
                            }`}
                          />
                        </div>

                        {/* FORM ACTIONS */}
                        <div className={`flex items-center gap-2 pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
                          <button
                            type="button"
                            disabled={isSavingProfile}
                            onClick={() => setIsEditingProfile(false)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-700' : 'bg-white/5 hover:bg-white/10 text-white/70'
                            }`}
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
                      <select
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        disabled={!!appliedVoucher}
                        className="flex-1 text-xs bg-white border border-stone-200 outline-none py-2 px-3 rounded-xl uppercase font-mono focus:border-amber-800 disabled:bg-stone-100 disabled:text-stone-400"
                      >
                        <option value="">Select a voucher</option>
                        {vouchers.filter(v => v.active).map(v => (
                          <option key={v.id} value={v.code}>{v.name} ({v.code})</option>
                        ))}
                      </select>
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
                        <span className="font-bold">
                          {appliedVoucher.discountType === 'free_item' 
                            ? `FREE ${appliedVoucher.freeItemName?.toUpperCase()}` 
                            : `-${appliedVoucher.discountType === 'percentage' ? `${appliedVoucher.discountValue}%` : `₱${appliedVoucher.discountValue}`}`}
                        </span>
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
                    const isEWallet = selectedMethod?.type === 'qr' || selectedMethod?.type === 'ewallet' || selectedMethod?.id === 'gcash' || selectedMethod?.id === 'ewallet' || paymentMethod === 'gcash' || paymentMethod === 'ewallet';
                    if (selectedMethod && isEWallet) {
                      const accountNumber = selectedMethod.accountNumber || "0917 123 4567";
                      const qrUrl = selectedMethod.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=GCash-Transfer-${accountNumber.replace(/\s+/g, '')}`;
                      return (
                        <div className="mt-3 p-4 bg-amber-50/40 border border-stone-200 rounded-xl flex flex-col items-center text-center space-y-3 animate-fade-in">
                          <p className="text-xs font-extrabold text-stone-800">Scan or Transfer to pay via {selectedMethod.name}</p>
                          <div className="bg-amber-950/10 text-amber-950 font-mono font-bold text-xs py-1.5 px-3 rounded-lg border border-amber-900/10 flex items-center gap-1.5">
                            <span>No./Account:</span>
                            <span className="text-amber-900 tracking-wider select-all">{accountNumber}</span>
                          </div>
                          <img src={qrUrl} alt={`${selectedMethod.name} QR Code`} className="w-40 h-40 object-contain rounded-lg border border-stone-150 bg-white p-1 shadow-xs" />
                          <p className="text-[10px] text-stone-500 leading-relaxed font-medium">Please send the exact amount and upload your payment proof/receipt image below for verification.</p>
                          
                          {/* Receipt Upload Input at Checkout */}
                          <div className="w-full pt-2 border-t border-stone-200/50 text-left">
                            <label className="text-[10px] font-extrabold uppercase text-stone-600 tracking-wider block mb-1.5">Upload Payment Receipt</label>
                            <div className="flex items-center gap-2">
                              {checkoutReceiptUrl && (
                                <img src={checkoutReceiptUrl} alt="Receipt Preview" className="w-10 h-10 rounded-lg object-cover border border-stone-300 bg-white" />
                              )}
                              <div className="flex-1">
                                <ImageUpload
                                  label="Select Receipt"
                                  folder="receipts"
                                  onUploadSuccess={(url) => setCheckoutReceiptUrl(url)}
                                />
                              </div>
                            </div>
                            {uploadingReceipt && <p className="text-[9px] text-amber-800 animate-pulse mt-1 font-semibold">Uploading proof of payment...</p>}
                          </div>
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
                  <p><strong className="text-stone-900">Payment:</strong> {getPaymentMethodDisplayName(selectedOrderDetails.paymentMethod, settings.paymentMethods)} ({selectedOrderDetails.paymentStatus.toUpperCase()})</p>
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

              {/* QR payment details and receipt upload block inside details modal */}
              {selectedOrderDetails && (selectedOrderDetails.paymentStatus === 'unpaid' || selectedOrderDetails.paymentStatus === 'pending') && (
                (() => {
                  const selectedMethod = (settings.paymentMethods || []).find(m => m.id === selectedOrderDetails.paymentMethod || m.name.toLowerCase() === selectedOrderDetails.paymentMethod.toLowerCase());
                  if (selectedMethod && (selectedMethod.type === 'qr' || selectedMethod.type === 'other')) {
                    return (
                      <div className="bg-amber-50/50 border border-stone-200 p-3.5 rounded-xl space-y-2.5 text-center text-xs">
                        <p className="font-extrabold text-stone-850">Payment Instructions ({selectedMethod.name})</p>
                        {selectedMethod.accountNumber && (
                          <div className="bg-amber-900/10 text-amber-950 font-mono font-bold text-[11px] py-1.5 px-3 rounded-lg border border-amber-900/10 flex items-center justify-center gap-1.5">
                            <span>No./Account:</span>
                            <span className="text-amber-900 tracking-wider select-all">{selectedMethod.accountNumber}</span>
                          </div>
                        )}
                        {selectedMethod.qrCodeUrl && (
                          <img src={selectedMethod.qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto object-contain bg-white rounded-lg border p-1 shadow-xs" />
                        )}
                        
                        {/* Receipt Upload/Display inside details */}
                        <div className="text-left border-t border-stone-200/60 pt-2.5">
                          <label className="text-[10px] font-extrabold uppercase text-stone-600 tracking-wider block mb-1.5">
                            {selectedOrderDetails.receiptUrl ? 'Update Uploaded Receipt' : 'Upload Payment Receipt'}
                          </label>
                          {selectedOrderDetails.receiptUrl && (
                            <div className="mb-2">
                              <p className="text-[10px] text-stone-500 mb-1">Current Uploaded Receipt:</p>
                              <img 
                                src={selectedOrderDetails.receiptUrl} 
                                alt="Receipt Proof" 
                                className="w-full h-32 object-contain rounded-lg border border-stone-300 bg-white" 
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <ImageUpload
                                label="Select Receipt"
                                folder="receipts"
                                onUploadSuccess={async (url) => {
                                  try {
                                    // Update Firestore!
                                    await updateDocument('orders', selectedOrderDetails.id, { 
                                      receiptUrl: url, 
                                      paymentStatus: 'pending' // Move to pending verification status
                                    });
                                    
                                    // Update local state for immediate modal feedback
                                    setSelectedOrderDetails((prev: any) => ({
                                      ...prev,
                                      receiptUrl: url,
                                      paymentStatus: 'pending'
                                    }));
                                    alert("Receipt successfully uploaded! POS cashier will verify your payment.");
                                  } catch (err: any) {
                                    alert("Failed to update order with receipt: " + err.message);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* If already completed/paid/preparing, but they want to view their uploaded receipt */}
              {selectedOrderDetails && selectedOrderDetails.receiptUrl && selectedOrderDetails.paymentStatus !== 'unpaid' && selectedOrderDetails.paymentStatus !== 'pending' && (
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-left text-xs space-y-1">
                  <p className="font-bold text-stone-700">Uploaded Receipt (Verified):</p>
                  <img 
                    src={selectedOrderDetails.receiptUrl} 
                    alt="Receipt Proof" 
                    className="w-full h-32 object-contain rounded-lg border border-stone-300" 
                  />
                </div>
              )}

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
      <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-2 py-1 max-w-sm sm:max-w-md mx-auto transition-colors ${
        isLight 
          ? 'bg-white/95 border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]' 
          : 'bg-[#0d0e14]/95 border-[#c5a059]/20 shadow-[0_-8px_25px_rgba(0,0,0,0.8)]'
      }`}>
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
                    ? isLight ? 'text-stone-900' : 'text-white'
                    : isLight ? 'text-stone-500 hover:text-stone-800' : 'text-white/40 hover:text-white/80'
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
                      : isLight 
                        ? 'bg-stone-100 text-stone-600 group-hover:bg-stone-200 group-hover:text-stone-900' 
                        : 'bg-white/[0.04] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white/90'
                  }`}>
                    <Icon className={`w-3 h-3 transition-transform ${isSelected ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
                    {tab.badge}
                  </div>
                </motion.div>

                {/* LABEL */}
                <span className={`text-[8.5px] tracking-wider uppercase font-bold mt-0.5 leading-none transition-colors ${
                  isSelected ? 'text-[#c5a059] font-black' : isLight ? 'text-stone-500 group-hover:text-stone-800' : 'text-white/40 group-hover:text-white/70'
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
