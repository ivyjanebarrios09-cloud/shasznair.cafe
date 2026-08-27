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
  MapPin, Clock, Gift, Check, QrCode, 
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

  const activeCategories = categories.filter(c => c.active !== false);

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
  const primaryColor = settings?.branding?.primaryColor || '#c5a059';
  const secondaryColor = settings?.branding?.secondaryColor || '#1c1917';
  const accentColor = settings?.branding?.accentColor || '#10b981';

  const stickyHeaderClass = isAdmin ? `${isLight ? 'bg-stone-100 border-stone-200 text-stone-900' : 'bg-[#050505] border-white/10 text-[#f2f2f2]'} border-b sticky top-9 z-40 px-4 py-3 shadow-md flex items-center justify-between transition-colors` : `${isLight ? 'bg-stone-100 border-stone-200 text-stone-900' : 'bg-[#050505] border-white/10 text-[#f2f2f2]'} border-b sticky top-0 z-40 px-4 py-3 shadow-md flex items-center justify-between transition-colors`;
  const stickyBannerClass = isAdmin ? "bg-rose-950 text-rose-200 border-b border-rose-800 text-sm py-2.5 px-4 sticky top-[69px] z-40 shadow-md flex items-center justify-between animate-slide-down" : "bg-rose-950 text-rose-200 border-b border-rose-800 text-sm py-2.5 px-4 sticky top-14 z-40 shadow-md flex items-center justify-between animate-slide-down";

  // Filter orders for the current user
  const customerOrders = orders.filter(o => o.customerId === (currentUser?.uid || 'guest'));
  const activeOrdersCount = customerOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.orderStatus)).length;

  return (
    <div 
      className={`h-full w-full overflow-hidden ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} font-sans flex transition-colors duration-300`}
      style={{ 
        '--color-primary': primaryColor,
        '--color-secondary': secondaryColor,
        '--color-accent': accentColor,
      } as React.CSSProperties}
    >
      {/* SIDEBAR NAVIGATION - MATCHING SCREENSHOT EXACTLY */}
      <aside className={`w-14 sm:w-16 md:w-20 flex-shrink-0 flex flex-col items-center py-5 border-r ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-2xl'} z-30 select-none`}>
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-none py-2 items-center w-full">
          {/* "ALL" or Category items */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setSelectedCategory('all')}
            className="relative group flex flex-col items-center gap-1 cursor-pointer w-full"
          >
            {selectedCategory === 'all' && (
              <motion.div 
                layoutId="sidebarActive"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-9 rounded-r-full"
                style={{ backgroundColor: primaryColor, boxShadow: `0 0 12px ${primaryColor}cc` }}
              />
            )}
            <div 
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'font-black' 
                  : isLight ? 'bg-stone-100 text-stone-500 hover:bg-stone-200' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: primaryColor, color: '#000', boxShadow: `0 0 20px ${primaryColor}66` } : undefined}
            >
              <Coffee className="w-5 h-5" />
            </div>
            <span 
              className={`text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] [writing-mode:vertical-lr] transition-colors mt-0.5 ${
                selectedCategory === 'all' ? '' : isLight ? 'text-stone-400' : 'text-white/30'
              }`}
              style={selectedCategory === 'all' ? { color: primaryColor } : undefined}
            >
              ALL
            </span>
          </motion.button>

          {activeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            // Short category display label for vertical sidebar
            const shortLabel = cat.name.length > 8 ? cat.name.slice(0, 7) + '..' : cat.name;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedCategory(cat.id)}
                className="relative group flex flex-col items-center gap-1 cursor-pointer w-full"
              >
                {/* ACTIVE INDICATOR LINE */}
                {isSelected && (
                  <motion.div 
                    layoutId="sidebarActive"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-9 rounded-r-full"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 0 12px ${primaryColor}cc` }}
                  />
                )}

                <div 
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? 'font-black' 
                      : isLight ? 'bg-stone-100 text-stone-500 hover:bg-stone-200' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor, color: '#000', boxShadow: `0 0 20px ${primaryColor}66` } : undefined}
                >
                  <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-5 h-5" />
                </div>
                
                {/* VERTICAL TEXT FOR CATEGORY */}
                <span 
                  className={`text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] [writing-mode:vertical-lr] transition-colors mt-0.5 ${
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden relative grid-bg">
        {/* 1. BRAND HEADER (NO BURGER MENU, CLEAN IOS BRAND IDENTITY) */}
        <header className={`${isLight ? 'bg-white/90 border-stone-200 text-stone-900' : 'bg-[#121212]/95 border-white/10 text-white'} backdrop-blur-xl shrink-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between border-b transition-colors`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Branding Logo */}
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl overflow-hidden bg-black/40 border flex items-center justify-center shrink-0"
              style={{ borderColor: `${primaryColor}66`, boxShadow: `0 0 15px ${primaryColor}33` }}
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
                  className="w-full h-full flex items-center justify-center text-black font-serif font-black text-sm sm:text-lg"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
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
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${settings?.storeStatus?.isOpen !== false ? 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse' : 'bg-rose-400'}`} />
                <span className={`text-[8.5px] sm:text-[9px] font-extrabold ${isLight ? 'text-stone-500' : 'text-white/50'} tracking-wider uppercase truncate`}>
                  • SYSTEM {settings?.storeStatus?.isOpen !== false ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Actions: Download / Install App + Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <InstallAppButton />

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0"
              style={{ 
                backgroundColor: `${primaryColor}15`, 
                borderColor: `${primaryColor}50`, 
                color: primaryColor 
              }}
              title="Cart Tray"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {cart.length > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 0 10px ${primaryColor}80` }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-none px-3.5 sm:px-6 py-4 space-y-6 pb-28">
          <AnimatePresence mode="wait">
            {activeTab === 'menu' && (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 max-w-5xl"
              >
                {/* CATEGORY TITLE WITH ACCENT */}
                <div className="flex items-center gap-2 pt-1">
                  <div 
                    className="w-1.5 h-5 rounded-full" 
                    style={{ backgroundColor: primaryColor, boxShadow: `0 0 8px ${primaryColor}cc` }}
                  />
                  <h2 className={`text-base sm:text-lg font-black uppercase tracking-wider ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {selectedCategory === 'all' ? 'FULL CATALOG' : (categories.find(c => c.id === selectedCategory)?.name || selectedCategory)}
                  </h2>
                </div>

                {/* SEARCH BAR & BEST SELLER DROPDOWN ROW */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-stone-400' : 'text-white/30'}`} />
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
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs ${isLight ? 'text-stone-400 hover:text-stone-700' : 'text-white/40 hover:text-white'} cursor-pointer`}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowBestSellers(!showBestSellers)}
                    className={`shrink-0 px-3.5 py-3 rounded-2xl ${isLight ? 'bg-white border-stone-200 text-stone-800 hover:text-stone-950' : 'bg-[#121212] border-white/10 text-white/80 hover:text-white'} border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all`}
                    style={showBestSellers ? { borderColor: `${primaryColor}80` } : undefined}
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
                    className={`border ${isLight ? 'border-stone-200 bg-white/70' : 'border-white/10 bg-[#121212]'} backdrop-blur-md rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-xl`}
                    style={{ borderColor: `${primaryColor}40` }}
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
                          className={`min-w-[240px] sm:min-w-[260px] ${isLight ? 'bg-white border-stone-200 hover:border-stone-400' : 'bg-[#18181b] border-white/5 hover:bg-[#202024] hover:border-white/20'} border rounded-2xl p-2.5 sm:p-3 flex gap-3 items-center cursor-pointer transition-all shadow-md group`}
                        >
                          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/5">
                            <img 
                              src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300'} 
                              alt={prod.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                            />
                            <div 
                              className="absolute top-1.5 left-1.5 text-[7.5px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md"
                              style={{ backgroundColor: primaryColor, color: '#000' }}
                            >
                              <Flame size={7} /> {soldCount} sold
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                            <div>
                              <span className="text-[8px] font-black uppercase tracking-widest block" style={{ color: primaryColor }}>BEST SELLER</span>
                              <h4 className={`text-xs sm:text-sm font-bold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>{prod.name}</h4>
                              <p className={`text-[9px] uppercase truncate ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{prod.category}</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm sm:text-base font-black" style={{ color: primaryColor }}>₱{prod.price}</span>
                              <span 
                                className="text-[9px] font-extrabold px-2 py-1 rounded-lg border transition-all"
                                style={{ 
                                  backgroundColor: `${primaryColor}15`, 
                                  borderColor: `${primaryColor}40`, 
                                  color: primaryColor 
                                }}
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

                {/* PRODUCT GRID - 2 COLUMNS ON MOBILE MATCHING SCREENSHOT */}
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
                            {/* BEST SELLER / HOT BADGE */}
                            {bestSellerItems.some(item => item.product.id === prod.id) && (
                              <div 
                                className="absolute bottom-2 left-2 flex items-center gap-1 text-[7.5px] sm:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md"
                                style={{ backgroundColor: primaryColor, color: '#000' }}
                              >
                                <Flame size={8} fill="currentColor" /> BEST SELLER
                              </div>
                            )}
                          </div>

                          {/* Product Information */}
                          <div className="space-y-1 px-1">
                            <h4 className={`text-xs sm:text-sm font-bold leading-tight line-clamp-1 transition-colors ${isLight ? 'text-stone-900 group-hover:text-[var(--color-primary)]' : 'text-white group-hover:text-[var(--color-primary)]'}`}>
                              {prod.name}
                            </h4>
                            <p className={`text-[9.5px] sm:text-[11px] line-clamp-2 leading-snug ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                              {prod.description || `${prod.name} freshly brewed with signature recipe`}
                            </p>
                          </div>
                        </div>

                        {/* Price & Action Row */}
                        <div className={`pt-3 px-1 flex items-center justify-between border-t ${isLight ? 'border-stone-100' : 'border-white/5'} mt-2`}>
                          <div className="flex flex-col">
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none ${isLight ? 'text-stone-400' : 'text-white/30'}`}>PRICE</span>
                            <span className="text-sm sm:text-base font-black mt-0.5" style={{ color: primaryColor }}>₱{prod.price}</span>
                          </div>
                          <button 
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all shadow-md ${isLight ? 'bg-stone-100 border-stone-200 text-stone-700 group-hover:bg-[var(--color-primary)] group-hover:text-black group-hover:border-[var(--color-primary)]' : 'bg-white/5 border-white/10 text-white/60 group-hover:bg-[var(--color-primary)] group-hover:text-black group-hover:border-[var(--color-primary)]'}`}
                          >
                            <Plus size={14} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </motion.div>
                    ));
                  })}
                </div>
              </motion.div>
            )}
            
            {/* OTHER TABS (Orders, Profile) */}
            {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 pb-12"
              >
                <div className="flex items-center justify-between">
                  <h2 className={`text-base font-bold font-serif tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>Order History & Tracking</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Real-time Sync</span>
                  </div>
                </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerOrders.map(ord => {
                      const isActive = ['pending', 'preparing', 'ready'].includes(ord.orderStatus);
                      return (
                        <motion.div
                          key={ord.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl p-5 border shadow-lg space-y-4 ${
                            isLight ? 'bg-white' : 'bg-[#121212]'
                          } ${
                            isActive ? 'border-[#c5a059]/60 ring-1 ring-[#c5a059]/20' : isLight ? 'border-stone-200' : 'border-white/10'
                          }`}
                        >
                          <div className={`flex justify-between items-start text-xs pb-3 border-b ${isLight ? 'border-stone-100' : 'border-white/5'}`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`font-mono font-black text-sm tracking-tighter ${isLight ? 'text-stone-900' : 'text-white'}`}>#{ord.orderNumber}</p>
                                <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
                                  ord.orderSource === 'pos' ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                                }`}>
                                  {ord.orderSource === 'pos' ? <Store size={10} /> : <Smartphone size={10} />}
                                  {ord.orderSource === 'pos' ? 'STORE' : 'APP'}
                                </span>
                              </div>
                              <p className={`${isLight ? 'text-stone-500' : 'text-white/30'} mt-1 text-[10px] font-bold`}>
                                {ord.createdAt instanceof Date ? ord.createdAt.toLocaleString() : 'JUST NOW'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                              ord.orderStatus === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-900/30' :
                              ord.orderStatus === 'cancelled' ? 'bg-rose-950 text-rose-300 border border-rose-900/30' :
                              ord.orderStatus === 'ready' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/30 animate-pulse' :
                              ord.orderStatus === 'preparing' ? 'bg-amber-950 text-amber-300 border border-amber-900/30' :
                              isLight ? 'bg-stone-100 text-stone-800 border border-stone-300' : 'bg-white/5 text-white/70 border border-white/10'
                            }`}>
                              {ord.orderStatus}
                            </span>
                          </div>

                          <div className={`text-xs space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar ${isLight ? 'text-stone-800' : 'text-white/80'}`}>
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center">
                                  <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white/90'}`}>
                                    {it.quantity}x {it.name} <span className="text-[10px] text-[var(--color-primary)] opacity-80">({it.selectedSize})</span>
                                  </span>
                                  <span className="text-[var(--color-primary)] font-black">₱{it.price * it.quantity}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {isActive && (
                            <div className={`rounded-xl p-3 space-y-3 border ${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-white/[0.03] border-white/5'}`}>
                              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 animate-spin" /> Live Status
                              </p>
                              <div className="grid grid-cols-4 gap-1 relative pt-1">
                                <div className={`absolute top-3.5 left-[12%] right-[12%] h-1 z-0 rounded-full ${isLight ? 'bg-stone-200' : 'bg-white/10'}`}>
                                  <motion.div 
                                    className="h-full bg-[var(--color-primary)] shadow-[0_0_15px_rgba(197,160,89,0.5)] rounded-full" 
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: ord.orderStatus === 'ready' ? '100%' :
                                             ord.orderStatus === 'preparing' ? '66%' :
                                             ord.orderStatus === 'pending' ? '33%' : '0%'
                                    }}
                                  />
                                </div>
                                {['Sent', 'Confirmed', 'Cooking', 'Ready'].map((step, idx) => {
                                  const stepMap: Record<OrderStatus, number> = { pending: 1, preparing: 2, ready: 3, completed: 4, cancelled: 0 };
                                  const isPastOrCurrent = (idx + 1) <= stepMap[ord.orderStatus];
                                  return (
                                    <div key={step} className="flex flex-col items-center z-10">
                                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                                        isPastOrCurrent ? 'bg-[var(--color-primary)] text-black shadow-lg scale-110' : isLight ? 'bg-stone-200 text-stone-500' : 'bg-white/10 text-white/40'
                                      }`}>
                                        {isPastOrCurrent ? <Check size={12} strokeWidth={4} /> : idx + 1}
                                      </div>
                                      <span className={`text-[8px] mt-2 font-black uppercase tracking-tighter ${isPastOrCurrent ? 'text-white' : 'text-white/20'}`}>{step}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <p className="text-white/20 text-[9px] font-black uppercase tracking-widest">Grand Total</p>
                              <p className="text-lg font-black text-[var(--color-primary)] tracking-tighter">₱{ord.total}</p>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.94 }}
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 hover:border-[var(--color-primary)] transition-all cursor-pointer"
                            >
                              Ticket details
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
                className="space-y-6 pb-12"
              >
                <div className="flex items-center justify-between">
                  <h2 className={`text-base font-bold font-serif tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>Customer Profile</h2>
                  <button onClick={handleOpenEditProfile} className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer">
                    Edit Settings
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* LEFT: MAIN PROFILE CARD */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className={`rounded-[2.5rem] p-8 border shadow-2xl text-center space-y-6 ${isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'}`}>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-[var(--color-primary)]/50 shadow-2xl flex items-center justify-center ${isLight ? 'bg-stone-100' : 'bg-[#080808]'}`}>
                            {currentUser?.avatar || currentUser?.photoURL ? (
                              <img src={currentUser.avatar || currentUser.photoURL} alt={currentUser.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-serif text-3xl font-black text-[var(--color-primary)]">
                                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User size={40} />}
                              </div>
                            )}
                          </div>
                          <button onClick={handleOpenEditProfile} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[var(--color-primary)] text-black border-4 border-[#121212] flex items-center justify-center shadow-xl hover:scale-110 transition-all cursor-pointer">
                            <Camera size={16} strokeWidth={3} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black tracking-tight text-white">{currentUser?.name || "Guest Customer"}</h3>
                          <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">{currentUser?.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                          <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">Orders</p>
                          <p className="text-lg font-black text-white">{currentUser?.orderCount || 0}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                          <p className="text-white/20 text-[9px] font-black uppercase tracking-widest mb-1">Points</p>
                          <p className="text-lg font-black text-[var(--color-primary)]">{currentUser?.loyaltyPoints || 0}</p>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => logout()}
                        className="w-full font-black py-4 px-6 rounded-2xl text-[10px] uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        Secure Sign Out
                      </motion.button>
                    </div>
                  </div>

                  {/* RIGHT: LOYALTY PASS & REWARDS */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[var(--color-primary)] text-black p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Award size={160} strokeWidth={1} />
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-white p-3 rounded-[2rem] shadow-2xl">
                          <img src={getQRCodeUrl(currentUser?.uid || 'guest')} alt="QR" className="w-32 h-32" />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-4">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Digital Member Pass</span>
                            <h3 className="text-3xl font-black font-serif tracking-tight leading-none mt-1">Exclusive Loyalty Pass</h3>
                          </div>
                          <p className="text-xs font-bold opacity-70 max-w-sm">Present this digital identifier at any of our physical branches to accumulate beans and unlock premium rewards instantly.</p>
                          <div className="pt-2">
                            <span className="text-[10px] font-mono font-black bg-black/10 px-3 py-1.5 rounded-full border border-black/10">ID: {currentUser?.uid.slice(0, 16)}...</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[var(--color-primary)]" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Unlockable Rewards</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vouchers.filter(v => v.active && v.claimableViaPoints).map(v => {
                          const canAfford = (currentUser?.loyaltyPoints || 0) >= (v.pointCost || 0);
                          return (
                            <div key={v.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between gap-4 group hover:bg-white/[0.08] transition-all">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">{v.name}</h4>
                                  <span className="bg-[var(--color-primary)] text-black text-[9px] font-black px-2 py-0.5 rounded-full">{v.pointCost} PTS</span>
                                </div>
                                <p className="text-[10px] text-white/30 uppercase tracking-tighter leading-relaxed">{v.description}</p>
                              </div>
                              <button
                                disabled={!canAfford}
                                onClick={() => claimVoucher(v.id)}
                                className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                  canAfford ? 'bg-white text-black hover:bg-[var(--color-primary)]' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                }`}
                              >
                                {canAfford ? 'Redeem now' : 'Insufficient balance'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

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
                              ? 'border-2 shadow-xs font-bold'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                          style={customSize?.name === size.name ? {
                            backgroundColor: `${primaryColor}15`,
                            borderColor: primaryColor,
                            color: isLight ? '#000' : '#fff'
                          } : undefined}
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
                                ? 'border-2'
                                : 'bg-white border-stone-100 hover:border-stone-200'
                            }`}
                            style={isSelected ? {
                              backgroundColor: `${primaryColor}10`,
                              borderColor: primaryColor,
                            } : undefined}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? 'text-black' : 'border-stone-300'
                                }`}
                                style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className={isSelected ? 'font-bold' : ''}>{addon.name}</span>
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
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200 outline-none focus:border-[var(--color-primary)] focus:bg-white resize-none"
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
                  className={`flex-1 text-white text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center transition-all shadow-sm ${settings.storeStatus?.isOpen === false ? 'bg-stone-400 cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                  style={settings.storeStatus?.isOpen !== false ? { backgroundColor: primaryColor, color: '#000' } : undefined}
                >
                  <span className="font-extrabold">{settings.storeStatus?.isOpen === false ? 'Store Closed' : 'Add Item to Bag'}</span>
                  <span 
                    className="py-0.5 px-2 rounded-md font-extrabold"
                    style={{ backgroundColor: settings.storeStatus?.isOpen === false ? undefined : 'rgba(0,0,0,0.15)', color: '#000' }}
                  >
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
                  <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
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
                    <div 
                      className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner border"
                      style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30`, color: primaryColor }}
                    >
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
                              <p className="text-[10px] font-semibold mt-0.5" style={{ color: primaryColor }}>
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

                              <span className="text-xs font-extrabold" style={{ color: primaryColor }}>₱{unitPrice * item.quantity}</span>
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
                        className="flex-1 text-xs bg-white border border-stone-200 outline-none py-2 px-3 rounded-xl uppercase font-mono focus:border-[var(--color-primary)] disabled:bg-stone-100 disabled:text-stone-400"
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
                          className="text-black text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
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
                      <span style={{ color: primaryColor }}>₱{cartTotal}</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full text-black text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center transition-all shadow-md cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
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
                              ? 'border-2 shadow-xs font-bold'
                              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                          style={orderType === t.id ? { backgroundColor: `${primaryColor}15`, borderColor: primaryColor } : undefined}
                        >
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center mb-1"
                            style={orderType === t.id ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : undefined}
                          >
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
                      className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-200 outline-none focus:border-[var(--color-primary)] focus:bg-white"
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
                            ? 'border-2 shadow-xs font-bold'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                        style={paymentMethod === p.id ? { backgroundColor: `${primaryColor}15`, borderColor: primaryColor } : undefined}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-stone-100 text-stone-600"
                          style={paymentMethod === p.id ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : undefined}
                        >
                          {p.type === 'cash' ? (
                            <Banknote className="w-4.5 h-4.5 text-emerald-600" />
                          ) : p.type === 'card' ? (
                            <CreditCard className="w-4.5 h-4.5 text-indigo-600" />
                          ) : p.type === 'qr' ? (
                            <QrCode className="w-4.5 h-4.5" style={{ color: primaryColor }} />
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
                  
                  {/* Dynamic QR Code/Payment Info Display for selected payment method */}
                  {(() => {
                    const selectedMethod = (settings.paymentMethods || []).find(m => m.id === paymentMethod);
                    // Show if not cash and has either QR code or account number
                    const hasPaymentInfo = selectedMethod && selectedMethod.type !== 'cash' && (!!selectedMethod.qrCodeUrl || !!selectedMethod.accountNumber);
                    
                    if (selectedMethod && hasPaymentInfo) {
                      const accountNumber = selectedMethod.accountNumber;
                      const qrUrl = selectedMethod.qrCodeUrl;
                      
                      return (
                        <div className="mt-3 p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center text-center space-y-3 animate-fade-in">
                          <p className="text-xs font-extrabold text-stone-800">Payment Instructions for {selectedMethod.name}</p>
                          
                          {accountNumber && (
                            <div 
                              className="font-mono font-bold text-xs py-1.5 px-3 rounded-lg border flex items-center gap-1.5"
                              style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30`, color: primaryColor }}
                            >
                              <span>No./Account:</span>
                              <span className="tracking-wider select-all">{accountNumber}</span>
                            </div>
                          )}
                          
                          {qrUrl && (
                            <img src={qrUrl} alt={`${selectedMethod.name} QR Code`} className="w-40 h-40 object-contain rounded-lg border border-stone-150 bg-white p-1 shadow-xs" />
                          )}
                          
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
                                  onUploadSuccess={(url, _key) => setCheckoutReceiptUrl(url)}
                                />
                              </div>
                            </div>
                            {uploadingReceipt && <p className="text-[9px] animate-pulse mt-1 font-semibold" style={{ color: primaryColor }}>Uploading proof of payment...</p>}
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
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-50 text-stone-900 border border-stone-300 outline-none focus:border-[var(--color-primary)] focus:bg-white resize-none placeholder-stone-500 font-medium"
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
                      <span style={{ color: primaryColor }}>₱{cartTotal}</span>
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
                  className={`w-full text-black text-xs font-bold py-3 px-4 rounded-xl flex justify-between items-center transition-all shadow-md ${settings.storeStatus?.isOpen === false ? 'bg-stone-400 cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                  style={settings.storeStatus?.isOpen !== false ? { backgroundColor: primaryColor } : undefined}
                >
                  <span className="font-extrabold">{settings.storeStatus?.isOpen === false ? 'Store Closed' : 'Confirm & Send Order'}</span>
                  <span 
                    className="font-extrabold font-mono text-[11px] py-0.5 px-2 rounded-md"
                    style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#000' }}
                  >
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute inset-0 bg-black/65 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative z-10 bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <h3 className="font-extrabold text-stone-900 text-sm">Receipt Order Ticket</h3>
                <button onClick={() => setSelectedOrderDetails(null)} className="p-1 hover:bg-stone-100 rounded-full cursor-pointer">
                  <X className="w-5 h-5 text-stone-700" />
                </button>
              </div>

              <div className="text-center font-mono space-y-1 text-xs text-stone-900">
                <h2 className="text-base font-black tracking-tight uppercase" style={{ color: primaryColor }}>{settings.branding.shopName}</h2>
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
                    <p className="font-extrabold mt-1" style={{ color: primaryColor }}>Points Earned: +{selectedOrderDetails.pointsEarned} pts</p>
                  )}
                </div>
              </div>

              {/* QR payment details and receipt upload block inside details modal */}
              {selectedOrderDetails && (selectedOrderDetails.paymentStatus === 'unpaid' || selectedOrderDetails.paymentStatus === 'pending') && (
                (() => {
                  const selectedMethod = (settings.paymentMethods || []).find(m => m.id === selectedOrderDetails.paymentMethod || m.name.toLowerCase() === selectedOrderDetails.paymentMethod.toLowerCase());
                  if (selectedMethod && (selectedMethod.type === 'qr' || selectedMethod.type === 'other' || !!selectedMethod.qrCodeUrl)) {
                    return (
                      <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-2.5 text-center text-xs">
                        <p className="font-extrabold text-stone-850">Payment Instructions ({selectedMethod.name})</p>
                        {selectedMethod.accountNumber && (
                          <div 
                            className="font-mono font-bold text-[11px] py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5"
                            style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30`, color: primaryColor }}
                          >
                            <span>No./Account:</span>
                            <span className="tracking-wider select-all">{selectedMethod.accountNumber}</span>
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
                                onUploadSuccess={async (url, _key) => {
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

      {/* FLOATING ACTION BUTTON (FAB) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          setIsCartOpen(true);
        }}
        title="Open Bag"
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full text-black flex items-center justify-center cursor-pointer border"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, 
          boxShadow: `0 4px 22px ${primaryColor}80`,
          borderColor: `${primaryColor}80` 
        }}
      >
        <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
        {cartCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 bg-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-md"
            style={{ color: primaryColor, borderColor: primaryColor }}
          >
            {cartCount}
          </span>
        )}
      </motion.button>

      {/* FLOATING CART NOTIFICATION PILL ABOVE BOTTOM BAR */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && !isCheckoutOpen && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-20 sm:bottom-24 left-4 right-16 sm:right-20 z-40 max-w-xs mx-auto pointer-events-none"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full pointer-events-auto text-black font-black py-2 px-3.5 rounded-2xl flex items-center justify-between cursor-pointer border shadow-lg"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}ee)`,
                boxShadow: `0 6px 20px ${primaryColor}66`,
                borderColor: `${primaryColor}90`
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="bg-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ color: primaryColor }}
                >
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

      {/* 7. FLOATING iOS-STYLE BOTTOM NAVIGATION BAR */}
      <nav 
        aria-label="Bottom Navigation"
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 p-1.5 rounded-full border backdrop-blur-2xl transition-all duration-300 select-none ${
          isLight 
            ? 'bg-white/90 border-stone-200/90 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12)]' 
            : 'bg-[#141416]/90 border-white/15 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]'
        }`}
      >
        {/* Subtle Specular Top Highlight */}
        <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="flex items-center gap-1 sm:gap-1.5 relative">
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
                <span 
                  className="ml-1 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {activeOrdersCount}
                </span>
              ) : null
            },
            { 
              id: 'profile', 
              label: 'Profile', 
              icon: User,
              badge: null
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsCartOpen(false);
                }}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-3.5 sm:px-4.5 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer ${
                  isSelected 
                    ? isLight 
                      ? 'text-white' 
                      : 'text-black font-black'
                    : isLight 
                      ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/60' 
                      : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {/* iOS ANIMATED ACTIVE SLIDING PILL */}
                {isSelected && (
                  <motion.div
                    layoutId="iosDockActivePill"
                    className={`absolute inset-0 rounded-full shadow-md ${
                      isLight 
                        ? 'bg-stone-900 shadow-stone-900/30' 
                        : ''
                    }`}
                    style={!isLight ? { 
                      background: `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}dd)`, 
                      boxShadow: `0 4px 15px ${primaryColor}40` 
                    } : undefined}
                    transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                  />
                )}

                {/* ICON & LABEL */}
                <div className="relative z-10 flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 transition-transform ${isSelected ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
                  <span className="text-[11px] tracking-wide font-extrabold uppercase whitespace-nowrap">
                    {tab.label}
                  </span>
                  {tab.badge}
                </div>
              </motion.button>
            );
          })}
        </div>
      </nav>
      
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
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}30`, color: primaryColor }}
                  >
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
                    <div className="flex-1">
                      <ImageUpload
                        label="Update Photo"
                        folder="avatars"
                        onUploadSuccess={(url, _key) => setEditAvatar(url)}
                        onUploadError={(err) => setProfileErrorMsg(err)}
                      />
                      {editAvatar && (
                        <button
                          type="button"
                          onClick={() => setEditAvatar('')}
                          className="text-[10px] text-rose-500 hover:text-rose-600 block font-semibold mt-1"
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
                      className={`w-full border text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-[var(--color-primary)] ${
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
                    className={`w-full border text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-medium ${
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
                    className={`w-full border text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[var(--color-primary)] font-medium ${
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
                    className="flex-1 py-2 rounded-xl text-black text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
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
    </div>
  );
};
export default CustomerExperience;
