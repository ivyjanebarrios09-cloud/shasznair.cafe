import React, { useState, useMemo } from 'react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Product, CartItem, OrderType, PaymentMethod, UserProfile, Order, getPaymentMethodDisplayName } from '../types';
import { InstallAppButton } from './InstallAppButton';
import { CategoryIcon } from '../utils/categoryIcons';
import { 
  Search, ShoppingCart, UserPlus, CreditCard, Sparkles, Trash2, X, Plus, Minus, 
  Check, Play, Pause, AlertCircle, Printer, LogOut, ShoppingBag, 
  UserCheck, Banknote, Clock, ChevronRight, Layers, ArrowLeft, Coffee, ReceiptText,
  UtensilsCrossed, User, Smartphone, Store, Flame, ChevronDown, ChevronUp
} from 'lucide-react';

export const PosExperience: React.FC = () => {
  const {
    categories,
    products,
    vouchers,
    orders,
    usersList,
    placeOrder,
    updatePaymentStatus,
    updateOrderStatus,
    settings,
    currentUser,
    logout
  } = useCoffeeApp();

  const isLight = settings?.branding?.theme === 'light';

  // Selected Category filter & search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active POS state
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [customizeProduct, setCustomizeProduct] = useState<Product | null>(null);

  // Mobile cart drawer sheet state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customer Loyalty association & Walk-in customer name
  const [associatedCustomer, setAssociatedCustomer] = useState<UserProfile | null>(null);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedPosVoucher, setAppliedPosVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Checkout payment dialog
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNo, setTableNo] = useState('');
  const [posNotes, setPosNotes] = useState('');

  // Held orders
  const [heldOrders, setHeldOrders] = useState<{ id: string; cart: CartItem[]; customer: UserProfile | null; customerName?: string; voucher: any; timestamp: Date }[]>([]);

  // Active checkout receipt to print
  const [printedReceipt, setPrintedReceipt] = useState<Order | null>(null);

  // View toggler: 'menu' | 'register' | 'transactions'
  const [activeView, setActiveView] = useState<'menu' | 'register' | 'transactions'>('menu');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'unpaid'>('all');
  const [showPosBestSellers, setShowPosBestSellers] = useState(true);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Dynamic Best Sellers calculation for POS from real orders
  const posBestSellers = useMemo(() => {
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

    const orderedOnly = withSales.filter(item => item.soldCount > 0);
    return orderedOnly.sort((a, b) => b.soldCount - a.soldCount).slice(0, 6);
  }, [orders, products]);

  // Live count helper for categories
  const getCategoryProductCount = (catId: string) => {
    if (catId === 'all') {
      return products.filter(p => p.available).length;
    }
    const catObj = categories.find(c => c.id === catId);
    return products.filter(p => 
      p.available && (p.category === catId || (catObj && p.category === catObj.name))
    ).length;
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const catObj = categories.find(c => c.id === selectedCategory);
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory || (catObj && p.category === catObj.name);
    const matchSearch = searchQuery.trim() === '' ||
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && p.available;
  });

  // Calculate POS metrics
  const totalItemCount = posCart.reduce((sum, item) => sum + item.quantity, 0);

  const posSubtotal = posCart.reduce((sum, item) => {
    const sizePrice = item.selectedSize?.priceAdjustment || 0;
    const addOnsPrice = item.selectedAddOns.reduce((acc, a) => acc + a.price, 0);
    return sum + ((item.product.price + sizePrice + addOnsPrice) * item.quantity);
  }, 0);

  let posDiscount = 0;
  if (appliedPosVoucher) {
    if (appliedPosVoucher.discountType === 'percentage') {
      posDiscount = Math.round((posSubtotal * appliedPosVoucher.discountValue) / 100);
      if (appliedPosVoucher.maxDiscount > 0) {
        posDiscount = Math.min(posDiscount, appliedPosVoucher.maxDiscount);
      }
    } else {
      posDiscount = appliedPosVoucher.discountValue;
    }
  }

  const posTotal = Math.max(0, posSubtotal - posDiscount);

  // Add product to POS Cart
  const handleProductClick = (product: Product) => {
    setCustomizeProduct(product);
    setSelectedSize(product.sizes?.[0] || { name: 'Standard', priceAdjustment: 0 });
    setSelectedAddOns([]);
  };

  const handleAddCustomizedToCart = () => {
    if (!customizeProduct) return;
    const item: CartItem = {
      product: customizeProduct,
      quantity: 1,
      selectedSize: selectedSize,
      selectedAddOns: selectedAddOns,
      notes: ''
    };
    
    // Check if item already exists with exact customizations
    const existingIndex = posCart.findIndex(i => 
      i.product.id === item.product.id && 
      i.selectedSize.name === item.selectedSize.name &&
      JSON.stringify(i.selectedAddOns.map(a => a.name)) === JSON.stringify(item.selectedAddOns.map(a => a.name))
    );

    if (existingIndex > -1) {
      setPosCart(prev => prev.map((it, idx) => idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setPosCart(prev => [...prev, item]);
    }

    setCustomizeProduct(null);
  };

  const toggleAddOn = (addon: any) => {
    if (selectedAddOns.some(a => a.name === addon.name)) {
      setSelectedAddOns(prev => prev.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddOns(prev => [...prev, addon]);
    }
  };

  // Customer Loyalty association
  const handleAssociateCustomer = (cust: UserProfile) => {
    setAssociatedCustomer(cust);
    setShowCustomerModal(false);
    setCustomerSearchInput('');
  };

  // Apply Voucher
  const handleApplyVoucher = () => {
    setVoucherError(null);
    const code = voucherCodeInput.trim().toUpperCase();
    const v = vouchers.find(v => v.code === code && v.active);
    if (!v) {
      setVoucherError("Voucher code not found.");
      return;
    }
    if (posSubtotal < v.minPurchase) {
      setVoucherError(`Minimum purchase of ₱${v.minPurchase} required.`);
      return;
    }
    setAppliedPosVoucher(v);
    setVoucherCodeInput('');
  };

  // Hold / Park Order
  const handleHoldOrder = () => {
    if (posCart.length === 0) return;
    const heldItem = {
      id: `held_${Date.now()}`,
      cart: [...posCart],
      customer: associatedCustomer,
      customerName: customerNameInput.trim(),
      voucher: appliedPosVoucher,
      timestamp: new Date()
    };
    setHeldOrders(prev => [...prev, heldItem]);
    // Clear state
    setPosCart([]);
    setAssociatedCustomer(null);
    setCustomerNameInput('');
    setAppliedPosVoucher(null);
    setIsMobileCartOpen(false);
  };

  const handleResumeHeldOrder = (heldId: string) => {
    const item = heldOrders.find(h => h.id === heldId);
    if (!item) return;
    setPosCart(item.cart);
    setAssociatedCustomer(item.customer);
    setCustomerNameInput(item.customerName || '');
    setAppliedPosVoucher(item.voucher);
    setHeldOrders(prev => prev.filter(h => h.id !== heldId));
  };

  // Process POS Checkout Submission
  const handleProcessPOSCheckout = async () => {
    if (posCart.length === 0) return;
    
    try {
      const result = await placeOrder(
        orderType,
        tableNo,
        paymentMethod,
        posNotes,
        associatedCustomer?.uid || undefined,
        posCart,
        appliedPosVoucher,
        customerNameInput.trim() || undefined,
        'pos'
      );

      const selectedMethod = (settings.paymentMethods || []).find(m => m.id === paymentMethod);
      const isCashType = selectedMethod?.type === 'cash' || paymentMethod === 'cash';

      // If paid instantly, mark transaction as paid
      if (!isCashType || cashReceived) {
        await updatePaymentStatus(result.id, 'paid', parseFloat(cashReceived) || result.total);
        await updateOrderStatus(result.id, 'preparing');
      }

      setPrintedReceipt({ ...result, cashReceived: parseFloat(cashReceived) || undefined, change: parseFloat(cashReceived) ? Math.max(0, parseFloat(cashReceived) - result.total) : undefined });
      
      // Clear cart & inputs
      setPosCart([]);
      setAssociatedCustomer(null);
      setCustomerNameInput('');
      setAppliedPosVoucher(null);
      setCashReceived('');
      setPosNotes('');
      setTableNo('');
      setIsPayModalOpen(false);
      setIsMobileCartOpen(false);
    } catch (e: any) {
      alert(e.message || "An error occurred during cashier check out.");
    }
  };

  const calculatedChange = parseFloat(cashReceived) ? Math.max(0, parseFloat(cashReceived) - posTotal) : 0;

  // Render the Cart Content component (reusable in desktop sidebar and mobile bottom-sheet)
  const renderCartContent = (isMobileSheet = false) => (
    <div className={`flex flex-col ${isMobileSheet ? 'h-full' : 'h-full'} ${isLight ? 'bg-stone-50' : 'bg-[#0e1017]'}`}>
      {/* CART HEADER */}
      <div className={`p-3.5 sm:p-4 border-b flex justify-between items-center ${
        isLight ? 'bg-white border-stone-200' : 'bg-[#13151f] border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#c5a059]/15 text-[#c5a059]">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`font-extrabold text-xs sm:text-sm uppercase tracking-wider font-serif ${
              isLight ? 'text-stone-900' : 'text-white'
            }`}>Register Invoice</h3>
            <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in order
            </p>
          </div>
        </div>

        {isMobileSheet && (
          <button 
            onClick={() => setIsMobileCartOpen(false)}
            className={`p-1.5 rounded-full ${
              isLight ? 'text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200' : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* CUSTOMER IDENTIFICATION SECTION */}
      <div className="mx-3 mt-3 space-y-2">
        {associatedCustomer ? (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/40 border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                isLight ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold truncate ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>{associatedCustomer.name}</p>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isLight ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>Loyalty Member</span>
                </div>
                <p className={`text-[10px] font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400/80'}`}>{associatedCustomer.loyaltyPoints} loyalty pts • {associatedCustomer.phone || associatedCustomer.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAssociatedCustomer(null);
                setCustomerNameInput('');
              }}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                isLight ? 'text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border-emerald-300' : 'text-emerald-300 hover:text-emerald-100 bg-emerald-900/50 hover:bg-emerald-900 border-emerald-700/40'
              }`}
            >
              Detach
            </button>
          </div>
        ) : (
          <div className={`p-2.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-[10px] uppercase font-extrabold tracking-wider flex items-center gap-1 ${
                isLight ? 'text-stone-600' : 'text-white/50'
              }`}>
                <User className="w-3 h-3 text-[#c5a059]" /> Customer Name (Walk-in)
              </label>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-[10px] text-[#c5a059] hover:text-[#b08c47] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3 h-3" /> Link Loyalty Acc
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Enter customer name (e.g. Maria, John)..."
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs outline-none pr-7 transition-colors ${
                  isLight ? 'bg-stone-100 border-stone-300 text-stone-900 placeholder-stone-400 focus:border-amber-600' : 'bg-[#171922] border-white/10 text-white placeholder-white/30 focus:border-[#c5a059]'
                }`}
              />
              {customerNameInput && (
                <button
                  type="button"
                  onClick={() => setCustomerNameInput('')}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer ${
                    isLight ? 'text-stone-400 hover:text-stone-700' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SCROLLABLE CART ITEM LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-none min-h-[160px]">
        {posCart.length === 0 ? (
          <div className="text-center py-16 sm:py-24 space-y-3 px-4">
            <div className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center text-2xl ${
              isLight ? 'bg-stone-100 border-stone-200' : 'bg-white/[0.03] border-white/5'
            }`}>
              ☕
            </div>
            <div>
              <p className={`text-xs font-bold ${isLight ? 'text-stone-700' : 'text-white/60'}`}>Cart is Empty</p>
              <p className={`text-[11px] max-w-[200px] mx-auto mt-1 ${isLight ? 'text-stone-500' : 'text-white/30'}`}>Tap coffee or pastry items from the menu to build an invoice ticket.</p>
            </div>
          </div>
        ) : (
          posCart.map((item, index) => {
            const sizePrice = item.selectedSize?.priceAdjustment || 0;
            const addOnsPrice = item.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
            const unitPrice = item.product.price + sizePrice + addOnsPrice;

            return (
              <div 
                key={index} 
                className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs gap-2.5 shadow-sm ${
                  isLight ? 'bg-white border-stone-200 hover:border-stone-300' : 'bg-[#141620] border-white/[0.07] hover:border-white/15'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <h4 className={`font-bold text-xs truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>{item.product.name}</h4>
                    <span className="font-mono font-extrabold text-[#c5a059] text-xs">₱{unitPrice * item.quantity}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="bg-[#c5a059]/10 text-[#c5a059] px-1.5 py-0.5 rounded font-semibold border border-[#c5a059]/20">
                      {item.selectedSize.name}
                    </span>
                    {item.selectedAddOns.length > 0 && (
                      <span className={`truncate max-w-[150px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                        +{item.selectedAddOns.map(a => a.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* QUANTITY CONTROLLERS (Touch Friendly >= 36px) */}
                <div className={`flex items-center gap-1 border p-1 rounded-lg ${
                  isLight ? 'bg-stone-100 border-stone-300' : 'bg-[#0a0b0f] border-white/10'
                }`}>
                  <button
                    onClick={() => {
                      if (item.quantity > 1) {
                        setPosCart(prev => prev.map((it, idx) => idx === index ? { ...it, quantity: it.quantity - 1 } : it));
                      } else {
                        setPosCart(prev => prev.filter((_, idx) => idx !== index));
                      }
                    }}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-all cursor-pointer ${
                      isLight ? 'bg-stone-200 hover:bg-stone-300 text-stone-700' : 'bg-white/5 hover:bg-white/15 text-white/80'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className={`font-mono font-bold text-xs w-5 text-center ${isLight ? 'text-stone-900' : 'text-white'}`}>{item.quantity}</span>
                  <button
                    onClick={() => {
                      setPosCart(prev => prev.map((it, idx) => idx === index ? { ...it, quantity: it.quantity + 1 } : it));
                    }}
                    className={`w-7 h-7 flex items-center justify-center rounded transition-all cursor-pointer ${
                      isLight ? 'bg-stone-200 hover:bg-stone-300 text-stone-700' : 'bg-white/5 hover:bg-white/15 text-white/80'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POS CART CONTROL FOOTER */}
      {posCart.length > 0 && (
        <div className={`p-3.5 sm:p-4 border-t space-y-3 flex-shrink-0 ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#11131c] border-white/[0.08]'
        }`}>
          {/* Promo code application */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="PROMO / VOUCHER CODE..."
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value)}
                disabled={!!appliedPosVoucher}
                className={`flex-1 text-xs border outline-none px-3 py-2 rounded-xl uppercase font-mono transition-colors ${
                  isLight 
                    ? 'bg-stone-100 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 disabled:bg-stone-200 disabled:text-stone-400' 
                    : 'bg-[#090a0e] border-white/10 text-white placeholder:text-white/30 focus:border-[#c5a059] disabled:bg-[#090a0e]/40 disabled:text-white/30'
                }`}
              />
              {appliedPosVoucher ? (
                <button
                  onClick={() => setAppliedPosVoucher(null)}
                  className="bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/60 px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleApplyVoucher}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Apply
                </button>
              )}
            </div>
            {voucherError && <p className="text-[10px] text-rose-400 font-bold">{voucherError}</p>}
          </div>

          {/* Subtotal & Discount breakdown */}
          <div className={`text-xs space-y-1.5 p-3 rounded-xl border ${
            isLight ? 'bg-stone-50 border-stone-200 text-stone-600' : 'bg-[#0a0b0f] border-white/[0.05] text-white/60'
          }`}>
            <div className="flex justify-between">
              <span>Subtotal ({totalItemCount} items)</span>
              <span className={`font-mono font-medium ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{posSubtotal}</span>
            </div>
            {posDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Voucher Discount</span>
                <span className="font-mono">-₱{posDiscount}</span>
              </div>
            )}
            {associatedCustomer && (
              <div className="flex justify-between text-[#c5a059] font-bold text-[11px]">
                <span>Loyalty Points to Earn</span>
                <span>+{Math.floor(posTotal / (settings.loyaltySettings.amountRequired || 100))} pts</span>
              </div>
            )}
            <div className={`flex justify-between border-t pt-2 text-sm font-black ${
              isLight ? 'border-stone-200 text-stone-900' : 'border-white/10 text-white'
            }`}>
              <span>Total Due</span>
              <span className="text-[#c5a059] font-mono text-base">₱{posTotal}</span>
            </div>
          </div>

          {/* Action buttons: Clear & Hold */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setPosCart([]);
                setAssociatedCustomer(null);
                setAppliedPosVoucher(null);
                setIsMobileCartOpen(false);
              }}
              className={`border font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer transition-all ${
                isLight ? 'border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Clear
            </button>
            <button
              onClick={handleHoldOrder}
              className="border border-[#c5a059]/30 bg-[#c5a059]/10 hover:bg-[#c5a059]/20 active:scale-95 text-[#c5a059] font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-1.5 cursor-pointer transition-all"
            >
              <Pause className="w-3.5 h-3.5" /> Hold Ticket
            </button>
          </div>

          {/* Main Checkout Pay Button */}
          <button
            onClick={() => {
              setIsPayModalOpen(true);
              if (isMobileSheet) setIsMobileCartOpen(false);
            }}
            className="w-full bg-[#c5a059] hover:bg-[#b08c47] active:scale-[0.98] text-black font-extrabold py-3.5 rounded-xl text-xs sm:text-sm flex justify-between items-center transition-all shadow-lg shadow-[#c5a059]/20 cursor-pointer px-4"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> 
              Collect Payment
            </span>
            <span className="bg-black/25 text-[#c5a059] font-mono py-1 px-2.5 rounded-lg font-black text-xs sm:text-sm">
              ₱{posTotal}
            </span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`min-h-screen ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#07080c] text-[#f2f2f2]'} flex flex-col font-sans select-none overflow-x-hidden pb-20 lg:pb-6 transition-colors duration-300`}
      style={{ '--color-primary': settings.branding.primaryColor } as React.CSSProperties}
    >
      {/* TOP NAVIGATION & PRODUCTION HEADER BANNER */}
      <header className={`${isLight ? 'bg-white/95 border-stone-200 text-stone-900' : 'bg-[#0b0c10]/95 border-white/10 text-white'} backdrop-blur-md border-b px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xl relative transition-colors`}>
        {/* GOLD ACCENT ACCENT LINE */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-80" />

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-stone-200">
            {settings.branding.logoUrl ? (
              <img src={settings.branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--color-primary)] flex items-center justify-center text-black font-serif font-black text-base sm:text-lg">
                {settings.branding.shopName.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif font-black tracking-wider text-[var(--color-primary)] text-xs sm:text-base leading-tight truncate">
                {settings.branding.shopName}
              </h1>
              {/* CHECKOUT TERMINAL PILL BADGE */}
              <span className="inline-flex items-center gap-1 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 text-[var(--color-primary)] px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CHECKOUT TERMINAL
              </span>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                settings?.storeStatus?.isOpen !== false
                  ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                  : isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/80 text-rose-300 border-rose-600/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${settings?.storeStatus?.isOpen !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span>{settings?.storeStatus?.isOpen !== false ? 'OPEN' : 'CLOSED'}</span>
              </div>
            </div>

            {/* BOLD POS CASHIER & COMMAND CENTER POS SUBTITLE BANNER */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest ${
                isLight ? 'text-emerald-700' : 'text-emerald-400'
              }`}>
                POS CASHIER
              </span>
              <span className={`${isLight ? 'text-stone-300' : 'text-white/20'} hidden sm:inline`}>•</span>
              <span className={`text-[9px] sm:text-[10px] font-sans font-bold tracking-wider uppercase hidden xs:inline ${
                isLight ? 'text-stone-500' : 'text-white/50'
              }`}>
                COMMAND CENTER POS
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: INSTALL APP + CASHIER PROFILE & LOGOUT */}
        <div className="flex items-center gap-2 sm:gap-3">
          <InstallAppButton />

          {/* CASHIER PROFILE & LOGOUT */}
          <div className={`flex items-center gap-2 border-l pl-2 sm:pl-3 ${
            isLight ? 'border-stone-200' : 'border-white/10'
          }`}>
            <span className={`text-[11px] font-medium hidden md:inline ${
              isLight ? 'text-stone-600' : 'text-stone-400'
            }`}>
              Cashier: <strong className={isLight ? 'text-stone-900 uppercase' : 'text-white uppercase'}>{currentUser?.name}</strong>
            </span>
            <button
              id="pos-signout-btn"
              onClick={() => logout()}
              title="Sign Out of Cashier Station"
              className={`text-[10px] font-bold p-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer border ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
                  : 'bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* STORE CLOSED BANNER */}
      {settings.storeStatus?.isOpen === false && (
        <div className={`border-b text-xs py-2 px-4 sticky top-[49px] sm:top-[57px] z-35 shadow-md flex items-center justify-center gap-2 ${
          isLight
            ? 'bg-rose-100 border-rose-300 text-rose-900'
            : 'bg-rose-950/90 border-rose-900 text-rose-200'
        }`}>
          <AlertCircle className={`w-4 h-4 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
          <span className="font-bold text-center">Store Operations Status: <strong className="uppercase">CLOSED</strong>. POS new register orders are paused.</span>
        </div>
      )}

      {/* SELECTION BAR AFTER TOP BAR (MENU ITEMS, REGISTER, TRANSACTIONS) */}
      <div className={`border-b px-3 sm:px-6 py-2 sticky top-[49px] sm:top-[57px] z-30 shadow-md ${
        isLight ? 'bg-white border-stone-200' : 'bg-[#0b0c10] border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <nav className={`flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl border w-full sm:w-auto ${
            isLight ? 'bg-stone-100 border-stone-200' : 'bg-[#141620] border-white/10'
          }`}>
            {/* 1. Menu Items */}
            <button
              id="pos-nav-menu"
              onClick={() => setActiveView('menu')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeView === 'menu'
                  ? 'bg-[#c5a059] text-black shadow-md font-extrabold'
                  : isLight ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Menu Items</span>
            </button>

            {/* 2. Register */}
            <button
              id="pos-nav-register"
              onClick={() => setActiveView('register')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 relative ${
                activeView === 'register'
                  ? 'bg-[#c5a059] text-black shadow-md font-extrabold'
                  : isLight ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Register</span>
              {totalItemCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeView === 'register' ? 'bg-black text-[#c5a059]' : 'bg-[#c5a059] text-black'
                }`}>
                  {totalItemCount}
                </span>
              )}
            </button>

            {/* 3. Transaction */}
            <button
              id="pos-nav-transactions"
              onClick={() => setActiveView('transactions')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeView === 'transactions'
                  ? 'bg-[#c5a059] text-black shadow-md font-extrabold'
                  : isLight ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-200' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Transactions</span>
              {orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'preparing').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Quick stats on larger screens */}
          <div className={`hidden sm:flex items-center gap-3 text-xs ${isLight ? 'text-stone-600' : 'text-white/50'}`}>
            {heldOrders.length > 0 && (
              <button
                onClick={() => handleResumeHeldOrder(heldOrders[0].id)}
                className={`font-mono text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors animate-pulse border ${
                  isLight
                    ? 'text-amber-800 bg-amber-100 border-amber-300 hover:bg-amber-200'
                    : 'text-amber-400/90 hover:text-amber-300 bg-amber-950/40 border-amber-500/30'
                }`}
                title="Resume oldest held order"
              >
                <Play className="w-2.5 h-2.5 fill-amber-500" />
                <span>{heldOrders.length} Held Ticket{heldOrders.length > 1 ? 's' : ''}</span>
              </button>
            )}
            <div className={`flex items-center gap-1.5 font-mono px-3 py-1.5 rounded-lg border ${
              isLight ? 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-[#141620] text-white/50 border-white/5'
            }`}>
              <span>Invoice:</span>
              <strong className="text-[#c5a059]">₱{posTotal}</strong>
              <span className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full">
        {activeView === 'menu' && (
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            {/* A. PRODUCT & FILTER MENU GRID (8 columns on desktop, 12 on mobile) */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-3.5 sm:gap-4">
              
              {/* SEARCH & LOYALTY LOOKUP BAR */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search coffee, drinks, or pastries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full text-xs rounded-xl py-2.5 px-3.5 pl-9 outline-none shadow-inner border transition-colors ${
                      isLight
                        ? 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-amber-600'
                        : 'bg-[#12141c] border-white/10 text-white placeholder-white/35 focus:border-[#c5a059]'
                    }`}
                  />
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-stone-400' : 'text-white/40'}`} />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs p-1 ${isLight ? 'text-stone-400 hover:text-stone-700' : 'text-white/40 hover:text-white'}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* LOYALTY LOOKUP BUTTON */}
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className={`text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-98 whitespace-nowrap border ${
                    isLight
                      ? 'bg-white hover:bg-amber-50 border-amber-600/40 text-amber-900'
                      : 'bg-[#12141c] hover:bg-[#1a1d28] border-[#c5a059]/40 text-[#c5a059]'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{associatedCustomer ? associatedCustomer.name : 'Loyalty Lookup'}</span>
                </button>
              </div>

              {/* OVERALL BEST SELLERS RIBBON (EXACT REFERENCE DESIGN) */}
              {selectedCategory === 'all' && showPosBestSellers && posBestSellers.length > 0 && (
                <div className="bg-[#fff9f0] border border-[#f5d9a6] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg space-y-2.5 sm:space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔥</span>
                      <h3 className="font-black text-xs sm:text-sm text-stone-900 tracking-wider uppercase">
                        OVERALL BEST SELLERS
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowPosBestSellers(false)}
                      className="text-stone-400 hover:text-stone-700 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>

                  {/* BEST SELLER CARDS LIST */}
                  <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none touch-pan-x">
                    {posBestSellers.map(({ product: prod, soldCount }) => (
                      <div
                        key={prod.id}
                        onClick={() => handleProductClick(prod)}
                        className="bg-white rounded-2xl p-2 sm:p-2.5 border border-[#f5e6d0] shadow-sm hover:shadow-md hover:border-[#e8caa3] transition-all flex gap-2.5 sm:gap-3 items-center relative min-w-[235px] sm:min-w-[250px] max-w-[270px] shrink-0 cursor-pointer group select-none"
                      >
                        {/* PRODUCT THUMBNAIL WITH FLAME SOLD BADGE */}
                        <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100">
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400'}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1 left-1 bg-[#ff5722] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                            <span>🔥</span>
                            <span>{soldCount} sold</span>
                          </div>
                        </div>

                        {/* DETAILS & + ADD BUTTON */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                          <div>
                            <span className="text-[8px] sm:text-[9px] font-black text-amber-600 tracking-wider uppercase block">
                              BEST SELLER
                            </span>
                            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 truncate leading-snug mt-0.5">
                              {prod.name}
                            </h4>
                            <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                              {prod.category}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-stone-100">
                            <span className="text-xs sm:text-sm font-black text-[#c5a059]">
                              ₱{prod.price}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(prod);
                              }}
                              className="bg-[#fff1e0] hover:bg-[#ffe3c2] active:scale-95 text-[#d97706] font-black text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border border-[#fbd38d]/70 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              + ADD
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORIES STATUS FILTER PILLS BAR WITH LIVE COUNTS */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                <button
                  id="pos-filter-pill-all"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all flex items-center gap-2 shadow-sm ${
                    selectedCategory === 'all'
                      ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md font-extrabold ring-1 ring-[#c5a059]/40'
                      : isLight ? 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900' : 'bg-[#12141c] border-white/10 text-white/70 hover:bg-[#181a24] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Items</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-black/20 text-black'
                      : isLight ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-white/60'
                  }`}>
                    {getCategoryProductCount('all')}
                  </span>
                </button>
                {categories.filter(c => c.active).map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  const count = getCategoryProductCount(cat.id);
                  return (
                    <button
                      key={cat.id}
                      id={`pos-filter-pill-${cat.id}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all flex items-center gap-2 shadow-sm ${
                        isSelected
                          ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md font-extrabold ring-1 ring-[#c5a059]/40'
                          : isLight ? 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900' : 'bg-[#12141c] border-white/10 text-white/70 hover:bg-[#181a24] hover:text-white'
                      }`}
                    >
                      <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black transition-colors ${
                        isSelected
                          ? 'bg-black/20 text-black'
                          : isLight ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-white/60'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* PRODUCT CARDS GRID (MOBILE FRIENDLY: 2 cols on mobile, 3-4 cols on tablet/desktop) */}
              {filteredProducts.length === 0 ? (
                <div className={`border rounded-2xl p-12 text-center space-y-2 ${
                  isLight ? 'bg-white border-stone-200 text-stone-500' : 'bg-[#12141c] border-white/10 text-white/40'
                }`}>
                  <p className={`text-sm font-bold ${isLight ? 'text-stone-800' : 'text-white/60'}`}>No products found</p>
                  <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-white/30'}`}>Try selecting another category or clear search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 pb-6">
                  {filteredProducts.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => handleProductClick(prod)}
                      className={`rounded-2xl border p-2 sm:p-2.5 text-left flex flex-col justify-between hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden ${
                        isLight
                          ? 'bg-white border-stone-200 hover:border-amber-500/60 hover:bg-amber-50/30'
                          : 'bg-[#12141c] border-white/[0.08] hover:border-[#c5a059]/50 hover:bg-[#161822]'
                      }`}
                    >
                      <div className="space-y-2 w-full">
                        {/* PRODUCT IMAGE WITH GRADIENT & STOCK TAG */}
                        <div className={`relative w-full h-24 sm:h-28 rounded-xl overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-white/5'}`}>
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200'}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                          
                          {/* Stock Status Badge */}
                          {prod.stockTracking && prod.stockQuantity <= 10 && (
                            <span className={`absolute top-1.5 right-1.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow ${
                              prod.stockQuantity === 0 
                                ? 'bg-rose-950/90 text-rose-300 border border-rose-800' 
                                : 'bg-amber-950/90 text-amber-300 border border-amber-800'
                            }`}>
                              {prod.stockQuantity === 0 ? 'Out of Stock' : `${prod.stockQuantity} Left`}
                            </span>
                          )}
                        </div>

                        {/* PRODUCT DETAILS */}
                        <div>
                          <h4 className={`text-xs sm:text-sm font-bold transition-colors line-clamp-1 leading-tight ${
                            isLight ? 'text-stone-900 group-hover:text-amber-800' : 'text-white group-hover:text-[#c5a059]'
                          }`}>
                            {prod.name}
                          </h4>
                          <p className={`text-[10px] line-clamp-1 mt-0.5 ${
                            isLight ? 'text-stone-500 font-medium' : 'text-white/40'
                          }`}>
                            {prod.description}
                          </p>
                        </div>
                      </div>

                      {/* BOTTOM PRICE & QUICK ADD BUTTON */}
                      <div className={`flex justify-between items-center mt-2.5 w-full border-t pt-2 ${
                        isLight ? 'border-stone-200' : 'border-white/[0.06]'
                      }`}>
                        <div>
                          <span className="text-xs sm:text-sm font-mono font-extrabold text-[#c5a059]">₱{prod.price}</span>
                          {prod.sizes && prod.sizes.length > 1 && (
                            <span className={`text-[9px] block font-sans ${isLight ? 'text-stone-400 font-medium' : 'text-white/30'}`}>Options</span>
                          )}
                        </div>
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#c5a059]/15 group-hover:bg-[#c5a059] text-[#c5a059] group-hover:text-black flex items-center justify-center transition-colors font-bold shadow-sm">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* B. DESKTOP CART SIDEBAR (Hidden on mobile < lg, shown on desktop lg:col-span-4) */}
            <div className={`hidden lg:block lg:col-span-4 sticky top-28 h-[calc(100vh-8.5rem)] rounded-2xl border overflow-hidden shadow-2xl ${
              isLight ? 'border-stone-200 bg-white' : 'border-white/10'
            }`}>
              {renderCartContent(false)}
            </div>
          </div>
        )}

        {activeView === 'register' && (
          <div className="max-w-2xl mx-auto w-full">
            <div className={`rounded-2xl border overflow-hidden shadow-2xl min-h-[580px] ${
              isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#0e1017] border-white/10'
            }`}>
              {renderCartContent(false)}
            </div>
          </div>
        )}

        {activeView === 'transactions' && (
          /* CASHIER TRANSACTIONS QUEUE VIEW (RESPONSIVE TABLE + MOBILE CARDS) */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className={`font-bold text-base font-serif tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>Transactions Queue & Operations</h3>
                <p className={`text-xs ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Real-time synced customer & POS orders</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5 border ${
                  isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Synced
                </span>
              </div>
            </div>

            {/* TRANSACTIONS STATUS FILTER PILLS BAR WITH LIVE COUNTS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {[
                { id: 'all', label: 'All Orders', count: orders.length },
                { id: 'pending', label: 'Pending', count: orders.filter(o => o.orderStatus === 'pending').length },
                { id: 'preparing', label: 'Preparing', count: orders.filter(o => o.orderStatus === 'preparing').length },
                { id: 'ready', label: 'Ready', count: orders.filter(o => o.orderStatus === 'ready').length },
                { id: 'completed', label: 'Completed', count: orders.filter(o => o.orderStatus === 'completed').length },
                { id: 'unpaid', label: 'Unpaid', count: orders.filter(o => o.paymentStatus === 'unpaid').length },
              ].map(pill => {
                const isSelected = txStatusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    id={`pos-tx-filter-${pill.id}`}
                    onClick={() => setTxStatusFilter(pill.id as any)}
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap border cursor-pointer transition-all flex items-center gap-2 shadow-sm ${
                      isSelected
                        ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md font-extrabold ring-1 ring-[#c5a059]/40'
                        : isLight ? 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900' : 'bg-[#12141c] border-white/10 text-white/70 hover:bg-[#181a24] hover:text-white'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black transition-colors ${
                      isSelected
                        ? 'bg-black/20 text-black'
                        : isLight ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-white/60'
                    }`}>
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MOBILE CARD VIEW FOR ORDERS (< md) */}
            <div className="md:hidden space-y-3">
              {(() => {
                const displayedOrders = orders.filter(ord => {
                  if (txStatusFilter === 'all') return true;
                  if (txStatusFilter === 'unpaid') return ord.paymentStatus === 'unpaid';
                  return ord.orderStatus === txStatusFilter;
                });

                if (displayedOrders.length === 0) {
                  return (
                    <div className={`p-8 rounded-2xl border text-center text-xs ${
                      isLight ? 'bg-white border-stone-200 text-stone-400' : 'bg-[#12141c] border-white/10 text-white/30'
                    }`}>
                      No transactions matching the selected filter.
                    </div>
                  );
                }

                return displayedOrders.map(ord => (
                  <div key={ord.id} className={`p-3.5 rounded-2xl border space-y-3 shadow-md ${
                    isLight ? 'bg-white border-stone-200' : 'bg-[#12141c] border-white/10'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${
                      isLight ? 'border-stone-200' : 'border-white/5'
                    }`}>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-[#c5a059] text-xs">#{ord.orderNumber.slice(-8)}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            ord.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-blue-950/70 text-blue-300 border border-blue-800/40' 
                              : isLight ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? (
                              <><Store className="w-2.5 h-2.5" /> POS Counter</>
                            ) : (
                              <><Smartphone className="w-2.5 h-2.5" /> Online App</>
                            )}
                          </span>
                        </div>
                        <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${isLight ? 'text-stone-900' : 'text-white'}`}>
                          <User className="w-3 h-3 text-[#c5a059]" /> {ord.customerName}
                        </p>
                        {ord.cashierName && (
                          <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Cashier: {ord.cashierName}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          ord.paymentStatus === 'paid' 
                            ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-900/30'
                            : isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-900/30'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          ord.orderStatus === 'completed' ? (isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-900/30') :
                          ord.orderStatus === 'ready' ? (isLight ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'bg-indigo-950 text-indigo-300 border border-indigo-900/30') :
                          ord.orderStatus === 'preparing' ? (isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-900/30') :
                          (isLight ? 'bg-stone-100 text-stone-600 border border-stone-200' : 'bg-white/5 text-white/50')
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div className={`text-[11px] space-y-0.5 ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                        <p>Type: <strong className={`capitalize ${isLight ? 'text-stone-900' : 'text-white'}`}>{ord.orderType.replace('_', ' ')}</strong></p>
                        <p>Payment: <strong className={`uppercase ${isLight ? 'text-stone-900' : 'text-white'}`}>{getPaymentMethodDisplayName(ord.paymentMethod, settings.paymentMethods)}</strong></p>
                        <div className="pt-1 max-h-16 overflow-y-auto">
                          {ord.items.map((it, i) => (
                            <div key={i} className="flex flex-col">
                              <span className={isLight ? 'text-stone-800' : 'text-white/80'}><strong className="text-[#c5a059]">{it.quantity}x</strong> {it.name} <span className={isLight ? 'text-stone-500' : 'text-white/40'}>({it.selectedSize})</span></span>
                              {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                                <span className={`italic text-[10px] pl-3 ${isLight ? 'text-stone-500' : 'text-white/40'}`}>+ {it.selectedAddOns.join(', ')}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] block ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Total Due</span>
                        <span className="font-mono font-black text-[#c5a059] text-sm">₱{ord.total}</span>
                      </div>
                    </div>

                    {ord.receiptUrl && (
                      <div className={`mt-2 p-2 rounded-xl border flex items-center justify-between gap-2.5 ${
                        isLight ? 'bg-amber-50/40 border-amber-200 text-stone-800' : 'bg-amber-950/15 border-amber-800/30 text-white/90'
                      }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ReceiptText className="w-4 h-4 text-[#c5a059] shrink-0" />
                          <span className="text-[10px] font-bold truncate">E-Wallet Receipt</span>
                        </div>
                        <button
                          onClick={() => setViewReceiptUrl(ord.receiptUrl || null)}
                          className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-[9px] px-2 py-1 rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          Check Receipt
                        </button>
                      </div>
                    )}

                    {/* Fulfill / Payment buttons */}
                    <div className={`flex gap-2 pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      {ord.paymentStatus === 'unpaid' && (
                        <button
                          onClick={() => updatePaymentStatus(ord.id, 'paid')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer text-center"
                        >
                          Mark Paid
                        </button>
                      )}
                      {ord.orderStatus === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(ord.id, 'completed')}
                          className="flex-1 bg-[#c5a059] hover:bg-[#b08c47] active:scale-95 text-black font-bold py-2 rounded-xl text-xs transition-all cursor-pointer text-center"
                        >
                          Fulfill Order
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className={`hidden md:block rounded-2xl border shadow-xl overflow-hidden ${
              isLight ? 'bg-white border-stone-200' : 'bg-[#12141c] border-white/10'
            }`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b uppercase tracking-widest font-extrabold text-[10px] ${
                    isLight ? 'bg-stone-100 border-stone-200 text-stone-600' : 'bg-[#0b0c10] border-white/10 text-white/50'
                  }`}>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Source</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5 w-1/4">Items & Add-ons</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-stone-200' : 'divide-white/5'}`}>
                  {(() => {
                    const displayedOrders = orders.filter(ord => {
                      if (txStatusFilter === 'all') return true;
                      if (txStatusFilter === 'unpaid') return ord.paymentStatus === 'unpaid';
                      return ord.orderStatus === txStatusFilter;
                    });

                    if (displayedOrders.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className={`p-8 text-center ${isLight ? 'text-stone-400' : 'text-white/30'}`}>No transactions matching the selected filter.</td>
                        </tr>
                      );
                    }

                    return displayedOrders.map(ord => (
                      <tr key={ord.id} className={`transition-colors ${isLight ? 'hover:bg-stone-50' : 'hover:bg-white/[0.03]'}`}>
                        <td className="p-3.5 font-mono font-bold text-[#c5a059]">#{ord.orderNumber.slice(-8)}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ord.orderSource === 'pos'
                              ? isLight ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                              : isLight ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                          }`}>
                            {ord.orderSource === 'pos' ? (
                              <><Store className="w-3 h-3" /> POS Counter</>
                            ) : (
                              <><Smartphone className="w-3 h-3" /> Online App</>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className={`font-bold flex items-center gap-1 ${isLight ? 'text-stone-900' : 'text-white'}`}>
                            <User className="w-3 h-3 text-[#c5a059]" /> {ord.customerName}
                          </p>
                          <div className={`flex items-center gap-2 mt-0.5 text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                            <span className="uppercase">{getPaymentMethodDisplayName(ord.paymentMethod, settings.paymentMethods)}</span>
                            {ord.cashierName && (
                              <span>• Cashier: {ord.cashierName}</span>
                            )}
                          </div>
                          {ord.receiptUrl && (
                            <div className={`mt-2 p-2 rounded-xl border flex items-center justify-between gap-2.5 ${
                              isLight ? 'bg-amber-50/40 border-amber-200 text-stone-800' : 'bg-amber-950/15 border-amber-800/30 text-white/90'
                            }`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ReceiptText className="w-4 h-4 text-[#c5a059] shrink-0" />
                                <span className="text-[10px] font-bold truncate">E-Wallet Receipt</span>
                              </div>
                              <button
                                onClick={() => setViewReceiptUrl(ord.receiptUrl || null)}
                                className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-[9px] px-2 py-1 rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                              >
                                Check Receipt
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-[10px]">
                          <div className="space-y-1 max-h-16 overflow-y-auto">
                            {ord.items.map((it, i) => (
                              <div key={i} className="flex flex-col">
                                <span className={`font-bold ${isLight ? 'text-stone-800' : 'text-white/80'}`}>{it.quantity}x {it.name} <span className={`font-normal ${isLight ? 'text-stone-500' : 'text-white/40'}`}>({it.selectedSize})</span></span>
                                {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                                  <span className={`italic ${isLight ? 'text-stone-500' : 'text-white/40'}`}>+ {it.selectedAddOns.join(', ')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`capitalize font-bold px-2 py-0.5 rounded text-[10px] border ${
                            isLight ? 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-white/5 text-white/70 border-white/5'
                          }`}>
                            {ord.orderType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className={`font-mono font-extrabold ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{ord.total}</p>
                          {ord.discount > 0 && <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Save ₱{ord.discount}</p>}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            ord.paymentStatus === 'paid' 
                              ? isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-900/30'
                              : isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-900/30'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            ord.orderStatus === 'completed' ? (isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950 text-emerald-300 border border-emerald-900/30') :
                            ord.orderStatus === 'ready' ? (isLight ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'bg-indigo-950 text-indigo-300 border border-indigo-900/30') :
                            ord.orderStatus === 'preparing' ? (isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-900/30') :
                            (isLight ? 'bg-stone-100 text-stone-600 border border-stone-200' : 'bg-white/5 text-white/50')
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex gap-1.5 justify-end items-center">
                            {ord.receiptUrl && ord.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => setViewReceiptUrl(ord.receiptUrl)}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-2.5 py-1 rounded-lg text-[10px] transition-colors cursor-pointer shrink-0"
                              >
                                Check Receipt
                              </button>
                            )}
                            {ord.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => updatePaymentStatus(ord.id, 'paid')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-colors cursor-pointer shrink-0"
                              >
                                Mark Paid
                              </button>
                            )}
                            {ord.orderStatus === 'ready' && (
                              <button
                                onClick={() => updateOrderStatus(ord.id, 'completed')}
                                className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold px-2.5 py-1 rounded-lg text-[10px] transition-colors cursor-pointer shrink-0"
                              >
                                Fulfill Order
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE PERSISTENT FLOATING REGISTER / CART BAR (< lg screens) */}
      {activeView === 'menu' && posCart.length > 0 && (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 p-3 backdrop-blur-md border-t z-40 shadow-2xl ${
          isLight ? 'bg-white/95 border-stone-200' : 'bg-[#0b0c10]/95 border-white/10'
        }`}>
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className={`flex items-center gap-2.5 text-left p-2 rounded-xl border flex-1 transition-all cursor-pointer ${
                isLight ? 'bg-stone-100 hover:bg-stone-200 border-stone-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <div className="relative p-2 rounded-lg bg-[#c5a059] text-black">
                <ShoppingCart className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-black text-[#c5a059] text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#c5a059]">
                  {totalItemCount}
                </span>
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>Register Ticket</p>
                <p className={`text-[10px] font-mono ${isLight ? 'text-stone-600' : 'text-white/50'}`}>Total: <strong className="text-[#c5a059]">₱{posTotal}</strong></p>
              </div>
            </button>

            <button
              onClick={() => setIsPayModalOpen(true)}
              className="bg-[#c5a059] hover:bg-[#b08c47] active:scale-95 text-black font-extrabold px-4 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay ₱{posTotal}</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SLIDE-UP CART DRAWER (< lg) */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`rounded-t-3xl border-t h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up ${
            isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#0e1017] border-white/15'
          }`}>
            {/* Grab handle indicator */}
            <div className={`w-12 h-1 rounded-full mx-auto my-2 ${isLight ? 'bg-stone-300' : 'bg-white/20'}`} />
            <div className="flex-1 overflow-hidden">
              {renderCartContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* 1. CUSTOMER ASSOCIATOR DIALOG MODAL (MOBILE RESPONSIVE) */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className={`w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 border max-h-[80vh] flex flex-col ${
            isLight ? 'bg-white border-stone-200' : 'bg-[#12141c] border-white/10'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2 text-[#c5a059]">
                <UserPlus className="w-4 h-4" />
                <h3 className={`font-bold text-sm font-serif tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>Associate Loyalty Customer</h3>
              </div>
              <button 
                onClick={() => setShowCustomerModal(false)} 
                className={`p-1 rounded-full cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-stone-100 text-stone-500 hover:text-stone-900' : 'hover:bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Search Phone or Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="E.g. 0917 or customer name..."
                  value={customerSearchInput}
                  onChange={(e) => setCustomerSearchInput(e.target.value)}
                  className={`w-full text-xs p-2.5 pl-8 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-stone-100 border-stone-300 text-stone-900 focus:border-amber-600' 
                      : 'bg-[#07080c] border-white/10 text-white focus:border-[#c5a059]'
                  }`}
                />
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isLight ? 'text-stone-400' : 'text-white/40'}`} />
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none min-h-[120px]">
              {usersList
                .filter(u => u.phone.includes(customerSearchInput) || u.name.toLowerCase().includes(customerSearchInput.toLowerCase()))
                .map(user => (
                  <button
                    key={user.uid}
                    onClick={() => handleAssociateCustomer(user)}
                    className={`w-full text-left p-3 rounded-xl border flex justify-between items-center text-xs transition-all cursor-pointer active:scale-98 ${
                      isLight 
                        ? 'bg-stone-50 hover:bg-stone-100 border-stone-200' 
                        : 'bg-[#07080c] hover:bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className={`font-bold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>{user.name}</p>
                      <p className={`text-[10px] font-mono truncate ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{user.phone || user.email}</p>
                    </div>
                    <span className="font-bold font-mono bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                      {user.loyaltyPoints} pts
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CHOOSE PAYMENT & TABLE / ORDERTYPE MODAL (WITH QUICK CASH BUTTONS) */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 border max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-white border-stone-200' : 'bg-[#12141c] border-white/10'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#c5a059]" />
                <div>
                  <h3 className={`font-bold text-sm font-serif ${isLight ? 'text-stone-900' : 'text-white'}`}>Collect Register Payment</h3>
                  <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Select channel and tender cash</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPayModalOpen(false)} 
                className={`p-1 rounded-full cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-stone-100 text-stone-500 hover:text-stone-900' : 'hover:bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CUSTOMER NAME / CALLING TAG INPUT */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center justify-between">
                <span>Customer Name / Call Name</span>
                {associatedCustomer && <span className="text-[#c5a059] font-bold">({associatedCustomer.displayName})</span>}
              </label>
              <input
                type="text"
                placeholder="Enter customer name or order call tag (e.g. John, Order #12)..."
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                  isLight 
                    ? 'bg-stone-100 border-stone-300 text-stone-900 focus:border-amber-600' 
                    : 'bg-[#07080c] border-white/10 text-white focus:border-[#c5a059]'
                }`}
              />
            </div>

            {/* ORDER TYPE & CHANNEL SELECT */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Service Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-stone-100 border-stone-300 text-stone-900 focus:border-amber-600' 
                      : 'bg-[#07080c] border-white/10 text-white focus:border-[#c5a059]'
                  }`}
                >
                  <option value="dine_in">🍽️ Dine-In</option>
                  <option value="pickup">🛍️ Takeout Pickup</option>
                  <option value="table">🛎️ Table Service</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-stone-100 border-stone-300 text-stone-900 focus:border-amber-600' 
                      : 'bg-[#07080c] border-white/10 text-white focus:border-[#c5a059]'
                  }`}
                >
                  {(settings.paymentMethods || []).filter(m => m.active).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.type === 'cash' ? '💵' : m.type === 'card' ? '💳' : m.type === 'qr' ? '📱' : '💸'} {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {orderType === 'table' && (
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Table Number / Location</label>
                <input
                  type="text"
                  placeholder="E.g. Table #04, Balcony #2"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-stone-100 border-stone-300 text-stone-900 focus:border-amber-600' 
                      : 'bg-[#07080c] border-white/10 text-white focus:border-[#c5a059]'
                  }`}
                />
              </div>
            )}

            {/* CASH TENDER & QUICK DENOMINATIONS */}
            {(() => {
              const selectedMethod = (settings.paymentMethods || []).find(m => m.id === paymentMethod);
              const isCashType = selectedMethod?.type === 'cash' || paymentMethod === 'cash';
              
              if (isCashType) {
                return (
                  <div className={`p-3.5 rounded-xl border space-y-3 ${
                    isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#07080c] border-white/10'
                  }`}>
                    <div className={`flex justify-between items-center text-xs font-bold ${isLight ? 'text-stone-700' : 'text-white/60'}`}>
                      <span>TOTAL BILL:</span>
                      <span className="text-base font-mono font-black text-[#c5a059]">₱{posTotal}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Cash Tendered</label>
                      <input
                        type="number"
                        placeholder="Enter cash amount..."
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className={`w-full text-lg font-mono font-black p-2.5 rounded-xl border outline-none text-right ${
                          isLight 
                            ? 'bg-white border-stone-300 text-stone-900 focus:border-amber-600' 
                            : 'bg-[#12141c] border-white/10 text-white focus:border-[#c5a059]'
                        }`}
                      />
                    </div>

                    {/* Quick Cash preset denomination chips */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Exact', val: posTotal },
                        { label: '₱100', val: 100 },
                        { label: '₱200', val: 200 },
                        { label: '₱500', val: 500 },
                        { label: '₱1,000', val: 1000 },
                        { label: '₱1,500', val: 1500 },
                        { label: '₱2,000', val: 2000 },
                        { label: 'Clear', val: '' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCashReceived(preset.val === '' ? '' : preset.val.toString())}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold transition-all cursor-pointer text-center active:scale-95 ${
                            isLight 
                              ? 'bg-stone-200 hover:bg-stone-300 border-stone-300 text-stone-800' 
                              : 'bg-white/5 hover:bg-white/15 border-white/10 text-white/80 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className={`flex justify-between items-center text-xs border-t pt-2 font-bold ${
                      isLight ? 'border-stone-200' : 'border-white/10'
                    }`}>
                      <span className={isLight ? 'text-stone-600' : 'text-white/50'}>CHANGE:</span>
                      <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">₱{calculatedChange}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Kitchen / Barista Memo</label>
              <input
                type="text"
                placeholder="Special notes (e.g. extra hot, separate bag)..."
                value={posNotes}
                onChange={(e) => setPosNotes(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl border outline-none ${
                  isLight 
                    ? 'bg-stone-100 border-stone-300 text-stone-900 focus:border-amber-600' 
                    : 'bg-[#07080c] border-white/10 text-white focus:border-[#c5a059]'
                }`}
              />
            </div>

            <button
              onClick={handleProcessPOSCheckout}
              disabled={(() => {
                const selectedMethod = (settings.paymentMethods || []).find(m => m.id === paymentMethod);
                const isCashType = selectedMethod?.type === 'cash' || paymentMethod === 'cash';
                return isCashType && (!cashReceived || parseFloat(cashReceived) < posTotal);
              })()}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] active:scale-98 text-black font-extrabold py-3.5 rounded-xl text-xs sm:text-sm flex justify-center items-center gap-2 shadow-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Confirm & Print Receipt</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. PRINT TICKET RECEIPT MODAL */}
      {printedReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto border scrollbar-none ${
            isLight ? 'bg-white border-stone-200' : 'bg-[#12141c] border-white/10'
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="w-5 h-5" />
                <h3 className={`font-bold text-sm font-serif ${isLight ? 'text-stone-900' : 'text-white'}`}>Payment Succeeded!</h3>
              </div>
              <button 
                onClick={() => setPrintedReceipt(null)} 
                className={`p-1 rounded-full cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-stone-100 text-stone-500 hover:text-stone-900' : 'hover:bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PRINT RECEIPT BODY */}
            <div className={`text-center font-mono space-y-1 text-xs p-3.5 rounded-xl border ${
              isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#07080c] border-white/10 text-white'
            }`}>
              <h2 className="text-sm font-black text-[#c5a059] uppercase">{settings.branding.shopName}</h2>
              <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{settings.businessInfo.address}</p>
              <div className={`border-t border-dashed my-2 ${isLight ? 'border-stone-300' : 'border-white/20'}`} />

              <div className={`text-left space-y-1 text-[10px] ${isLight ? 'text-stone-700' : 'text-white/60'}`}>
                <p><strong className={isLight ? 'text-stone-900' : 'text-white'}>Invoice:</strong> #{printedReceipt.orderNumber}</p>
                <p><strong className={isLight ? 'text-stone-900' : 'text-white'}>Customer:</strong> <span className="text-[#c5a059] font-bold">{printedReceipt.customerName}</span></p>
                <p><strong className={isLight ? 'text-stone-900' : 'text-white'}>Order Origin:</strong> {printedReceipt.orderSource === 'pos' ? 'POS Register (In-Store)' : 'Customer Mobile Web App'}</p>
                {printedReceipt.cashierName && (
                  <p><strong className={isLight ? 'text-stone-900' : 'text-white'}>Cashier:</strong> {printedReceipt.cashierName}</p>
                )}
                <p><strong className={isLight ? 'text-stone-900' : 'text-white'}>Channel:</strong> {getPaymentMethodDisplayName(printedReceipt.paymentMethod, settings.paymentMethods)}</p>
                <p><strong className={isLight ? 'text-stone-900' : 'text-white'}>Time:</strong> {new Date().toLocaleTimeString()}</p>
              </div>

              <div className={`border-t border-dashed my-2 ${isLight ? 'border-stone-300' : 'border-white/20'}`} />

              <div className="space-y-2 text-left text-[10px]">
                {printedReceipt.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex flex-col">
                    <div className={`flex justify-between ${isLight ? 'text-stone-800' : 'text-white/80'}`}>
                      <span>{it.quantity}x {it.name} ({it.selectedSize})</span>
                      <span className="font-mono">₱{it.price * it.quantity}</span>
                    </div>
                    {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                      <span className={`italic pl-3 ${isLight ? 'text-stone-500' : 'text-white/40'}`}>+ {it.selectedAddOns.join(', ')}</span>
                    )}
                    {it.notes && (
                      <span className={`italic pl-3 ${isLight ? 'text-stone-500' : 'text-white/30'}`}>"{it.notes}"</span>
                    )}
                  </div>
                ))}
              </div>

              <div className={`border-t border-dashed my-2 ${isLight ? 'border-stone-300' : 'border-white/20'}`} />

              <div className={`space-y-0.5 text-right text-[10px] font-mono ${isLight ? 'text-stone-700' : 'text-white/60'}`}>
                <p>Subtotal: ₱{printedReceipt.subtotal}</p>
                {printedReceipt.discount > 0 && <p className="text-emerald-600 dark:text-emerald-400 font-bold">Discount: -₱{printedReceipt.discount}</p>}
                <p className="text-xs font-black text-[#c5a059] pt-1">Total Paid: ₱{printedReceipt.total}</p>
                {printedReceipt.cashReceived !== undefined && (
                  <>
                    <p>Cash: ₱{printedReceipt.cashReceived}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">Change: ₱{printedReceipt.change}</p>
                  </>
                )}
                {printedReceipt.pointsEarned > 0 && (
                  <p className="text-[#c5a059] font-sans font-bold mt-1 text-center">★ Points Earned: +{printedReceipt.pointsEarned} pts</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setPrintedReceipt(null);
                window.print();
              }}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Printer className="w-4 h-4" /> Print Thermal Ticket
            </button>
          </div>
        </div>
      )}

      {/* 4. PRODUCT QUICK CUSTOMIZATION MODAL FOR POS GRID */}
      {customizeProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className={`w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 border max-h-[85vh] overflow-y-auto ${
            isLight ? 'bg-white border-stone-200' : 'bg-[#12141c] border-white/10'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg overflow-hidden ${isLight ? 'bg-stone-100' : 'bg-white/10'}`}>
                  <img 
                    src={customizeProduct.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=200'} 
                    alt={customizeProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className={`font-bold text-xs sm:text-sm font-serif ${isLight ? 'text-stone-900' : 'text-white'}`}>{customizeProduct.name}</h3>
                  <p className="text-[10px] text-[#c5a059] font-mono font-bold">Base: ₱{customizeProduct.price}</p>
                </div>
              </div>
              <button 
                onClick={() => setCustomizeProduct(null)} 
                className={`p-1 rounded-full cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-stone-100 text-stone-500 hover:text-stone-900' : 'hover:bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SIZES SELECTION CHIPS */}
            {customizeProduct.sizes && customizeProduct.sizes.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Select Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {customizeProduct.sizes.map(size => (
                    <button
                      key={size.name}
                      onClick={() => setSelectedSize(size)}
                      className={`p-2 sm:p-2.5 border rounded-xl text-xs font-bold text-center cursor-pointer transition-all active:scale-95 ${
                        selectedSize?.name === size.name
                          ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059] shadow-md'
                          : isLight ? 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200' : 'bg-[#07080c] border-white/10 text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <p>{size.name}</p>
                      <p className={`text-[10px] font-mono font-normal mt-0.5 ${isLight ? 'text-stone-500' : 'text-white/40'}`}>
                        {size.priceAdjustment === 0 ? 'Regular' : `+₱${size.priceAdjustment}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADD-ONS SELECTION */}
            {customizeProduct.addOns && customizeProduct.addOns.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Add-Ons & Syrups</label>
                <div className="space-y-2">
                  {customizeProduct.addOns.map(addon => {
                    const isSelected = selectedAddOns.some(a => a.name === addon.name);
                    return (
                      <button
                        key={addon.name}
                        onClick={() => toggleAddOn(addon)}
                        className={`w-full p-2.5 border rounded-xl flex items-center justify-between text-xs font-bold cursor-pointer transition-colors active:scale-98 ${
                          isSelected 
                            ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]' 
                            : isLight ? 'bg-stone-100 border-stone-300 text-stone-800 hover:border-stone-400' : 'bg-[#07080c] border-white/10 text-white hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-[#c5a059] border-[#c5a059] text-black' : isLight ? 'border-stone-400' : 'border-white/20'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                          </div>
                          <span>{addon.name}</span>
                        </div>
                        <span className="text-[#c5a059] font-mono font-bold">+₱{addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ADD BUTTON */}
            <button
              onClick={handleAddCustomizedToCart}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] active:scale-98 text-black font-extrabold py-3.5 rounded-xl text-xs flex justify-between items-center transition-all shadow-lg cursor-pointer px-4"
            >
              <span>Add to Register Ticket</span>
              <span className="font-extrabold font-mono text-xs bg-black/20 text-[#c5a059] py-0.5 px-2 rounded-md">
                ₱{customizeProduct.price + (selectedSize?.priceAdjustment || 0) + selectedAddOns.reduce((sum, ad) => sum + ad.price, 0)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT VIEWER LIGHTBOX MODAL */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className={`relative max-w-lg w-full rounded-2xl overflow-hidden p-6 shadow-2xl flex flex-col items-center gap-4 ${isLight ? 'bg-white text-stone-900' : 'bg-stone-950 text-white border border-white/10'}`}>
            <button 
              onClick={() => setViewReceiptUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-stone-500/20 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#c5a059]">Payment Receipt Proof</h3>
            
            <div className="w-full h-[60vh] rounded-xl overflow-hidden bg-black/20 border border-stone-200/10 flex items-center justify-center">
              <img 
                src={viewReceiptUrl} 
                alt="Receipt Detail" 
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Find the order for this receipt so we can offer verifying payment */}
            {(() => {
              const matchedOrder = orders.find(o => o.receiptUrl === viewReceiptUrl);
              return (
                <div className="flex gap-3 w-full font-mono text-xs mt-2">
                  {matchedOrder && matchedOrder.paymentStatus !== 'paid' && (
                    <button
                      onClick={async () => {
                        try {
                          await updatePaymentStatus(matchedOrder.id, 'paid');
                          setViewReceiptUrl(null);
                        } catch (err: any) {
                          alert("Failed to mark order as paid: " + err.message);
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl uppercase tracking-wider flex justify-center items-center gap-1.5 cursor-pointer shadow transition-all"
                    >
                      Verify & Mark Paid
                    </button>
                  )}
                  <a 
                    href={viewReceiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-stone-700 hover:bg-stone-600 text-white font-extrabold py-2.5 rounded-xl uppercase tracking-wider flex justify-center items-center gap-1.5 cursor-pointer shadow transition-all text-center"
                  >
                    Open in New Tab
                  </a>
                  <button 
                    onClick={() => setViewReceiptUrl(null)}
                    className={`flex-1 font-bold py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${isLight ? 'bg-stone-200 hover:bg-stone-300 text-stone-800' : 'bg-stone-900 hover:bg-stone-800 text-stone-300'}`}
                  >
                    Close
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PosExperience;
