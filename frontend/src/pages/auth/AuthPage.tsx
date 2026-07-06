import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Brain, Eye, EyeOff, ShieldCheck, ImagePlus, MessageSquareText, FileText } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import type { AuthTokens } from '../../types/models';

function LoginForm({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading('Signing in...');

    try {
      const response = await api.post<AuthTokens>('/auth/login', { username, password });

      setAuth(response.data);
      toast.dismiss(loadingToast);
      toast.success(`Welcome back, ${username}`);
      await new Promise((r) => setTimeout(r, 1500));

      if (response.data.must_change_password) {
        toast.warning('You must change your password before continuing.');
        await new Promise((r) => setTimeout(r, 1500));
        navigate('/change-password');
        return;
      }

      navigate('/chat');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="appearance-none block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg placeholder-[#c3c6d7] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] text-sm bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="appearance-none block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg placeholder-[#c3c6d7] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] text-sm bg-white transition-colors pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737686] hover:text-[#434655] transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-[#004ac6] focus:ring-[#004ac6] border-[#e2e8f0] rounded bg-white cursor-pointer"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-[#434655] cursor-pointer">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <a href="#" className="font-medium text-[#004ac6] hover:text-[#003ea8] transition-colors">
            Forgot password?
          </a>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#004ac6] hover:bg-[#003ea8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004ac6] transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}

function RegisterForm({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating account...');

    try {
      const response = await api.post<AuthTokens>('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      setAuth(response.data);
      toast.dismiss(loadingToast);
      toast.success('Account created successfully!');
      await new Promise((r) => setTimeout(r, 1500));
      navigate('/chat');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.detail || 'Failed to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1" htmlFor="reg-username">
          Username
        </label>
        <input
          id="reg-username"
          type="text"
          required
          value={form.username}
          onChange={(e) => setForm((state) => ({ ...state, username: e.target.value }))}
          placeholder="Enter username"
          className="appearance-none block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg placeholder-[#c3c6d7] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] text-sm bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1" htmlFor="reg-email">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((state) => ({ ...state, email: e.target.value }))}
          placeholder="Enter email address"
          className="appearance-none block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg placeholder-[#c3c6d7] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] text-sm bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1" htmlFor="reg-password">
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            onChange={(e) => setForm((state) => ({ ...state, password: e.target.value }))}
            placeholder="••••••••••••"
            className="appearance-none block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg placeholder-[#c3c6d7] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] text-sm bg-white transition-colors pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737686] hover:text-[#434655] transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1" htmlFor="reg-confirm">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="reg-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            value={form.confirmPassword}
            onChange={(e) => setForm((state) => ({ ...state, confirmPassword: e.target.value }))}
            placeholder="••••••••••••"
            className="appearance-none block w-full px-4 py-3 border border-[#e2e8f0] rounded-lg placeholder-[#c3c6d7] text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] text-sm bg-white transition-colors pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#737686] hover:text-[#434655] transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#004ac6] hover:bg-[#003ea8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004ac6] transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}

const features = [
  {
    icon: ImagePlus,
    title: 'Visual Question Answering',
    desc: 'Ask questions about medical images and receive AI-driven answers grounded in clinical context.',
  },
  {
    icon: FileText,
    title: 'Image Captioning',
    desc: 'Automatically generate descriptive captions for radiology scans and pathology slides.',
  },
  {
    icon: MessageSquareText,
    title: 'Conversational Chat',
    desc: 'Multi-turn chat sessions with image memory for differential diagnosis and case review.',
  },
];

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className="min-h-[100dvh] flex font-sans text-[#191c1e]">
      {/* Left Panel — Brand Info (70%) */}
      <div className="hidden lg:flex lg:w-[70%] bg-[#f7f9fb] flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-[-30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#004ac6]/[0.03] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#dbe1ff]/50 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#004ac6]">
              <Brain className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#191c1e]">MedVQA</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.15] mb-5 max-w-[600px]">
            AI-Powered Medical Image Understanding
          </h2>
          <p className="text-[#434655] text-base leading-relaxed max-w-[520px] mb-12">
            Combines Vision Transformer and PubMedBERT to answer clinical questions about medical
            images — from X-rays and CT scans to pathology slides.
          </p>

          <div className="space-y-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-[#004ac6] shrink-0">
                  <feature.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#191c1e]">{feature.title}</h3>
                  <p className="text-xs text-[#434655] mt-0.5 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[#434655] text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>HIPAA-conscious &bull; Encrypted &bull; Medical-grade</span>
        </div>
      </div>

      {/* Right Panel — Form (30%) */}
      <div className="w-full lg:w-[30%] flex flex-col justify-center items-center px-6 py-12 lg:py-0 bg-white border-l border-[#e2e8f0]">
        <div className="w-full max-w-[340px]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-11 w-11 rounded-full bg-[#dbe1ff] flex items-center justify-center mb-3 text-[#004ac6]">
              <Brain className="h-6 w-6" />
            </div>
            <h1 className="text-[#004ac6] font-semibold text-xl tracking-tight">MedVQA</h1>
          </div>

          {/* Form with Motion Transition */}
          <div className="mb-5 text-center">
            <h2 className="text-[#191c1e] text-lg font-semibold">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-[#434655] text-xs mt-1">
              {isLogin
                ? 'Sign in to continue to your account'
                : 'Get started with clinical image chat'}
            </p>
          </div>

          {/* Card Flip Container */}
          <div style={{ perspective: '1000px' }} className="w-full relative min-h-[380px]">
            <motion.div
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isLogin ? 0 : 180 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {/* Front Face — Login */}
              <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0">
                <LoginForm navigate={navigate} />
              </div>

              {/* Back Face — Register (pre-rotated so it reads correctly when flipped) */}
              <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="absolute inset-0">
                <RegisterForm navigate={navigate} />
              </div>
            </motion.div>
          </div>

          {/* Toggle Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-[#434655]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <Link
                to={isLogin ? '/register' : '/login'}
                className="font-medium text-[#004ac6] hover:text-[#003ea8] transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>

          {/* Mobile Security Badge */}
          <div className="lg:hidden mt-8 flex items-center justify-center gap-1.5 text-[#434655] opacity-60">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Secure &amp; HIPAA-conscious</span>
          </div>
        </div>
      </div>
    </div>
  );
}
