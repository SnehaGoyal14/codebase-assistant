'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MermaidDiagram({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!chart || !ref.current) return;
    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        if (ref.current) ref.current.innerHTML = `<pre style="font-size:11px;color:#64748b;overflow:auto">${chart}</pre>`;
      }
    };
    render();
  }, [chart]);

  return <div ref={ref} style={{ overflow: 'auto' }} />;
}

function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repo_id');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const suggestions = [
    '"Where is database session initialized?"',
    '"Explain error handling middleware"',
    '"How does authentication work?"',
    '"What are the main entry points?"',
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/'); return; }
    if (!repoId) { router.push('/dashboard'); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchHistory(token);
  }, [repoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchHistory(token) {
    try {
      const res = await fetch(`http://localhost:3001/repos/history/${repoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.history.length > 0) {
        const formatted = data.history.map(h => ([
          { type: 'user', text: h.question, id: `u-${h.id}` },
          { type: 'ai', answer: h.answer, diagram: h.diagram, sources: h.sources, id: `a-${h.id}` }
        ])).flat();
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!question.trim() || loading) return;

    const userMsg = { type: 'user', text: question, id: `u-${Date.now()}` };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/repos/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ repo_id: repoId, question: question.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        const aiMsg = { type: 'ai', answer: data.answer, diagram: data.diagram, sources: data.sources, id: `a-${Date.now()}` };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [...prev, { type: 'ai', answer: data.error || 'Something went wrong.', diagram: null, sources: [], id: `a-err-${Date.now()}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'ai', answer: 'Cannot connect to server.', diagram: null, sources: [], id: `a-err-${Date.now()}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  function parseDiagram(diagram) {
    if (!diagram) return null;
    return diagram.replace(/```mermaid\n?/, '').replace(/```$/, '').trim();
  }

  const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '6px', transition: 'all 0.15s', textDecoration: 'none' };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6F9F9C' }}>account_tree</span>
              {repoId}
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', position: 'relative' }}>
        <header style={{ height: '64px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', alignItems: 'center', flexShrink: 0, zIndex: 20 }}>
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
              {repoId}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, backgroundColor: 'rgba(155,191,164,0.2)', color: '#2C5E55', border: '1px solid rgba(155,191,164,0.4)' }}>
              {repoId}
            </span>
          </div>
          <button onClick={() => setMessages([])}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; e.currentTarget.style.color = '#64748b'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
            Reset Session
          </button>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', paddingBottom: '140px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b', fontSize: '14px' }}>Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(111,159,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6F9F9C', marginBottom: '16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>chat_bubble_outline</span>
              </div>
              <h4 style={{ fontFamily: 'Geist, sans-serif', fontWeight: 500, fontSize: '15px', color: '#111827', marginBottom: '8px' }}>Ask your first question</h4>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', marginBottom: '16px', lineHeight: '1.6' }}>
                Explore architectural patterns, query specific functions, or generate dependency flowcharts.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => { setQuestion(s.replace(/"/g, '')); inputRef.current?.focus(); }}
                    style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '4px', color: '#475569', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '12px', paddingLeft: '64px' }}>
                    <div style={{ backgroundColor: '#6F9F9C', color: 'white', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', lineHeight: '1.6', maxWidth: '560px', fontFamily: 'Inter, sans-serif' }}>
                      {msg.text}
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#577E89', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600, flexShrink: 0, marginTop: '2px' }}>
                      YOU
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px', paddingRight: '32px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(111,159,156,0.15)', border: '1px solid rgba(111,159,156,0.3)', color: '#577E89', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>smart_toy</span>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.7', fontFamily: 'Inter, sans-serif' }}>{msg.answer}</div>
                      {msg.diagram && parseDiagram(msg.diagram) && (
                        <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#F8F9FA', padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="material-symbols-outlined" style={{ color: '#6F9F9C', fontSize: '16px' }}>schema</span>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Architecture Diagram</span>
                            </div>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#94a3b8', backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '4px' }}>flowchart</span>
                          </div>
                          <MermaidDiagram chart={parseDiagram(msg.diagram)} />
                        </div>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(226,232,240,0.8)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>source</span>
                            SOURCES ({[...new Set(msg.sources)].length} FILES)
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {[...new Set(msg.sources)].map((src, i) => (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#475569' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94a3b8' }}>description</span>
                                {src}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <button onClick={() => handleCopy(msg.answer, msg.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copiedId === msg.id ? 'check' : 'content_copy'}</span>
                          {copiedId === msg.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(111,159,156,0.15)', border: '1px solid rgba(111,159,156,0.3)', color: '#577E89', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>smart_toy</span>
              </div>
              <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6F9F9C', display: 'inline-block', animation: `bounce 1s ${i * 0.2}s infinite` }}></span>
                  ))}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Analyzing codebase...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(to top, #F8F9FA 60%, transparent)', zIndex: 30 }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <form onSubmit={handleSend}>
              <div style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" style={{ padding: '8px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>attach_file</span>
                </button>
                <input ref={inputRef} type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this codebase..." disabled={loading}
                  style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#111827', fontFamily: 'Inter, sans-serif' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '4px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>Return to send</span>
                  <button type="submit" disabled={loading || !question.trim()}
                    style={{ width: '36px', height: '36px', backgroundColor: loading || !question.trim() ? '#9BBFA4' : '#6F9F9C', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: loading || !question.trim() ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={(e) => { if (!loading && question.trim()) e.currentTarget.style.backgroundColor = '#577E89'; }}
                    onMouseLeave={(e) => { if (!loading && question.trim()) e.currentTarget.style.backgroundColor = '#6F9F9C'; }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_upward</span>
                  </button>
                </div>
              </div>
            </form>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 0', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
              <span>AI answers synthesize code analysis, AST flowcharts, and source locations.</span>
              <span>Context: <span style={{ color: '#577E89', fontWeight: 500 }}>{repoId}</span></span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
      `}</style>
    </div>
  );
}

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>Loading...</div>}>
      <ChatPage />
    </Suspense>
  );
}
