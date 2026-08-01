'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoId, setRepoId] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [indexError, setIndexError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/'); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchRepos(token);
  }, []);

  async function fetchRepos(token) {
    try {
      const res = await fetch('http://localhost:3001/repos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRepos(data.repos);
    } catch (err) {
      console.error('Failed to fetch repos');
    } finally {
      setLoading(false);
    }
  }

  async function handleIndex(e) {
    e.preventDefault();
    setIndexError('');
    if (!repoUrl.startsWith('https://github.com/')) {
      setIndexError('Please enter a valid GitHub URL');
      return;
    }
    if (!repoId.trim()) {
      setIndexError('Please enter a repo ID');
      return;
    }
    setIndexing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/repos/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ repo_url: repoUrl, repo_id: repoId.trim() })
      });
      const data = await res.json();
      if (!res.ok) { setIndexError(data.error || 'Failed to index repo'); return; }
      setRepoUrl('');
      setRepoId('');
      fetchRepos(token);
    } catch (err) {
      setIndexError('Cannot connect to server.');
    } finally {
      setIndexing(false);
    }
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

  function getRepoName(repo) {
    return repo.repo_id.replace(/_/g, '-');
  }

  function getRepoDisplayUrl(repo) {
    try { return repo.repo_url.replace('https://', ''); } catch { return repo.repo_url; }
  }

  const navItemStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' };
  const activeNavItemStyle = { ...navItemStyle, color: '#6F9F9C', position: 'relative' };

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <aside style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: '260px', backgroundColor: '#1E293B', display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 50 }}>
        <div style={{ padding: '0 16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#6F9F9C', fontSize: '24px' }}>terminal</span>
            <h1 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>Codebase Assistant</h1>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={activeNavItemStyle}>
            <div style={{ position: 'absolute', left: 0, width: '2px', height: '100%', backgroundColor: '#6F9F9C' }} />
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
            <span>Dashboard</span>
          </div>
          <div style={navItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>folder_open</span>
            <span>Recent Repos</span>
          </div>
          <div style={{ marginTop: '24px', padding: '0 16px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Actions</span>
          </div>
          <div style={{ padding: '0 16px' }}>
            <button onClick={() => document.getElementById('repo-url-input').focus()}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#6F9F9C', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f8a87'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6F9F9C'}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
              New Project
            </button>
          </div>
        </nav>
        <div style={{ borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: '16px' }}>
          <div style={navItemStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
            <span>Settings</span>
          </div>
          <div style={navItemStyle} onClick={handleLogout}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            <span>Logout</span>
          </div>
          <div style={{ marginTop: '16px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6F9F9C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {getInitials(user?.email)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{user?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <header style={{ position: 'fixed', top: 0, right: 0, left: '260px', height: '64px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 32px', zIndex: 40 }}>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
          <input placeholder="Search commands or files..."
            style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', backgroundColor: '#f8fafc', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', width: '320px', fontFamily: 'Inter, sans-serif', color: '#1e293b' }} />
        </div>
      </header>

      <main style={{ marginLeft: '260px', marginTop: '64px', padding: '32px' }}>
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.01em' }}>Index a new repository</h2>
              <p style={{ fontSize: '14px', color: '#64748b', fontFamily: 'Geist, sans-serif' }}>Paste your GitHub repository URL below. Our AI will analyze the directory structure, index the chunks, and build your knowledge graph.</p>
            </div>
            {indexing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(111,159,156,0.05)', border: '1px solid rgba(111,159,156,0.2)', padding: '8px 16px', borderRadius: '8px', flexShrink: 0, marginLeft: '24px' }}>
                <span className="material-symbols-outlined" style={{ color: '#6F9F9C', fontSize: '20px', animation: 'spin 2s linear infinite' }}>progress_activity</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#6F9F9C' }}>Indexing... this may take a minute</span>
              </div>
            )}
          </div>
          <div style={{ backgroundColor: 'white', padding: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleIndex}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, position: 'relative', minWidth: '280px' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>link</span>
                  <input id="repo-url-input" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository" required
                    style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#1e293b' }} />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <input type="text" value={repoId} onChange={(e) => setRepoId(e.target.value)}
                    placeholder="repo_id (e.g. flask_ast)" required
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#1e293b' }} />
                </div>
                <button type="submit" disabled={indexing}
                  style={{ backgroundColor: indexing ? '#9BBFA4' : '#6F9F9C', color: 'white', padding: '12px 24px', borderRadius: '4px', border: 'none', cursor: indexing ? 'not-allowed' : 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                  onMouseEnter={(e) => { if (!indexing) e.currentTarget.style.backgroundColor = '#5f8a87'; }}
                  onMouseLeave={(e) => { if (!indexing) e.currentTarget.style.backgroundColor = '#6F9F9C'; }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>input</span>
                  {indexing ? 'Indexing...' : 'Index Repository'}
                </button>
              </div>
              {indexError && <p style={{ color: '#ba1a1a', fontSize: '12px', fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>{indexError}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '14px' }}>info</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>Supports public GitHub repositories. Large repos may take up to 5 minutes.</span>
              </div>
            </form>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 500, color: '#1e293b' }}>Your repositories</h3>
              <span style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, color: '#64748b', border: '1px solid #E2E8F0' }}>{repos.length} TOTAL</span>
            </div>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading repositories...</div>
          ) : repos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', display: 'block', marginBottom: '16px' }}>folder_open</span>
              <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#1e293b' }}>No repositories indexed yet</p>
              <p style={{ fontSize: '14px' }}>Paste a GitHub URL above to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {repos.map((repo) => (
                <div key={repo.id}
                  style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(111,159,156,0.4)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #E2E8F0', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>source</span>
                    </div>
                    <span style={{ backgroundColor: 'rgba(155,191,164,0.15)', color: '#153522', padding: '4px 8px', borderRadius: '9999px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(155,191,164,0.3)' }}>
                      {repo.repo_id}
                    </span>
                  </div>
                  <h4 style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 500, color: '#1e293b', marginBottom: '4px' }}>{getRepoName(repo)}</h4>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '24px' }}>{getRepoDisplayUrl(repo)}</p>
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px' }}>
                    <button onClick={() => router.push(`/chat?repo_id=${repo.repo_id}`)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#6F9F9C', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'Geist, sans-serif' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f8a87'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6F9F9C'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                      Chat
                    </button>
                    <button onClick={() => router.push(`/guide?repo_id=${repo.repo_id}`)}
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6F9F9C'; e.currentTarget.style.color = '#6F9F9C'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748b'; }}
                      title="Onboarding Guide">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_stories</span>
                    </button>
                    <button onClick={() => router.push(`/graph?repo_id=${repo.repo_id}&repo_url=${encodeURIComponent(repo.repo_url)}`)}
                      style={{ padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6F9F9C'; e.currentTarget.style.color = '#6F9F9C'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748b'; }}
                      title="Dependency Graph">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_tree</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
