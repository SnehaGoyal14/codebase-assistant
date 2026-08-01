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
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, color: '#707978', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
                {mode === 'login' && <a href="#" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#366664' }}>Forgot?</a>}
              </div>
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
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#577E89'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#366664'; }}>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            <div style={{ position: 'relative', padding: '8px 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #c0c8c7' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ padding: '0 16px', backgroundColor: '#ffffff', fontSize: '11px', color: '#c0c8c7', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Or continue with</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { name: 'GitHub', svg: <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" fill="currentColor"/></svg> },
                { name: 'Google', svg: <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12.48 10.92V14.6h6.73c-.24 1.22-.88 2.25-1.92 2.95c-1.04.7-2.4 1.1-4.81 1.1c-3.15 0-5.83-2.13-6.78-5a6.99 6.99 0 0 1 0-4.3c.95-2.87 3.63-5 6.78-5c1.69 0 3.14.58 4.3 1.66l2.84-2.84C17.15 1.34 15.01.5 12.48.5C7.62.5 3.54 3.3 1.41 7.37a11.16 11.16 0 0 0 0 9.26c2.13 4.07 6.21 6.87 11.07 6.87c3.2 0 5.89-1.06 7.84-2.88c2.19-2.06 3.42-5.12 3.42-8.7c0-.52-.04-1.03-.12-1.53l-10.14-.02z" fill="currentColor"/></svg> },
              ].map(({ name, svg }) => (
                <button key={name} type="button"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px solid #c0c8c7', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: '#141b2b', backgroundColor: '#ffffff', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}>
                  {svg} {name}
                </button>
              ))}
            </div>
          </form>
          <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: '#c0c8c7', fontFamily: 'Inter, sans-serif' }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: '#404848', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#404848', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Privacy Policy</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
