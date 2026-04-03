import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Moon, Chrome, Apple } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: (email: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would validate and call an API
    onLogin(email || 'starlight@home.com');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-surface">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          alt="Nocturnal background" 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAww1TK88dVmbnZ9XP_sl-6FbJNjPmUaNcOPBB4-WIcTzoKTK-nPw3qivfUrtwGvyposFHq9KMrqr5MG4mXueMoPZhebGhOpnrdoryalq2r07GUaZpso5by70oafsneLgsv4veEvPKLLGtkmPl_NpXV8Acnc4CvYsgzgaMIBDQwMgLXYZ-0dA3cGEv3_-0aIc2HetqJXpHYiLNm8NiJY0lqCTt2MCMwjzHLGa_IVQcxe-u0Y7G8L_WKXjbYx_-fuFg0iubPJvjXPaI" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Floating Glow Blobs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 blur-[100px] rounded-full pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-md px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div 
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass-panel rounded-xl p-8 md:p-10 shadow-2xl flex flex-col gap-8 border border-white/10"
          >
            {/* Header Section */}
            <header className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Moon className="text-4xl text-primary animate-float" size={40} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                {isLogin ? 'VioNest' : 'Join VioNest'}
              </h1>
              <p className="text-on-surface-variant font-body text-sm">
                {isLogin ? 'Expenses & chores, beautifully managed.' : 'Create your shared household.'}
              </p>
            </header>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-4">Full Name</label>
                  <div className="relative group">
                    <input 
                      className="w-full bg-surface-container-lowest text-on-surface rounded-full py-4 px-6 border-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline/50" 
                      placeholder="Your Name" 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-4">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-primary" size={20} />
                  <input 
                    className="w-full bg-surface-container-lowest text-on-surface rounded-full py-4 pl-14 pr-6 border-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline/50" 
                    placeholder="starlight@home.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-4">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-primary" size={20} />
                  <input 
                    className="w-full bg-surface-container-lowest text-on-surface rounded-full py-4 pl-14 pr-14 border-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-outline/50" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {isLogin && (
                  <div className="flex justify-end pr-2">
                    <a className="text-xs font-medium text-tertiary hover:text-tertiary-dim transition-colors" href="#">Forgot Password?</a>
                  </div>
                )}
              </div>

              <button 
                className="primary-gradient primary-glow w-full py-4 rounded-full text-on-primary-fixed font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all" 
                type="submit"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="relative flex items-center py-2">
              <div className="grow border-t border-outline-variant/30"></div>
              <span className="shrink mx-4 text-xs font-medium text-on-surface-variant uppercase tracking-widest">or continue with</span>
              <div className="grow border-t border-outline-variant/30"></div>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-4">
              <button className="flex-1 glass-panel py-3 rounded-full flex items-center justify-center hover:bg-surface-variant/50 transition-colors border border-white/10">
                <Chrome className="mr-2" size={18} />
                <span className="text-sm font-semibold">Google</span>
              </button>
              <button className="flex-1 glass-panel py-3 rounded-full flex items-center justify-center hover:bg-surface-variant/50 transition-colors border border-white/10">
                <Apple className="mr-2" size={18} />
                <span className="text-sm font-semibold">Apple</span>
              </button>
            </div>

            {/* Footer Link */}
            <footer className="text-center pt-2">
              <p className="text-on-surface-variant text-sm font-body">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-bold hover:underline underline-offset-4 ml-1"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </footer>
          </motion.div>
        </AnimatePresence>

        {/* Decorative Elements */}
        <div className="mt-8 text-center opacity-40 pointer-events-none">
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">VioNest Management</p>
        </div>
      </main>
    </div>
  );
}
