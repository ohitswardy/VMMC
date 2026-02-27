import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      toast.error(raw || 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[100dvh] bg-white">
      {/* ─── Left side (scrollable) ─── */}
      <div className="w-full lg:w-[48%] xl:w-[44%] overflow-y-auto">
        <div className="flex flex-col min-h-[100dvh] px-8 sm:px-12 md:px-16 lg:px-20 py-10">
          {/* Top: logo + title */}
          <div className="mb-12">
            <img
              src="/VMMClogo.png"
              alt="VMMC"
              className="h-20 w-20 object-contain mb-6"
            />
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight tracking-tight">
              VMMC OR
              <br />
              Booking System
            </h1>
          </div>

          {/* Center: form */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-[360px]"
          >
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Example@email.com"
                  className="w-full h-11 px-4 rounded-full border border-gray-200 bg-gray-50 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-11 px-4 pr-11 rounded-full border border-gray-200 bg-gray-50 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <button type="button" className="text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot Password?
                </button>
              </div>

              {/* Sign in button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-gray-900 text-white text-[15px] font-semibold
                  hover:bg-gray-800 active:bg-black disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </motion.div>

          {/* Spacer to push copyright + demos to bottom */}
          <div className="flex-1 min-h-12" />

          {/* Copyright */}
          <p className="text-[12px] text-gray-400 mt-8 mb-6">
            © {new Date().getFullYear()} ALL RIGHTS RESERVED
          </p>

          {/* Demo accounts — below copyright */}
          <div className="w-full max-w-[360px] pb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { email: 'admin@vmmc.gov.ph',      label: 'System Admin',    role: 'super_admin' },
                { email: 'anes.admin@vmmc.gov.ph',  label: 'Anes Admin',      role: 'anesthesiology_admin' },
                { email: 'nurse@vmmc.gov.ph',       label: 'OR Nurse',        role: 'nurse' },
                { email: 'gs@vmmc.gov.ph',          label: 'General Surgery', role: 'department_user' },
                { email: 'obgyne@vmmc.gov.ph',      label: 'OB-GYNE',         role: 'department_user' },
                { email: 'ortho@vmmc.gov.ph',       label: 'Orthopedics',     role: 'department_user' },
                { email: 'ophtha@vmmc.gov.ph',      label: 'Ophthalmology',   role: 'department_user' },
                { email: 'ent@vmmc.gov.ph',         label: 'ENT',             role: 'department_user' },
                { email: 'pedia@vmmc.gov.ph',       label: 'Pediatric Surgery', role: 'department_user' },
                { email: 'uro@vmmc.gov.ph',         label: 'Urology',         role: 'department_user' },
                { email: 'tcvs@vmmc.gov.ph',        label: 'TCVS',            role: 'department_user' },
                { email: 'neuro@vmmc.gov.ph',       label: 'Neurosurgery',    role: 'department_user' },
              ].map((u) => (
                <button
                  key={u.email}
                  onClick={() => { setEmail(u.email); setPassword('Vmmc@2026!'); }}
                  className="px-3 py-3 rounded-[10px] bg-white border border-gray-200 hover:border-gray-300 active:bg-gray-50 text-left transition-all duration-150 touch-target group"
                >
                  <span className="block text-[13px] font-semibold text-gray-800 truncate group-hover:text-accent-600 transition-colors">{u.label}</span>
                  <span className="text-[11px] text-gray-400 capitalize">{u.role.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right side: hero image (sticky full-height) ─── */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 sticky top-0 h-[100dvh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="w-full h-full max-h-[calc(100dvh-64px)] rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/40"
        >
          <img
            src="/VMMC.jpg"
            alt="VMMC Building"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>
    </div>
  );
}
