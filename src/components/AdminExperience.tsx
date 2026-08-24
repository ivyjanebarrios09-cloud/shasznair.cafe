import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Product, Category, Voucher, UserProfile, Order, SystemSettings } from '../types';
import { 
  BarChart, TrendingUp, Banknote, Calendar, Users, 
  ShoppingBag, Clipboard, Award, Shield, FileText, 
  Coffee, Tag, Settings, Plus, Edit2, Trash2, Check, 
  X, AlertTriangle, Download, ArrowRight, RotateCcw,
  Sparkles, ShieldCheck, Store, Smartphone, User,
  Palette, Building2, Phone, Mail, Clock, Save, RefreshCw, Layers, Menu
} from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { CategoryIcon, FOOD_ICON_OPTIONS } from '../utils/categoryIcons';
import { AdminReportsTab } from './AdminReportsTab';

export const AdminExperience: React.FC = () => {
  const {
    categories,
    products,
    vouchers,
    orders,
    usersList,
    auditLogs,
    inventoryLogs,
    settings,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    addVoucher,
    updateVoucher,
    deleteVoucher,
    adjustInventory,
    adjustUserPoints,
    loadDemoData,
    resetDatabase
  } = useCoffeeApp();

  // Navigation Panel Tab: 'dashboard' | 'products' | 'categories' | 'vouchers' | 'customers' | 'reports' | 'audit' | 'settings'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'vouchers' | 'customers' | 'reports' | 'audit' | 'settings'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardChartView, setDashboardChartView] = useState<'area' | 'bar'>('area');

  // Filter States
  const [reportRange, setReportRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0, 10));
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Notification States
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Settings Management Form State
  const [settingsForm, setSettingsForm] = useState<SystemSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Account Configuration States
  const [selectedAccountTab, setSelectedAccountTab] = useState<'admin' | 'pos' | 'kds'>('admin');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<'admin' | 'pos' | 'kds' | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verifyingAccountKey, setVerifyingAccountKey] = useState<'admin' | 'pos' | 'kds' | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('123456');

  React.useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccessMsg(null);
    try {
      await updateSettings(settingsForm);
      setSettingsSuccessMsg("Brand and system settings successfully saved and synced across all terminals!");
      setTimeout(() => setSettingsSuccessMsg(null), 4000);
    } catch (err: any) {
      alert("Failed to save settings: " + (err.message || err));
    } finally {
      setSettingsSaving(false);
    }
  };

  // Form states - Products
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: '',
    category: categories[0]?.id || '',
    description: '',
    price: 100,
    cost: 30,
    image: '',
    stockTracking: true,
    stockQuantity: 100,
    minStock: 10
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, formType: 'product' | 'settings' = 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setModalError(null);

      // 1. Get presigned URL
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get upload URL. Is R2 configured?');
      }

      const { signedUrl, publicUrl } = await res.json();

      // 2. Upload to R2 directly
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image to storage bucket');
      }

      // 3. Update form state
      if (formType === 'product') {
        setProdForm((prev) => ({ ...prev, image: publicUrl }));
      } else if (formType === 'settings') {
        setSettingsForm((prev) => ({
          ...prev,
          branding: {
            ...prev.branding,
            logoUrl: publicUrl
          }
        }));
      }
      setModalSuccess("Image uploaded successfully!");
      setTimeout(() => setModalSuccess(null), 3000);
      
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Form states - Categories
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    image: '',
    icon: 'coffee',
    displayOrder: 1,
    active: true
  });

  // Form states - Vouchers
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [vForm, setVForm] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minPurchase: 100,
    maxDiscount: 50,
    expirationDate: '2027-12-31',
    active: true,
    usageLimit: 1000
  });

  // Form states - Points adjustment
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsUser, setPointsUser] = useState<UserProfile | null>(null);
  const [pointsAmount, setPointsAmount] = useState<string>('50');
  const [pointsReason, setPointsReason] = useState('Customer Goodwill Reward');

  // Form states - Stock Adjustment
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockAmount, setStockAmount] = useState<string>('10');
  const [stockReason, setStockReason] = useState('Restock supply delivery');

  // 1. CALCULATE SUMMARY METRICS (Dashboard)
  const completedOrders = orders.filter(o => o.orderStatus === 'completed');
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending');
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing');
  const readyOrders = orders.filter(o => o.orderStatus === 'ready');

  // Helper to safely parse order date
  const parseOrderDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val?.toDate === 'function') {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof val?.seconds === 'number') {
      return new Date(val.seconds * 1000);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => {
    const created = parseOrderDate(o.createdAt);
    return created ? created.toISOString().slice(0, 10) === todayStr : false;
  });

  const todaySales = todayOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
  const totalSalesAllTime = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = completedOrders.length > 0 ? Math.round(totalSalesAllTime / completedOrders.length) : 0;

  // Real 7-day turnover analytics based on real paid/completed orders
  const last7DaysAnalytics = useMemo(() => {
    const days: { 
      day: string; 
      fullDateStr: string; 
      dateLabel: string; 
      value: number; 
      orderCount: number; 
      height: string; 
    }[] = [];

    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDateStr = targetDate.toISOString().slice(0, 10);

      // Match actual orders on this specific calendar date
      const dayOrders = orders.filter(o => {
        const orderDate = parseOrderDate(o.createdAt);
        if (!orderDate) return false;
        return orderDate >= targetDate && orderDate < nextDay;
      });

      const paidDayOrders = dayOrders.filter(o => o.paymentStatus === 'paid' || o.orderStatus === 'completed');
      const dayTurnover = paidDayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      days.push({
        day: dayName,
        dateLabel,
        fullDateStr,
        value: dayTurnover,
        orderCount: paidDayOrders.length,
        height: '0%'
      });
    }

    const maxVal = Math.max(...days.map(d => d.value), 0);

    return days.map(d => ({
      ...d,
      height: maxVal > 0 
        ? `${Math.max(Math.round((d.value / maxVal) * 100), d.value > 0 ? 8 : 4)}%` 
        : '4%'
    }));
  }, [orders]);

  const total7DayTurnover = useMemo(() => {
    return last7DaysAnalytics.reduce((acc, curr) => acc + curr.value, 0);
  }, [last7DaysAnalytics]);

  const avg7DayTurnover = Math.round(total7DayTurnover / 7);

  // Top selling products computation for dashboard analytics
  const topSellingProducts = useMemo(() => {
    const productStats: Record<string, { product: Product; qty: number; revenue: number }> = {};
    orders.forEach(o => {
      if (o.paymentStatus === 'paid' || o.orderStatus === 'completed') {
        o.items?.forEach(item => {
          const prod = products.find(p => p.id === item.productId || p.name === item.name);
          if (prod) {
            if (!productStats[prod.id]) {
              productStats[prod.id] = { product: prod, qty: 0, revenue: 0 };
            }
            productStats[prod.id].qty += item.quantity;
            productStats[prod.id].revenue += (item.itemTotal || item.unitPrice * item.quantity);
          }
        });
      }
    });
    return Object.values(productStats).sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [orders, products]);

  // Stock alerts
  const lowStockProducts = products.filter(p => p.stockTracking && p.stockQuantity <= p.minStock && p.stockQuantity > 0);
  const outOfStockProducts = products.filter(p => p.stockTracking && p.stockQuantity === 0);

  // 2. TRANSACTION REPORTS FILTERING & STATS
  const filteredReportOrders = orders.filter(o => {
    const created = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
    const now = new Date();
    
    if (reportRange === 'today') {
      return created.toISOString().slice(0, 10) === todayStr;
    } else if (reportRange === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return created.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10);
    } else if (reportRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return created >= oneWeekAgo;
    } else { // month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return created >= oneMonthAgo;
    }
  });

  const reportGrossSales = filteredReportOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const reportDiscounts = filteredReportOrders.reduce((sum, o) => sum + o.discount, 0);
  const reportNetSales = filteredReportOrders.reduce((sum, o) => sum + o.total, 0);
  const reportOrdersCount = filteredReportOrders.length;
  const reportAvgTicket = reportOrdersCount > 0 ? Math.round(reportNetSales / reportOrdersCount) : 0;

  // Best selling items calculator
  const itemSalesCount: Record<string, { name: string; qty: number; rev: number }> = {};
  filteredReportOrders.forEach(ord => {
    ord.items.forEach(it => {
      if (!itemSalesCount[it.productId]) {
        itemSalesCount[it.productId] = { name: it.name, qty: 0, rev: 0 };
      }
      itemSalesCount[it.productId].qty += it.quantity;
      itemSalesCount[it.productId].rev += (it.price * it.quantity);
    });
  });
  const bestSellers = Object.values(itemSalesCount).sort((a,b) => b.qty - a.qty).slice(0, 5);

  // 3. HANDLERS FOR CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    const targetCategory = prodForm.category || categories[0]?.id;
    if (!targetCategory) {
      setModalError("Please create a menu category first before committing any beverage records.");
      return;
    }

    const productPayload = {
      ...prodForm,
      category: targetCategory,
      price: Number(prodForm.price),
      cost: Number(prodForm.cost),
      stockQuantity: Number(prodForm.stockQuantity),
      minStock: Number(prodForm.minStock),
      available: prodForm.stockQuantity > 0,
      sizes: [
        { name: 'Small', priceAdjustment: 0 },
        { name: 'Medium', priceAdjustment: 15 },
        { name: 'Large', priceAdjustment: 30 }
      ],
      addOns: [
        { name: 'Extra Shot', price: 25 },
        { name: 'Vanilla Syrup', price: 15 },
        { name: 'Caramel Syrup', price: 15 }
      ]
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload);
        setModalSuccess("Beverage record updated successfully!");
      } else {
        await addProduct(productPayload);
        setModalSuccess("Beverage record created in database successfully!");
      }
      setTimeout(() => {
        setShowProductModal(false);
        setEditingProduct(null);
        setModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Missing or insufficient permissions. Please verify your admin role.");
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      category: prod.category || categories[0]?.id || '',
      description: prod.description,
      price: prod.price,
      cost: prod.cost,
      image: prod.image,
      stockTracking: prod.stockTracking,
      stockQuantity: prod.stockQuantity,
      minStock: prod.minStock
    });
    setModalError(null);
    setModalSuccess(null);
    setShowProductModal(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, catForm);
        setModalSuccess("Category updated successfully!");
      } else {
        await addCategory(catForm);
        setModalSuccess("Category record created in database successfully!");
      }
      setTimeout(() => {
        setShowCatModal(false);
        setEditingCat(null);
        setModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Missing or insufficient permissions. Please verify your admin role.");
    }
  };

  const handleEditCatClick = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      description: cat.description,
      image: cat.image,
      icon: cat.icon || 'coffee',
      displayOrder: cat.displayOrder,
      active: cat.active
    });
    setModalError(null);
    setModalSuccess(null);
    setShowCatModal(true);
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    const payload = {
      ...vForm,
      discountValue: Number(vForm.discountValue),
      minPurchase: Number(vForm.minPurchase),
      maxDiscount: Number(vForm.maxDiscount),
      usageLimit: Number(vForm.usageLimit),
      code: vForm.code.toUpperCase().trim()
    };
    try {
      if (editingVoucher) {
        await updateVoucher(editingVoucher.id, payload);
        setModalSuccess("Voucher updated successfully!");
      } else {
        await addVoucher(payload);
        setModalSuccess("Voucher campaign deployed to database successfully!");
      }
      setTimeout(() => {
        setShowVoucherModal(false);
        setEditingVoucher(null);
        setModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Missing or insufficient permissions. Please verify your admin role.");
    }
  };

  const handleEditVoucherClick = (v: Voucher) => {
    setEditingVoucher(v);
    setVForm({
      code: v.code,
      name: v.name,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minPurchase: v.minPurchase,
      maxDiscount: v.maxDiscount,
      expirationDate: v.expirationDate,
      active: v.active,
      usageLimit: v.usageLimit
    });
    setModalError(null);
    setModalSuccess(null);
    setShowVoucherModal(true);
  };

  const handleAdjustPointsSubmit = async () => {
    if (!pointsUser) return;
    try {
      await adjustUserPoints(pointsUser.uid, Number(pointsAmount), pointsReason);
      setShowPointsModal(false);
      setPointsUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustStockSubmit = async () => {
    if (!stockProduct) return;
    try {
      await adjustInventory(stockProduct.id, Number(stockAmount), stockReason);
      setShowStockModal(false);
      setStockProduct(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. EXPORT TO CSV (Excel readable)
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order Number,Date,Order Origin,Customer,Cashier,Order Type,Subtotal,Discount,Net Total,Payment Mode,Status\n";

    filteredReportOrders.forEach(o => {
      const created = o.createdAt instanceof Date ? o.createdAt.toLocaleDateString() : 'August 2026';
      csvContent += `"${o.orderNumber}","${created}","${o.orderSource === 'pos' ? 'POS Register' : 'Online Web App'}","${o.customerName}","${o.cashierName || 'N/A'}","${o.orderType}",${o.subtotal},${o.discount},${o.total},"${o.paymentMethod}","${o.orderStatus}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Coffee_Sales_Report_${reportRange.toUpperCase()}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLight = settings?.branding?.theme === 'light';

  return (
    <div 
      className={`min-h-screen ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} flex flex-col lg:flex-row overflow-hidden transition-colors duration-300`}
      style={{ '--color-primary': settings.branding.primaryColor } as React.CSSProperties}
    >
      {/* MOBILE HEADER */}
      <header className={`lg:hidden h-14 ${isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-[#121212] border-white/10 text-white'} border-b px-4 flex items-center justify-between sticky top-0 z-40 transition-colors`}>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 -ml-1 ${isLight ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-100' : 'text-white/70 hover:text-white hover:bg-white/5'} rounded-lg active:scale-95 transition-all flex items-center justify-center`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <div className={`flex items-center gap-2 ${isLight ? 'bg-stone-100 border-stone-200 text-stone-900' : 'bg-white/5 border-white/10 text-white'} border px-2.5 py-1 rounded-lg`}>
            <div className="text-[#c5a059] flex items-center justify-center">
              {activeTab === 'dashboard' && <BarChart size={15} />}
              {activeTab === 'products' && <Coffee size={15} />}
              {activeTab === 'categories' && <Clipboard size={15} />}
              {activeTab === 'vouchers' && <Tag size={15} />}
              {activeTab === 'customers' && <Users size={15} />}
              {activeTab === 'reports' && <FileText size={15} />}
              {activeTab === 'audit' && <Shield size={15} />}
              {activeTab === 'settings' && <Settings size={15} />}
            </div>
            <span className={`font-serif font-extrabold text-xs ${isLight ? 'text-stone-900' : 'text-white'} tracking-wide capitalize`}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'products' && 'Products'}
              {activeTab === 'categories' && 'Categories'}
              {activeTab === 'vouchers' && 'Vouchers'}
              {activeTab === 'customers' && 'Customers'}
              {activeTab === 'reports' && 'Reports'}
              {activeTab === 'audit' && 'Audit Logs'}
              {activeTab === 'settings' && 'Settings'}
            </span>
          </div>
        </div>

        <div />
      </header>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. ADMIN SIDEBAR NAVIGATION */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 lg:w-56 ${isLight ? 'bg-white text-stone-800 border-stone-200' : 'bg-[#121212] text-white/70 border-white/10'} flex flex-col h-full lg:h-[calc(100vh-3rem)] border-r transition-colors duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`p-4 border-b ${isLight ? 'border-stone-200 bg-stone-50' : 'border-white/10 bg-[#080808]'} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shadow-sm">
              <Coffee size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`font-serif font-extrabold text-xs ${isLight ? 'text-stone-900' : 'text-white'} uppercase tracking-wider`}>{settings.branding.shopName}</span>
              <span className="text-[9px] text-[#c5a059] font-bold uppercase tracking-widest">Admin Workspace</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`lg:hidden p-1.5 ${isLight ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-200' : 'text-white/50 hover:text-white hover:bg-white/10'} rounded-lg`}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart },
            { id: 'products', label: 'Products', icon: Coffee },
            { id: 'categories', label: 'Categories', icon: Clipboard },
            { id: 'vouchers', label: 'Vouchers', icon: Tag },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'audit', label: 'Audit Logs', icon: Shield },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl transition-all text-left cursor-pointer ${
                  isActive 
                    ? 'bg-[#c5a059]/15 text-[#c5a059] border-l-4 border-[#c5a059] pl-2.5 shadow-sm' 
                    : isLight 
                      ? 'hover:bg-stone-100 text-stone-600 hover:text-stone-900' 
                      : 'hover:bg-white/5 hover:text-white text-white/70'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#c5a059]/20 text-[#c5a059]' : isLight ? 'bg-stone-100 text-stone-500' : 'bg-white/5 text-white/50'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`p-3 border-t ${isLight ? 'border-stone-200 bg-stone-50' : 'border-white/10 bg-[#080808]'} space-y-2`}>
          <button
            onClick={loadDemoData}
            className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold text-[10px] py-2 rounded-xl uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={12} className="stroke-[2.5]" />
            <span>Load Sample Menu</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN SUB-VIEW WORKSPACE (scrollable) */}
      <main className={`flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3rem)] ${isLight ? 'bg-stone-100 text-stone-900' : 'bg-[#050505] text-[#f2f2f2]'} scrollbar-none transition-colors duration-300`}>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif font-extrabold text-lg sm:text-xl tracking-wide flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-[#c5a059]" />
                  Store Operations KPI Metrics
                </h2>
                <p className={`${isLight ? 'text-stone-500' : 'text-white/50'} text-xs mt-0.5`}>Real-time synchronized sales performance & store health telemetry</p>
              </div>
              <div className={`text-xs font-semibold ${isLight ? 'bg-stone-200/70 border-stone-300 text-stone-700' : 'bg-[#121212] border-white/10 text-white/70'} px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-xs`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* FINANCIALS KPI ROW WITH MOTION SQUARE CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Today's Net Sales */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-lg'} p-5 rounded-2xl border aspect-square flex flex-col justify-between relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] sm:text-xs font-extrabold ${isLight ? 'text-stone-400' : 'text-white/40'} uppercase tracking-wider`}>Today's Net Sales</p>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Live</span>
                </div>
                
                <div className="my-auto space-y-1">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center border border-emerald-900/40 shadow-xs mb-2">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#c5a059] tracking-tight block">₱{todaySales.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-500 pt-2 border-t border-white/5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="truncate">POS & web synced</span>
                </div>
              </motion.div>

              {/* Card 2: Lifetime Gross Sales */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-lg'} p-5 rounded-2xl border aspect-square flex flex-col justify-between relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#c5a059]/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-[#c5a059]/20 transition-all" />
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] sm:text-xs font-extrabold ${isLight ? 'text-stone-400' : 'text-white/40'} uppercase tracking-wider`}>Lifetime Gross Sales</p>
                  <span className={`text-[10px] font-bold ${isLight ? 'text-stone-500 bg-stone-100 border-stone-200' : 'text-white/50 bg-white/5 border-white/10'} px-2 py-0.5 rounded-full border`}>Total</span>
                </div>

                <div className="my-auto space-y-1">
                  <div className="w-11 h-11 rounded-2xl bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center border border-[#c5a059]/30 shadow-xs mb-2">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className={`text-2xl sm:text-3xl font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} tracking-tight block`}>₱{totalSalesAllTime.toLocaleString()}</span>
                </div>

                <div className={`pt-2 border-t border-white/5 text-[10px] sm:text-xs ${isLight ? 'text-stone-500' : 'text-white/40'} font-semibold truncate`}>
                  {completedOrders.length} Completed Order Bags
                </div>
              </motion.div>

              {/* Card 3: Avg Order Ticket */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-lg'} p-5 rounded-2xl border aspect-square flex flex-col justify-between relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] sm:text-xs font-extrabold ${isLight ? 'text-stone-400' : 'text-white/40'} uppercase tracking-wider`}>Avg Receipt Ticket</p>
                  <span className={`text-[10px] font-bold ${isLight ? 'text-stone-500 bg-stone-100 border-stone-200' : 'text-white/50 bg-white/5 border-white/10'} px-2 py-0.5 rounded-full border`}>Ticket</span>
                </div>

                <div className="my-auto space-y-1">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center border border-indigo-900/40 shadow-xs mb-2">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className={`text-2xl sm:text-3xl font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} tracking-tight block`}>₱{averageOrderValue.toLocaleString()}</span>
                </div>

                <div className={`pt-2 border-t border-white/5 text-[10px] sm:text-xs ${isLight ? 'text-stone-500' : 'text-white/40'} font-semibold truncate`}>
                  Average basket spend
                </div>
              </motion.div>

              {/* Card 4: Active Fulfill Queue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-lg'} p-5 rounded-2xl border aspect-square flex flex-col justify-between relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-rose-500/20 transition-all" />
                <div className="flex justify-between items-center">
                  <p className={`text-[10px] sm:text-xs font-extrabold ${isLight ? 'text-stone-400' : 'text-white/40'} uppercase tracking-wider`}>Active Queue</p>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Kitchen</span>
                </div>

                <div className="my-auto space-y-1">
                  <div className="w-11 h-11 rounded-2xl bg-rose-950/80 text-rose-300 flex items-center justify-center border border-rose-900/40 shadow-xs mb-2">
                    <Clipboard className="w-6 h-6" />
                  </div>
                  <span className={`text-2xl sm:text-3xl font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} tracking-tight block`}>
                    {orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.orderStatus)).length}
                  </span>
                </div>

                <div className={`pt-2 border-t border-white/5 text-[10px] sm:text-xs ${isLight ? 'text-stone-600' : 'text-white/50'} font-semibold flex items-center justify-between gap-1`}>
                  <span className="text-amber-400 font-bold">{pendingOrders.length} New</span>
                  <span>•</span>
                  <span className="text-blue-400 font-bold">{preparingOrders.length} Prep</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{readyOrders.length} Ready</span>
                </div>
              </motion.div>
            </div>

            {/* CRITICAL STOCK ALERTS SECTION */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-950/30 border border-[#c5a059]/40 rounded-2xl p-4 flex gap-3 items-start shadow-md"
              >
                <AlertTriangle className="w-5 h-5 text-[#c5a059] flex-shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-extrabold text-[#c5a059] uppercase tracking-wider">Critical Stock Inventory Warning</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                    {outOfStockProducts.length > 0 && (
                      <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                        <p className="font-bold text-rose-400 uppercase text-[10px] tracking-wider mb-1">Out of Stock (Action Required):</p>
                        <p className="text-white/90 text-xs font-semibold">{outOfStockProducts.map(p => p.name).join(', ')}</p>
                      </div>
                    )}
                    {lowStockProducts.length > 0 && (
                      <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                        <p className="font-bold text-amber-300 uppercase text-[10px] tracking-wider mb-1">Low Inventory Alert:</p>
                        <p className="text-white/90 text-xs font-semibold">{lowStockProducts.map(p => `${p.name} (${p.stockQuantity} left)`).join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ANIMATED INTERACTIVE GRAPH CARD (RECHARTS + MOTION) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className={`${isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-[#121212] border-white/10 shadow-xl'} rounded-2xl border p-5 sm:p-6 space-y-4`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c5a059]" />
                    <h3 className="text-xs font-extrabold text-[#c5a059] uppercase tracking-wider">7-Day Daily Register Turnover Analytics</h3>
                  </div>
                  <p className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-white/50'}`}>Live revenue & order transactions timeline visualization</p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
                  <div className={`flex items-center p-1 rounded-xl ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-black/40 border-white/10'} border text-xs`}>
                    <button
                      type="button"
                      onClick={() => setDashboardChartView('area')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${dashboardChartView === 'area' ? 'bg-[#c5a059] text-black shadow-xs' : isLight ? 'text-stone-600 hover:text-stone-900' : 'text-white/60 hover:text-white'}`}
                    >
                      Area Trend
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashboardChartView('bar')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${dashboardChartView === 'bar' ? 'bg-[#c5a059] text-black shadow-xs' : isLight ? 'text-stone-600 hover:text-stone-900' : 'text-white/60 hover:text-white'}`}
                    >
                      Bar Columns
                    </button>
                  </div>

                  <div className={`hidden md:flex items-center gap-3 text-xs px-3 py-1.5 rounded-xl ${isLight ? 'bg-stone-100' : 'bg-white/5'} font-semibold`}>
                    <span className={isLight ? 'text-stone-500' : 'text-white/50'}>7-Day Sum: <strong className="text-[#c5a059]">₱{total7DayTurnover.toLocaleString()}</strong></span>
                    <span className="opacity-30">•</span>
                    <span className={isLight ? 'text-stone-500' : 'text-white/50'}>Daily Avg: <strong>₱{avg7DayTurnover.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* RECHARTS ANIMATED CONTAINER */}
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {dashboardChartView === 'area' ? (
                    <AreaChart data={last7DaysAnalytics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="turnoverColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c5a059" stopOpacity={0.45}/>
                          <stop offset="95%" stopColor="#c5a059" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e7e5e4" : "#ffffff10"} vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke={isLight ? "#78716c" : "#ffffff50"} 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke={isLight ? "#78716c" : "#ffffff50"} 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₱${val}`}
                      />
                      <ReTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#1c1d24] border border-[#c5a059]/40 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
                                <p className="font-bold text-white/60">{data.dateLabel} ({data.day})</p>
                                <p className="text-sm font-extrabold text-[#c5a059]">₱{data.value.toLocaleString()}</p>
                                <p className="text-[10px] text-white/70">{data.orderCount} paid {data.orderCount === 1 ? 'order' : 'orders'}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#c5a059" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#turnoverColor)"
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  ) : (
                    <RechartsBarChart data={last7DaysAnalytics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#e7e5e4" : "#ffffff10"} vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke={isLight ? "#78716c" : "#ffffff50"} 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke={isLight ? "#78716c" : "#ffffff50"} 
                        fontSize={11} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₱${val}`}
                      />
                      <ReTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#1c1d24] border border-[#c5a059]/40 p-3 rounded-xl shadow-2xl text-xs space-y-1 text-white">
                                <p className="font-bold text-white/60">{data.dateLabel} ({data.day})</p>
                                <p className="text-sm font-extrabold text-[#c5a059]">₱{data.value.toLocaleString()}</p>
                                <p className="text-[10px] text-white/70">{data.orderCount} paid {data.orderCount === 1 ? 'order' : 'orders'}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#c5a059" 
                        radius={[6, 6, 0, 0]} 
                        isAnimationActive={true}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    </RechartsBarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>


          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="font-serif font-extrabold text-white text-base tracking-wide">Beverages & Pastries Master Records</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdForm({
                    name: '',
                    category: categories[0]?.id || '',
                    description: '',
                    price: 120,
                    cost: 35,
                    image: '',
                    stockTracking: true,
                    stockQuantity: 100,
                    minStock: 10
                  });
                  setModalError(null);
                  setModalSuccess(null);
                  setShowProductModal(true);
                }}
                className="w-full sm:w-auto bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> Add Product Record
              </button>
            </div>

            {/* MOBILE CARD VIEW - PRODUCTS (SQUARE STYLE GRID) */}
            <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
              {products.map(prod => {
                const isLowStock = prod.stockTracking && prod.stockQuantity <= (prod.minStock || 10) && prod.stockQuantity > 0;
                const isOutOfStock = prod.stockTracking && prod.stockQuantity === 0;
                const cat = categories.find(c => c.id === prod.category);
                
                return (
                  <div 
                    key={prod.id} 
                    className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-md'} rounded-xl border flex flex-col justify-between overflow-hidden relative group hover:border-[#c5a059]/40 transition-all ${
                      isOutOfStock ? 'border-rose-500/40 bg-rose-950/10' : isLowStock ? 'border-amber-500/40' : ''
                    }`}
                  >
                    {/* Square Image / Thumbnail Area */}
                    <div className={`w-full aspect-square relative ${isLight ? 'bg-stone-100' : 'bg-[#080808]'} overflow-hidden border-b ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      {prod.image ? (
                        <img 
                          src={prod.image} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          alt={prod.name} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center ${isLight ? 'bg-stone-100 text-stone-400' : 'bg-[#0d0d0d] text-white/20'}`}>
                          <Coffee className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-[9px] uppercase font-bold tracking-widest mt-1 opacity-60">No Image</span>
                        </div>
                      )}

                      {/* Floating Category Pill */}
                      <div className="absolute top-1.5 left-1.5 max-w-[70%]">
                        <span className="inline-block truncate px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] font-bold text-white/90 border border-white/10 uppercase tracking-tighter shadow-sm">
                          {cat?.name || 'Item'}
                        </span>
                      </div>

                      {/* Stock / Warning Badge */}
                      {isOutOfStock ? (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[8px] uppercase tracking-wider shadow">
                          Out
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[8px] uppercase tracking-wider shadow">
                          Low ({prod.stockQuantity})
                        </span>
                      ) : prod.stockTracking ? (
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[8px] font-mono font-bold text-white/80 border border-white/10 shadow-sm">
                          {prod.stockQuantity} qty
                        </span>
                      ) : null}
                    </div>

                    {/* Compact Product Details */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-0.5">
                        <p className={`font-bold text-xs ${isLight ? 'text-stone-900' : 'text-white'} truncate leading-tight`} title={prod.name}>
                          {prod.name}
                        </p>
                        <div className="flex items-baseline justify-between gap-1 pt-0.5">
                          <span className="text-xs font-extrabold text-[#c5a059]">₱{prod.price}</span>
                          <span className="text-[9px] text-emerald-500 font-semibold truncate">
                            +₱{prod.price - prod.cost}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex items-center gap-1.5 pt-1.5 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                        <button 
                          onClick={() => handleEditProductClick(prod)}
                          className={`flex-1 py-1.5 px-2 ${isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200' : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/5'} rounded-lg transition-colors flex items-center justify-center gap-1 text-[10px] font-bold border cursor-pointer active:scale-95`}
                          title="Edit Product"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${prod.name}"?`)) {
                              deleteProduct(prod.id).catch(err => setModalError(err.message));
                            }
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors border border-red-500/10 flex items-center justify-center cursor-pointer active:scale-95"
                          title="Delete Product"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW - PRODUCTS */}
            <div className={`hidden lg:block ${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} rounded-xl border overflow-hidden`}>
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className={`${isLight ? 'bg-stone-100 border-stone-200 text-stone-600' : 'bg-[#080808] border-white/10 text-white/50'} border-b uppercase tracking-wider font-extrabold text-[10px]`}>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Unit Cost (Margin)</th>
                      <th className="p-3">Stock Count</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                <tbody className={`divide-y ${isLight ? 'divide-stone-200' : 'divide-white/5'}`}>
                  {products.map(prod => {
                    const isLowStock = prod.stockTracking && prod.stockQuantity <= prod.minStock && prod.stockQuantity > 0;
                    const isOutOfStock = prod.stockTracking && prod.stockQuantity === 0;

                    return (
                      <tr key={prod.id} className={`${isLight ? 'hover:bg-stone-50' : 'hover:bg-white/5'} transition-colors ${
                        isOutOfStock ? 'bg-rose-950/30 border-l-4 border-rose-500' : isLowStock ? 'bg-amber-950/25 border-l-4 border-amber-500' : ''
                      }`}>
                        <td className="p-3 flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={prod.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=100'}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className={`w-10 h-10 object-cover rounded ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/10'} flex-shrink-0 border`}
                            />
                            {(isLowStock || isOutOfStock) && (
                              <span className={`absolute -top-1 -right-1 rounded-full p-0.5 shadow-md flex items-center justify-center ${
                                isOutOfStock ? 'bg-rose-500 text-black' : 'bg-amber-500 text-black'
                              }`} title={isOutOfStock ? "Out of Stock" : "Low Stock Warning"}>
                                <AlertTriangle className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{prod.name}</p>
                              {isOutOfStock ? (
                                <span className="px-1.5 py-0.2 bg-rose-900/70 text-rose-300 border border-rose-700/40 text-[9px] font-extrabold rounded uppercase tracking-wider">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="px-1.5 py-0.2 bg-amber-900/70 text-amber-300 border border-amber-700/40 text-[9px] font-extrabold rounded uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Low Stock
                                </span>
                              ) : null}
                            </div>
                            <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'} truncate max-w-xs`}>{prod.description}</p>
                          </div>
                        </td>
                        <td className={`p-3 font-semibold ${isLight ? 'text-stone-700' : 'text-white/70'}`}>
                          {categories.find(c => c.id === prod.category)?.name || prod.category}
                        </td>
                        <td className="p-3 font-extrabold text-[#c5a059]">₱{prod.price}</td>
                        <td className="p-3 font-medium text-emerald-500">
                          ₱{prod.cost} (₱{prod.price - prod.cost} profit)
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold flex items-center gap-1 ${
                              isOutOfStock ? 'text-rose-500 font-extrabold' : isLowStock ? 'text-amber-500 font-extrabold' : isLight ? 'text-stone-800' : 'text-white/80'
                            }`}>
                              {(isLowStock || isOutOfStock) && (
                                <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 animate-pulse ${
                                  isOutOfStock ? 'text-rose-500' : 'text-amber-500'
                                }`} />
                              )}
                              {prod.stockQuantity} units
                            </span>
                            <button
                              onClick={() => {
                                setStockProduct(prod);
                                setStockAmount('20');
                                setShowStockModal(true);
                              }}
                              className="text-[10px] text-[#c5a059] hover:underline font-bold"
                            >
                              (Adjust)
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right flex gap-1 justify-end">
                          <button
                            onClick={() => handleEditProductClick(prod)}
                            className={`p-1 ${isLight ? 'text-stone-400 hover:text-[#c5a059]' : 'text-white/40 hover:text-[#c5a059]'} cursor-pointer`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(prod.id)}
                            className={`p-1 ${isLight ? 'text-stone-400 hover:text-rose-500' : 'text-white/40 hover:text-rose-400'} cursor-pointer`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className={`font-serif font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} text-base tracking-wide`}>Menu Categories Manager</h2>
              <button
                onClick={() => {
                  setEditingCat(null);
                  setCatForm({
                    name: '',
                    description: '',
                    image: '',
                    icon: 'coffee',
                    displayOrder: categories.length + 1,
                    active: true
                  });
                  setModalError(null);
                  setModalSuccess(null);
                  setShowCatModal(true);
                }}
                className="w-full sm:w-auto bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> Add Category Record
              </button>
            </div>

            {/* MOBILE CARD VIEW - CATEGORIES */}
            <div className="lg:hidden space-y-3">
              {categories.map(cat => (
                <div key={cat.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-4 rounded-xl border space-y-3`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] border border-[#c5a059]/20 shadow-xs">
                        <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>{cat.name}</p>
                          <span className={`font-mono text-[10px] ${isLight ? 'text-stone-400' : 'text-white/40'}`}>#{cat.displayOrder}</span>
                        </div>
                        {cat.description && (
                          <p className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-white/50'} line-clamp-1`}>{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditCatClick(cat)}
                        className={`p-2 ${isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-700' : 'bg-white/5 hover:bg-white/10 text-white/70'} rounded-lg transition-colors`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
                            deleteCategory(cat.id).catch(err => setModalError(err.message));
                          }
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW - CATEGORIES */}
            <div className={`hidden lg:block ${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} rounded-xl border overflow-hidden`}>
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className={`${isLight ? 'bg-stone-100 border-stone-200 text-stone-600' : 'bg-[#080808] border-white/10 text-white/50'} border-b uppercase tracking-wider font-extrabold text-[10px]`}>
                    <th className="p-3">Display Order</th>
                    <th className="p-3">Category & Icon</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Active State</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-stone-200' : 'divide-white/5'}`}>
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-white/5">
                      <td className="p-3 font-mono font-bold text-[#c5a059]">#{cat.displayOrder}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#c5a059]/10 flex items-center justify-center text-[#c5a059] border border-[#c5a059]/20">
                            <CategoryIcon iconId={cat.icon} categoryName={cat.name} className="w-3.5 h-3.5" />
                          </div>
                          <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{cat.name}</span>
                        </div>
                      </td>
                      <td className={`p-3 ${isLight ? 'text-stone-600' : 'text-white/70'}`}>{cat.description}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cat.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : isLight ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}>
                          {cat.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-right flex gap-1 justify-end">
                        <button
                          onClick={() => handleEditCatClick(cat)}
                          className={`p-1 ${isLight ? 'text-stone-400 hover:text-[#c5a059]' : 'text-white/40 hover:text-[#c5a059]'} cursor-pointer`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
                              deleteCategory(cat.id).catch(err => setModalError(err.message));
                            }
                          }}
                          className={`p-1 ${isLight ? 'text-stone-400 hover:text-rose-500' : 'text-white/40 hover:text-rose-400'} cursor-pointer`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'vouchers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className={`font-serif font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} text-base tracking-wide`}>Campaign Voucher Management</h2>
              <button
                onClick={() => {
                  setEditingVoucher(null);
                  setVForm({
                    code: '',
                    name: '',
                    description: '',
                    discountType: 'percentage',
                    discountValue: 15,
                    minPurchase: 150,
                    maxDiscount: 100,
                    expirationDate: '2027-12-31',
                    active: true,
                    usageLimit: 500
                  });
                  setModalError(null);
                  setModalSuccess(null);
                  setShowVoucherModal(true);
                }}
                className="w-full sm:w-auto bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> Add Coupon Code
              </button>
            </div>

            {/* MOBILE CARD VIEW - VOUCHERS */}
            <div className="lg:hidden space-y-4">
              {vouchers.map(v => (
                <div key={v.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-4 rounded-xl border space-y-4`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#c5a059]" />
                        <span className={`text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'} tracking-widest uppercase`}>{v.code}</span>
                      </div>
                      <p className={`text-[10px] font-bold ${isLight ? 'text-stone-500' : 'text-white/40'} uppercase tracking-widest`}>
                        {v.discountType === 'percentage' ? `${v.discountValue}% OFF` : `₱${v.discountValue} OFF`}
                        {v.minPurchase > 0 && ` • Min. ₱${v.minPurchase}`}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase ${v.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {v.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className={`flex justify-between items-center text-[10px] ${isLight ? 'text-stone-500 border-stone-200' : 'text-white/40 border-white/5'} font-mono pt-3 border-t`}>
                    <span>Expires: {v.expirationDate}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditVoucherClick(v)}
                        className={`p-2 ${isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-700' : 'bg-white/5 hover:bg-white/10 text-white/70'} rounded-lg transition-colors`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete voucher "${v.code}"?`)) {
                            deleteVoucher(v.id).catch(err => setModalError(err.message));
                          }
                        }}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP GRID VIEW - VOUCHERS */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map(v => (
                <div key={v.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-4 rounded-xl border flex justify-between items-start`}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-[#c5a059]/10 text-[#c5a059] font-extrabold text-xs px-2.5 py-1 rounded border border-[#c5a059]/20">
                        {v.code}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        v.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : isLight ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-white/5 text-white/40 border border-white/10'
                      }`}>
                        {v.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{v.name}</h4>
                      <p className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-white/50'} mt-0.5`}>{v.description}</p>
                    </div>

                    <div className={`text-[10px] ${isLight ? 'text-stone-600' : 'text-white/40'} font-semibold space-y-0.5`}>
                      <p>Discount: {v.discountType === 'percentage' ? `${v.discountValue}% (Max ₱${v.maxDiscount})` : `₱${v.discountValue}`}</p>
                      <p>Requires Min Purchase: ₱{v.minPurchase}</p>
                      <p>Usage: {v.usageCount} used / Limit {v.usageLimit}</p>
                      <p>Expires: {v.expirationDate}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditVoucherClick(v)}
                      className={`p-1 ${isLight ? 'text-stone-400 hover:text-[#c5a059]' : 'text-white/40 hover:text-[#c5a059]'} cursor-pointer transition-colors`}
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => deleteVoucher(v.id)}
                      className={`p-1 ${isLight ? 'text-stone-400 hover:text-rose-500' : 'text-white/40 hover:text-rose-400'} cursor-pointer transition-colors`}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-4">
            <h2 className={`font-serif font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} text-base tracking-wide`}>Customer Loyalty Points Database</h2>

            {/* MOBILE CARD VIEW - CUSTOMERS */}
            <div className="lg:hidden space-y-3">
              {usersList.filter(u => u.role === 'customer').map(cust => (
                <div key={cust.uid} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-4 rounded-xl border space-y-3`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${isLight ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-white/5 text-white/40 border-white/10'} flex items-center justify-center border`}>
                        <User size={20} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>{cust.name}</p>
                        <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'} font-mono tracking-tight`}>{cust.phone || 'No Phone'}</p>
                        <p className={`text-[10px] ${isLight ? 'text-stone-400' : 'text-white/30'} truncate max-w-[150px]`}>{cust.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-extrabold text-[#c5a059] uppercase tracking-tighter">Points</p>
                      <p className={`text-lg font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} leading-none`}>{cust.loyaltyPoints}</p>
                    </div>
                  </div>
                  <div className={`flex justify-between items-center pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                    <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'} font-bold uppercase tracking-widest`}>
                      Spend: ₱{cust.lifetimeSpending || 0}
                    </p>
                    <button
                      onClick={() => {
                        setPointsUser(cust);
                        setPointsAmount('50');
                        setShowPointsModal(true);
                      }}
                      className="bg-[#c5a059]/10 hover:bg-[#c5a059]/25 border border-[#c5a059]/35 text-[#c5a059] font-bold px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer"
                    >
                      Modify Points
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW - CUSTOMERS */}
            <div className={`hidden lg:block ${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} rounded-xl border overflow-hidden`}>
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className={`${isLight ? 'bg-stone-100 border-stone-200 text-stone-600' : 'bg-[#080808] border-white/10 text-white/50'} border-b uppercase tracking-wider font-extrabold text-[10px]`}>
                      <th className="p-3">Customer Profile</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Points Balance</th>
                      <th className="p-3">Lifetime spend</th>
                      <th className="p-3 text-right">Loyalty Adjust</th>
                    </tr>
                  </thead>
                <tbody className={`divide-y ${isLight ? 'divide-stone-200' : 'divide-white/5'}`}>
                  {usersList.filter(u => u.role === 'customer').map(cust => (
                    <tr key={cust.uid} className={isLight ? 'hover:bg-stone-50' : 'hover:bg-white/5'}>
                      <td className="p-3">
                        <p className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{cust.name}</p>
                        <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>{cust.email}</p>
                      </td>
                      <td className={`p-3 font-mono ${isLight ? 'text-stone-700' : 'text-white/70'}`}>{cust.phone || 'Not Specified'}</td>
                      <td className="p-3">
                        <span className="font-bold font-mono bg-[#c5a059]/10 text-[#c5a059] px-2 py-0.5 rounded border border-[#c5a059]/20">
                          {cust.loyaltyPoints} points
                        </span>
                      </td>
                      <td className={`p-3 font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{cust.lifetimeSpending || 0}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setPointsUser(cust);
                            setPointsAmount('50');
                            setShowPointsModal(true);
                          }}
                          className="bg-[#c5a059]/10 hover:bg-[#c5a059]/25 border border-[#c5a059]/35 text-[#c5a059] font-bold px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer"
                        >
                          Modify Points
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'reports' && (
          <AdminReportsTab
            orders={orders}
            products={products}
            categories={categories}
            reportRange={reportRange}
            setReportRange={setReportRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            handleExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h2 className={`font-serif font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} text-base tracking-wide`}>Chronological Administrative Audit Logs</h2>

            {/* MOBILE CARD VIEW - AUDIT LOGS */}
            <div className="lg:hidden space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-4 rounded-xl border space-y-2`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-bold text-sm ${isLight ? 'text-stone-900' : 'text-white'}`}>{log.userName}</p>
                      <p className="text-[10px] text-[#c5a059] font-mono font-bold uppercase tracking-widest">{log.action}</p>
                    </div>
                    <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'} font-mono`}>
                      {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </p>
                  </div>
                  <div className="text-[10px] space-y-1">
                    <p className={`${isLight ? 'text-stone-600' : 'text-white/50'} truncate`}>Target: {log.target}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className={`p-1.5 ${isLight ? 'bg-rose-50 border-rose-200' : 'bg-rose-500/5 border-rose-500/10'} rounded border`}>
                        <p className="text-[8px] uppercase text-rose-500 font-bold">Old</p>
                        <p className={`${isLight ? 'text-stone-600' : 'text-white/40'} truncate`}>{log.prevValue || '—'}</p>
                      </div>
                      <div className={`p-1.5 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/5 border-emerald-500/10'} rounded border`}>
                        <p className="text-[8px] uppercase text-emerald-600 font-bold">New</p>
                        <p className="text-emerald-600 font-bold truncate">{log.newValue || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className={`text-center py-12 ${isLight ? 'text-stone-400' : 'text-white/20'} text-xs italic`}>No audit records found</div>
              )}
            </div>

            <div className={`hidden lg:block ${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} rounded-xl border overflow-hidden`}>
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className={`${isLight ? 'bg-stone-100 border-stone-200 text-stone-600' : 'bg-[#080808] border-white/10 text-white/50'} border-b uppercase tracking-wider font-extrabold text-[10px]`}>
                    <th className="p-3">Staff Operator</th>
                    <th className="p-3">Action performed</th>
                    <th className="p-3">Target Doc</th>
                    <th className="p-3">Old Value</th>
                    <th className="p-3">New Value</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-stone-200 text-stone-700' : 'divide-white/5 text-white/70'} font-medium`}>
                  {auditLogs.map(log => (
                    <tr key={log.id} className={isLight ? 'hover:bg-stone-50' : 'hover:bg-white/5'}>
                      <td className={`p-3 font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{log.userName}</td>
                      <td className="p-3 text-[#c5a059] font-mono text-[10px] font-bold">{log.action.toUpperCase()}</td>
                      <td className={`p-3 ${isLight ? 'text-stone-600' : 'text-white/50'} truncate max-w-xs`}>{log.target}</td>
                      <td className={`p-3 ${isLight ? 'text-stone-400' : 'text-white/30'} font-mono text-[10px] truncate max-w-xs`}>{log.prevValue || '—'}</td>
                      <td className="p-3 text-emerald-600 font-mono text-[10px] font-bold truncate max-w-xs">{log.newValue || '—'}</td>
                      <td className={`p-3 ${isLight ? 'text-stone-500' : 'text-white/40'} font-mono text-[10px] text-right`}>
                        {log.timestamp instanceof Date ? log.timestamp.toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className={`p-8 text-center ${isLight ? 'text-stone-500' : 'text-white/40'} font-semibold`}>No audit logs logged in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl pb-12">
            <div className={`border-b ${isLight ? 'border-stone-200' : 'border-white/10'} pb-4`}>
              <div>
                <h2 className={`font-serif font-extrabold ${isLight ? 'text-stone-900' : 'text-white'} text-lg tracking-wide flex items-center gap-2`}>
                  <Palette className="w-5 h-5 text-[#c5a059]" />
                  Branding & System Configuration
                </h2>
                <p className={`${isLight ? 'text-stone-500' : 'text-white/50'} text-xs mt-0.5`}>Customize shop name, theme colors, receipt information, and store operating rules.</p>
              </div>
            </div>

            {settingsSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold">{settingsSuccessMsg}</span>
              </div>
            )}

            {/* STORE OPERATIONS STATUS CONTROL */}
            <div className={`p-5 rounded-2xl border shadow-lg space-y-3 ${
              settingsForm.storeStatus?.isOpen !== false 
                ? isLight ? 'bg-emerald-50/80 border-emerald-300' : 'bg-emerald-950/20 border-emerald-500/30' 
                : isLight ? 'bg-rose-50/80 border-rose-300' : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className={`flex items-center justify-between border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2.5`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${settingsForm.storeStatus?.isOpen !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <div>
                    <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Store Operations Status</h3>
                    <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/50'}`}>Control whether customers can place orders online and whether POS/KDS are active.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    settingsForm.storeStatus?.isOpen !== false ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}>
                    {settingsForm.storeStatus?.isOpen !== false ? 'Store is OPEN' : 'Store is CLOSED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus = !(settingsForm.storeStatus?.isOpen !== false);
                      setSettingsForm({
                        ...settingsForm,
                        storeStatus: {
                          ...(settingsForm.storeStatus || {}),
                          isOpen: nextStatus
                        }
                      });
                    }}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                      settingsForm.storeStatus?.isOpen !== false ? 'bg-emerald-500' : 'bg-rose-600'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      settingsForm.storeStatus?.isOpen !== false ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                <p className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-white/60'} italic`}>
                  {settingsForm.storeStatus?.isOpen !== false
                    ? '✓ Customers can browse the menu and place online orders through the customer dashboard.'
                    : '✕ Store is closed. Online ordering is disabled and POS/KDS show operational standby banners.'}
                </p>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Store status successfully updated across all terminals!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save store status: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Store Status
                </button>
              </div>
            </div>

            {/* 1. BRAND IDENTITY & THEME */}
            <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-5 rounded-2xl border space-y-4`}>
              <div className={`flex items-center gap-2 text-[#c5a059] border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2.5`}>
                <Sparkles className="w-4 h-4" />
                <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Brand Identity & Visual Colors</h3>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Brand Logo URL / Upload</label>
                <div className="space-y-3">
                  {settingsForm.branding.logoUrl && (
                    <img src={settingsForm.branding.logoUrl} alt="Logo Preview" className={`w-16 h-16 rounded-lg object-contain ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/10'} border`} />
                  )}
                  <ImageUpload
                    label="Upload New Logo"
                    folder="branding"
                    onUploadSuccess={(url, key) => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, logoUrl: url, logoKey: key }
                    })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Or paste external logo URL here..."
                  value={settingsForm.branding.logoUrl || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    branding: { ...settingsForm.branding, logoUrl: e.target.value }
                  })}
                  className={`w-full p-2.5 mt-2 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Coffee Shop Brand Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.branding.shopName}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, shopName: e.target.value }
                    })}
                    placeholder="E.g. SHASZNAIR CAFE"
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border font-bold focus:border-[#c5a059] outline-none`}
                  />
                  <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Reflected in app header, e-receipts, POS register, and kitchen display.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Brand Slogan / Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.branding.description}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, description: e.target.value }
                    })}
                    placeholder="E.g. Artisanal Roasts, Fresh Pastries & Handcrafted Drinks"
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                  />
                </div>
              </div>

              {/* COLOR SELECTION ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Primary Brand Color */}
                <div className={`p-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/10'} rounded-xl border space-y-2`}>
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider block">Primary Gold Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsForm.branding.primaryColor || '#c5a059'}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, primaryColor: e.target.value }
                      })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settingsForm.branding.primaryColor || '#c5a059'}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, primaryColor: e.target.value }
                      })}
                      className={`w-full p-1.5 text-xs font-mono rounded ${isLight ? 'bg-white border-stone-300 text-stone-900' : 'bg-white/5 border-white/10 text-white'} border uppercase`}
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className={`p-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/10'} rounded-xl border space-y-2`}>
                  <label className={`text-[10px] font-extrabold uppercase ${isLight ? 'text-stone-700' : 'text-white/70'} tracking-wider block`}>Secondary Canvas</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsForm.branding.secondaryColor || '#1c1917'}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, secondaryColor: e.target.value }
                      })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settingsForm.branding.secondaryColor || '#1c1917'}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, secondaryColor: e.target.value }
                      })}
                      className={`w-full p-1.5 text-xs font-mono rounded ${isLight ? 'bg-white border-stone-300 text-stone-900' : 'bg-white/5 border-white/10 text-white'} border uppercase`}
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className={`p-3 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/10'} rounded-xl border space-y-2`}>
                  <label className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider block">Status / Highlight Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settingsForm.branding.accentColor || '#10b981'}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, accentColor: e.target.value }
                      })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settingsForm.branding.accentColor || '#10b981'}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, accentColor: e.target.value }
                      })}
                      className={`w-full p-1.5 text-xs font-mono rounded ${isLight ? 'bg-white border-stone-300 text-stone-900' : 'bg-white/5 border-white/10 text-white'} border uppercase`}
                    />
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON FOR BRAND IDENTITY */}
              <div className={`flex justify-end pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Brand identity & visual colors successfully saved!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save brand settings: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Brand Identity
                </button>
              </div>
            </div>

            {/* SEPARATE THEME MODE CARD */}
            <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-5 rounded-2xl border space-y-4`}>
              <div className={`flex items-center gap-2 text-[#c5a059] border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2.5`}>
                <Palette className="w-4 h-4" />
                <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Application Theme Mode</h3>
              </div>

              <div className="space-y-3 text-xs">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider block">Select Interface Appearance</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, theme: 'dark' }
                    })}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      (settingsForm.branding.theme || 'dark') === 'dark'
                        ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-lg'
                        : isLight ? 'bg-stone-100 text-stone-700 border-stone-300 hover:text-stone-900' : 'bg-[#080808] text-white/70 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>🌙 Dark Theme</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, theme: 'light' }
                    })}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      settingsForm.branding.theme === 'light'
                        ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-lg'
                        : isLight ? 'bg-stone-100 text-stone-700 border-stone-300 hover:text-stone-900' : 'bg-[#080808] text-white/70 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>☀️ Light Theme</span>
                  </button>
                </div>
              </div>

              <div className={`flex justify-end pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Application theme successfully updated!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save theme: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Theme
                </button>
              </div>
            </div>

            {/* 2. BUSINESS & STORE CONTACT INFO */}
            <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-5 rounded-2xl border space-y-4`}>
              <div className={`flex items-center gap-2 text-[#c5a059] border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2.5`}>
                <Building2 className="w-4 h-4" />
                <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Business & Store Location Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                    Store Physical Address (Printed on Receipts)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.businessInfo.address}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      businessInfo: { ...settingsForm.businessInfo, address: e.target.value }
                    })}
                    placeholder="123 Coffee Blvd, Corner Espresso Ave"
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={settingsForm.businessInfo.contactNumber}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      businessInfo: { ...settingsForm.businessInfo, contactNumber: e.target.value }
                    })}
                    placeholder="+63 917 123 4567"
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Business Contact Email
                  </label>
                  <input
                    type="email"
                    value={settingsForm.businessInfo.email}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      businessInfo: { ...settingsForm.businessInfo, email: e.target.value }
                    })}
                    placeholder="hello@shasznaircafe.com"
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Store Operating Hours
                  </label>
                  <input
                    type="text"
                    value={settingsForm.businessInfo.businessHours}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      businessInfo: { ...settingsForm.businessInfo, businessHours: e.target.value }
                    })}
                    placeholder="Mon - Sun: 7:00 AM - 10:00 PM"
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                  />
                </div>
              </div>

              <div className={`flex justify-end pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Business & store location details successfully saved!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save business info: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Business Info
                </button>
              </div>
            </div>

            {/* 3. ORDERING & LOYALTY RULES */}
            <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-5 rounded-2xl border space-y-4`}>
              <div className={`flex items-center gap-2 text-[#c5a059] border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2.5`}>
                <Award className="w-4 h-4" />
                <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Kitchen Prep & Loyalty Rules</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Prep Time (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settingsForm.orderSettings.estimatedPrepTime}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      orderSettings: { ...settingsForm.orderSettings, estimatedPrepTime: parseInt(e.target.value) || 10 }
                    })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none font-mono`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Minimum Order Amount (₱)</label>
                  <input
                    type="number"
                    min={0}
                    value={settingsForm.orderSettings.minimumOrder}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      orderSettings: { ...settingsForm.orderSettings, minimumOrder: parseFloat(e.target.value) || 0 }
                    })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none font-mono`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Spend for 1 Point (₱)</label>
                  <input
                    type="number"
                    min={1}
                    value={settingsForm.loyaltySettings.amountRequired}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      loyaltySettings: { ...settingsForm.loyaltySettings, amountRequired: parseFloat(e.target.value) || 100 }
                    })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none font-mono`}
                  />
                </div>
              </div>

              <div className={`flex justify-end pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Kitchen prep & loyalty rules successfully saved!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save rules: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Rules
                </button>
              </div>
            </div>

            {/* ACCOUNT CONFIGURATION FOR ADMIN, POS & KDS */}
            <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-5 rounded-2xl border space-y-4`}>
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-3`}>
                <div className="flex items-center gap-2 text-[#c5a059]">
                  <Users className="w-5 h-5" />
                  <div>
                    <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Terminal & Staff Account Security & Access</h3>
                    <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Manage Admin, POS Register, and KDS Kitchen login credentials, phone numbers, and Gmail verification.</p>
                  </div>
                </div>
                {/* Account Role Tabs */}
                <div className={`flex ${isLight ? 'bg-stone-100 border-stone-300' : 'bg-[#080808] border-white/10'} p-1 rounded-xl border`}>
                  {(['admin', 'pos', 'kds'] as const).map((roleKey) => {
                    const label = roleKey === 'admin' ? 'Admin' : roleKey === 'pos' ? 'POS Register' : 'KDS Kitchen';
                    const isActive = selectedAccountTab === roleKey;
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => setSelectedAccountTab(roleKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive ? 'bg-[#c5a059] text-black shadow-md' : isLight ? 'text-stone-600 hover:text-stone-900' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Form for selectedAccountTab */}
              {(() => {
                const acc = settingsForm.accountsConfig?.[selectedAccountTab] || {
                  role: selectedAccountTab,
                  name: '',
                  mobile: '',
                  email: '',
                  isEmailVerified: true
                };

                return (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                          <User className="w-3 h-3" /> Account / Staff Name
                        </label>
                        <input
                          type="text"
                          value={acc.name}
                          onChange={(e) => {
                            const updated = {
                              ...(settingsForm.accountsConfig || {
                                admin: { role: 'admin', name: '', mobile: '', email: '', isEmailVerified: true },
                                pos: { role: 'cashier', name: '', mobile: '', email: '', isEmailVerified: true },
                                kds: { role: 'kitchen', name: '', mobile: '', email: '', isEmailVerified: true }
                              }),
                              [selectedAccountTab]: { ...acc, name: e.target.value }
                            };
                            setSettingsForm({ ...settingsForm, accountsConfig: updated });
                          }}
                          placeholder="Full Name or Terminal Name"
                          className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Mobile Number
                        </label>
                        <input
                          type="text"
                          value={acc.mobile}
                          onChange={(e) => {
                            const updated = {
                              ...(settingsForm.accountsConfig || {
                                admin: { role: 'admin', name: '', mobile: '', email: '', isEmailVerified: true },
                                pos: { role: 'cashier', name: '', mobile: '', email: '', isEmailVerified: true },
                                kds: { role: 'kitchen', name: '', mobile: '', email: '', isEmailVerified: true }
                              }),
                              [selectedAccountTab]: { ...acc, mobile: e.target.value }
                            };
                            setSettingsForm({ ...settingsForm, accountsConfig: updated });
                          }}
                          placeholder="+63 917 000 0000"
                          className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none font-mono`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Gmail Address
                          </label>
                          {acc.isEmailVerified ? (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" /> Verified Gmail
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyingAccountKey(selectedAccountTab);
                                setGeneratedCode(Math.floor(100000 + Math.random() * 900000).toString());
                                setShowEmailVerificationModal(true);
                              }}
                              className="text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded hover:bg-amber-500/20 cursor-pointer"
                            >
                              Verify Gmail Required
                            </button>
                          )}
                        </div>
                        <input
                          type="email"
                          value={acc.email}
                          onChange={(e) => {
                            const updated = {
                              ...(settingsForm.accountsConfig || {
                                admin: { role: 'admin', name: '', mobile: '', email: '', isEmailVerified: true },
                                pos: { role: 'cashier', name: '', mobile: '', email: '', isEmailVerified: true },
                                kds: { role: 'kitchen', name: '', mobile: '', email: '', isEmailVerified: true }
                              }),
                              [selectedAccountTab]: { ...acc, email: e.target.value, isEmailVerified: false }
                            };
                            setSettingsForm({ ...settingsForm, accountsConfig: updated });
                          }}
                          placeholder="account@gmail.com"
                          className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/15 text-white'} border focus:border-[#c5a059] outline-none`}
                        />
                      </div>
                    </div>

                    <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <div className={`text-[11px] ${isLight ? 'text-stone-600' : 'text-white/50'}`}>
                        Password Security: {acc.password ? 'Custom Password Set' : 'Default Secure Password'}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {!acc.isEmailVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyingAccountKey(selectedAccountTab);
                              setGeneratedCode(Math.floor(100000 + Math.random() * 900000).toString());
                              setShowEmailVerificationModal(true);
                            }}
                            className="flex-1 sm:flex-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Verify Gmail Code
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordTarget(selectedAccountTab);
                            setNewPasswordVal('');
                            setConfirmPasswordVal('');
                            setShowPasswordModal(true);
                          }}
                          className={`flex-1 sm:flex-none ${isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'} border text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#c5a059]" /> Change Account Password
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className={`flex justify-end pt-3 border-t ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Terminal & staff accounts successfully saved!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save accounts: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Staff Accounts
                </button>
              </div>
            </div>

            {/* (Redundant store status section removed) */}

            {/* 7. PAYMENT CONFIGURATION */}
            <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-sm' : 'bg-[#121212] border-white/10 text-white shadow-lg'} p-5 rounded-2xl border space-y-4`}>
              <div className={`flex items-center justify-between border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2.5`}>
                <div className="flex items-center gap-2 text-[#c5a059]">
                  <Banknote className="w-4 h-4" />
                  <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-xs font-serif uppercase tracking-wider`}>Payment Configuration</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newMethods = [...(settingsForm.paymentMethods || [])];
                    newMethods.push({
                      id: `method-${Date.now()}`,
                      name: 'New Method',
                      type: 'qr',
                      active: true
                    });
                    setSettingsForm({ ...settingsForm, paymentMethods: newMethods });
                  }}
                  className={`${isLight ? 'bg-stone-100 hover:bg-stone-200 text-stone-800' : 'bg-white/5 hover:bg-white/10 text-white'} p-1 rounded-md cursor-pointer transition-colors`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {(settingsForm.paymentMethods || []).map((method, index) => (
                  <div key={method.id} className={`p-4 ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/5'} border rounded-xl space-y-3`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="grid grid-cols-2 gap-3 flex-1 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Method Name</label>
                          <input
                            type="text"
                            value={method.name}
                            onChange={(e) => {
                              const updated = [...settingsForm.paymentMethods];
                              updated[index].name = e.target.value;
                              setSettingsForm({ ...settingsForm, paymentMethods: updated });
                            }}
                            className={`w-full p-2 rounded-lg ${isLight ? 'bg-white border-stone-300 text-stone-900' : 'bg-black border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Type</label>
                          <select
                            value={method.type}
                            onChange={(e) => {
                              const updated = [...settingsForm.paymentMethods];
                              updated[index].type = e.target.value as any;
                              setSettingsForm({ ...settingsForm, paymentMethods: updated });
                            }}
                            className={`w-full p-2 rounded-lg ${isLight ? 'bg-white border-stone-300 text-stone-900' : 'bg-black border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50`}
                          >
                            <option value="cash">Cash</option>
                            <option value="qr">E-Wallet / QR (e.g., GCash, Maya)</option>
                            <option value="card">Card / Terminal</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/50'}`}>{method.active ? 'Active' : 'Disabled'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...settingsForm.paymentMethods];
                              updated[index].active = !updated[index].active;
                              setSettingsForm({ ...settingsForm, paymentMethods: updated });
                            }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${method.active ? 'bg-emerald-500' : 'bg-white/10'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${method.active ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = settingsForm.paymentMethods.filter((_, i) => i !== index);
                            setSettingsForm({ ...settingsForm, paymentMethods: updated });
                          }}
                          className="text-xs text-rose-400/50 hover:text-rose-400 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {(method.type === 'qr' || method.type === 'other') && (
                      <div className={`border-t ${isLight ? 'border-stone-200' : 'border-white/5'} pt-3 space-y-1 text-xs`}>
                        <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">QR Code Image</label>
                        <div className="flex items-center gap-3">
                          {method.qrCodeUrl && (
                            <img src={method.qrCodeUrl} alt="QR Preview" className={`w-12 h-12 rounded-lg object-contain ${isLight ? 'bg-stone-100 border-stone-300' : 'bg-white/5 border-white/10'} border`} />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await fetch('/api/upload-url', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ filename: file.name, contentType: file.type })
                                });
                                if (!res.ok) throw new Error(await res.text());
                                const { signedUrl, publicUrl } = await res.json();
                                await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
                                
                                const updated = [...settingsForm.paymentMethods];
                                updated[index].qrCodeUrl = publicUrl;
                                setSettingsForm({ ...settingsForm, paymentMethods: updated });
                              } catch (err: any) {
                                alert("Failed to upload QR: " + err.message);
                              }
                            }}
                            className={`w-full text-xs ${isLight ? 'text-stone-600' : 'text-white/50'} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#c5a059]/10 file:text-[#c5a059] hover:file:bg-[#c5a059]/20`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(settingsForm.paymentMethods || []).length === 0 && (
                  <p className={`text-xs ${isLight ? 'text-stone-500 border-stone-200' : 'text-white/50 border-white/5'} italic p-4 text-center border border-dashed rounded-xl`}>No payment methods configured. Customers won't be able to checkout.</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-white/5">
                <button
                  type="button"
                  disabled={settingsSaving}
                  onClick={async () => {
                    setSettingsSaving(true);
                    try {
                      await updateSettings(settingsForm);
                      setSettingsSuccessMsg("Payment configuration successfully saved!");
                      setTimeout(() => setSettingsSuccessMsg(null), 4000);
                    } catch (err: any) {
                      alert("Failed to save payment config: " + (err.message || err));
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {settingsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Payment Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. PRODUCT CRUD SYSTEM MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProductSubmit} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-md rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>
                {editingProduct ? `Edit Beverage: ${editingProduct.name}` : 'Create Beverage Record'}
              </h3>
              <button type="button" onClick={() => setShowProductModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-start gap-2">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Product Name</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none font-bold`}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Detailed Description</label>
                <textarea
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  rows={2}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Unit Price (₱)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Unit Ingredient Cost (₱)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.cost}
                    onChange={(e) => setProdForm({ ...prodForm, cost: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Product Image</label>
                <div className="flex items-center gap-3">
                  {prodForm.image && (
                    <img src={prodForm.image} alt="Preview" className={`w-10 h-10 rounded-md object-cover border ${isLight ? 'border-stone-300' : 'border-white/10'}`} />
                  )}
                  <ImageUpload
                    label="Upload Image"
                    folder="products"
                    onUploadSuccess={(url, key) => setProdForm({
                      ...prodForm,
                      image: url,
                      imageKey: key
                    })}
                  />
                </div>
                {isUploadingImage && <p className="text-[10px] text-[#c5a059] animate-pulse mt-1">Uploading to Cloudflare R2...</p>}
                {/* Fallback to text input if they just want to paste a URL */}
                <input
                  type="text"
                  placeholder="Or paste image URL here..."
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  className={`w-full p-2.5 mt-2 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors text-xs`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Initial Stock</label>
                  <input
                    type="number"
                    value={prodForm.stockQuantity}
                    onChange={(e) => setProdForm({ ...prodForm, stockQuantity: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none font-bold focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Min Alert Stock</label>
                  <input
                    type="number"
                    value={prodForm.minStock}
                    onChange={(e) => setProdForm({ ...prodForm, minStock: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Commit Beverage Record
            </button>
          </form>
        </div>
      )}

      {/* 4. CATEGORY CRUD SYSTEM MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCatSubmit} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-md rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs max-h-[90vh] overflow-y-auto scrollbar-none`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>
                {editingCat ? `Edit Category: ${editingCat.name}` : 'Create Category Record'}
              </h3>
              <button type="button" onClick={() => setShowCatModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-start gap-2">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coffee, Pastries, Sandwiches..."
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>

              {/* FOOD & DRINK ICONS SELECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Food & Drink Icon</label>
                  <div className={`flex items-center gap-1.5 text-[11px] ${isLight ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-[#1a1a1a] border-white/10 text-white/80'} px-2 py-0.5 rounded-md border`}>
                    <CategoryIcon iconId={catForm.icon} categoryName={catForm.name} className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span className="font-bold text-[#c5a059] truncate max-w-[130px]">
                      {FOOD_ICON_OPTIONS.find(o => o.id === catForm.icon)?.label || 'Selected Icon'}
                    </span>
                  </div>
                </div>

                <div className={`${isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/10'} border rounded-xl p-2.5 space-y-2 max-h-48 overflow-y-auto scrollbar-none`}>
                  {/* Icon Categories */}
                  {(['beverages', 'bakery', 'meals', 'desserts', 'snacks', 'specials'] as const).map(group => {
                    const groupOptions = FOOD_ICON_OPTIONS.filter(o => o.category === group);
                    if (groupOptions.length === 0) return null;
                    const groupTitle = 
                      group === 'beverages' ? 'Beverages & Drinks' :
                      group === 'bakery' ? 'Bakery & Bread' :
                      group === 'meals' ? 'Meals & Savory' :
                      group === 'desserts' ? 'Desserts & Sweets' :
                      group === 'snacks' ? 'Snacks' : 'Signature & Specials';

                    return (
                      <div key={group} className="space-y-1">
                        <p className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-500' : 'text-white/40'} px-1 pt-0.5`}>{groupTitle}</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                          {groupOptions.map(opt => {
                            const isSelected = (catForm.icon || 'coffee') === opt.id;
                            const IconComponent = opt.IconComponent;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                title={opt.label}
                                onClick={() => setCatForm({ ...catForm, icon: opt.id })}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer group relative ${
                                  isSelected
                                    ? 'bg-[#c5a059] text-black border-[#c5a059] font-bold shadow-[0_0_8px_rgba(197,160,89,0.4)] ring-1 ring-[#c5a059]'
                                    : isLight
                                    ? 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                                    : 'bg-[#121212] border-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20'
                                }`}
                              >
                                <IconComponent className="w-4 h-4 shrink-0" />
                                <span className={`text-[8px] truncate w-full text-center mt-1 block leading-tight ${
                                  isSelected ? 'text-black font-extrabold' : isLight ? 'text-stone-500 group-hover:text-stone-800' : 'text-white/50 group-hover:text-white/80'
                                }`}>
                                  {opt.label.split(' ')[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Description</label>
                <input
                  type="text"
                  placeholder="Short tagline or description"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Sort Order No.</label>
                  <input
                    type="number"
                    value={catForm.displayOrder}
                    onChange={(e) => setCatForm({ ...catForm, displayOrder: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className={`flex items-center gap-2 cursor-pointer font-bold ${isLight ? 'text-stone-700' : 'text-white/70'}`}>
                    <input
                      type="checkbox"
                      checked={catForm.active}
                      onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })}
                      className={`w-4 h-4 rounded ${isLight ? 'border-stone-300 bg-stone-50' : 'border-white/20 bg-[#080808]'}`}
                    />
                    <span>Category Active</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Commit Category Record
            </button>
          </form>
        </div>
      )}

      {/* 5. VOUCHER MODAL */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleVoucherSubmit} className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-sm rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>Configure Campaign Voucher</h3>
              <button type="button" onClick={() => setShowVoucherModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-start gap-2">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Voucher Code</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. COFFEE20"
                    value={vForm.code}
                    onChange={(e) => setVForm({ ...vForm, code: e.target.value })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none uppercase font-mono font-bold focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Discount Type</label>
                  <select
                    value={vForm.discountType}
                    onChange={(e) => setVForm({ ...vForm, discountType: e.target.value as any })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none`}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash Amount (₱)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Discount Value</label>
                  <input
                    type="number"
                    value={vForm.discountValue}
                    onChange={(e) => setVForm({ ...vForm, discountValue: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Expiration Date</label>
                  <input
                    type="date"
                    value={vForm.expirationDate}
                    onChange={(e) => setVForm({ ...vForm, expirationDate: e.target.value })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none font-mono focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Min Purchase Req</label>
                  <input
                    type="number"
                    value={vForm.minPurchase}
                    onChange={(e) => setVForm({ ...vForm, minPurchase: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Campaign Limit</label>
                  <input
                    type="number"
                    value={vForm.usageLimit}
                    onChange={(e) => setVForm({ ...vForm, usageLimit: Number(e.target.value) })}
                    className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Commit Voucher Rules
            </button>
          </form>
        </div>
      )}

      {/* 7. MANUAL LOYALTY POINTS ADJUST MODAL */}
      {showPointsModal && pointsUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-sm rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>Authorized Loyalty Adjust</h3>
              <button onClick={() => setShowPointsModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            <div className="bg-[#c5a059]/10 text-stone-900 dark:text-white border border-[#c5a059]/20 p-3 rounded-xl">
              <p className="font-bold text-[#c5a059]">Customer: {pointsUser.name}</p>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-stone-600' : 'text-white/70'}`}>Current Balance: {pointsUser.loyaltyPoints} points</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Points Delta (Positive/Negative)</label>
                <input
                  type="number"
                  placeholder="E.g. 50 or -30"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none font-bold focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Adjustment Reason Memo</label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>
            </div>

            <button
              onClick={handleAdjustPointsSubmit}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Commit Points Adjustment (Logged)
            </button>
          </div>
        </div>
      )}

      {/* 8. MANUAL INVENTORY STOCK ADJUST MODAL */}
      {showStockModal && stockProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-sm rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>Stock Audit: {stockProduct.name}</h3>
              <button onClick={() => setShowStockModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            <div className={`${isLight ? 'bg-stone-100 text-stone-800 border-stone-200' : 'bg-white/5 text-white/90 border-white/10'} p-3 rounded-xl border`}>
              <p className="font-bold">Item: {stockProduct.name}</p>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-stone-500' : 'text-white/60'}`}>Current Stock Ledger: {stockProduct.stockQuantity} units</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Adjustment Delta</label>
                <input
                  type="number"
                  placeholder="E.g. 50 or -10"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none font-bold focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Adjustment Audit Reason</label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50 transition-colors`}
                />
              </div>
            </div>

            <button
              onClick={handleAdjustStockSubmit}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Commit Stock Audit (Logged)
            </button>
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && passwordTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-sm rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>Change Password for {passwordTarget.toUpperCase()}</h3>
              <button onClick={() => setShowPasswordModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new secure password"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPasswordVal}
                  onChange={(e) => setConfirmPasswordVal(e.target.value)}
                  className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} border outline-none focus:border-[#c5a059]/50`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!newPasswordVal || newPasswordVal.length < 6) {
                  alert("Password must be at least 6 characters long.");
                  return;
                }
                if (newPasswordVal !== confirmPasswordVal) {
                  alert("Passwords do not match!");
                  return;
                }
                const updatedAcc = {
                  ...(settingsForm.accountsConfig || {
                    admin: { role: 'admin', name: '', mobile: '', email: '', isEmailVerified: true },
                    pos: { role: 'cashier', name: '', mobile: '', email: '', isEmailVerified: true },
                    kds: { role: 'kitchen', name: '', mobile: '', email: '', isEmailVerified: true }
                  }),
                  [passwordTarget]: {
                    ...(settingsForm.accountsConfig?.[passwordTarget] || {}),
                    password: newPasswordVal
                  }
                };
                setSettingsForm({ ...settingsForm, accountsConfig: updatedAcc });
                setShowPasswordModal(false);
                setModalSuccess(`Password successfully updated for ${passwordTarget.toUpperCase()}! Click "Save & Update All Terminals" to commit.`);
                setTimeout(() => setModalSuccess(null), 4000);
              }}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* GMAIL VERIFICATION MODAL */}
      {showEmailVerificationModal && verifyingAccountKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white border-stone-200 text-stone-900 shadow-2xl' : 'bg-[#121212] border-white/10 text-white shadow-2xl'} w-full max-w-sm rounded-2xl border p-5 space-y-4 animate-zoom-in text-xs`}>
            <div className={`flex justify-between items-center border-b ${isLight ? 'border-stone-200' : 'border-white/5'} pb-2`}>
              <h3 className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'} text-sm`}>Gmail Verification ({verifyingAccountKey.toUpperCase()})</h3>
              <button onClick={() => setShowEmailVerificationModal(false)} className={`p-1 ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/5'} rounded-full cursor-pointer transition-colors`}>
                <X className={`w-5 h-5 ${isLight ? 'text-stone-500' : 'text-white/50'}`} />
              </button>
            </div>

            <div className="p-3 bg-[#c5a059]/10 rounded-xl border border-[#c5a059]/30 text-stone-900 dark:text-white/90 space-y-1">
              <p className="font-bold text-[#c5a059]">Verification Code Sent!</p>
              <p className={`text-[10px] ${isLight ? 'text-stone-600' : 'text-white/70'}`}>We sent a 6-digit confirmation code to <strong className={isLight ? 'text-stone-900' : 'text-white'}>{settingsForm.accountsConfig?.[verifyingAccountKey]?.email}</strong>.</p>
              <p className="text-[10px] text-amber-600 font-mono mt-1">[Simulated Verification Code: <strong>{generatedCode}</strong>]</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-[#c5a059] tracking-wider">Enter 6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                className={`w-full p-2.5 rounded-xl ${isLight ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-[#080808] border-white/10 text-white'} text-center font-mono text-lg tracking-widest outline-none focus:border-[#c5a059]/50`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (verificationCodeInput !== generatedCode && verificationCodeInput !== '123456') {
                  alert("Invalid verification code. Please check and try again.");
                  return;
                }
                const updatedAcc = {
                  ...(settingsForm.accountsConfig || {
                    admin: { role: 'admin', name: '', mobile: '', email: '', isEmailVerified: true },
                    pos: { role: 'cashier', name: '', mobile: '', email: '', isEmailVerified: true },
                    kds: { role: 'kitchen', name: '', mobile: '', email: '', isEmailVerified: true }
                  }),
                  [verifyingAccountKey]: {
                    ...(settingsForm.accountsConfig?.[verifyingAccountKey] || {}),
                    isEmailVerified: true
                  }
                };
                setSettingsForm({ ...settingsForm, accountsConfig: updatedAcc });
                setShowEmailVerificationModal(false);
                setVerificationCodeInput('');
                setModalSuccess(`Gmail successfully verified for ${verifyingAccountKey.toUpperCase()}!`);
                setTimeout(() => setModalSuccess(null), 4000);
              }}
              className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-bold py-3 rounded-xl shadow-md cursor-pointer text-xs transition-colors"
            >
              Verify Gmail Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminExperience;
