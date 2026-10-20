'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setError('Invalid email or password. Please try again.');
        else if (res.status === 409) setError('This email is already registered. Try logging in instead.');
        else if (res.status === 400) setError(data.error);
        else if (res.status === 500) setError('Server error. Please try again in a moment.');
        else setError(data.error || 'Something went wrong.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to server. Make sure the backend is running on port 3001.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh' }}>
      <section style={{ width: '50%', backgroundColor: '#1E293B', flexDirection: 'column', padding: '48px', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgb(159,208,204) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <div style={{ width: 40, height: 40, backgroundColor: '#6f9f9c', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'white' }}>terminal</span>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>Codebase Assistant</span>
        </div>
        <div style={{ zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: '32px', fontWeight: 600, color: 'white', marginBottom: '24px', lineHeight: '40px', letterSpacing: '-0.02em' }}>
            Understand any codebase in minutes with AI.
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px', lineHeight: '28px' }}>
            Navigate complex logic, find architectural bottlenecks, and generate documentation instantly. Built for engineering teams who value speed and structural integrity.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {['Ask in plain English', 'Dependency graphs', 'Onboarding guides'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', border: '1px solid #6f9f9c', borderRadius: '9999px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#9fd0cc', letterSpacing: '0.05em' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>terminal</span>
                {f}
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '8px', padding: '24px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#cbd5e1' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['rgba(186,26,26,0.4)', 'rgba(130,83,65,0.4)', 'rgba(54,102,100,0.4)'].map((c, i) => (
                <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c }} />
              ))}
            </div>
            <div><span style={{ color: '#94a3b8' }}>const</span> res = <span style={{ color: '#9fd0cc' }}>await</span> fetch(<span style={{ color: '#6f9f9c' }}>&apos;/api/ask&apos;</span>, {'{'}</div>
            <div style={{ marginLeft: '16px' }}>body: JSON.stringify{'({'})</div>
            <div style={{ marginLeft: '32px' }}>repo_id: <span style={{ color: '#6f9f9c' }}>&quot;flask_ast&quot;</span>,</div>
            <div style={{ marginLeft: '32px' }}>question: <span style={{ color: '#6f9f9c' }}>&quot;how does routing work?&quot;</span></div>
            <div style={{ marginLeft: '16px' }}>{'}'}{')'}</div>
            <div>{'}'});</div>
            <div style={{ marginTop: '12px', borderLeft: '2px solid #366664', paddingLeft: '12px', color: '#94a3b8' }}>
              <div>&gt; Routing is handled by add_url_rule() in</div>
              <div>src/flask/sansio/scaffold.py. The @app.route</div>
              <div>decorator calls this internally...</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '48px 32px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: '28px', fontWeight: 600, color: '#141b2b', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: '16px', color: '#404848' }}>
              {mode === 'login' ? 'Log in to your technical workspace' : 'Start understanding codebases faster'}
            </p>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#f1f3ff', padding: '4px', borderRadius: '8px', marginBottom: '32px' }}>
            {['login', 'signup'].map((tab) => (
              <button key={tab} onClick={() => { setMode(tab); setError(''); }}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: mode === tab ? '#ffffff' : 'transparent', color: mode === tab ? '#366664' : '#707978', boxShadow: mode === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontFamily: 'Inter, sans-serif' }}>
                {tab === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#ffdad6', color: '#93000a', border: '1px solid #ba1a1a', fontSize: '14px' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, color: '#707978', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dev@company.com" required
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #c0c8c7', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#141b2b', backgroundColor: '#ffffff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, color: '#707978', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', padding: '12px 44px 12px 16px', border: '1px solid #c0c8c7', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#141b2b', backgroundColor: '#ffffff' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#707978' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, color: '#707978', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #c0c8c7', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#141b2b', backgroundColor: '#ffffff' }} />
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, color: 'white', backgroundColor: loading ? '#6f9f9c' : '#366664', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#3D6B75'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#366664'; }}>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
            Make sure you have an account — use Sign Up if you are new.
          </p>
        </div>
      </section>
    </main>
  );
}
