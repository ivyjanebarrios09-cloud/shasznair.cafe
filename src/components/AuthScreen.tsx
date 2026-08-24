import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '../firebase/demoData';
import { Product, CartItem, OrderType, PaymentMethod, Order } from '../types';
import { 
  Coffee, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Search,
  MapPin,
  Clock,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  Check,
  CheckCircle2,
  UtensilsCrossed,
  ReceiptText,
  Tag,
  Award,
  ChevronRight,
  Store,
  CreditCard,
  Banknote
} from 'lucide-react';

const DEFAULT_LOGO_URL = 'https://pub-592579d2fd244afeb67e8542cbe5fe1c.r2.dev/1787405830668-1000005848.jpg';

export const AuthScreen: React.FC = () => {
  const { 
    categories: contextCategories, 
    products: contextProducts, 
    settings, 
    login, 
    register,
    placeOrder
  } = useCoffeeApp();

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Auth Modal & Form State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Walk-in Guest Cart State
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Selected Product Customization Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customSize, setCustomSize] = useState<any>(null);
  const [customAddOns, setCustomAddOns] = useState<any[]>([]);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState('');

  // Walk-in Checkout Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [tableNo, setTableNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [orderNotes, setOrderNotes] = useState('');
  const [checkoutReceiptUrl, setCheckoutReceiptUrl] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Real-time Firestore categories & products (with safe active checks)
  const activeCategories = useMemo(() => {
    return (contextCategories || []).filter(c => c.active !== false);
  }, [contextCategories]);

  const activeProducts = useMemo(() => {
    return contextProducts || [];
  }, [contextProducts]);

  // Products not matching any known active category
  const uncategorizedProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const found = activeCategories.some(c => c.id === p.category || c.name.toLowerCase() === (p.category || '').toLowerCase());
      return !found;
    });
  }, [activeProducts, activeCategories]);

  // Filter products by search & category
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCat = false;
      if (activeCategoryFilter === 'all') {
        matchesCat = true;
      } else if (activeCategoryFilter === 'uncategorized') {
        matchesCat = !activeCategories.some(c => c.id === p.category || c.name.toLowerCase() === (p.category || '').toLowerCase());
      } else {
        matchesCat = p.category === activeCategoryFilter || 
                     activeCategories.some(c => 
                       (c.id === activeCategoryFilter || c.name.toLowerCase() === activeCategoryFilter.toLowerCase()) && 
                       (c.id === p.category || c.name.toLowerCase() === (p.category || '').toLowerCase())
                     );
      }
      return matchesSearch && matchesCat;
    });
  }, [activeProducts, searchQuery, activeCategoryFilter, activeCategories]);

  // Total quantity in guest cart
  const cartTotalItems = useMemo(() => {
    return guestCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [guestCart]);

  // Cart subtotal calculation
  const cartSubtotal = useMemo(() => {
    return guestCart.reduce((sum, item) => {
      const sizePrice = item.selectedSize?.priceAdjustment || 0;
      const addOnsPrice = item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0;
      return sum + ((item.product.price + sizePrice + addOnsPrice) * item.quantity);
    }, 0);
  }, [guestCart]);

  // Product Selection & Customization Handlers
  const handleOpenCustomize = (product: Product) => {
    if (!product.available) return;
    setSelectedProduct(product);
    setCustomSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : { name: 'Regular', priceAdjustment: 0 });
    setCustomAddOns([]);
    setCustomQuantity(1);
    setCustomNotes('');
  };

  const handleToggleAddOn = (addOn: any) => {
    if (customAddOns.some(a => a.name === addOn.name)) {
      setCustomAddOns(prev => prev.filter(a => a.name !== addOn.name));
    } else {
      setCustomAddOns(prev => [...prev, addOn]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const newItem: CartItem = {
      product: selectedProduct,
      quantity: customQuantity,
      selectedSize: customSize || { name: 'Regular', priceAdjustment: 0 },
      selectedAddOns: customAddOns,
      notes: customNotes.trim()
    };

    setGuestCart(prev => [...prev, newItem]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setGuestCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setGuestCart(prev => prev.filter((_, i) => i !== index));
  };

  // Place Walk-in Order Handler
  const handlePlaceWalkInOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (guestCart.length === 0) {
      setOrderError('Your order tray is empty. Please add items to order.');
      return;
    }

    if (!customerName.trim()) {
      setOrderError('Please enter your Customer Name so our baristas know who ordered.');
      return;
    }

    if (orderType === 'table' && !tableNo.trim()) {
      setOrderError('Please provide your Table Number for Dine-in orders.');
      return;
    }

    setOrderSubmitting(true);

    try {
      // Place real order with walk-in flag and customer name
      const order = await placeOrder(
        orderType,
        orderType === 'table' ? tableNo.trim() : '',
        paymentMethod,
        orderNotes.trim(),
        customerPhone.trim() || undefined,
        guestCart,
        null, // Walk-in customers do NOT have vouchers
        customerName.trim(),
        'web_app',
        undefined, // cashReceived
        undefined, // change
        checkoutReceiptUrl || undefined // receiptUrl
      );

      setConfirmedOrder(order);
      setGuestCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
    } catch (err: any) {
      console.error("Walk-in order placement error:", err);
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Authentication Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setAuthLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!phone.trim()) {
          throw new Error('Please enter your contact phone number.');
        }

        await register(email, password, name, phone, 'customer');
        setAuthSuccessMsg('Account created successfully! Logging you in...');
      }
    } catch (err: any) {
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password combination. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already registered.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setAuthError(friendlyMessage || 'An unexpected error occurred during authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  const shopName = settings?.branding?.shopName || 'SHASZNAIR CAFE';
  const shopDesc = settings?.branding?.description || 'Artisanal Coffee & Freshly Baked Delights';
  const logoUrl = settings?.branding?.logoUrl || DEFAULT_LOGO_URL;
  const isLight = settings?.branding?.theme === 'light';
  const isOpen = settings?.storeStatus?.isOpen !== false;

  return (
    <div className={`min-h-screen ${isLight ? 'bg-stone-50 text-stone-900' : 'bg-[#070504] text-stone-200'} flex flex-col font-sans transition-colors duration-300`}>
      
      {/* STORE CLOSED BANNER IF APPLICABLE */}
      {!isOpen && (
        <div className="bg-rose-950 text-rose-200 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 border-b border-rose-800/50 sticky top-0 z-50">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Our coffee lab is currently closed for the day. Online orders will resume during regular business hours.</span>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className={`sticky ${!isOpen ? 'top-[33px]' : 'top-0'} z-40 backdrop-blur-md ${isLight ? 'bg-white/95 border-stone-200 text-stone-900 shadow-sm' : 'bg-[#0b0806]/95 border-white/10 text-stone-200 shadow-xl'} border-b transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-3.5 justify-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-[#c5a059]/40 shadow-md flex items-center justify-center shrink-0">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={shopName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-[#c5a059] flex items-center justify-center text-black font-serif font-black text-lg">
                  {shopName.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className={`text-base sm:text-lg md:text-xl font-serif font-extrabold tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  {shopName}
                </h1>
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold border ${
                  isOpen 
                    ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                    : isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/80 text-rose-300 border-rose-600/40'
                }`}>
                  <span className={`w-1 sm:w-1.5 sm:h-1.5 h-1 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="hidden xs:inline">{isOpen ? 'Open' : 'Closed'}</span>
                </span>
              </div>
              <p className={`text-[9px] sm:text-[10px] ${isLight ? 'text-[#9c782d]' : 'text-[#c5a059]'} uppercase tracking-wider sm:tracking-widest font-semibold`}>
                {shopDesc}
              </p>
            </div>
          </div>

          {/* Action Header Buttons: Cart Tray + Sign In/Register */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3">
            
            {/* View Order Tray / Cart Button - Animated SVG Icon */}
            <motion.button
              id="view-cart-btn"
              onClick={() => setIsCartOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              className={`relative p-2.5 sm:p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                cartTotalItems > 0
                  ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md hover:bg-[#b08c47]'
                  : isLight 
                    ? 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200' 
                    : 'bg-[#120f0c] text-stone-300 border-white/10 hover:border-white/20'
              }`}
              title="View Order Tray"
            >
              <ShoppingBag className="w-5 h-5 shrink-0" />
              {cartTotalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-black text-[#c5a059] border border-[#c5a059]/30 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                >
                  {cartTotalItems}
                </motion.span>
              )}
            </motion.button>

            {/* Member Sign In / Sign Up Button */}
            <button
              id="open-auth-modal-btn"
              onClick={() => {
                setShowAuthModal(true);
                setAuthError(null);
                setAuthSuccessMsg(null);
              }}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                isLight 
                  ? 'bg-stone-900 text-white border-stone-800 hover:bg-stone-800 shadow-sm' 
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
              }`}
            >
              <User className="w-4 h-4 text-[#c5a059]" />
              <span className="hidden sm:inline">Member Portal</span>
              <span className="sm:hidden">Sign In</span>
            </button>

          </div>

        </div>
      </header>

      {/* HERO & PERK NOTICE BANNER */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-[#181410] to-[#241c14] border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#c5a059]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 text-[#c5a059] text-[10px] uppercase tracking-widest font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Walk-in Orders Welcome • No Account Required</span>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Place your walk-in order directly from our full interactive menu below. Just provide your name so our kitchen and barista team can notify you when it's freshly prepared.
            </p>

            {/* MEMBER PERK CLARITY PILL */}
            <div className="bg-stone-950/80 border border-[#c5a059]/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-stone-300">
                <div className="w-7 h-7 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Loyalty Points & Promo Vouchers:</span>{' '}
                  <span className="text-stone-400">Exclusive to registered account members.</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setIsLogin(false);
                }}
                className="text-xs font-bold text-[#c5a059] hover:text-white flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                <span>Create Member Account</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* MAIN MENU SECTION */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-stone-950/80 border-white/10 shadow-lg'} space-y-3.5`}>
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search coffee, drinks, pastries, or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs py-2.5 pl-10 pr-4 rounded-xl outline-none transition-all ${
                  isLight 
                    ? 'bg-stone-100 border border-stone-300 focus:border-[#c5a059] focus:bg-white text-stone-900 placeholder-stone-400' 
                    : 'bg-stone-900 border border-white/10 focus:border-[#c5a059] text-white placeholder-stone-500'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Total items badge */}
            <div className="text-xs text-stone-400 font-semibold px-2 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[#c5a059]" />
              <span>{filteredProducts.length} Items Available</span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`text-xs px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#c5a059] text-black shadow-md'
                  : isLight
                    ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
              }`}
            >
              All Categories ({activeProducts.length})
            </button>
            {activeCategories.map(cat => {
              const count = activeProducts.filter(p => p.category === cat.id || p.category === cat.name || (p.category && p.category.toLowerCase() === cat.name.toLowerCase())).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeCategoryFilter === cat.id
                      ? 'bg-[#c5a059] text-black shadow-md'
                      : isLight
                        ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
            {uncategorizedProducts.length > 0 && activeCategories.length > 0 && (
              <button
                onClick={() => setActiveCategoryFilter('uncategorized')}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'uncategorized'
                    ? 'bg-[#c5a059] text-black shadow-md'
                    : isLight
                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span>Other Specialties</span>
                <span className="text-[10px] opacity-75 font-mono">({uncategorizedProducts.length})</span>
              </button>
            )}
          </div>

        </div>

        {/* CATEGORIES & PRODUCT CARDS LIST */}
        <div className="space-y-12">
          {activeCategories.map(cat => {
            const catProducts = filteredProducts.filter(p => {
              const pCat = (p.category || '').toLowerCase().trim();
              const cId = (cat.id || '').toLowerCase().trim();
              const cName = (cat.name || '').toLowerCase().trim();
              return pCat === cId || pCat === cName;
            });

            if (catProducts.length === 0) {
              if (activeCategoryFilter === cat.id) {
                return (
                  <div key={cat.id} className="p-8 text-center text-stone-500 text-xs italic bg-stone-900/20 rounded-2xl border border-white/5">
                    No products found in "{cat.name}" matching your search.
                  </div>
                );
              }
              return null;
            }

            return (
              <section key={cat.id} className="space-y-4">
                
                {/* Category Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`text-lg sm:text-xl font-serif font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-xs text-stone-400">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 px-3 py-1 rounded-full border border-[#c5a059]/20">
                    {catProducts.length} {catProducts.length === 1 ? 'Product' : 'Products'}
                  </span>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {catProducts.map(product => (
                    <div 
                      key={product.id}
                      className={`rounded-xl p-2.5 sm:p-3 border transition-all duration-200 flex flex-col justify-between group ${
                        isLight 
                          ? 'bg-white border-stone-200 shadow-sm hover:border-[#c5a059] hover:shadow-md' 
                          : 'bg-[#12100e] border-white/5 hover:border-[#c5a059]/40 shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        
                        {/* Image & Price Header */}
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-900 border border-white/5">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-700 space-y-1">
                              <Coffee className="w-6 h-6" />
                              <span className="text-[9px]">Coffee</span>
                            </div>
                          )}

                          {/* Price Tag Overlay */}
                          <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-[#c5a059] font-serif font-black text-xs px-2 py-0.5 rounded-md border border-[#c5a059]/30 shadow-lg font-mono">
                            ₱{product.price}
                          </div>

                          {/* Out of Stock Overlay */}
                          {!product.available && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                              Sold Out
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className={`text-xs sm:text-sm font-bold transition-colors truncate ${
                            isLight ? 'text-stone-900 group-hover:text-[#9c782d]' : 'text-white group-hover:text-[#c5a059]'
                          }`}>
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5 leading-snug">
                            {product.description || 'Artisanal craft brew.'}
                          </p>
                        </div>

                        {/* Sizes Pill list */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 pt-0.5">
                            {product.sizes.map((s, idx) => (
                              <span key={idx} className="text-[8px] font-semibold bg-white/5 text-stone-400 px-1 py-0.5 rounded border border-white/5 truncate max-w-full">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-2.5 border-t border-white/5 mt-2.5 flex items-center justify-between gap-1.5">
                        <div className="truncate">
                          {product.stockTracking ? (
                            <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="truncate">{product.stockQuantity} Left</span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-stone-400 font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#c5a059]" />
                              <span className="truncate">Fresh</span>
                            </span>
                          )}
                        </div>

                        <button
                          disabled={!product.available}
                          onClick={() => handleOpenCustomize(product)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isLight 
                              ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm' 
                              : 'bg-[#c5a059] text-black hover:bg-[#b08c47] font-extrabold shadow-md'
                          }`}
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Order</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </section>
            );
          })}

          {/* Uncategorized or Fallback Section */}
          {(activeCategoryFilter === 'all' || activeCategoryFilter === 'uncategorized' || activeCategories.length === 0) && uncategorizedProducts.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-serif font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                      {activeCategories.length === 0 ? 'Featured Delights' : 'Other Specialties & Creations'}
                    </h3>
                    <p className="text-xs text-stone-400">Fresh handcrafted creations</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 px-3 py-1 rounded-full border border-[#c5a059]/20">
                  {uncategorizedProducts.length} {uncategorizedProducts.length === 1 ? 'Product' : 'Products'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {uncategorizedProducts
                  .filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(product => (
                    <div 
                      key={product.id}
                      className={`rounded-xl p-2.5 sm:p-3 border transition-all duration-200 flex flex-col justify-between group ${
                        isLight 
                          ? 'bg-white border-stone-200 shadow-sm hover:border-[#c5a059] hover:shadow-md' 
                          : 'bg-[#12100e] border-white/5 hover:border-[#c5a059]/40 shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-stone-900 border border-white/5">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-700 space-y-1">
                              <Coffee className="w-6 h-6" />
                              <span className="text-[9px]">Item</span>
                            </div>
                          )}

                          <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-[#c5a059] font-serif font-black text-xs px-2 py-0.5 rounded-md border border-[#c5a059]/30 shadow-lg font-mono">
                            ₱{product.price}
                          </div>

                          {!product.available && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                              Sold Out
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className={`text-xs sm:text-sm font-bold transition-colors truncate ${
                            isLight ? 'text-stone-900 group-hover:text-[#9c782d]' : 'text-white group-hover:text-[#c5a059]'
                          }`}>
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5 leading-snug">
                            {product.description || 'Artisanal creation.'}
                          </p>
                        </div>

                        {product.sizes && product.sizes.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 pt-0.5">
                            {product.sizes.map((s, idx) => (
                              <span key={idx} className="text-[8px] font-semibold bg-white/5 text-stone-400 px-1 py-0.5 rounded border border-white/5 truncate max-w-full">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-white/5 mt-2.5 flex items-center justify-between gap-1.5">
                        <div className="truncate">
                          {product.stockTracking ? (
                            <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="truncate">{product.stockQuantity} Left</span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-stone-400 font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#c5a059]" />
                              <span className="truncate font-semibold">Fresh</span>
                            </span>
                          )}
                        </div>

                        <button
                          disabled={!product.available}
                          onClick={() => handleOpenCustomize(product)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isLight 
                              ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm' 
                              : 'bg-[#c5a059] text-black hover:bg-[#b08c47] font-extrabold shadow-md'
                          }`}
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Order</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {filteredProducts.length === 0 && (
            <div className="bg-stone-900/30 border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-4">
              <Coffee className="w-12 h-12 text-stone-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">No Menu Products Found</h4>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  We couldn't find any items matching "{searchQuery}". Try searching for another keyword or reset filters.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategoryFilter('all');
                }}
                className="bg-[#c5a059] text-black font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>

      </main>

      {/* PRODUCT CUSTOMIZATION MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 animate-fade-in ${
            isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#12100e] border-white/10 text-white'
          }`}>
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059]">Customize Item</span>
                <h3 className="text-xl font-serif font-extrabold">{selectedProduct.name}</h3>
                <p className="text-xs text-stone-400 mt-0.5">{selectedProduct.description}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Size Selection */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Select Size
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProduct.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomSize(s)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          customSize?.name === s.name
                            ? 'bg-[#c5a059]/20 border-[#c5a059] text-white font-bold'
                            : 'bg-stone-900/60 border-white/5 text-stone-300 hover:border-white/20'
                        }`}
                      >
                        <div className="text-xs font-bold">{s.name}</div>
                        <div className="text-[10px] text-[#c5a059] mt-0.5 font-mono">
                          {s.priceAdjustment > 0 ? `+₱${s.priceAdjustment}` : 'Included'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Selection */}
              {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Add-ons & Extras
                  </label>
                  <div className="space-y-1.5">
                    {selectedProduct.addOns.map((ad, idx) => {
                      const isSelected = customAddOns.some(a => a.name === ad.name);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleAddOn(ad)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-[#c5a059]/15 border-[#c5a059] text-white' 
                              : 'bg-stone-900/40 border-white/5 text-stone-300 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected ? 'bg-[#c5a059] border-[#c5a059] text-black' : 'border-stone-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-medium">{ad.name}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#c5a059]">+₱{ad.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Special Notes / Custom Instructions
                </label>
                <input
                  type="text"
                  placeholder="E.g. Less ice, extra hot, oat milk preference..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-stone-900 border border-white/10 outline-none focus:border-[#c5a059] text-white placeholder-stone-500"
                />
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Quantity</span>
                <div className="flex items-center gap-3 bg-stone-900 border border-white/10 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                    className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black font-mono w-6 text-center text-white">{customQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setCustomQuantity(customQuantity + 1)}
                    className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Add to Tray Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-black text-xs py-3.5 rounded-xl flex items-center justify-between px-4 transition-all shadow-lg cursor-pointer"
              >
                <span>Add Item to Order Tray</span>
                <span className="font-mono text-sm font-black">
                  ₱{((selectedProduct.price + (customSize?.priceAdjustment || 0) + customAddOns.reduce((s, a) => s + a.price, 0)) * customQuantity)}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WALK-IN ORDER CART / TRAY SLIDEOVER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className={`w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl border-l animate-slide-in-right ${
            isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#100e0c] border-white/10 text-white'
          }`}>
            
            {/* Drawer Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#c5a059]" />
                  <h3 className="text-lg font-serif font-extrabold">Walk-in Order Tray</h3>
                  <span className="bg-[#c5a059]/20 text-[#c5a059] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notice regarding Walk-in vs Member Loyalty */}
              <div className="bg-[#c5a059]/10 border border-[#c5a059]/25 rounded-xl p-3 text-[11px] text-stone-300 flex items-start gap-2">
                <Award className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#c5a059]">Walk-in Mode:</strong> You can place this order right now by providing your customer name. (Points and promo vouchers are reserved for registered accounts).
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {guestCart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500 space-y-3">
                  <ShoppingBag className="w-12 h-12 stroke-1 text-stone-600" />
                  <p className="text-xs font-bold text-stone-400">Your order tray is currently empty.</p>
                  <p className="text-[10px] max-w-xs">Select any drink or pastry from the menu to build your walk-in order.</p>
                </div>
              ) : (
                guestCart.map((item, idx) => {
                  const itemUnitPrice = item.product.price + (item.selectedSize?.priceAdjustment || 0) + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0);
                  const itemTotalPrice = itemUnitPrice * item.quantity;

                  return (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-stone-900/60 border border-white/5 space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.product.name}</h4>
                          <span className="text-[10px] text-[#c5a059] font-semibold">{item.selectedSize?.name || 'Regular'}</span>
                        </div>
                        <span className="text-xs font-serif font-black text-[#c5a059] font-mono">
                          ₱{itemTotalPrice}
                        </span>
                      </div>

                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <p className="text-[10px] text-stone-400 italic">
                          + {item.selectedAddOns.map(a => a.name).join(', ')}
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-[10px] text-stone-400 italic bg-black/40 px-2 py-1 rounded border border-white/5">
                          Note: {item.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>

                        <div className="flex items-center gap-2 bg-stone-950 px-2 py-0.5 rounded-lg border border-white/10">
                          <button
                            onClick={() => handleUpdateCartQuantity(idx, -1)}
                            className="text-stone-400 hover:text-white cursor-pointer text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white font-mono">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(idx, 1)}
                            className="text-stone-400 hover:text-white cursor-pointer text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Cart Footer Actions */}
            {guestCart.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-400 font-semibold">Subtotal:</span>
                  <span className="font-serif font-black text-base text-[#c5a059] font-mono">₱{cartSubtotal}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <span>Proceed to Walk-in Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* WALK-IN CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 animate-fade-in ${
            isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#12100e] border-white/10 text-white'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059]">Walk-in Checkout</span>
                <h3 className="text-xl font-serif font-extrabold">Complete Your Order</h3>
                <p className="text-xs text-stone-400 mt-0.5">Please add your customer name so our team knows who is ordering.</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {orderError && (
              <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <span>{orderError}</span>
              </div>
            )}

            <form onSubmit={handlePlaceWalkInOrder} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* CUSTOMER NAME (CRITICAL FOR WALK-IN IDENTIFICATION) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-stone-300 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Customer / Pickup Name <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Shasz, John D., or Table Guest"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-stone-900 border border-white/10 outline-none focus:border-[#c5a059] text-white placeholder-stone-500 transition-all font-semibold"
                />
                <p className="text-[10px] text-stone-400">
                  Our baristas will call this name at the pickup counter or deliver it to your designated table.
                </p>
              </div>

              {/* CONTACT PHONE (OPTIONAL) */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-stone-500" />
                  <span>Contact Phone (Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="E.g. +63 917 123 4567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-900 border border-white/10 outline-none focus:border-[#c5a059] text-white placeholder-stone-500"
                />
              </div>

              {/* DINING OPTION: TAKEOUT vs DINE-IN */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      orderType === 'pickup'
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-stone-900 border-white/10 text-stone-300 hover:border-white/20'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Takeout / Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('table')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      orderType === 'table'
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-stone-900 border-white/10 text-stone-300 hover:border-white/20'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Dine-In (Table)</span>
                  </button>
                </div>
              </div>

              {/* TABLE NUMBER IF DINE-IN */}
              {orderType === 'table' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                    Table Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Table 4, Booth A"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-stone-900 border border-white/10 outline-none focus:border-[#c5a059] text-white"
                  />
                </div>
              )}

              {/* PAYMENT METHOD */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-stone-900 border-white/10 text-stone-300'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash on Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gcash')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'gcash'
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-stone-900 border-white/10 text-stone-300'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>GCash / E-Wallet</span>
                  </button>
                </div>
              </div>

              {/* Dynamic QR Code Display & Upload Receipt button for GCash / E-Wallet */}
              {paymentMethod === 'gcash' && (
                <div className="p-4 rounded-2xl bg-stone-950 border border-white/10 flex flex-col items-center text-center space-y-3 animate-fade-in">
                  <p className="text-xs font-bold text-white">Scan or Transfer to pay via GCash / E-Wallet</p>
                  
                  {(() => {
                    const qrMethod = (settings?.paymentMethods || []).find(m => m.type === 'qr' || m.id === 'gcash');
                    const accountNumber = qrMethod?.accountNumber || "0917 123 4567";
                    const qrUrl = qrMethod?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=GCash-Transfer-${accountNumber.replace(/\s+/g, '')}`;
                    return (
                      <>
                        <div className="bg-stone-900 text-[#c5a059] font-mono font-bold text-xs py-1.5 px-3 rounded-lg border border-white/5 flex items-center gap-1.5">
                          <span>No./Account:</span>
                          <span className="text-white tracking-wider select-all">{accountNumber}</span>
                        </div>
                        
                        <img 
                          src={qrUrl} 
                          alt="GCash QR Code" 
                          className="w-40 h-40 object-contain rounded-lg border border-white/10 bg-white p-1.5 shadow-sm" 
                        />
                      </>
                    );
                  })()}
                  
                  <p className="text-[10px] text-stone-400 leading-relaxed font-medium">
                    Please transfer the exact order amount and upload your payment proof/receipt screenshot below.
                  </p>
                  
                  {/* Receipt Upload Input at Checkout */}
                  <div className="w-full pt-2 border-t border-white/5 text-left">
                    <label className="text-[10px] font-extrabold uppercase text-stone-300 tracking-wider block mb-1.5">
                      Upload Payment Receipt
                    </label>
                    <div className="flex items-center gap-2">
                      {checkoutReceiptUrl && (
                        <img src={checkoutReceiptUrl} alt="Receipt Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-stone-900" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingReceipt(true);
                          try {
                            const res = await fetch('/api/upload-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ filename: file.name, contentType: file.type })
                            });
                            if (!res.ok) throw new Error(await res.text());
                            const { signedUrl, publicUrl } = await res.json();
                            await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                            
                            setCheckoutReceiptUrl(publicUrl);
                          } catch (err: any) {
                            alert("Failed to upload receipt: " + err.message);
                          } finally {
                            setUploadingReceipt(false);
                          }
                        }}
                        className="w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#c5a059]/10 file:text-[#c5a059] hover:file:bg-[#c5a059]/20"
                      />
                    </div>
                    {uploadingReceipt && <p className="text-[9px] text-[#c5a059] animate-pulse mt-1 font-semibold">Uploading proof of payment...</p>}
                  </div>
                </div>
              )}

              {/* SPECIAL ORDER NOTES */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                  Order Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="E.g. Separate bags, napkins please..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-900 border border-white/10 outline-none focus:border-[#c5a059] text-white"
                />
              </div>

              {/* RESTRICTION NOTICE FOR WALK-IN ORDER: POINTS & VOUCHERS */}
              <div className="bg-stone-950 border border-white/10 rounded-2xl p-3.5 text-xs text-stone-400 space-y-1">
                <div className="flex items-center gap-1.5 text-[#c5a059] font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Member Rewards Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Loyalty Points and Promo Vouchers are exclusive to registered user accounts. To earn rewards and apply discount codes on future orders, you can sign up anytime.
                </p>
              </div>

              {/* Order Summary Breakdown */}
              <div className="bg-stone-950/80 border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase text-stone-400">Order Summary</div>
                <div className="space-y-1">
                  {guestCart.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-stone-300">
                      <span>{item.quantity}x {item.product.name} ({item.selectedSize?.name})</span>
                      <span className="font-mono">
                        ₱{((item.product.price + (item.selectedSize?.priceAdjustment || 0) + (item.selectedAddOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm font-black text-white">
                  <span>Total Amount:</span>
                  <span className="font-serif text-[#c5a059] font-mono text-base">₱{cartSubtotal}</span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={orderSubmitting}
                className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {orderSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Send Walk-in Order to Kitchen (₱{cartSubtotal})</span>
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* LIVE ORDER CONFIRMATION / RECEIPT MODAL */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 text-center animate-fade-in ${
            isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#12100e] border-[#c5a059]/40 text-white'
          }`}>
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#c5a059] uppercase">
                ORDER TRANSMITTED TO KITCHEN
              </span>
              <h3 className="text-2xl font-serif font-black">Walk-in Order Placed!</h3>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Thank you, <strong className="text-white">{confirmedOrder.customerName}</strong>! Your order is now on our kitchen KDS display.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-stone-950 border border-white/10 rounded-2xl p-4 text-left space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-stone-400 font-bold">Order Number:</span>
                <span className="font-mono text-xs font-black text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded">
                  {confirmedOrder.orderNumber}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Customer:</span>
                <span className="font-bold text-white">{confirmedOrder.customerName} (Walk-in)</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Dining Type:</span>
                <span className="capitalize font-semibold text-white">
                  {confirmedOrder.orderType === 'table' ? `Dine-in (${confirmedOrder.tableNo || 'Table'})` : 'Takeout / Pickup'}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Payment:</span>
                <span className="capitalize font-semibold text-white">{confirmedOrder.paymentMethod}</span>
              </div>

              {/* Items */}
              <div className="border-t border-white/5 pt-2 space-y-1">
                {confirmedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-stone-300">
                    <span>{it.quantity}x {it.name} ({it.selectedSize})</span>
                    <span className="font-mono text-stone-400">₱{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm font-black">
                <span className="text-stone-300">Total Due:</span>
                <span className="text-[#c5a059] font-mono text-base">₱{confirmedOrder.total}</span>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="bg-stone-900/80 border border-white/5 rounded-xl p-3 text-xs text-stone-300 space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <ReceiptText className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Next Step:</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Please proceed to the cashier counter when your name (<strong className="text-stone-200">{confirmedOrder.customerName}</strong>) or order number (<strong className="text-stone-200">{confirmedOrder.orderNumber}</strong>) is announced.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setConfirmedOrder(null)}
                className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Back to Menu & Order More
              </button>
              
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  setShowAuthModal(true);
                  setIsLogin(false);
                }}
                className="w-full bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Create Loyalty Account for Future Points</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MEMBER PORTAL (SIGN IN / SIGN UP) MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-6 relative overflow-hidden animate-fade-in ${
            isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#12100e] border-white/10 text-white'
          }`}>
            
            {/* Top Accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[#c5a059]" />

            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Brand Header */}
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-[#c5a059]/40 bg-white flex items-center justify-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={shopName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#c5a059] flex items-center justify-center text-black font-serif font-black text-2xl">
                    {shopName.charAt(0)}
                  </div>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-black">
                {isLogin ? 'Member Sign In' : 'Join Loyalty Rewards'}
              </h2>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                {isLogin 
                  ? 'Access your customer account to view points, vouchers, and previous orders.' 
                  : 'Register now to earn points on every order and claim exclusive promo vouchers.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-950 border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isLogin ? 'bg-[#c5a059] text-black shadow-md' : 'text-stone-400 hover:text-white'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isLogin ? 'bg-[#c5a059] text-black shadow-md' : 'text-stone-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {/* Success Message */}
            {authSuccessMsg && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c5a059]" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              
              {/* Register Special Fields */}
              {!isLogin && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                      <input
                        type="text"
                        required
                        placeholder="E.g. Shasz Nair"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-950 border border-white/10 outline-none focus:border-[#c5a059] text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                      Contact Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                      <input
                        type="tel"
                        required
                        placeholder="E.g. +63 917 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-950 border border-white/10 outline-none focus:border-[#c5a059] text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-950 border border-white/10 outline-none focus:border-[#c5a059] text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-400 tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-950 border border-white/10 outline-none focus:border-[#c5a059] text-white"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs py-3 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md mt-4 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account & Unlock Rewards'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-stone-950 py-10 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-white text-sm">{shopName}</h4>
            <p className="text-xs text-stone-400">{shopDesc}</p>
            <p className="text-[11px] text-stone-500">Walk-in Orders, Cloud POS & Real-Time Kitchen Sync.</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">Coffee Lab Hours</h4>
            <div className="space-y-1 text-xs text-stone-400">
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Open Daily: 7:00 AM - 10:00 PM</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Coffee District • Walk-ins Welcome</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">Loyalty & Rewards</h4>
            <p className="text-xs text-stone-400">
              Register an account to earn points on every cup, redeem free drinks, and unlock member vouchers.
            </p>
            <button
              onClick={() => {
                setShowAuthModal(true);
                setIsLogin(false);
              }}
              className="text-xs font-bold text-[#c5a059] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Join Loyalty Program</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/5 text-center text-[10px] text-stone-600">
          &copy; {new Date().getFullYear()} {shopName}. All Rights Reserved.
        </div>
      </footer>

      {/* MOBILE FLOATING ORDER TRAY BAR */}
      {cartTotalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#c5a059] text-black font-black text-xs py-3.5 rounded-2xl flex items-center justify-between px-5 shadow-2xl border border-[#c5a059]/40 animate-bounce-subtle cursor-pointer hover:bg-[#b08c47] transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>View Order Tray</span>
              <span className="bg-black text-[#c5a059] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {cartTotalItems}
              </span>
            </div>
            <span className="font-mono font-black text-xs">₱{cartSubtotal}</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default AuthScreen;
