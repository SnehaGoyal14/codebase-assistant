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
  const [deletingId, setDeletingId] = useState(null);
  const [reindexingId, setReindexingId] = useState(null);
  const [indexError, setIndexError] = useState('');
  const [indexSuccess, setIndexSuccess] = useState('');
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/repos`, {
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
    setIndexSuccess('');
    if (!repoUrl.startsWith('https://github.com/')) {
      setIndexError('Please enter a valid GitHub URL');
      return;
    }
    if (!repoId.trim()) {
      setIndexError('Please enter a repo ID');
      return;
    }
    setIndexing(true);
    const indexedRepoId = repoId.trim();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/repos/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ repo_url: repoUrl, repo_id: indexedRepoId })
      });
      const data = await res.json();
      if (!res.ok) { setIndexError(data.error || 'Failed to index repo'); return; }
      setRepoUrl('');
      setRepoId('');
      setIndexSuccess(`Successfully indexed ${data.total_chunks || ''} chunks from ${indexedRepoId}`);
      setTimeout(() => setIndexSuccess(''), 5000);
      fetchRepos(token);
    } catch (err) {
      setIndexError('Cannot connect to server. Please check your connection and try again.');
    } finally {
      setIndexing(false);
    }
  }

  async function handleDelete(repo) {
    const confirmed = window.confirm(`Delete "${repo.repo_id}"? This will remove the repo and all its conversations.`);
    if (!confirmed) return;
    setDeletingId(repo.repo_id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/repos/${repo.repo_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRepos(prev => prev.filter(r => r.repo_id !== repo.repo_id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReindex(repo) {
    const confirmed = window.confirm(`Re-index "${repo.repo_id}"? This will fetch the latest code from GitHub and rebuild the index.`);
    if (!confirmed) return;
    setReindexingId(repo.repo_id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/repos/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ repo_url: repo.repo_url, repo_id: repo.repo_id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Re-indexed successfully! ${data.total_chunks || ''} chunks processed.`);
      } else {
        alert('Re-indexing failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Cannot connect to server.');
    } finally {
      setReindexingId(null);
    }
  }

  function handleLogout() {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
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
  const activeNavItemStyle = { ...navItemStyle, color: '#4A8784', position: 'relative' };

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <aside style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: '260px', backgroundColor: '#1E293B', display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 50 }}>
        <div style={{ padding: '0 16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#4A8784', fontSize: '24px' }}>terminal</span>
            <h1 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 600, color: 'white', letterSpacing: '-0.02em' }}>Codebase Assistant</h1>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={activeNavItemStyle}>
            <div style={{ position: 'absolute', left: 0, width: '2px', height: '100%', backgroundColor: '#4A8784' }} />
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
            <span>Dashboard</span>
          </div>
          <div style={navItemStyle}
            onClick={() => document.getElementById('repos-section')?.scrollIntoView({ behavior: 'smooth' })}
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
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#4A8784', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f8a87'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A8784'}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
              New Project
            </button>
          </div>
        </nav>
        <div style={{ borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: '16px' }}>
          <div style={navItemStyle} onClick={handleLogout}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(51,65,85,0.5)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
            <span>Logout</span>
          </div>
          <div style={{ marginTop: '16px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4A8784', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {getInitials(user?.email)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{user?.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: '260px', padding: '32px' }}>
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '8px', letterSpacing: '-0.01em' }}>Index a new repository</h2>
              <p style={{ fontSize: '14px', color: '#64748b', fontFamily: 'Geist, sans-serif' }}>Paste your GitHub repository URL below. Our AI will analyze the directory structure, index the chunks, and build your knowledge graph.</p>
            </div>
            {indexing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'rgba(74,135,132,0.05)', border: '1px solid rgba(74,135,132,0.2)', padding: '14px 16px', borderRadius: '8px', flexShrink: 0, marginLeft: '24px', minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#4A8784', fontSize: '20px', animation: 'spin 2s linear infinite' }}>progress_activity</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#4A8784', fontWeight: 600 }}>Indexing repository...</span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b' }}>This may take 2-5 minutes for large repos</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8' }}>Cloning → Chunking → Embedding → Done</span>
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
                    style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#1e293b', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <input type="text" value={repoId} onChange={(e) => setRepoId(e.target.value)}
                    placeholder="repo_id (e.g. flask_ast)" required
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#1e293b', outline: 'none' }} />
                </div>
                <button type="submit" disabled={indexing}
                  style={{ backgroundColor: indexing ? '#6F9F9C' : '#4A8784', color: 'white', padding: '12px 24px', borderRadius: '4px', border: 'none', cursor: indexing ? 'not-allowed' : 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                  onMouseEnter={(e) => { if (!indexing) e.currentTarget.style.backgroundColor = '#5f8a87'; }}
                  onMouseLeave={(e) => { if (!indexing) e.currentTarget.style.backgroundColor = '#4A8784'; }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>input</span>
                  {indexing ? 'Indexing...' : 'Index Repository'}
                </button>
              </div>
              {indexError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#fff1f0', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 12px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>error</span>
                  <div>
                    <span style={{ color: '#dc2626', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, display: 'block' }}>{indexError}</span>
                    <span style={{ color: '#ef4444', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>Please check the URL and try again.</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '14px' }}>info</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>Supports public GitHub repositories. Large repos may take up to 5 minutes.</span>
              </div>
            </form>
            {indexSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px', marginTop: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '18px' }}>check_circle</span>
                <span style={{ color: '#15803d', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{indexSuccess}</span>
              </div>
            )}
          </div>
        </section>

        <section id="repos-section">
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
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(74,135,132,0.4)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #E2E8F0', color: '#64748b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>source</span>
                    </div>
                    <span style={{ backgroundColor: 'rgba(111,159,156,0.15)', color: '#153522', padding: '4px 8px', borderRadius: '9999px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', border: '1px solid rgba(111,159,156,0.3)' }}>
                      {repo.repo_id}
                    </span>
                  </div>
                  <h4 style={{ fontFamily: 'Geist, sans-serif', fontSize: '18px', fontWeight: 500, color: '#1e293b', marginBottom: '4px' }}>{getRepoName(repo)}</h4>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '24px' }}>{getRepoDisplayUrl(repo)}</p>
                  
                  {/* Action buttons - all labeled */}
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => router.push(`/chat?repo_id=${repo.repo_id}`)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#4A8784', color: 'white', padding: '10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Geist, sans-serif', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f8a87'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A8784'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                      Chat with Codebase
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button onClick={() => router.push(`/guide?repo_id=${repo.repo_id}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4A8784'; e.currentTarget.style.color = '#4A8784'; e.currentTarget.style.backgroundColor = 'rgba(74,135,132,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'white'; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>menu_book</span>
                        Onboarding Guide
                      </button>
                      <button onClick={() => router.push(`/graph?repo_id=${repo.repo_id}&repo_url=${encodeURIComponent(repo.repo_url)}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4A8784'; e.currentTarget.style.color = '#4A8784'; e.currentTarget.style.backgroundColor = 'rgba(74,135,132,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'white'; }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>account_tree</span>
                        Dependency Graph
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button onClick={() => handleReindex(repo)} disabled={reindexingId === repo.repo_id || deletingId === repo.repo_id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: 'white', color: '#64748b', cursor: (reindexingId === repo.repo_id || deletingId === repo.repo_id) ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s', opacity: (reindexingId === repo.repo_id || deletingId === repo.repo_id) ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (reindexingId !== repo.repo_id && deletingId !== repo.repo_id) { e.currentTarget.style.borderColor = '#4A8784'; e.currentTarget.style.color = '#4A8784'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748b'; }}>
                        {reindexingId === repo.repo_id
                          ? <><span className="material-symbols-outlined" style={{ fontSize: '15px', animation: 'spin 2s linear infinite' }}>progress_activity</span>Re-indexing...</>
                          : <><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>refresh</span>Re-index</>
                        }
                      </button>
                      <button onClick={() => handleDelete(repo)} disabled={deletingId === repo.repo_id || reindexingId === repo.repo_id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '1px solid #fca5a5', borderRadius: '4px', backgroundColor: 'white', color: '#dc2626', cursor: (deletingId === repo.repo_id || reindexingId === repo.repo_id) ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s', opacity: (deletingId === repo.repo_id || reindexingId === repo.repo_id) ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (deletingId !== repo.repo_id && reindexingId !== repo.repo_id) e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}>
                        {deletingId === repo.repo_id
                          ? <><span className="material-symbols-outlined" style={{ fontSize: '15px', animation: 'spin 2s linear infinite' }}>progress_activity</span>Deleting...</>
                          : <><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>Delete Repo</>
                        }
                      </button>
                    </div>
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
