import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Activity, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import hospitalBg from '@/assets/close-up-of-empty-hospital-room-with-bed-2026-03-10-03-10-55-utc.jpeg';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Welcome back!', 'You have been signed in successfully.');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid email or password. Please try again.';
      setError('root', { message: msg });
      toast.error('Sign in failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundImage: `url(${hospitalBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xl">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">MedEquip</span>
            <p className="text-primary-300 text-xs font-medium tracking-widest uppercase">
              Hospital Management
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-slate-300 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-sm text-red-200">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-200">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="admin@hospital.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-primary-400/60 transition-all text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-300 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-200">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-primary-400/60 transition-all text-sm"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-300 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all duration-200 text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Demo accounts
            </p>
            <div className="space-y-2">
              {[
                { role: 'Admin', email: 'admin@hospital.com', password: 'Admin@123456', color: 'text-indigo-300' },
                { role: 'Technician', email: 'farai.chikwanda@hospital.com', password: 'Tech@123456', color: 'text-emerald-300' },
                { role: 'Guest', email: 'guest@hospital.com', password: 'Guest@123456', color: 'text-amber-300' },
              ].map(({ role, email, password, color }) => (
                <div key={role} className="text-xs border-t border-white/10 pt-2 first:border-0 first:pt-0">
                  <span className={`font-semibold ${color}`}>{role}</span>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Email:</span>
                      <code className="text-slate-200 font-mono truncate">{email}</code>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400 shrink-0">Password:</span>
                      <code className="text-slate-200 font-mono">{password}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>Enterprise-grade security · HIPAA compliant</span>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          © {new Date().getFullYear()} MedEquip · Hospital Equipment Management System
        </p>
      </div>
    </div>
  );
}
