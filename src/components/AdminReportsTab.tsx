import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Order, Product, Category, SystemSettings, CumulativeExpense } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Croissant,
  Utensils,
  Calendar,
  Download,
  Clock,
  Store,
  Smartphone,
  User,
  Percent,
  Activity,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface AdminReportsTabProps {
  orders: Order[];
  products: Product[];
  categories: Category[];
  reportRange: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  setReportRange: (range: 'today' | 'yesterday' | 'week' | 'month' | 'custom') => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
  handleExportCSV: () => void;
  isLight?: boolean;
  settings?: SystemSettings;
  updateSettings?: (s: SystemSettings) => Promise<void>;
}

// Helpers for categorization
const isDrinkProduct = (item: { name: string; productId?: string }, products: Product[]) => {
  const prod = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
  const cat = prod?.category?.toLowerCase() || '';
  const name = item.name.toLowerCase();
  
  if (cat.includes('food') || cat.includes('pastr') || cat.includes('bak') || cat.includes('muffin') || cat.includes('croissant') || cat.includes('lunch') || cat.includes('meal')) {
    return false;
  }
  return (
    cat.includes('coffee') ||
    cat.includes('drink') ||
    cat.includes('beverage') ||
    cat.includes('tea') ||
    cat.includes('soda') ||
    cat.includes('juice') ||
    cat.includes('latte') ||
    cat.includes('non-coffee') ||
    cat.includes('special') ||
    name.includes('latte') ||
    name.includes('coffee') ||
    name.includes('espresso') ||
    name.includes('tea') ||
    name.includes('choco') ||
    name.includes('matcha') ||
    name.includes('brew') ||
    name.includes('frappe')
  );
};

const isPastryProduct = (item: { name: string; productId?: string }, products: Product[]) => {
  const prod = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
  const cat = prod?.category?.toLowerCase() || '';
  const name = item.name.toLowerCase();
  
  return (
    cat.includes('pastr') ||
    cat.includes('bak') ||
    cat.includes('bread') ||
    cat.includes('cake') ||
    cat.includes('cookie') ||
    cat.includes('muffin') ||
    cat.includes('croissant') ||
    cat.includes('dessert') ||
    cat.includes('donut') ||
    name.includes('muffin') ||
    name.includes('cookie') ||
    name.includes('croissant') ||
    name.includes('cake') ||
    name.includes('pastry') ||
    name.includes('bread') ||
    name.includes('brownie') ||
    name.includes('donut') ||
    name.includes('toast')
  );
};

const isLunchProduct = (item: { name: string; productId?: string }, products: Product[]) => {
  const prod = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.name.toLowerCase());
  const cat = prod?.category?.toLowerCase() || '';
  const name = item.name.toLowerCase();
  
  return (
    cat.includes('lunch') ||
    cat.includes('meal') ||
    cat.includes('sandwich') ||
    cat.includes('pasta') ||
    cat.includes('rice') ||
    cat.includes('savory') ||
    name.includes('sandwich') ||
    name.includes('pasta') ||
    name.includes('lunch') ||
    name.includes('meal') ||
    name.includes('bowl') ||
    name.includes('salad') ||
    name.includes('panini')
  );
};

// Safe date parser
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

