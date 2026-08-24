import React, { useState } from 'react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { UserRole } from '../types';
import { 
  Coffee, 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  ChevronRight,
  Gift,
  Star,
  Layers,
  ShoppingBag,
  User,
  Lock,
  Smartphone,
  AlertCircle
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { 
    settings, 
    categories, 
    products, 
    currentUser, 
    login, 
    register, 
    logout,
    simulateRole 
  } = useCoffeeApp();

  const [activeSection, setActiveSection] = useState<'home' | 'menu' | 'loyalty' | 'auth'>('home');
  
  // Auth Form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Loyalty Calculator states
  const [spendAmount, setSpendAmount] = useState<number>(500);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(false);

    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        setSuccessMsg('Successfully signed in!');
        setTimeout(() => {
          onEnterApp();
        }, 800);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!phone.trim()) throw new Error('Please enter your contact phone number.');

        await register(email, password, name, phone, 'customer');
        setSuccessMsg('Account created successfully! Welcome to the club.');
        setTimeout(() => {
          onEnterApp();
        }, 800);
      }
    } catch (err: any) {
      let friendly = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendly = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendly = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        friendly = 'Your password is too weak. Please use at least 6 characters.';
      }
      setError(friendly || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSimulation = async (role: UserRole) => {
    await simulateRole(role);
    onEnterApp();
  };

  // Safe variables based on Firestore settings
  const shopName = settings?.branding?.shopName || 'Brew & Bloom';
  const shopDesc = settings?.branding?.description || 'Premium Artisanal Coffee & Baked Delights';
  const address = settings?.businessInfo?.address || '742 Evergreen Terrace, Coffee District';
  const contact = settings?.businessInfo?.contactNumber || '+63 917 123 4567';
  const bizHours = settings?.businessInfo?.businessHours || '7:00 AM - 10:00 PM';
  const emailContact = settings?.businessInfo?.email || 'contact@brewandbloom.com';

  // Loyalty calculation
  const pointsPerAmount = settings?.loyaltySettings?.pointsPerAmountSpent || 1;
  const amountRequired = settings?.loyaltySettings?.amountRequired || 100;
  const calculatedPoints = Math.floor((spendAmount / amountRequired) * pointsPerAmount);

  // Active products preview
  const featuredProducts = products.filter(p => p.available).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#070504] text-stone-200 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#070504]/90 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSection('home')}>
            {settings?.branding?.logoUrl ? (
              <img src={settings.branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.1)]">
                <Coffee className="w-5 h-5 animate-pulse" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-extrabold tracking-wide text-white">{shopName}</h1>
              <p className="text-[9px] text-[#c5a059] tracking-widest uppercase font-semibold">Artisanal Brews</p>
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveSection('home')}
              className={`text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer ${activeSection === 'home' ? 'text-[#c5a059]' : 'text-stone-400 hover:text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveSection('menu')}
              className={`text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer ${activeSection === 'menu' ? 'text-[#c5a059]' : 'text-stone-400 hover:text-white'}`}
            >
              Menu Grid
            </button>
            <button 
              onClick={() => setActiveSection('loyalty')}
              className={`text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer ${activeSection === 'loyalty' ? 'text-[#c5a059]' : 'text-stone-400 hover:text-white'}`}
            >
              Loyalty Club
            </button>
            <button 
              onClick={() => setActiveSection('auth')}
              className={`text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer ${activeSection === 'auth' ? 'text-[#c5a059]' : 'text-stone-400 hover:text-white'}`}
            >
              Portal Login
            </button>
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white leading-none">{currentUser.name}</p>
                  <p className="text-[9px] text-[#c5a059] uppercase tracking-wider mt-0.5">{currentUser.role} Account</p>
                </div>
                <button 
                  onClick={onEnterApp}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <span>Go to App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setActiveSection('auth')}
                className="bg-[#c5a059]/10 hover:bg-[#c5a059]/20 border border-[#c5a059]/30 text-[#c5a059] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

        </div>
      </header>

      {/* VIEW CONDITIONAL RENDERER */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME */}
        {activeSection === 'home' && (
          <div className="space-y-24 pb-20 animate-fade-in">
            
            {/* HERO SECTION */}
            <section className="relative overflow-hidden pt-20 pb-28 border-b border-white/5">
              
              {/* Radial backdrop light */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#c5a059]/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Hero Text */}
                <div className="space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] text-[10px] uppercase tracking-widest font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Experience Artisanal Coffee Excellence</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-extrabold tracking-tight text-white leading-[1.1]">
                    Where Pure <span className="text-[#c5a059]">Artistry</span> Meets Every Single Brew.
                  </h1>

                  <p className="text-sm sm:text-base text-stone-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    {shopDesc}. Handcrafted beverages made from sustainable, single-origin micro-lots, combined with beautiful baked pastries curated daily.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                    <button 
                      onClick={onEnterApp}
                      className="w-full sm:w-auto bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-sm px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#c5a059]/10 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order For Pickup / Dine-In</span>
                    </button>
                    <button 
                      onClick={() => setActiveSection('loyalty')}
                      className="w-full sm:w-auto bg-stone-900 hover:bg-stone-850 border border-white/5 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all cursor-pointer"
                    >
                      Calculate Loyalty Points
                    </button>
                  </div>

                  {/* Trust metrics */}
                  <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                    <div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-[#c5a059]">100%</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">Micro-lot beans</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-[#c5a059]">₱1 = 1pt</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">Loyalty Rewards</p>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-serif font-bold text-[#c5a059]">8s Prep</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">KDS Terminal Sync</p>
                    </div>
                  </div>

                </div>

                {/* Hero Decorative Display Card */}
                <div className="relative flex justify-center">
                  <div className="relative w-full max-w-md bg-stone-900/60 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                    
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-extrabold">Active Status</p>
                        <h3 className="text-lg font-serif font-bold text-white">Espresso Lab Terminal</h3>
                      </div>
                      <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                        Online
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Interactive Workspace links */}
                      <p className="text-xs text-stone-400">
                        Reviewers and operators can slide between simulated point-of-sale workspaces instantly below:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button 
                          onClick={() => handleQuickSimulation('customer')}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-white/5 hover:border-[#c5a059]/30 transition-all text-left cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">Customer App</p>
                            <p className="text-[9px] text-stone-500">Order & loyalty club</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#c5a059]" />
                        </button>

                        <button 
                          onClick={() => handleQuickSimulation('cashier')}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-white/5 hover:border-[#c5a059]/30 transition-all text-left cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">POS Cashier</p>
                            <p className="text-[9px] text-stone-500">Order taking register</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#c5a059]" />
                        </button>

                        <button 
                          onClick={() => handleQuickSimulation('kitchen')}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-white/5 hover:border-[#c5a059]/30 transition-all text-left cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">Kitchen (KDS)</p>
                            <p className="text-[9px] text-stone-500">Order prep monitor</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#c5a059]" />
                        </button>

                        <button 
                          onClick={() => handleQuickSimulation('admin')}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-950 hover:bg-stone-900 border border-white/5 hover:border-[#c5a059]/30 transition-all text-left cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">Admin Hub</p>
                            <p className="text-[9px] text-stone-500">Menu & inventory managers</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#c5a059]" />
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* FEATURED MENU SAMPLER */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-3 mb-12">
                <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-extrabold">Signature Menu Preview</p>
                <h2 className="text-3xl font-serif font-extrabold text-white">Artisanal Masterpieces</h2>
                <p className="text-xs text-stone-400 max-w-md mx-auto">
                  A small preview of our rich espresso formulas and fresh delicacies. Explore our dynamic Menu Grid section for the full experience.
                </p>
              </div>

              {featuredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map(prod => (
                    <div key={prod.id} className="bg-stone-900/40 border border-white/5 hover:border-[#c5a059]/20 rounded-2xl p-4 space-y-4 transition-all">
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-stone-950 relative">
                        {prod.image ? (
                          <img 
                            src={prod.image} 
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-700">
                            <Coffee className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5 bg-stone-950/80 border border-white/10 text-[#c5a059] px-2 py-0.5 rounded text-[10px] font-bold">
                          ₱{prod.price}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">{prod.name}</h4>
                        <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">{prod.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-[#c5a059]/5 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] mx-auto">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">No Products In Catalog</h4>
                    <p className="text-[11px] text-stone-500">
                      The catalog is currently empty. Enter the Admin Hub to add custom categories and products!
                    </p>
                  </div>
                  <button 
                    onClick={() => handleQuickSimulation('admin')}
                    className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    Configure Admin Catalog
                  </button>
                </div>
              )}
            </section>

            {/* VALUE PROPOSITION GRID */}
            <section className="bg-stone-900/30 border-y border-white/5 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-3.5 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#c5a059]/10 text-[#c5a059]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white">Full Terminal Sync</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Our digital systems coordinate instantly. Active orders accepted on the customer terminal or the POS terminal reflect inside the KDS prep monitors instantly.
                  </p>
                </div>
                <div className="space-y-3.5 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#c5a059]/10 text-[#c5a059]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white">Real Loyalty Value</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Create a loyalty profile with your phone and accumulate points transparently on every transaction. Claim espresso vouchers and physical rewards anytime.
                  </p>
                </div>
                <div className="space-y-3.5 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#c5a059]/10 text-[#c5a059]">
                    <Star className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white">Transparent Tracking</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Check active inventory balances, verify minimum reorder levels, inspect comprehensive audit trails, and calculate point margins dynamically on our cloud server.
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: MENU GRID */}
        {activeSection === 'menu' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in">
            <div className="text-center space-y-3">
              <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-extrabold">Interactive Catalog</p>
              <h2 className="text-3xl font-serif font-extrabold text-white">Explore Our Dynamic Menu</h2>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Explore available premium espresso variations, custom syrups, and flaky fresh pastries loaded directly from our live Firestore server.
              </p>
            </div>

            {categories.length > 0 ? (
              <div className="space-y-16">
                {categories.filter(c => c.active).map(cat => {
                  const catProducts = products.filter(p => p.category === cat.id && p.available);
                  return (
                    <div key={cat.id} className="space-y-6">
                      <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-serif font-bold text-white">{cat.name}</h3>
                          <p className="text-xs text-stone-400 mt-0.5">{cat.description}</p>
                        </div>
                        <span className="text-[10px] text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                          {catProducts.length} Items
                        </span>
                      </div>

                      {catProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {catProducts.map(p => (
                            <div key={p.id} className="bg-stone-900/30 border border-white/5 rounded-2xl p-4 flex gap-4 items-start">
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-950 flex-shrink-0">
                                {p.image ? (
                                  <img 
                                    src={p.image} 
                                    alt={p.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-700">
                                    <Coffee className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                                  <span className="text-xs font-serif font-extrabold text-[#c5a059]">₱{p.price}</span>
                                </div>
                                <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">{p.description}</p>
                                {p.stockTracking && (
                                  <p className="text-[9px] text-stone-500 font-semibold mt-1">
                                    Stock level: {p.stockQuantity} available
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic">No available active items inside this category.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#c5a059]/5 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] mx-auto">
                  <Coffee className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Menu is Empty</h4>
                  <p className="text-[11px] text-stone-500">
                    Our database contains no categories or products. Enter the **Admin Hub** workspace simulation to define your personalized coffee brand items!
                  </p>
                </div>
                <button 
                  onClick={() => handleQuickSimulation('admin')}
                  className="bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Configure Admin Catalog
                </button>
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: LOYALTY CLUB */}
        {activeSection === 'loyalty' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-fade-in">
            <div className="text-center space-y-3">
              <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-extrabold">Club Rewards</p>
              <h2 className="text-3xl font-serif font-extrabold text-white">Join the Loyalty Lounge</h2>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Every purchase made directly funds your next free espresso or store discount coupon. See how our point accumulation scales.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Interactive Point Calculator */}
              <div className="bg-stone-900/40 border border-white/10 rounded-2xl p-6 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#c5a059]/5 rounded-full blur-2xl pointer-events-none" />
                
                <h3 className="text-lg font-serif font-bold text-white">Loyalty Points Estimator</h3>
                <p className="text-xs text-stone-400">
                  Drag the slider below to simulate your planned shop orders and calculate the points you will immediately earn on your profile.
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-extrabold">Planned Transaction</span>
                    <span className="text-lg font-serif font-extrabold text-[#c5a059]">₱{spendAmount}</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="50"
                    value={spendAmount} 
                    onChange={(e) => setSpendAmount(Number(e.target.value))}
                    className="w-full accent-[#c5a059] bg-stone-950 rounded-lg cursor-pointer h-1.5 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="bg-stone-950 p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest font-semibold">Points Earned</p>
                      <p className="text-2xl font-serif font-extrabold text-white mt-1">{calculatedPoints} pts</p>
                    </div>
                    <div className="bg-stone-950 p-3 rounded-xl border border-white/5 text-center">
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest font-semibold">Redemption Rate</p>
                      <p className="text-2xl font-serif font-extrabold text-white mt-1">100%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#c5a059]/5 border border-[#c5a059]/10 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-[#c5a059] leading-relaxed">
                    Earned points can be accumulated safely and exchanged directly for free premium beverages or up to 20% off whole store purchases.
                  </p>
                </div>
              </div>

              {/* Benefit breakdown */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] flex-shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Free Premium Upgrades</h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Exchange points for complimentary extra espresso shots, gourmet caramel syrup drizzles, or a choice of non-dairy soy milk.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] flex-shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Early Access & Drops</h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Members receive instant notification flags regarding holiday blend releases and limited flaky pastry drops curated in our kitchen.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] flex-shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Digital Pass Syncing</h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Simply register an account, log in at the POS terminal using your email, and let the barista scan your active loyalty balance instantly.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* VIEW 4: AUTH (LOG IN / SIGN UP) */}
        {activeSection === 'auth' && (
          <section className="max-w-md mx-auto px-4 py-16 animate-fade-in">
            <div className="bg-[#121110] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#c5a059]" />

              <div className="text-center space-y-1.5">
                <h2 className="text-2xl font-serif font-bold text-white">
                  {isLogin ? 'Welcome Back' : 'Create Register'}
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {isLogin 
                    ? 'Access your personalized loyalty pass or operate standard terminal workspaces' 
                    : 'Join the loyalty club or configure terminal access keys'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                
                {/* Errors */}
                {error && (
                  <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success messages */}
                {successMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c5a059]" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* SIGN UP SPECIAL FIELDS */}
                {!isLogin && (
                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-stone-500 tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                        <input
                          type="text"
                          required
                          placeholder="Shasz Nair"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-900 border border-white/5 outline-none focus:border-[#c5a059] focus:bg-stone-950 text-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-stone-500 tracking-wider">Contact Phone</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                        <input
                          type="tel"
                          required
                          placeholder="+63 917 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-900 border border-white/5 outline-none focus:border-[#c5a059] focus:bg-stone-950 text-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-500 tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-900 border border-white/5 outline-none focus:border-[#c5a059] focus:bg-stone-950 text-white transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-500 tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-900 border border-white/5 outline-none focus:border-[#c5a059] focus:bg-stone-950 text-white transition-all"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black font-extrabold text-xs py-3 rounded-xl flex justify-center items-center gap-2 transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In to Portal' : 'Register Loyalty Profile'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

              </form>

              {/* Mode Toggle */}
              <div className="text-center pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-[#c5a059] hover:underline font-semibold cursor-pointer"
                >
                  {isLogin ? "Don't have an account? Sign Up Here" : "Already have an account? Sign In"}
                </button>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-stone-950 border-t border-white/5 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <h4 className="text-sm font-serif font-bold text-white tracking-wide">{shopName}</h4>
            <p className="text-xs text-stone-500 leading-relaxed max-w-xs">{shopDesc}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Coffee Lab Hours</h4>
            <div className="space-y-1.5 text-xs text-stone-500">
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Open Daily: {bizHours}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{address}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Customer Support</h4>
            <div className="space-y-1.5 text-xs text-stone-500">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{contact}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>{emailContact}</span>
              </p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 mt-8 pt-6 text-center">
          <p className="text-[10px] text-stone-600 font-medium">
            &copy; {new Date().getFullYear()} {shopName}. All Rights Reserved. Built with Cloud Firestore, Next-Gen KDS terminals & Real-Time Syncing.
          </p>
        </div>
      </footer>

    </div>
  );
};
