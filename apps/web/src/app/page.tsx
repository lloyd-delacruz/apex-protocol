'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { saveAuth } from '@/lib/api';


export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: if already authenticated, route to the correct screen
  useEffect(() => {
    const token = localStorage.getItem('apex_token');
    if (!token) return;

    // Verify session is still valid and sync onboarding state from server
    api.auth.me().then((result) => {
      const u = result.user as { onboardingComplete?: boolean };
      if (u.onboardingComplete) {
        localStorage.setItem('apex_onboarding_complete', 'true');
      }
      const onboardingComplete = localStorage.getItem('apex_onboarding_complete');
      if (onboardingComplete === 'true') {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }).catch(() => {
      // Token expired or invalid — stay on login page
      localStorage.removeItem('apex_token');
      localStorage.removeItem('apex_refresh_token');
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await api.auth.login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        result = await api.auth.register(email, password, name.trim());
      }

      saveAuth(result.token, result.user, result.refreshToken);

      // Sync onboarding state from server — the user object is the source of truth
      const u = result.user as { onboardingComplete?: boolean };
      if (u.onboardingComplete) {
        localStorage.setItem('apex_onboarding_complete', 'true');
      }

      const onboardingComplete = localStorage.getItem('apex_onboarding_complete');
      if (onboardingComplete === 'true') {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(0,194,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(123,97,255,0.08) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 194, 255, 0.3), transparent)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-card flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7B61FF)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10h4l2-6 4 12 2-6h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-heading text-xl font-bold text-text-primary tracking-tight">
              Apex Protocol
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="label text-accent">Performance Training Platform</p>
            <h1 className="font-heading text-5xl xl:text-6xl font-bold text-text-primary leading-tight">
              Train with{' '}
              <span className="text-gradient-accent">precision.</span>
              <br />
              Progress with{' '}
              <span className="text-gradient-accent">data.</span>
            </h1>
            <p className="text-text-muted text-lg max-w-md leading-relaxed">
              Intelligent programming meets scientific progression. Every rep tracked, every set analyzed, every gain maximized.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: '📊', label: 'Auto-progression engine' },
              { icon: '🎯', label: 'RIR-based tracking' },
              { icon: '📈', label: 'Volume analytics' },
              { icon: '🔋', label: 'Recovery scoring' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-text-muted border border-white/[0.06] bg-surface/50"
              >
                <span>{feature.icon}</span>
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <blockquote className="text-text-muted text-sm italic">
            &ldquo;The body achieves what the mind believes — and what the data confirms.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div
              className="w-9 h-9 rounded-card flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00C2FF, #7B61FF)' }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 10h4l2-6 4 12 2-6h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-heading text-xl font-bold text-text-primary tracking-tight">
              Apex Protocol
            </span>
          </div>

          {/* Form card */}
          <div className="card p-8 space-y-6">
            {/* Tab switcher */}
            <div className="flex bg-background rounded-card p-1 border border-white/[0.06]">
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-2 rounded-[6px] text-sm font-medium transition-transform duration-150 ${
                  mode === 'login'
                    ? 'bg-surface-elevated text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 py-2 rounded-[6px] text-sm font-medium transition-transform duration-150 ${
                  mode === 'signup'
                    ? 'bg-surface-elevated text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Heading */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-text-primary">
                {mode === 'login' ? 'Welcome back' : 'Get started'}
              </h2>
              <p className="text-text-muted text-sm mt-1">
                {mode === 'login'
                  ? 'Sign in to your training dashboard'
                  : 'Create your account to start training'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="label block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="input-dark"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="label block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-dark"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="label">Password</label>
                  {mode === 'login' && (
                    <button type="button" className="text-xs text-accent hover:text-accent/80 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  className="input-dark"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-card bg-danger/10 border border-danger/20">
                  <svg className="w-4 h-4 text-danger flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle link */}
            <p className="text-center text-sm text-text-muted">
              {mode === 'login' ? (
                <>
                  No account yet?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    Create one free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-accent hover:text-accent/80 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-center text-xs text-text-muted mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
