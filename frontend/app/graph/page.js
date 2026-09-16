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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/'); return; }
    if (!repoId) { router.push('/dashboard'); return; }
    if (userData) setUser(JSON.parse(userData));

    // Load react-force-graph dynamically (client only)
    import('react-force-graph-2d').then(mod => {
      setForceGraph(() => mod.default);
    });

    fetchGraph(token);
  }, [repoId]);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
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
        // Deduplicate edges
        const edgeSet = new Set();
        const uniqueEdges = data.graph.edges.filter(e => {
          const key = `${e.source}-${e.target}`;
          if (edgeSet.has(key)) return false;
          edgeSet.add(key);
          return true;
        });

        setGraphData({
          allNodes: data.graph.nodes.map(n => ({
            ...n,
            color: getNodeColor(n.path || n.id),
          })),
          allLinks: uniqueEdges.map(e => ({
            source: e.source,
            target: e.target,
          })),
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
    if (!path) return '#6F9F9C';
    if (path.includes('test')) return '#94a3b8';
    if (path.endsWith('.json') || path.endsWith('.toml') || path.endsWith('.cfg')) return '#f59e0b';
    return '#6F9F9C';
  }

  function getNodeSize(node) {
    if (!graphData) return 5;
    const connections = graphData.allLinks.filter(
      l => l.source === node.id || l.target === node.id ||
           (l.source?.id === node.id) || (l.target?.id === node.id)
    ).length;
    return Math.max(4, Math.min(12, 4 + connections * 0.8));
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

  function getOutgoing(node) {
    if (!graphData) return [];
    return graphData.allLinks
      .filter(l => (l.source?.id || l.source) === node.id)
      .map(l => l.target?.id ? l.target : graphData.allNodes.find(n => n.id === l.target))
      .filter(Boolean);
  }

  function getIncoming(node) {
    if (!graphData) return [];
    return graphData.allLinks
      .filter(l => (l.target?.id || l.target) === node.id)
      .map(l => l.source?.id ? l.source : graphData.allNodes.find(n => n.id === l.source))
      .filter(Boolean);
  }

  const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '6px', transition: 'all 0.15s', textDecoration: 'none' };

  const filteredData = (() => {
    if (!graphData) return null;
    let baseNodes = showAll
      ? graphData.allNodes
      : graphData.allNodes.filter(n => n.id.includes('/src/'));

    if (selectedNode) {
      const connectedIds = new Set([selectedNode.id]);
      graphData.allLinks.forEach(l => {
        const src = l.source?.id || l.source;
        const tgt = l.target?.id || l.target;
        if (src === selectedNode.id) connectedIds.add(tgt);
        if (tgt === selectedNode.id) connectedIds.add(src);
      });
      const baseSet = new Set(baseNodes.map(n => n.id));
      const extra = graphData.allNodes.filter(n => connectedIds.has(n.id) && !baseSet.has(n.id));
      baseNodes = [...baseNodes, ...extra];
    }

    const visibleIds = new Set(baseNodes.map(n => n.id));
    const visibleLinks = graphData.allLinks.filter(l => {
      const src = l.source?.id || l.source;
      const tgt = l.target?.id || l.target;
      return visibleIds.has(src) && visibleIds.has(tgt);
    });

    return { nodes: baseNodes, links: visibleLinks };
  })();

  const nodeCount = filteredData?.nodes.length || 0;
  const edgeCount = filteredData?.links.length || 0;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8F9FA' }}>

      {/* Sidebar */}
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
                { label: 'Graph', icon: 'account_tree', path: `/graph?repo_id=${repoId}&repo_url=${encodeURIComponent(repoUrl || '')}` },
              ].map((tab) => (
                <a key={tab.label} href={tab.path}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 4px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', transition: 'all 0.15s', backgroundColor: tab.label === 'Graph' ? 'rgba(111,159,156,0.2)' : 'transparent', color: tab.label === 'Graph' ? '#6F9F9C' : '#94a3b8', border: tab.label === 'Graph' ? '1px solid rgba(111,159,156,0.3)' : '1px solid transparent' }}>
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

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ height: '64px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>search</span>
            <input placeholder="Search symbols, routes, files..."
              style={{ width: '100%', backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0', color: '#111827', paddingLeft: '36px', paddingRight: '16px', paddingTop: '6px', paddingBottom: '6px', borderRadius: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
          </div>
        </header>

        {/* Subheader */}
        <div style={{ padding: '10px 24px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Geist, sans-serif', fontWeight: 600, fontSize: '14px', color: '#111827' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#577E89' }}>folder</span>
              {repoId}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'rgba(155,191,164,0.2)', color: '#2C5E55', border: '1px solid rgba(155,191,164,0.4)' }}>
              {repoId}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6F9F9C', display: 'inline-block' }}></span>
                {nodeCount} nodes
              </span>
              <span>— {edgeCount} edges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
              {[{ color: '#6F9F9C', label: 'Source' }, { color: '#94a3b8', label: 'Tests' }, { color: '#f59e0b', label: 'Config' }].map(({ color, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setShowAll(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'white', backgroundColor: '#6F9F9C', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#577E89'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6F9F9C'}>
              {showAll ? 'Source only' : 'Show all files'}
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: 'white', backgroundColor: '#6F9F9C', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#577E89'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6F9F9C'}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              Export Graph
            </button>
          </div>
        </div>

        {/* Graph area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }} ref={containerRef}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#6F9F9C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#64748b' }}>Building dependency graph...</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ padding: '24px', backgroundColor: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '8px', color: '#93000a', fontSize: '14px' }}>{error}</div>
            </div>
          ) : ForceGraph && graphData ? (
            <>
              <ForceGraph
                ref={graphRef}
                width={selectedNode ? dimensions.width - 300 : dimensions.width}
                height={dimensions.height}
                graphData={filteredData}
                nodeId="id"
                nodeLabel={node => node.path || node.id}
                nodeColor={node => node.color}
                nodeRelSize={4}
                nodeVal={() => 1}
                linkColor={() => 'rgba(111,159,156,0.5)'}
                linkWidth={1}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={1}
                linkDirectionalArrowColor={() => 'rgba(111,159,156,0.6)'}
                backgroundColor="#F8F9FA"
                onNodeClick={(node) => setSelectedNode(node)}
                onBackgroundClick={() => setSelectedNode(null)}
                cooldownTicks={150}
                d3AlphaDecay={0.01}
                d3VelocityDecay={0.15}
                onEngineStop={() => graphRef.current?.zoomToFit(500, 100)}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const r = 5;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, r + (isSelected ? 2 : 0), 0, 2 * Math.PI);
                  ctx.fillStyle = isSelected ? '#577E89' : (node.color || '#6F9F9C');
                  ctx.fill();
                  if (isSelected) {
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                  }
                  const label = node.name || node.id.split('/').pop();
                  const fontSize = 10 / globalScale;
                  ctx.font = fontSize + 'px JetBrains Mono, monospace';
                  const textWidth = ctx.measureText(label).width;
                  const bx = node.x - textWidth / 2 - 2;
                  const by = node.y + r + 2;
                  ctx.fillStyle = 'rgba(255,255,255,0.85)';
                  ctx.fillRect(bx, by, textWidth + 4, fontSize + 3);
                  ctx.fillStyle = '#334155';
                  ctx.textAlign = 'center';
                  ctx.fillText(label, node.x, by + fontSize);
                }}
                nodeCanvasObjectMode={() => 'replace'}
              />

              {/* Selected node panel */}
              {selectedNode && (
                <div style={{ width: '300px', flexShrink: 0, backgroundColor: 'white', borderLeft: '1px solid #E2E8F0', overflowY: 'auto', boxShadow: '-4px 0 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(111,159,156,0.1)', border: '1px solid rgba(111,159,156,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#577E89' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>description</span>
                        FILE NODE
                      </span>
                      <button onClick={() => setSelectedNode(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                      </button>
                    </div>
                    <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                      {selectedNode.name || selectedNode.id.split('/').pop()}
                    </h3>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                      {selectedNode.path || selectedNode.id}
                    </p>
                  </div>

                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ padding: '10px', backgroundColor: '#F8F9FA', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Outgoing</div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '20px', fontWeight: 700, color: '#111827' }}>{getOutgoing(selectedNode).length}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b' }}>imports</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#F8F9FA', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Incoming</div>
                      <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '20px', fontWeight: 700, color: '#111827' }}>{getIncoming(selectedNode).length}</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#64748b' }}>imported by</div>
                    </div>
                  </div>

                  {getOutgoing(selectedNode).length > 0 && (
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Imports (Outgoing)
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8' }}>{getOutgoing(selectedNode).length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {getOutgoing(selectedNode).map((n, i) => (
                          <div key={i} onClick={() => setSelectedNode(n)}
                            style={{ padding: '8px 10px', backgroundColor: '#F8F9FA', borderRadius: '4px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6F9F9C'; e.currentTarget.style.backgroundColor = 'rgba(111,159,156,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#F8F9FA'; }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 500, color: '#111827' }}>{n.name || (n.id || '').split('/').pop()}</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.path || n.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {getIncoming(selectedNode).length > 0 && (
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Imported By (Incoming)
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94a3b8' }}>{getIncoming(selectedNode).length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {getIncoming(selectedNode).map((n, i) => (
                          <div key={i} onClick={() => setSelectedNode(n)}
                            style={{ padding: '8px 10px', backgroundColor: '#F8F9FA', borderRadius: '4px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6F9F9C'; e.currentTarget.style.backgroundColor = 'rgba(111,159,156,0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#F8F9FA'; }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 500, color: '#111827' }}>{n.name || (n.id || '').split('/').pop()}</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.path || n.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function GraphPageWrapper() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>Loading...</div>}>
      <GraphPage />
    </Suspense>
  );
}
