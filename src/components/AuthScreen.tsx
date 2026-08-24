import React, { useState } from 'react';
import { useCoffeeApp } from '../contexts/CoffeeAppContext';
import { Coffee, Mail, Lock, User, Phone, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useCoffeeApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'cashier' | 'kitchen' | 'admin'>('customer');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Validation
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }
        if (!phone.trim()) {
          throw new Error('Please enter your contact phone number.');
        }

        await register(email, password, name, phone, selectedRole);
        setSuccessMsg('Account registered successfully! Logging you in...');
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
      setError(friendlyMessage || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Decorative background brass glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent opacity-50" />

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 text-[#c5a059] mb-1">
            <Coffee className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-white/40 max-w-[85%] mx-auto leading-normal">
            {isLogin 
              ? 'Sign in to access your account, place orders, or manage your store' 
              : 'Join the coffee club and earn loyalty rewards with every purchase'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c5a059]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* REGISTER EXTRA FIELDS */}
          {!isLogin && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="E.g. Shasz Nair"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-900 border border-white/5 outline-none focus:border-[#c5a059] focus:bg-stone-950 text-white transition-all"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                  <input
                    type="tel"
                    required
                    placeholder="E.g. +63 917 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs py-2.5 pl-10 pr-4 rounded-xl bg-stone-900 border border-white/5 outline-none focus:border-[#c5a059] focus:bg-stone-950 text-white transition-all"
                  />
                </div>
              </div>

              {/* Account Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'customer', label: 'Customer' },
                    { id: 'cashier', label: 'POS Cashier' },
                    { id: 'kitchen', label: 'Kitchen KDS' },
                    { id: 'admin', label: 'Admin' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id as any)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        selectedRole === r.id
                          ? 'bg-[#c5a059] text-black border-[#c5a059] shadow'
                          : 'bg-stone-900 text-stone-300 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full bg-[#c5a059] hover:bg-[#b08c47] text-black text-xs font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md mt-6 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Register' : 'Register Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Auth Mode Toggle */}
        <div className="text-center border-t border-white/5 pt-4">
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
    </div>
  );
};
export default AuthScreen;
