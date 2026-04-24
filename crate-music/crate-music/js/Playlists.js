// Playlists.js — Collections / Playlists feature
// Allows users to group tracks into named collections (e.g. "Summer 2026", "Warm-up sets")

function Playlists({ tracks, playlists, onCreatePlaylist, onDeletePlaylist, onAddTrack, onRemoveTrack }) {
  const [view, setView] = React.useState('list'); // 'list' | 'detail'
  const [activePlaylist, setActivePlaylist] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');
  const [addingTrack, setAddingTrack] = React.useState(false);
  const [trackSearch, setTrackSearch] = React.useState('');

  const openPlaylist = (pl) => {
    setActivePlaylist(pl);
    setView('detail');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreatePlaylist({ name: newName.trim(), description: newDesc.trim() });
    setNewName('');
    setNewDesc('');
    setCreating(false);
  };

  const playlistTracks = (pl) =>
    (pl.trackIds || []).map(id => tracks.find(t => t.id === id)).filter(Boolean);

  const searchResults = trackSearch.trim()
    ? tracks.filter(t =>
        t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
        t.artist.toLowerCase().includes(trackSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  // Keep activePlaylist in sync with playlists prop (e.g. after adding a track)
  const currentPlaylist = activePlaylist
    ? playlists.find(p => p.id === activePlaylist.id) || activePlaylist
    : null;

  if (view === 'detail' && currentPlaylist) {
    const plTracks = playlistTracks(currentPlaylist);
    return (
      <main className="library">
        <div className="lib-head">
          <div>
            <button
              onClick={() => { setView('list'); setActivePlaylist(null); setAddingTrack(false); setTrackSearch(''); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ← All collections
            </button>
            <h1 style={{ margin: 0 }}>{currentPlaylist.name}</h1>
            {currentPlaylist.description && (
              <div className="sub">{currentPlaylist.description}</div>
            )}
          </div>
          <div className="stats">
            <div><span className="n">{plTracks.length}</span>tracks</div>
            <div><span className="n">{new Set(plTracks.map(t => t.artist)).size}</span>artists</div>
          </div>
        </div>

        {/* Add track bar */}
        <div className="lib-filter">
          {!addingTrack ? (
            <button className="btn sm" onClick={() => setAddingTrack(true)}>+ Add tracks</button>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
              <div className="search" style={{ flex: 1 }}>
                <span className="icn">⌕</span>
                <input
                  type="text"
                  autoFocus
                  placeholder="Search tracks to add…"
                  value={trackSearch}
                  onChange={e => setTrackSearch(e.target.value)}
                />
              </div>
              <button className="btn ghost sm" onClick={() => { setAddingTrack(false); setTrackSearch(''); }}>Done</button>
            </div>
          )}
        </div>

        {/* Track search results */}
        {addingTrack && searchResults.length > 0 && (
          <div style={{ padding: '0 32px 12px', borderBottom: '1px solid var(--rule)' }}>
            {searchResults.map(t => {
              const alreadyIn = (currentPlaylist.trackIds || []).includes(t.id);
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{t.title}</span>
                    <span style={{ color: 'var(--ink-3)', marginLeft: 8, fontStyle: 'italic' }}>{t.artist}</span>
                  </div>
                  <button
                    className={`btn sm ${alreadyIn ? 'ghost' : ''}`}
                    disabled={alreadyIn}
                    onClick={() => { onAddTrack(currentPlaylist.id, t.id); setTrackSearch(''); }}
                  >
                    {alreadyIn ? 'Already added' : 'Add →'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Track list */}
        <div className="lib-table">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Title · Artist</th>
                <th style={{ width: 150 }}>Label</th>
                <th style={{ width: 60, textAlign: 'right' }}>BPM</th>
                <th style={{ width: 90, textAlign: 'right' }}>Heard</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {plTracks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-4)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                    No tracks yet · click "+ Add tracks" above
                  </td>
                </tr>
              )}
              {plTracks.map((t, i) => (
                <tr key={t.id}>
                  <td className="num" style={{ color: 'var(--ink-4)', fontSize: 11 }}>{String(i + 1).padStart(3, '0')}</td>
                  <td className="title-cell">
                    {t.title}
                    <span className="yr">· {t.artist}{t.year ? ` · ${t.year}` : ''}</span>
                  </td>
                  <td className="label-cell">{t.label}</td>
                  <td className="num">{t.bpm ?? '—'}</td>
                  <td className="num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{window.formatDate ? window.formatDate(t.dateHeard) : t.dateHeard}</td>
                  <td>
                    <button
                      onClick={() => onRemoveTrack(currentPlaylist.id, t.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)', padding: '4px 8px' }}
                      title="Remove from collection"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  return (
    <main className="library">
      <div className="lib-head">
        <div>
          <h1>Collections</h1>
          <div className="sub">Curated playlists · group your tracks by mood, set, or moment</div>
        </div>
        <div className="stats">
          <div><span className="n">{playlists.length}</span>collections</div>
          <div><span className="n">{playlists.reduce((n, p) => n + (p.trackIds || []).length, 0)}</span>total tracks</div>
        </div>
      </div>

      <div className="lib-filter">
        {!creating ? (
          <button className="btn sm" onClick={() => setCreating(true)}>+ New collection</button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flex: 1, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
              <input
                type="text"
                autoFocus
                placeholder="Collection name…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); setNewDesc(''); } }}
              />
            </div>
            <div className="field" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Description (optional)…"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              />
            </div>
            <button className="btn sm" disabled={!newName.trim()} onClick={handleCreate}>Create →</button>
            <button className="btn ghost sm" onClick={() => { setCreating(false); setNewName(''); setNewDesc(''); }}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {playlists.length === 0 && !creating && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--ink-4)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            No collections yet · create your first above
          </div>
        )}
        {playlists.map(pl => {
          const plTracks = playlistTracks(pl);
          const preview = plTracks.slice(0, 3);
          return (
            <div
              key={pl.id}
              onClick={() => openPlaylist(pl)}
              style={{
                border: '1px solid var(--ink)',
                background: 'var(--card)',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all .12s',
                position: 'relative',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
            >
              {/* Delete button */}
              <button
                onClick={e => { e.stopPropagation(); onDeletePlaylist(pl.id); }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-4)', padding: '2px 6px' }}
                title="Delete collection"
              >×</button>

              {/* Vinyl-style accent mark */}
              <div style={{ width: 32, height: 32, border: '1px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }}></div>
              </div>

              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em', paddingRight: 20 }}>{pl.name}</div>
              {pl.description && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{pl.description}</div>
              )}

              {/* Preview tracks */}
              <div style={{ marginTop: 12, borderTop: '1px solid var(--rule)', paddingTop: 10 }}>
                {preview.length === 0 && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Empty · tap to add tracks</div>
                )}
                {preview.map(t => (
                  <div key={t.id} style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500, fontFamily: 'var(--font-display)' }}>{t.title}</span>
                    <span style={{ color: 'var(--ink-4)', marginLeft: 6 }}>— {t.artist}</span>
                  </div>
                ))}
                {plTracks.length > 3 && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                    + {plTracks.length - 3} more
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {plTracks.length} track{plTracks.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>Open →</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

Object.assign(window, { Playlists });
