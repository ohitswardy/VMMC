import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { MOCK_USERS } from '../lib/mockData';
import Button from '../components/ui/Button';
import type { UserProfile } from '../lib/types';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 800));

    // Demo: match by email from mock users
    const user = MOCK_USERS.find((u: UserProfile) => u.email === email);
    if (user) {
      setUser(user);
      toast.success(`Welcome back, ${user.full_name}!`);
    } else {
      toast.error('Invalid credentials. Try one of the demo accounts.');
    }
    setIsLoading(false);
  };

  const quickLogin = (loginEmail: string) => {
    const user = MOCK_USERS.find((u: UserProfile) => u.email === loginEmail);
    if (user) {
      setUser(user);
      toast.success(`Signed in as ${user.full_name}`);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Main — slightly off-center for asymmetry */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Logo + Branding */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/VMMClogo.png"
              alt="VMMC"
              className="h-24 w-auto object-contain mb-3"
            />
            <span className="text-[15px] font-bold text-gray-900 tracking-tight">VMMC OR</span>
          </div>

          {/* Header — left-aligned */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
              Sign in
            </h1>
            <p className="text-[15px] text-gray-500 mt-1.5">
              Operating Room Scheduling System
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-[12px] border border-gray-200 p-5 md:p-6 shadow-xs">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-gray-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@vmmc.gov.ph"
                    className="input-base !pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-base !pl-10 !pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" loading={isLoading} fullWidth size="lg">
                Sign in
              </Button>
            </form>
          </div>

          {/* Quick login for demo */}
          <div className="mt-8">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_USERS.slice(0, 4).map((u: UserProfile) => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u.email)}
                  className="px-3 py-3 rounded-[10px] bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 text-left transition-all duration-150 touch-target group"
                >
                  <span className="block text-[13px] font-semibold text-gray-800 truncate group-hover:text-accent-600 transition-colors">{u.full_name}</span>
                  <span className="text-[11px] text-gray-400 capitalize">{u.role.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
