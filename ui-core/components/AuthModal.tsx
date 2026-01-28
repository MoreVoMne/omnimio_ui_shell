
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
}

const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M21.35 11.1H12V15.13H17.69C17.45 16.39 16.71 17.47 15.62 18.19L15.6 18.26L18.48 20.49L18.68 20.51C20.48 18.85 21.52 16.4 21.52 13.57C21.52 12.72 21.46 11.89 21.35 11.1Z" />
    <path d="M12 23C14.68 23 16.93 22.12 18.68 20.51L15.62 18.19C14.74 18.79 13.57 19.2 12 19.2C9.39 19.2 7.19 17.45 6.4 15.09L6.31 15.1L3.32 17.41L3.29 17.48C5.04 20.97 8.63 23 12 23Z" />
    <path d="M6.4 15.09C6.2 14.49 6.09 13.86 6.09 13.2C6.09 12.54 6.2 11.91 6.4 11.31L6.39 11.22L3.4 8.91L3.33 8.95C2.59 10.43 2.21 12.02 2.21 13.2C2.21 14.38 2.59 15.97 3.33 17.45L6.4 15.09Z" />
    <path d="M12 7.2C13.45 7.2 14.77 7.7 15.8 8.68L18.75 5.73C16.93 4.03 14.68 3.2 12 3.2C8.63 3.2 5.04 5.23 3.29 8.72L6.39 11.08C7.19 8.75 9.39 7.2 12 7.2Z" />
  </svg>
);

const AppleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M17.29 12.73C17.26 11.39 18.38 10.47 18.43 10.44C17.61 9.25 16.34 9.1 15.88 9.08C14.76 8.97 13.66 9.73 13.11 9.73C12.56 9.73 11.63 9.09 10.73 9.1C9.56 9.12 8.48 9.78 7.88 10.82C6.65 12.95 7.57 16.1 8.76 17.82C9.34 18.66 10.04 19.59 10.97 19.55C11.87 19.51 12.21 18.97 13.31 18.97C14.4 18.97 14.72 19.55 15.66 19.54C16.63 19.52 17.25 18.66 17.82 17.83C18.48 16.87 18.76 15.93 18.77 15.88C18.76 15.87 17.32 15.32 17.29 12.73ZM14.86 6.97C15.34 6.39 15.66 5.58 15.57 4.77C14.87 4.8 14.02 5.24 13.51 5.84C13.06 6.36 12.66 7.19 12.76 7.98C13.54 8.04 14.36 7.56 14.86 6.97Z" />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login logic - in a real app this would validate credentials
    const finalName = name || email.split('@')[0] || 'Member';
    onLogin(finalName);
  };

  const handleSocialLogin = (provider: string) => {
    // Mock social login
    onLogin(`${provider} User`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-cream w-full max-w-md rounded-[32px] border border-charcoal overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-charcoal/40 hover:text-accent transition-colors">
              <X size={20} />
            </button>

            <div className="p-8 md:p-10">
              <h2 className="font-serif text-3xl italic mb-2 text-charcoal">
                {isLogin ? 'Welcome Back' : 'Join the Atelier'}
              </h2>
              <p className="text-[11px] uppercase tracking-widest text-charcoal/40 mb-6">
                {isLogin ? 'Access your saved configurations' : 'Create your digital identity'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                   <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-charcoal/60">Name</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b border-charcoal/20 py-2 text-lg font-serif focus:outline-none focus:border-accent transition-colors placeholder:text-charcoal/20 text-charcoal"
                        placeholder="Your Name"
                        autoFocus={!isLogin}
                      />
                   </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-charcoal/60">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-charcoal/20 py-2 text-lg font-serif focus:outline-none focus:border-accent transition-colors placeholder:text-charcoal/20 text-charcoal"
                    placeholder="studio@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-charcoal/60">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-charcoal/20 py-2 text-lg font-serif focus:outline-none focus:border-accent transition-colors placeholder:text-charcoal/20 text-charcoal"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-charcoal text-cream py-4 rounded-full mt-4 flex items-center justify-center gap-2 hover:bg-accent transition-colors group shadow-lg"
                >
                  <span className="text-xs uppercase tracking-widest font-bold">{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Social Divider */}
              <div className="relative flex items-center py-6">
                  <div className="flex-grow border-t border-charcoal/10"></div>
                  <span className="flex-shrink-0 mx-4 text-[9px] uppercase tracking-widest text-charcoal/40 font-bold">Or continue with</span>
                  <div className="flex-grow border-t border-charcoal/10"></div>
              </div>

              {/* Social Buttons */}
              <div className="flex gap-3 mb-2">
                  <button 
                    onClick={() => handleSocialLogin('Google')}
                    className="flex-1 py-3 border border-charcoal/20 rounded-xl hover:border-charcoal hover:bg-charcoal/5 transition-all duration-300 flex items-center justify-center gap-2 text-charcoal group"
                  >
                      <div className="text-charcoal/60 group-hover:text-charcoal transition-colors">
                        <GoogleIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold">Google</span>
                  </button>
                  <button 
                    onClick={() => handleSocialLogin('Apple')}
                    className="flex-1 py-3 border border-charcoal/20 rounded-xl hover:border-charcoal hover:bg-charcoal/5 transition-all duration-300 flex items-center justify-center gap-2 text-charcoal group"
                  >
                      <div className="text-charcoal/60 group-hover:text-charcoal transition-colors">
                         {/* Visually balanced size for Apple icon vs Google G */}
                         <AppleIcon className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold">Apple</span>
                  </button>
              </div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[10px] uppercase tracking-widest text-charcoal/40 hover:text-charcoal border-b border-transparent hover:border-charcoal transition-all pb-0.5"
                >
                  {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