export const AdminReportsTab: React.FC<AdminReportsTabProps> = ({
  orders,
  products,
  categories,
  reportRange,
  setReportRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  handleExportCSV,
  isLight = false,
  settings,
  updateSettings
}) => {
  // 1. FILTER ORDERS BASED ON SELECTED TIMEFRAME OR CALENDAR DATES
  const filteredReportOrders = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    return orders.filter(o => {
      const created = parseOrderDate(o.createdAt);
      if (!created) return false;

      if (reportRange === 'today') {
        return created.toISOString().slice(0, 10) === todayStr;
      } else if (reportRange === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return created.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10);
      } else if (reportRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return created >= weekAgo;
      } else if (reportRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(today.getDate() - 30);
        monthAgo.setHours(0, 0, 0, 0);
        return created >= monthAgo;
      } else if (reportRange === 'custom') {
        const start = new Date(customStartDate + 'T00:00:00');
        const end = new Date(customEndDate + 'T23:59:59');
        return created >= start && created <= end;
      }
      return true;
    });
  }, [orders, reportRange, customStartDate, customEndDate]);

  // 2. CORE FINANCIAL & OPERATIONAL TOTALS
  const reportGrossSales = filteredReportOrders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
  const reportDiscounts = filteredReportOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const reportNetSales = filteredReportOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const reportOrdersCount = filteredReportOrders.length;
  const reportAvgTicket = reportOrdersCount > 0 ? Math.round(reportNetSales / reportOrdersCount) : 0;

  // 3. PRODUCT CATEGORY METRICS: DRINKS, PASTRIES, LUNCH COUNT
  const totalDrinkQuantity = useMemo(() => {
    let count = 0;
    filteredReportOrders.forEach(o => {
      o.items?.forEach(it => {
        if (isDrinkProduct(it, products)) {
          count += (it.quantity || 1);
        }
      });
    });
    return count;
  }, [filteredReportOrders, products]);

  const totalPastriesQuantity = useMemo(() => {
    let count = 0;
    filteredReportOrders.forEach(o => {
      o.items?.forEach(it => {
        if (isPastryProduct(it, products)) {
          count += (it.quantity || 1);
        }
      });
    });
    return count;
  }, [filteredReportOrders, products]);

  const { totalLunchCount, totalLunchOrders } = useMemo(() => {
    let lunchOrders = 0;
    let lunchMeals = 0;

    filteredReportOrders.forEach(o => {
      const d = parseOrderDate(o.createdAt);
      const hour = d ? d.getHours() : -1;
      // Lunch Window: 11:00 AM - 2:00 PM
      if (hour >= 11 && hour <= 14) {
        lunchOrders++;
      }
      o.items?.forEach(it => {
        if (isLunchProduct(it, products)) {
          lunchMeals += (it.quantity || 1);
        }
      });
    });

    // Total lunch count includes meals sold or orders served during lunch window
    const totalCount = lunchMeals > 0 ? lunchMeals : lunchOrders;
    return { totalLunchCount: totalCount, totalLunchOrders: lunchOrders };
  }, [filteredReportOrders, products]);

  const [cumulativeExpensesVal, setCumulativeExpensesVal] = React.useState<CumulativeExpense[]>([]);
  const [expenseSaving, setExpenseSaving] = React.useState(false);
  const [expenseSuccessMsg, setExpenseSuccessMsg] = React.useState<string | null>(null);

  // Sync expense form value
  React.useEffect(() => {
    if (cumulativeExpensesVal.length === 0 && settings?.cumulativeExpenses) {
      setCumulativeExpensesVal(settings.cumulativeExpenses);
    }
  }, [settings?.cumulativeExpenses]);

  // 4. FINANCIAL EXPENSES & PROFIT ANALYSIS
  const financialAnalysis = useMemo(() => {
    const grossRevenue = reportNetSales;
    const totalExpenses = (settings?.cumulativeExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossRevenue - totalExpenses;
    const avgProfitPerOrder = reportOrdersCount > 0 ? Math.round(netProfit / reportOrdersCount) : 0;

    return {
      totalExpenses,
      netProfit,
      avgProfitPerOrder
    };
  }, [reportNetSales, settings?.cumulativeExpenses, reportOrdersCount]);

  // 5. ANIMATED REVENUE & ORDER VOLUME TREND DATA
  const revenueTrendData = useMemo(() => {
    const isSingleDay = reportRange === 'today' || reportRange === 'yesterday';

    if (isSingleDay) {
      const buckets: Record<string, { time: string; revenue: number; orders: number; hour: number }> = {};
      for (let h = 6; h <= 22; h += 2) {
        const label = `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
        buckets[label] = { time: label, revenue: 0, orders: 0, hour: h };
      }

      filteredReportOrders.forEach(o => {
        const d = parseOrderDate(o.createdAt);
        if (d) {
          const h = d.getHours();
          const bucketHour = Math.floor(h / 2) * 2;
          const label = `${bucketHour % 12 === 0 ? 12 : bucketHour % 12}:00 ${bucketHour >= 12 ? 'PM' : 'AM'}`;
          if (buckets[label]) {
            buckets[label].revenue += (o.total || 0);
            buckets[label].orders += 1;
          }
        }
      });
      return Object.values(buckets);
    } else {
      const dateMap: Record<string, { date: string; time: string; revenue: number; orders: number }> = {};

      const sorted = [...filteredReportOrders].sort((a, b) => {
        const da = parseOrderDate(a.createdAt)?.getTime() || 0;
        const db = parseOrderDate(b.createdAt)?.getTime() || 0;
        return da - db;
      });

      sorted.forEach(o => {
        const d = parseOrderDate(o.createdAt);
        if (d) {
          const dateKey = d.toISOString().slice(0, 10);
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = { date: dateKey, time: label, revenue: 0, orders: 0 };
          }
          dateMap[dateKey].revenue += (o.total || 0);
          dateMap[dateKey].orders += 1;
        }
      });
      return Object.values(dateMap);
    }
  }, [filteredReportOrders, reportRange]);

  // 6. TOP 10 SELLING ITEMS
  const top10SellingItems = useMemo(() => {
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredReportOrders.forEach(o => {
      o.items?.forEach(it => {
        const key = it.productId || it.name;
        if (!itemMap[key]) {
          itemMap[key] = { name: it.name, quantity: 0, revenue: 0 };
        }
        itemMap[key].quantity += (it.quantity || 1);
        itemMap[key].revenue += (it.price * (it.quantity || 1));
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredReportOrders]);

  // 7. PEAK HOURS OPERATIONAL DISTRIBUTION
  const hourlyPeakAnalysis = useMemo(() => {
    const hours: { hourLabel: string; hour: number; orders: number; revenue: number }[] = [];
    for (let i = 6; i <= 22; i++) {
      const label = `${i % 12 === 0 ? 12 : i % 12} ${i >= 12 ? 'PM' : 'AM'}`;
      hours.push({ hourLabel: label, hour: i, orders: 0, revenue: 0 });
    }

    filteredReportOrders.forEach(o => {
      const d = parseOrderDate(o.createdAt);
      if (d) {
        const h = d.getHours();
        const match = hours.find(hr => hr.hour === h);
        if (match) {
          match.orders += 1;
          match.revenue += (o.total || 0);
        }
      }
    });

    const peak = [...hours].sort((a, b) => b.orders - a.orders)[0];
    return {
      hours,
      peakHour: peak && peak.orders > 0 ? peak : null
    };
  }, [filteredReportOrders]);

  // 8. ORDER TYPE BREAKDOWN (Dine-in vs. Takeaway/Pickup vs. Table)
  const orderTypeData = useMemo(() => {
    let dineIn = 0;
    let pickup = 0;
    let table = 0;

    filteredReportOrders.forEach(o => {
      if (o.orderType === 'dine_in') dineIn++;
      else if (o.orderType === 'pickup') pickup++;
      else if (o.orderType === 'table') table++;
      else pickup++;
    });

    const total = filteredReportOrders.length;
    const data = [
      { name: 'Dine-In', value: dineIn, color: '#c5a059', percent: total > 0 ? Math.round((dineIn / total) * 100) : 0 },
      { name: 'Takeaway / Pickup', value: pickup, color: '#e0b868', percent: total > 0 ? Math.round((pickup / total) * 100) : 0 },
      { name: 'Table Service', value: table, color: '#8c6e30', percent: total > 0 ? Math.round((table / total) * 100) : 0 }
    ].filter(d => d.value > 0);

    return data.length > 0 ? data : [{ name: 'No Orders', value: 1, color: '#333333', percent: 100 }];
  }, [filteredReportOrders]);

  // 9. ORDERING CHANNEL BREAKDOWN (POS vs. APP)
  const orderChannelData = useMemo(() => {
    let posCount = 0;
    let posRevenue = 0;
    let appCount = 0;
    let appRevenue = 0;

    filteredReportOrders.forEach(o => {
      if (o.orderSource === 'pos') {
        posCount++;
        posRevenue += (o.total || 0);
      } else {
        appCount++;
        appRevenue += (o.total || 0);
      }
    });

    const total = filteredReportOrders.length;
    return [
      {
        name: 'In-Store POS Register',
        count: posCount,
        revenue: posRevenue,
        color: '#3b82f6',
        percent: total > 0 ? Math.round((posCount / total) * 100) : 0
      },
      {
        name: 'Customer Web/Mobile App',
        count: appCount,
        revenue: appRevenue,
        color: '#a855f7',
        percent: total > 0 ? Math.round((appCount / total) * 100) : 0
      }
    ];
  }, [filteredReportOrders]);

  const PIE_COLORS = ['#c5a059', '#e0b868', '#8c6e30', '#3b82f6', '#10b981'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-12"
    >
      {/* 1. TOP HEADER & CALENDAR DATE RANGE SELECTOR */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
        isLight ? 'bg-white border-stone-200 shadow-md' : 'bg-[#121212] border-white/10 shadow-xl'
      } space-y-4`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className={`font-serif font-extrabold text-lg sm:text-xl tracking-wide flex items-center gap-2 ${
              isLight ? 'text-stone-900' : 'text-white'
            }`}>
              <TrendingUp className="w-5 h-5 text-[#c5a059]" />
              Financial & Sales Analytics Reports
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-stone-600' : 'text-white/50'}`}>
              Comprehensive revenue turnover, COGS profitability, product volumes, peak traffic, and channel insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Range Presets */}
            <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl border ${
              isLight ? 'bg-stone-100 border-stone-200' : 'bg-[#080808] border-white/10'
            }`}>
              {(['today', 'yesterday', 'week', 'month', 'custom'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setReportRange(tab)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                    reportRange === tab
                      ? 'bg-[#c5a059] text-black shadow-md'
                      : isLight 
                        ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/80 font-semibold' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'week' ? 'Last 7D' : tab === 'month' ? 'Last 30D' : tab}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors shrink-0 border ${
                isLight 
                  ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
            >
              <Download className="w-4 h-4 text-[#c5a059]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* CALENDAR DATE RANGE PICKER */}
        <div className={`pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          isLight ? 'border-stone-200' : 'border-white/5'
        }`}>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-1.5 font-bold ${isLight ? 'text-stone-800' : 'text-white/70'}`}>
              <Calendar className="w-4 h-4 text-[#c5a059]" />
              <span>Date Filter:</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 ${
                isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#080808] border-white/10'
              }`}>
                <span className={`text-[10px] uppercase font-extrabold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setReportRange('custom');
                  }}
                  className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${
                    isLight ? 'text-stone-900 [color-scheme:light]' : 'text-white [color-scheme:dark]'
                  }`}
                />
              </div>

              <span className={`font-bold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>—</span>

              <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 ${
                isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#080808] border-white/10'
              }`}>
                <span className={`text-[10px] uppercase font-extrabold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setReportRange('custom');
                  }}
                  className={`bg-transparent text-xs font-bold outline-none cursor-pointer ${
                    isLight ? 'text-stone-900 [color-scheme:light]' : 'text-white [color-scheme:dark]'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`text-[11px] font-medium flex items-center gap-2 ${isLight ? 'text-stone-700' : 'text-white/50'}`}>
            <span>Active Window:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
              isLight ? 'text-[#8c6b27] bg-[#c5a059]/15 border-[#c5a059]/30' : 'text-[#c5a059] bg-[#c5a059]/10 border-[#c5a059]/20'
            }`}>
              {filteredReportOrders.length} {filteredReportOrders.length === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* TOTAL REVENUE */}
        <div className={`p-4 rounded-xl border shadow-md space-y-1.5 relative overflow-hidden group transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'
        }`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#c5a059]/10 rounded-full blur-xl group-hover:bg-[#c5a059]/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Total Revenue</span>
            <div className="p-1.5 rounded-lg bg-[#c5a059]/10 text-[#c5a059]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold font-mono ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{reportNetSales.toLocaleString()}</p>
          <p className={`text-[10px] truncate ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>
            Gross ₱{reportGrossSales.toLocaleString()} • Disc -₱{reportDiscounts.toLocaleString()}
          </p>
        </div>

        {/* AVERAGE ORDER VALUE (AOV) */}
        <div className={`p-4 rounded-xl border shadow-md space-y-1.5 relative overflow-hidden group transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Avg Order Value</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold font-mono ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{reportAvgTicket}</p>
          <p className={`text-[10px] ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Across {reportOrdersCount} invoices</p>
        </div>

        {/* TOTAL DRINK QUANTITY */}
        <div className={`p-4 rounded-xl border shadow-md space-y-1.5 relative overflow-hidden group transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Total Drinks</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold font-mono ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{totalDrinkQuantity}</p>
          <p className={`text-[10px] ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Cups & beverages sold</p>
        </div>

        {/* TOTAL PASTRIES */}
        <div className={`p-4 rounded-xl border shadow-md space-y-1.5 relative overflow-hidden group transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Total Pastries</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <Croissant className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold font-mono ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>{totalPastriesQuantity}</p>
          <p className={`text-[10px] ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Bakery & pastries sold</p>
        </div>

        {/* TOTAL LUNCH COUNT */}
        <div className={`p-4 rounded-xl border shadow-md space-y-1.5 relative overflow-hidden group transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Lunch Count</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{totalLunchCount}</p>
          <p className={`text-[10px] ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>{totalLunchOrders} lunch rush orders (11-2PM)</p>
        </div>

        {/* NET PROFIT */}
        <div className={`p-4 rounded-xl border shadow-md space-y-1.5 relative overflow-hidden group transition-colors ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Net Profit</span>
            <div className={`p-1.5 rounded-lg ${financialAnalysis.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-extrabold font-mono ${financialAnalysis.netProfit >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>₱{financialAnalysis.netProfit.toLocaleString()}</p>
          <p className={`text-[10px] font-bold ${isLight ? 'text-stone-500' : 'text-white/40'}`}>Gross Sales - Expenses</p>
        </div>
      </div>

      {/* 3. FINANCIAL EXPENSES & PROFIT BREAKDOWN */}
      <div className={`rounded-2xl border p-5 shadow-md space-y-4 transition-colors ${
        isLight 
          ? 'bg-white border-stone-200' 
          : 'bg-gradient-to-br from-[#141414] to-[#0a0a0a] border-white/10 shadow-xl'
      }`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 ${
          isLight ? 'border-stone-200' : 'border-white/5'
        }`}>
          <div className="flex items-center gap-2 text-[#c5a059]">
            <Activity className="w-5 h-5" />
            <h3 className={`font-serif font-extrabold text-sm sm:text-base tracking-wide ${
              isLight ? 'text-stone-900' : 'text-white'
            }`}>
              Financial Expenses & Profit Breakdown
            </h3>
          </div>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-mono font-bold ${
            isLight ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-emerald-400 bg-emerald-950/50 border border-emerald-500/30'
          }`}>
            Live Profit tracking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#080808] border-white/5'
          }`}>
            <p className={`text-[10px] uppercase font-extrabold tracking-wider ${isLight ? 'text-stone-700' : 'text-white/40'}`}>Gross Sales Revenue</p>
            <p className={`text-lg font-extrabold font-mono ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{reportNetSales.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> 100% Inflow
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#080808] border-white/5'
          }`}>
            <p className={`text-[10px] uppercase font-extrabold tracking-wider ${isLight ? 'text-stone-700' : 'text-white/40'}`}>Cumulative Expenses</p>
            <div className="space-y-2">
              {(cumulativeExpensesVal || []).map((exp, index) => (
                <div key={exp.id} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={exp.label}
                    onChange={(e) => {
                      const newExpenses = [...cumulativeExpensesVal];
                      newExpenses[index] = { ...newExpenses[index], label: e.target.value };
                      setCumulativeExpensesVal(newExpenses);
                    }}
                    className={`w-full bg-transparent border-b ${isLight ? 'border-stone-300 text-stone-900 focus:border-rose-500' : 'border-white/20 text-white focus:border-rose-400'} outline-none font-bold font-mono text-xs`}
                  />
                  <input
                    type="number"
                    min={0}
                    value={exp.amount}
                    onChange={(e) => {
                      const newExpenses = [...cumulativeExpensesVal];
                      newExpenses[index] = { ...newExpenses[index], amount: Number(e.target.value) };
                      setCumulativeExpensesVal(newExpenses);
                    }}
                    className={`w-16 bg-transparent border-b ${isLight ? 'border-stone-300 text-rose-700 focus:border-rose-500' : 'border-white/20 text-rose-400 focus:border-rose-400'} outline-none font-extrabold font-mono text-sm`}
                  />
                  <button onClick={() => {
                      const newExpenses = cumulativeExpensesVal.filter((_, i) => i !== index);
                      setCumulativeExpensesVal(newExpenses);
                  }} className="text-rose-500 text-xs">x</button>
                </div>
              ))}
              <button onClick={() => {
                const newExpenses = [...cumulativeExpensesVal, { id: Date.now().toString(), label: 'Expense', amount: 0 }];
                setCumulativeExpensesVal(newExpenses);
              }} className="text-[10px] font-bold text-emerald-600">+ Add Expense</button>
            </div>
            
            {JSON.stringify(cumulativeExpensesVal) !== JSON.stringify(settings?.cumulativeExpenses || []) && (
              <button
                disabled={expenseSaving}
                onClick={async () => {
                  if (!updateSettings || !settings) return;
                  setExpenseSaving(true);
                  try {
                    await updateSettings({ ...settings, cumulativeExpenses: cumulativeExpensesVal });
                    setExpenseSuccessMsg('Saved');
                    setTimeout(() => setExpenseSuccessMsg(null), 2000);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setExpenseSaving(false);
                  }
                }}
                className={`w-full py-1 rounded text-[10px] font-bold ${
                  expenseSaving 
                    ? 'opacity-50 cursor-not-allowed bg-stone-300 text-stone-600'
                    : expenseSuccessMsg
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                } transition-all`}
              >
                {expenseSaving ? 'Saving...' : expenseSuccessMsg || 'Update Expenses'}
              </button>
            )}
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#080808] border-white/5'
          }`}>
            <p className={`text-[10px] uppercase font-extrabold tracking-wider ${isLight ? 'text-stone-700' : 'text-white/40'}`}>Net Profit</p>
            <p className={`text-lg font-extrabold font-mono ${financialAnalysis.netProfit >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>₱{financialAnalysis.netProfit.toLocaleString()}</p>
            <p className={`text-[10px] ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Gross Sales - Total Expenses</p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-stone-50 border-stone-300' : 'bg-[#080808] border-white/5'
          }`}>
            <p className={`text-[10px] uppercase font-extrabold tracking-wider ${isLight ? 'text-stone-700' : 'text-white/40'}`}>Avg Profit / Invoice</p>
            <p className={`text-lg font-extrabold font-mono ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{financialAnalysis.avgProfitPerOrder}</p>
            <p className={`text-[10px] ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Net profit per customer visit</p>
          </div>
        </div>
      </div>

      {/* 4. ANIMATED GRAPHS: REVENUE & ORDER VOLUME TREND */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        isLight ? 'bg-white border-stone-200 shadow-md' : 'bg-[#121212] border-white/10 shadow-xl'
      } space-y-4`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className={`font-serif font-extrabold text-base tracking-wide flex items-center gap-2 ${
              isLight ? 'text-stone-900' : 'text-white'
            }`}>
              <TrendingUp className="w-4 h-4 text-[#c5a059]" />
              Revenue & Order Volume Performance Trend
            </h3>
            <p className={`text-xs ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>
              {reportRange === 'today' || reportRange === 'yesterday'
                ? 'Hourly timeline comparison throughout operating day'
                : 'Timeline trend of daily gross receipts and transaction volume'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#c5a059]" />
              <span className={`font-bold ${isLight ? 'text-stone-800' : 'text-white/70'}`}>Revenue (₱)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={`font-bold ${isLight ? 'text-stone-800' : 'text-white/70'}`}>Order Count</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          {revenueTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a059" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c5a059" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#00000015' : '#ffffff10'} vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke={isLight ? '#44403c' : '#ffffff40'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: isLight ? '#d6d3d1' : '#ffffff15' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke={isLight ? '#8c6b27' : '#c5a059'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `₱${v}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={isLight ? '#1d4ed8' : '#60a5fa'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                    borderColor: isLight ? '#d6d3d1' : '#ffffff20', 
                    borderRadius: '12px',
                    color: isLight ? '#1c1917' : '#ffffff',
                    fontSize: '12px',
                    boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.12)' : 'none'
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'revenue' ? `₱${val}` : `${val} orders`,
                    name === 'revenue' ? 'Sales Revenue' : 'Orders Placed'
                  ]}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#c5a059" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#revGrad)" 
                  animationDuration={1200}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="orders" 
                  fill="#3b82f6" 
                  opacity={0.7}
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center text-xs italic ${isLight ? 'text-stone-500 font-medium' : 'text-white/30'}`}>
              No transaction history recorded in the selected period.
            </div>
          )}
        </div>
      </div>

      {/* 5. TOP 10 SELLING ITEMS & PEAK HOURS ANALYSIS (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TOP 10 SELLING ITEMS GRAPH */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-stone-200 shadow-md' : 'bg-[#121212] border-white/10 shadow-xl'
        } space-y-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`font-serif font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2 ${
                isLight ? 'text-stone-900' : 'text-white'
              }`}>
                <Award className="w-4 h-4 text-[#c5a059]" />
                Top 10 Selling Products
              </h3>
              <p className={`text-xs ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Ranked by volume sold with total revenue</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isLight ? 'text-[#8c6b27] bg-[#c5a059]/15 border-[#c5a059]/30' : 'text-[#c5a059] bg-[#c5a059]/10 border-[#c5a059]/20'
            }`}>
              Rank #1 - #10
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {top10SellingItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10SellingItems}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#00000015' : '#ffffff10'} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke={isLight ? '#44403c' : '#ffffff40'} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: isLight ? '#d6d3d1' : '#ffffff15' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke={isLight ? '#1c1917' : '#ffffff80'} 
                    fontSize={11} 
                    fontWeight={isLight ? 600 : 400}
                    tickLine={false} 
                    axisLine={false}
                    width={110}
                    tickFormatter={(val) => val.length > 15 ? `${val.slice(0, 15)}…` : val}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                      borderColor: isLight ? '#d6d3d1' : '#ffffff20', 
                      borderRadius: '12px',
                      color: isLight ? '#1c1917' : '#ffffff',
                      fontSize: '12px',
                      boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.12)' : 'none'
                    }}
                    formatter={(val: any, name: any, props: any) => [
                      `${val} units (₱${props.payload.revenue.toLocaleString()})`,
                      'Sold Quantity'
                    ]}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="#c5a059" 
                    radius={[0, 6, 6, 0]}
                    animationDuration={1200}
                  >
                    {top10SellingItems.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isLight 
                          ? (index === 0 ? '#b08c47' : index < 3 ? '#a37f37' : '#8c6e30')
                          : (index === 0 ? '#dfba73' : index < 3 ? '#c5a059' : '#8c6e30')
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center text-xs italic ${isLight ? 'text-stone-500 font-medium' : 'text-white/30'}`}>
                No items sold yet in this range.
              </div>
            )}
          </div>
        </div>

        {/* PEAK HOURS OPERATIONAL DISTRIBUTION */}
        <div className={`p-5 rounded-2xl border transition-colors shadow-md flex flex-col justify-between ${
          isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10 shadow-xl'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-serif font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2 ${
                  isLight ? 'text-stone-900' : 'text-white'
                }`}>
                  <Clock className="w-4 h-4 text-[#c5a059]" />
                  Peak Traffic & Rush Hours Analysis
                </h3>
                <p className={`text-xs ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Hourly order volume flow across operating day</p>
              </div>
              {hourlyPeakAnalysis.peakHour && (
                <div className={`px-2.5 py-1 rounded-xl text-right ${
                  isLight ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                }`}>
                  <p className={`text-[9px] uppercase font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-400/80'}`}>Peak Busiest Hour</p>
                  <p className="font-mono font-bold text-xs">
                    {hourlyPeakAnalysis.peakHour.hourLabel} ({hourlyPeakAnalysis.peakHour.orders} orders)
                  </p>
                </div>
              )}
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlyPeakAnalysis.hours}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#00000015' : '#ffffff10'} vertical={false} />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke={isLight ? '#44403c' : '#ffffff40'} 
                    fontSize={10} 
                    tickLine={false} 
                    interval={1}
                    axisLine={{ stroke: isLight ? '#d6d3d1' : '#ffffff15' }}
                  />
                  <YAxis 
                    stroke={isLight ? '#44403c' : '#ffffff40'} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                      borderColor: isLight ? '#d6d3d1' : '#ffffff20', 
                      borderRadius: '12px',
                      color: isLight ? '#1c1917' : '#ffffff',
                      fontSize: '12px',
                      boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.12)' : 'none'
                    }}
                    formatter={(val: any, name: any, props: any) => [
                      `${val} orders (₱${props.payload.revenue.toLocaleString()})`,
                      'Traffic Count'
                    ]}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#c5a059" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  >
                    {hourlyPeakAnalysis.hours.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={hourlyPeakAnalysis.peakHour && entry.hour === hourlyPeakAnalysis.peakHour.hour ? '#10b981' : '#c5a059'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 6. ORDER TYPE & ORDERING CHANNEL PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ORDER TYPE (DINE-IN VS. TAKEAWAY) */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-stone-200 shadow-md' : 'bg-[#121212] border-white/10 shadow-xl'
        } space-y-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`font-serif font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2 ${
                isLight ? 'text-stone-900' : 'text-white'
              }`}>
                <Utensils className="w-4 h-4 text-[#c5a059]" />
                Order Type Distribution
              </h3>
              <p className={`text-xs ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>Dine-in vs. Takeaway / Pickup vs. Table Service</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                      borderColor: isLight ? '#d6d3d1' : '#ffffff20', 
                      borderRadius: '12px',
                      color: isLight ? '#1c1917' : '#ffffff',
                      fontSize: '12px',
                      boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.12)' : 'none'
                    }}
                    formatter={(val: any, name: any, props: any) => [`${val} orders (${props.payload.percent}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              {orderTypeData.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center p-2 rounded-lg border ${
                  isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/5'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>{item.value}</span>
                    <span className={`text-[10px] ml-1 font-semibold ${isLight ? 'text-stone-600' : 'text-white/40'}`}>({item.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ORDERING CHANNEL (POS COUNTER VS. CUSTOMER APP) */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-stone-200 shadow-md' : 'bg-[#121212] border-white/10 shadow-xl'
        } space-y-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`font-serif font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2 ${
                isLight ? 'text-stone-900' : 'text-white'
              }`}>
                <Store className="w-4 h-4 text-[#c5a059]" />
                Ordering Channel Breakdown
              </h3>
              <p className={`text-xs ${isLight ? 'text-stone-600 font-medium' : 'text-white/40'}`}>In-Store Staff POS Register vs. Customer Web App</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderChannelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    animationDuration={1000}
                  >
                    {orderChannelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#ffffff' : '#0a0a0a', 
                      borderColor: isLight ? '#d6d3d1' : '#ffffff20', 
                      borderRadius: '12px',
                      color: isLight ? '#1c1917' : '#ffffff',
                      fontSize: '12px',
                      boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.12)' : 'none'
                    }}
                    formatter={(val: any, name: any, props: any) => [
                      `${val} orders • ₱${props.payload.revenue.toLocaleString()} (${props.payload.percent}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              {orderChannelData.map((channel, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border space-y-1 ${
                  isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/5'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {channel.name.includes('POS') ? (
                        <Store className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                      )}
                      <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>{channel.name}</span>
                    </div>
                    <span className={`font-bold font-mono ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>{channel.percent}%</span>
                  </div>
                  <div className={`flex justify-between text-[11px] pl-5.5 ${isLight ? 'text-stone-700 font-medium' : 'text-white/50'}`}>
                    <span>{channel.count} Orders</span>
                    <span className={`font-mono font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{channel.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. DETAILED SALES INVOICES AUDIT FEED */}
      <div className={`rounded-2xl border shadow-md overflow-hidden flex flex-col h-[420px] transition-colors ${
        isLight ? 'bg-white border-stone-200' : 'bg-[#121212] border-white/10 shadow-xl'
      }`}>
        {/* CARD HEADER */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-stone-100 border-stone-200' : 'bg-[#0a0a0a] border-white/10'
        }`}>
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>Granular Transaction Audit Feed</h3>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
              isLight ? 'text-stone-800 bg-stone-200 border border-stone-300' : 'text-white/40 bg-white/5'
            }`}>
              {filteredReportOrders.length} {filteredReportOrders.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <div className={`text-xs font-medium ${isLight ? 'text-stone-800' : 'text-white/70'}`}>
            Feed Net Total: <span className={`font-extrabold font-mono ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>₱{reportNetSales.toLocaleString()}</span>
          </div>
        </div>

        {/* SCROLLABLE CARD BODY */}
        <div className={`flex-1 overflow-y-auto min-h-0 divide-y scrollbar-thin ${
          isLight 
            ? 'divide-stone-200 scrollbar-thumb-stone-300 scrollbar-track-transparent' 
            : 'divide-white/5 scrollbar-thumb-white/10 scrollbar-track-transparent'
        }`}>
          {filteredReportOrders.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center p-8 text-center space-y-1 ${
              isLight ? 'text-stone-600 font-medium' : 'text-white/40'
            }`}>
              <ShoppingBag className="w-8 h-8 opacity-20 mb-1" />
              <p className="text-xs font-semibold">No sales records in this timeframe</p>
              <p className={`text-[10px] ${isLight ? 'text-stone-500' : 'text-white/30'}`}>Adjust the date range or select a broader preset above.</p>
            </div>
          ) : (
            <>
              {/* MOBILE SCROLLABLE CARDS */}
              <div className="lg:hidden p-3 space-y-2.5">
                {filteredReportOrders.map(o => (
                  <div key={o.id} className={`p-3 rounded-lg border space-y-2 relative overflow-hidden group ${
                    isLight ? 'bg-stone-50 border-stone-200' : 'bg-[#080808] border-white/5'
                  }`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#c5a059]/40"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>#{o.orderNumber.slice(-8)}</span>
                          <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.2 rounded ${
                            o.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-blue-950/70 text-blue-300' 
                              : isLight ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-purple-950/70 text-purple-300'
                          }`}>
                            {o.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </div>
                        <p className={`text-[9px] font-medium ${isLight ? 'text-stone-600' : 'text-white/40'}`}>
                          {new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>₱{o.total}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                          o.orderStatus === 'completed' 
                            ? isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20' 
                            : isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950/50 text-amber-400 border-amber-500/20'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`py-1.5 border-t pl-1 ${isLight ? 'border-stone-200' : 'border-white/5'}`}>
                      <div className="space-y-1">
                        {o.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[10.5px]">
                            <span className={isLight ? 'text-stone-900 font-medium' : 'text-white/80'}>
                              {item.quantity}x {item.name} <span className={isLight ? 'text-stone-600 text-[9.5px]' : 'text-white/40 text-[9.5px]'}>({item.selectedSize})</span>
                            </span>
                            <span className={`text-[10px] font-bold ${isLight ? 'text-stone-800' : 'text-white/40'}`}>₱{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`flex justify-between items-center pt-1 border-t text-[9.5px] pl-1 ${
                      isLight ? 'border-stone-200 text-stone-700 font-medium' : 'border-white/5 text-white/50'
                    }`}>
                      <span>Customer: <strong className={isLight ? 'text-stone-900' : 'text-white/80'}>{o.customerName}</strong></span>
                      {o.cashierName && <span>Cashier: {o.cashierName}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP STICKY-HEADER TABLE VIEW */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className={`sticky top-0 z-10 border-b shadow-xs ${
                    isLight ? 'bg-stone-100 border-stone-200' : 'bg-[#080808] border-white/10'
                  }`}>
                    <tr className={`uppercase tracking-wider font-extrabold text-[10px] ${
                      isLight ? 'text-stone-700' : 'text-white/50'
                    }`}>
                      <th className="p-3">Invoice Code</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Origin</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 w-2/5">Items & Add-ons</th>
                      <th className="p-3">Net Paid</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isLight ? 'divide-stone-200 text-stone-800' : 'divide-white/5 text-white/70'
                  }`}>
                    {filteredReportOrders.map(o => (
                      <tr key={o.id} className={`transition-colors ${isLight ? 'hover:bg-stone-100/70' : 'hover:bg-white/5'}`}>
                        <td className={`p-3 font-mono font-bold whitespace-nowrap ${isLight ? 'text-[#8c6b27]' : 'text-[#c5a059]'}`}>#{o.orderNumber.slice(-8)}</td>
                        <td className={`p-3 text-[10px] font-medium whitespace-nowrap ${isLight ? 'text-stone-600' : 'text-white/50'}`}>
                          {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            o.orderSource === 'pos' 
                              ? isLight ? 'bg-blue-50 text-blue-900 border-blue-300' : 'bg-blue-950/70 text-blue-300 border-blue-800/40' 
                              : isLight ? 'bg-purple-50 text-purple-900 border-purple-300' : 'bg-purple-950/70 text-purple-300 border-purple-800/40'
                          }`}>
                            {o.orderSource === 'pos' ? <Store className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                            {o.orderSource === 'pos' ? 'POS' : 'APP'}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className={`font-bold flex items-center gap-1 ${isLight ? 'text-stone-900' : 'text-white'}`}>
                            <User className={`w-3 h-3 ${isLight ? 'text-stone-500' : 'text-white/40'}`} /> {o.customerName}
                          </p>
                          {o.cashierName && (
                            <p className={`text-[9px] font-medium ${isLight ? 'text-stone-600' : 'text-white/40'}`}>Cashier: {o.cashierName}</p>
                          )}
                        </td>
                        <td className="p-3 text-[9.5px]">
                          <div className="space-y-0.5 max-h-16 overflow-y-auto scrollbar-none">
                            {o.items?.map((it, i) => (
                              <div key={i} className="flex flex-col">
                                <span className={`font-bold ${isLight ? 'text-stone-900' : 'text-white/80'}`}>
                                  {it.quantity}x {it.name} <span className={`font-normal ${isLight ? 'text-stone-600' : 'text-white/40'}`}>({it.selectedSize})</span>
                                </span>
                                {it.selectedAddOns && it.selectedAddOns.length > 0 && (
                                  <span className={`italic text-[8.5px] font-medium ${isLight ? 'text-stone-600' : 'text-white/40'}`}>+ {it.selectedAddOns.join(', ')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className={`p-3 font-extrabold whitespace-nowrap ${isLight ? 'text-stone-900' : 'text-white'}`}>₱{o.total}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            o.orderStatus === 'completed' 
                              ? isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950/50 text-emerald-400 border-emerald-900/20' 
                              : isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950/50 text-amber-400 border-amber-900/20'
                          }`}>
                            {o.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
