'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoId = searchParams.get('repo_id');
  const repoUrl = searchParams.get('repo_url');
  const graphRef = useRef(null);
  const containerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [ForceGraph, setForceGraph] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickNode, setLastClickNode] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/'); return; }
    if (!repoId) { router.push('/dashboard'); return; }
    if (userData) setUser(JSON.parse(userData));
    import('react-force-graph-2d').then(mod => setForceGraph(() => mod.default));
    fetchGraph(token);
  }, [repoId]);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  async function fetchGraph(token) {
    try {
      const res = await fetch('http://localhost:3001/repos/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ repo_id: repoId, repo_url: repoUrl || '' })
      });
      const data = await res.json();
      if (res.ok) {
        const edgeSet = new Set();
        const uniqueEdges = data.graph.edges.filter(e => {
          const key = `${e.source}-${e.target}`;
          if (edgeSet.has(key)) return false;
          edgeSet.add(key);
          return true;
        });
        setGraphData({
          allNodes: data.graph.nodes.map(n => ({ ...n, color: getNodeColor(n.path || n.id) })),
          allLinks: uniqueEdges.map(e => ({ source: e.source, target: e.target })),
        });
      } else {
        setError(data.error || 'Failed to load graph');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  }

  function getNodeColor(path) {
    if (!path) return '#4A8784';
    if (path.includes('test')) return '#64748b';
    if (path.endsWith('.json') || path.endsWith('.toml') || path.endsWith('.cfg')) return '#d97706';
    return '#4A8784';
  }

  const visibleNodeIds = new Set();
  if (graphData) {
    if (showAll) {
      graphData.allNodes.forEach(n => visibleNodeIds.add(n.id));
    } else {
      graphData.allNodes.forEach(n => { if (n.id.includes('/src/')) visibleNodeIds.add(n.id); });
      if (selectedNode) {
        visibleNodeIds.add(selectedNode.id);
        graphData.allLinks.forEach(l => {
          const src = l.source?.id || l.source;
          const tgt = l.target?.id || l.target;
          if (src === selectedNode.id) visibleNodeIds.add(tgt);
          if (tgt === selectedNode.id) visibleNodeIds.add(src);
        });
      }
    }
  }

  const filteredData = graphData ? {
    nodes: graphData.allNodes.filter(n => visibleNodeIds.has(n.id)),
    links: graphData.allLinks.filter(l => {
      const src = l.source?.id || l.source;
      const tgt = l.target?.id || l.target;
      return visibleNodeIds.has(src) && visibleNodeIds.has(tgt);
    }),
  } : null;

  function getOutgoing(node) {
    if (!graphData) return [];
    return graphData.allLinks
      .filter(l => (l.source?.id || l.source) === node.id)
      .map(l => { const id = l.target?.id || l.target; return graphData.allNodes.find(n => n.id === id); })
      .filter(Boolean);
  }

  function getIncoming(node) {
    if (!graphData) return [];
    return graphData.allLinks
      .filter(l => (l.target?.id || l.target) === node.id)
      .map(l => { const id = l.source?.id || l.source; return graphData.allNodes.find(n => n.id === id); })
      .filter(Boolean);
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

  const nodeCount = filteredData?.nodes.length || 0;
  const edgeCount = filteredData?.links.length || 0;
  const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '6px', transition: 'all 0.15s', textDecoration: 'none' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>

      {/* Sidebar */}
      <aside style={{ width: '260px', flexShrink: 0, backgroundColor: '#1E293B', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(51,65,85,0.6)', zIndex: 30 }}>
        <div>
          <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(74,135,132,0.2)', border: '1px solid rgba(74,135,132,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A8784' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>terminal</span>
            </div>
            <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 600, color: 'white', fontSize: '14px' }}>Codebase Assistant</span>
          </div>
          <nav style={{ padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <a href="/dashboard" style={navItemStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
              <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#475569' }}>dashboard</span>
              Dashboard
            </a>
            <a href="/dashboard" style={navItemStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
              <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#475569' }}>folder_open</span>
              Recent Repos
            </a>
          </nav>
          <div style={{ margin: '4px 12px', padding: '12px', backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: '6px', border: '1px solid rgba(51,65,85,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#475569' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }}></span>
                ACTIVE REPOSITORY
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#4A8784' }}>LIVE</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{repoId}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>main • {nodeCount} nodes</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[{ label: 'Chat', icon: 'chat', path: `/chat?repo_id=${repoId}` }, { label: 'Guide', icon: 'menu_book', path: `/guide?repo_id=${repoId}` }, { label: 'Graph', icon: 'account_tree', path: `/graph?repo_id=${repoId}&repo_url=${encodeURIComponent(repoUrl || '')}` }].map((tab) => (
                <a key={tab.label} href={tab.path} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 4px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', backgroundColor: tab.label === 'Graph' ? 'rgba(74,135,132,0.2)' : 'transparent', color: tab.label === 'Graph' ? '#4A8784' : '#94a3b8', border: tab.label === 'Graph' ? '1px solid rgba(74,135,132,0.3)' : '1px solid transparent' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{tab.icon}</span>
                  {tab.label}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(51,65,85,0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a href="#" style={navItemStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#475569' }}>settings</span>
            Settings
          </a>
          <a href="#" onClick={handleLogout} style={navItemStyle} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: '#475569' }}>logout</span>
            Logout
          </a>
          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4A8784', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{getInitials(user?.email)}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>

        {/* Subheader */}
        <div style={{ padding: '0 24px', height: '48px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#111827' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4A8784' }}>folder</span>
              pallets / {repoId}
            </div>
            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', backgroundColor: '#E2E8F0', color: '#4A8784', border: '1px solid rgba(74,135,132,0.3)' }}>{repoId}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4A8784', display: 'inline-block' }}></span>{nodeCount} nodes</span>
              <span>— {edgeCount} edges</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4A8784', display: 'inline-block' }}></span>Source</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#64748b', display: 'inline-block' }}></span>Tests</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block' }}></span>Config</span>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', pointerEvents: 'none' }}>search</span>
              <input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '28px', paddingRight: '10px', paddingTop: '5px', paddingBottom: '5px', borderRadius: '4px', border: '1px solid #E2E8F0', backgroundColor: '#F8F9FA', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#111827', outline: 'none', width: '160px' }}
              />
            </div>
            <button onClick={() => setShowAll(prev => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#475569', backgroundColor: 'white', border: '1px solid #E2E8F0', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4A8784'; e.currentTarget.style.color = '#4A8784'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{showAll ? 'filter_alt' : 'filter_alt_off'}</span>
              {showAll ? 'Source only' : 'Show all files'}
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'white', backgroundColor: '#4A8784', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D6B75'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A8784'}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
              Export Graph
            </button>
          </div>
        </div>

        {/* Graph + Panel */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }} ref={containerRef}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', backgroundColor: '#F8F9FA' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(74,135,132,0.2)', borderTopColor: '#4A8784', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#4A8784' }}>Building dependency graph...</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: '#F8F9FA' }}>
              <div style={{ padding: '24px', backgroundColor: 'rgba(186,26,26,0.1)', border: '1px solid rgba(186,26,26,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace' }}>{error}</div>
            </div>
          ) : ForceGraph && filteredData ? (
            <>
              <ForceGraph
                ref={el => {
                  graphRef.current = el;
                  if (el) {
                    el.d3Force('charge').strength(-400);
                    el.d3Force('link').distance(100);
                  }
                }}
                width={selectedNode ? dimensions.width - 320 : dimensions.width}
                height={dimensions.height}
                graphData={filteredData}
                nodeId="id"
                nodeLabel={() => ''}
                nodeRelSize={1}
                nodeVal={node => {
                  const c = filteredData.links.filter(l => {
                    const s = l.source?.id || l.source;
                    const t = l.target?.id || l.target;
                    return s === node.id || t === node.id;
                  }).length;
                  return Math.max(8, Math.min(20, 8 + c * 1.5));
                }}
                nodeColor={node => selectedNode && selectedNode.id === node.id ? '#78C0A8' : (node.color || '#4A8784')}
                linkColor={() => 'rgba(74,135,132,0.4)'}
                linkWidth={1}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={() => 'rgba(74,135,132,0.6)'}
                backgroundColor="#F8F9FA"
                enableNodeDrag={true}
                onNodeClick={(node) => {
                  const now = Date.now();
                  if (lastClickNode && lastClickNode.id === node.id && now - lastClickTime < 300) {
                    setShowAll(false);
                    setSelectedNode(node);
                  } else {
                    setSelectedNode(node);
                    setTimeout(() => {
                      if (graphRef.current) {
                        graphRef.current.centerAt(node.x, node.y, 500);
                        graphRef.current.zoom(2, 500);
                      }
                    }, 100);
                  }
                  setSearchQuery('');
                  setLastClickTime(now);
                  setLastClickNode(node);
                }}
                onBackgroundClick={() => setSelectedNode(null)}
                onZoom={({ k }) => setZoom(Math.round(k * 100))}
                onEngineStop={() => {
                  if (graphRef.current) graphRef.current.zoomToFit(400, 60);
                }}
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const label = node.name || node.id.split('/').pop();
                  const isMatch = searchQuery && label.toLowerCase().includes(searchQuery.toLowerCase());
                  const c = filteredData.links.filter(l => {
                    const s = l.source?.id || l.source;
                    const t = l.target?.id || l.target;
                    return s === node.id || t === node.id;
                  }).length;
                  const r = Math.sqrt(Math.max(8, Math.min(20, 8 + c * 1.5)));
                  if (isMatch) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                  }
                  const fontSize = Math.max(9, 11 / globalScale);
                  ctx.font = `${isSelected || isMatch ? 'bold ' : ''}${fontSize}px JetBrains Mono, monospace`;
                  ctx.textAlign = 'left';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = isMatch ? '#f59e0b' : (isSelected ? '#111827' : '#475569');
                  ctx.fillText(label, node.x + r + 4, node.y);
                }}
              />

              {/* Selected node panel */}
              {selectedNode && (
                <div style={{ width: '320px', flexShrink: 0, backgroundColor: '#F8F9FA', borderLeft: '1px solid #E2E8F0', overflowY: 'auto' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#E2E8F0', border: '1px solid rgba(74,135,132,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#4A8784', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4A8784', display: 'inline-block' }}></span>
                        Core Architecture
                      </span>
                      <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: 600, color: '#111827' }}>{selectedNode.name || selectedNode.id.split('/').pop()}</h3>
                    </div>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b', wordBreak: 'break-all', marginBottom: '12px' }}>{selectedNode.path || selectedNode.id}</p>
                    <a href={`/chat?repo_id=${repoId}&question=${encodeURIComponent('What does ' + (selectedNode.name || selectedNode.id.split('/').pop()) + ' do and how does it work?')}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#4A8784', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D6B75'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A8784'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>chat</span>
                      Ask about this file
                    </a>
                  </div>

                  <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Outgoing Imports</div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '24px', fontWeight: 700, color: '#4A8784' }}>{getOutgoing(selectedNode).length} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>files</span></div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Incoming Imports</div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '24px', fontWeight: 700, color: '#4A8784' }}>{getIncoming(selectedNode).length} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>files</span></div>
                    </div>
                  </div>

                  {getOutgoing(selectedNode).length > 0 && (
                    <div style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#4A8784', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_outward</span>
                          FILES IT IMPORTS (OUTGOING)
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b' }}>{getOutgoing(selectedNode).length}</span>
                      </div>
                      {getOutgoing(selectedNode).map((n, i) => (
                        <div key={i} onClick={() => setSelectedNode(n)}
                          style={{ padding: '10px 16px', cursor: 'pointer', borderTop: '1px solid rgba(74,135,132,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74,135,132,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#111827' }}>{n.name || (n.id || '').split('/').pop()}</div>
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b' }}>{(n.path || n.id || '').replace(/\/[^/]+$/, '/')}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {getIncoming(selectedNode).length > 0 && (
                    <div>
                      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#4A8784', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_downward</span>
                          FILES THAT IMPORT IT (INCOMING)
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b' }}>{getIncoming(selectedNode).length}</span>
                      </div>
                      {getIncoming(selectedNode).map((n, i) => (
                        <div key={i} onClick={() => setSelectedNode(n)}
                          style={{ padding: '10px 16px', cursor: 'pointer', borderTop: '1px solid rgba(74,135,132,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(74,135,132,0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#111827' }}>{n.name || (n.id || '').split('/').pop()}</div>
                          </div>
                          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b' }}>{(n.path || n.id || '').replace(/\/[^/]+$/, '/')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom bar */}
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '999px', padding: '8px 20px', zIndex: 20 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#4A8784', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4A8784', display: 'inline-block' }}></span>
                  Graph initialized
                </span>
                <span style={{ color: 'rgba(74,135,132,0.3)', fontSize: '14px' }}>•</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b' }}>Zoom: {zoom}%</span>
                <span style={{ color: 'rgba(74,135,132,0.3)', fontSize: '14px' }}>•</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b' }}>{nodeCount} nodes</span>
                <span style={{ color: 'rgba(74,135,132,0.3)', fontSize: '14px' }}>•</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { icon: 'add', action: () => graphRef.current?.zoom(graphRef.current.zoom() * 1.2, 200) },
                    { icon: 'remove', action: () => graphRef.current?.zoom(graphRef.current.zoom() / 1.2, 200) },
                    { icon: 'center_focus_strong', action: () => graphRef.current?.zoomToFit(400, 60) },
                    { icon: 'refresh', action: () => { if (graphRef.current) { graphRef.current.d3Force('charge').strength(-400); graphRef.current.d3ReheatSimulation(); } } },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action}
                      style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#4A8784'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{btn.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GraphPageWrapper() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8F9FA', color: '#4A8784' }}>Loading...</div>}>
      <GraphPage />
    </Suspense>
  );
}
