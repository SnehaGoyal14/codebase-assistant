'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GuidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repo_id');

  const [user, setUser] = useState(null);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/'); return; }
    if (!repoId) { router.push('/dashboard'); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchGuide(token);
  }, [repoId]);

  async function fetchGuide(token) {
    try {
      const res = await fetch('http://localhost:3001/repos/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ repo_id: repoId })
      });
      const data = await res.json();
      if (res.ok) setGuide(data.guide);
      else setError(data.error || 'Failed to generate guide');
    } catch (err) {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!guide) return;
    const blob = new Blob([guide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoId}-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  }

  function getInitials(email) {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  function parseSections(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const sections = [];
    let current = null;
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (current) sections.push(current);
        current = { title: line.replace('## ', '').trim(), content: [] };
      } else if (line.startsWith('# ')) {
        // skip
      } else if (current) {
        current.content.push(line);
      }
    }
    if (current) sections.push(current);
    return sections;
  }

  // Renders a line with **bold**, `code`, and plain text
  function renderInline(text, key) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{ fontWeight: 600, color: '#111827' }}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={i} style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#334155' }}>
                {part.slice(1, -1)}
              </code>
            );
          }
          return part;
        })}
      </span>
    );
  }

  function renderContent(lines) {
    const result = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const items = [];
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          items.push(lines[i].replace(/^[-*] /, ''));
          i++;
        }
        result.push(
          <ul key={`ul-${i}`} style={{ margin: '8px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((item, j) => (
              <li key={j} style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
                {renderInline(item, j)}
              </li>
            ))}
          </ul>
        );
      } else if (line.match(/^\d+\. /)) {
        const items = [];
        while (i < lines.length && lines[i].match(/^\d+\. /)) {
          items.push(lines[i].replace(/^\d+\. /, ''));
          i++;
        }
        result.push(
          <ol key={`ol-${i}`} style={{ margin: '8px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((item, j) => (
              <li key={j} style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
                {renderInline(item, j)}
              </li>
            ))}
          </ol>
        );
      } else if (line.startsWith('### ')) {
        result.push(
          <h3 key={`h3-${i}`} style={{ fontFamily: 'Geist, sans-serif', fontSize: '14px', fontWeight: 600, color: '#111827', margin: '12px 0 6px' }}>
            {line.replace('### ', '')}
          </h3>
        );
        i++;
      } else if (line.trim() === '') {
        result.push(<div key={`br-${i}`} style={{ height: '8px' }} />);
        i++;
      } else {
        result.push(
          <p key={`p-${i}`} style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7', fontFamily: 'Inter, sans-serif', margin: '4px 0' }}>
            {renderInline(line, i)}
          </p>
        );
        i++;
      }
    }
    return result;
  }

  const sectionLabels = ['core::overview', 'runtime::bootstrap', 'architecture::map', 'runtime::flow', 'dev::entrypoints', 'concepts::mental-model'];
  const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '6px', transition: 'all 0.15s', textDecoration: 'none' };
  const sections = parseSections(guide || '');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>
      <aside style={{ width: '260px', flexShrink: 0, backgroundColor: '#1E293B', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(51,65,85,0.6)', zIndex: 30 }}>
        <div>
          <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(111,159,156,0.2)', border: '1px solid rgba(111,159,156,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6F9F9C' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>terminal</span>
            </div>
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'white', fontSize: '14px', letterSpacing: '-0.02em' }}>Codebase Assistant</span>
          </div>
          <nav style={{ padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <a href="/dashboard" style={navItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
              <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#94a3b8' }}>dashboard</span>
              Dashboard
            </a>
            <a href="/dashboard" style={navItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
              <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#94a3b8' }}>folder_open</span>
              Recent Repos
            </a>
          </nav>
          <div style={{ margin: '4px 12px', padding: '12px', backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: '6px', border: '1px solid rgba(51,65,85,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }}></span>
                ACTIVE REPOSITORY
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#9BBFA4' }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6F9F9C' }}>account_tree</span>
              {repoId}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { label: 'Chat', icon: 'chat', path: `/chat?repo_id=${repoId}` },
                { label: 'Guide', icon: 'menu_book', path: `/guide?repo_id=${repoId}` },
                { label: 'Graph', icon: 'account_tree', path: `/graph?repo_id=${repoId}` },
              ].map((tab) => (
                <a key={tab.label} href={tab.path}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 4px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', transition: 'all 0.15s', backgroundColor: tab.label === 'Guide' ? 'rgba(111,159,156,0.2)' : 'transparent', color: tab.label === 'Guide' ? '#6F9F9C' : '#94a3b8', border: tab.label === 'Guide' ? '1px solid rgba(111,159,156,0.3)' : '1px solid transparent' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{tab.icon}</span>
                  {tab.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(51,65,85,0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="#" style={navItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#94a3b8' }}>settings</span>
            Settings
          </a>
          <a href="#" onClick={handleLogout} style={navItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#94a3b8' }}>logout</span>
            Logout
          </a>
          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6F9F9C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
              {getInitials(user?.email)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <header style={{ height: '64px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
            <input placeholder="Search symbols, routes, files..."
              style={{ width: '100%', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', color: '#111827', paddingLeft: '36px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
          </div>
        </header>

        <div style={{ padding: '12px 32px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Geist, sans-serif', fontWeight: 600, fontSize: '15px', color: '#111827' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#577E89' }}>folder</span>
              pallets / {repoId}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, backgroundColor: 'rgba(155,191,164,0.2)', color: '#2C5E55', border: '1px solid rgba(155,191,164,0.4)' }}>
              {repoId}
            </span>
          </div>
          <button onClick={handleDownload} disabled={!guide}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'white', backgroundColor: guide ? '#6F9F9C' : '#9BBFA4', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: guide ? 'pointer' : 'not-allowed' }}
            onMouseEnter={(e) => { if (guide) e.currentTarget.style.backgroundColor = '#577E89'; }}
            onMouseLeave={(e) => { if (guide) e.currentTarget.style.backgroundColor = '#6F9F9C'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Download Guide (.md)
          </button>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#6F9F9C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#64748b' }}>Generating your onboarding guide...</p>
              </div>
            ) : error ? (
              <div style={{ padding: '24px', backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '8px', color: '#93000a', fontSize: '14px' }}>
                {error}
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'rgba(111,159,156,0.1)', border: '1px solid rgba(111,159,156,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#577E89' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>menu_book</span>
                      AI Architectural Digest
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8' }}>• Synthesized from indexed AST chunks</span>
                  </div>
                  <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    Onboarding & Architecture Guide: <span style={{ color: '#6F9F9C' }}>{repoId}</span>
                  </h1>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                    This developer guide outlines core structures, key components, and mental models required to understand and contribute to this codebase.
                  </p>
                </div>
                <div style={{ padding: '0 32px 32px' }}>
                  {sections.length > 0 ? sections.map((section, idx) => (
                    <div key={idx} style={{ marginTop: '32px', paddingTop: '24px', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#6F9F9C' }}>
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          {section.title.replace(/^\d+\.\s*/, '')}
                        </h2>
                        {sectionLabels[idx] && (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#94a3b8', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>
                            {sectionLabels[idx]}
                          </span>
                        )}
                      </div>
                      <div style={{ borderLeft: '2px solid #6F9F9C', paddingLeft: '16px' }}>
                        {renderContent(section.content)}
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '32px 0' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>{guide}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
      `}</style>
    </div>
  );
}

export default function GuidePageWrapper() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>Loading...</div>}>
      <GuidePage />
    </Suspense>
  );
}
