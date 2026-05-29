// main.js — top-level App with Supabase persistence

const SUPABASE_URL = 'https://hccuqyudoynaakzjklco.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjY3VxeXVkb3luYWFremprbGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMTAxNzEsImV4cCI6MjA5NTU4NjE3MX0.WGPEwVu8Jwz-DCCG4nLDhV4zMa14TqnTH-HXxkVgOtI';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── localStorage helpers (for tweaks only) ─────────────────
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
// ──────────────────────────────────────────────────────────

function App() {
  const [tracks, setTracks]         = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [inbox, setInbox]           = React.useState(() => window.INBOX);
  const [playlists, setPlaylists]   = React.useState(() => loadFromStorage('crate:playlists', []));
  const [view, setView]             = React.useState('crate');
  const [activeId, setActiveId]     = React.useState(null);
  const [filter, setFilter]         = React.useState({ source: 'all', owned: 'all', q: '' });
  const [tweaks, setTweaksState]    = React.useState(() => loadFromStorage('crate:tweaks', window.TWEAKS_DEFAULTS));
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [toast, setToast]           = React.useState(null);

  // ── Apply tweaks to <html> ────────────────────────────────
  React.useEffect(() => {
    document.documentElement.setAttribute('data-font', tweaks.font);
    document.documentElement.setAttribute('data-density', tweaks.density);
  }, [tweaks]);

  // ── Edit mode protocol ────────────────────────────────────
  React.useEffect(() => {
    const handler = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Load tracks from Supabase ─────────────────────────────
  React.useEffect(() => {
    async function fetchTracks() {
      setLoading(true);
      const { data, error } = await db
        .from('tracks')
        .select('*')
        .order('date_heard', { ascending: false });
      if (error) {
        console.error('[Crate] Failed to load tracks:', error);
        setToast('Failed to load tracks — check console');
        setTimeout(() => setToast(null), 3000);
      } else {
        setTracks(data.map(dbToTrack));
      }
      setLoading(false);
    }
    fetchTracks();
  }, []);

  // ── Persist playlists to localStorage ────────────────────
  React.useEffect(() => {
    saveToStorage('crate:playlists', playlists);
  }, [playlists]);

  // ── DB helpers ────────────────────────────────────────────
  function trackToDb(t) {
    return {
      id:            t.id,
      title:         t.title,
      artist:        t.artist,
      year:          t.year ? parseInt(t.year) : null,
      label:         t.label || null,
      genre:         t.genre || null,
      bpm:           t.bpm ? parseInt(t.bpm) : null,
      key:           t.key || null,
      source:        t.source || null,
      source_detail: t.sourceDetail || null,
      mood:          t.mood || null,
      date_heard:    t.dateHeard || null,
      owned:         !!t.owned,
      notes:         t.notes || null,
    };
  }

  function dbToTrack(r) {
    return {
      id:           r.id,
      title:        r.title,
      artist:       r.artist,
      year:         r.year,
      label:        r.label,
      genre:        r.genre,
      bpm:          r.bpm,
      key:          r.key,
      source:       r.source,
      sourceDetail: r.source_detail,
      mood:         r.mood,
      dateHeard:    r.date_heard,
      owned:        r.owned,
      notes:        r.notes,
    };
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // ── Track handlers ────────────────────────────────────────
  const handleLog = async (newTrack) => {
    const { error } = await db.from('tracks').insert(trackToDb(newTrack));
    if (error) {
      console.error('[Crate] Failed to log track:', error);
      showToast('Error saving track — check console');
    } else {
      setTracks(ts => [newTrack, ...ts]);
      showToast('Logged · ' + newTrack.title);
    }
  };

  const handleToggleOwned = async (id) => {
    const track = tracks.find(t => t.id === id);
    if (!track) return;
    const newOwned = !track.owned;
    const { error } = await db.from('tracks').update({ owned: newOwned }).eq('id', id);
    if (!error) setTracks(ts => ts.map(t => t.id === id ? { ...t, owned: newOwned } : t));
  };

  const handleUpdateTrack = async (id, field, value) => {
    const dbField = field === 'sourceDetail' ? 'source_detail' : field === 'dateHeard' ? 'date_heard' : field;
    const { error } = await db.from('tracks').update({ [dbField]: value }).eq('id', id);
    if (!error) setTracks(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // ── Inbox handlers ────────────────────────────────────────
  const handleInboxUpdate = (id, patch) => {
    setInbox(items => items.map(t => t.id === id ? { ...t, ...patch } : t));
  };
  const handleInboxDismiss = (id) => {
    setInbox(items => items.filter(t => t.id !== id));
  };
  const handleInboxPromote = async (id) => {
    const item = inbox.find(t => t.id === id);
    if (!item) return;
    const promoted = {
      ...item,
      id: 'trk-' + Date.now(),
      dateHeard: item.dateHeard || new Date().toISOString().slice(0, 10),
      notes: '',
    };
    const { error } = await db.from('tracks').insert(trackToDb(promoted));
    if (!error) {
      setTracks(ts => [promoted, ...ts]);
      setInbox(items => items.filter(t => t.id !== id));
      showToast('Moved to Crate · ' + item.title);
    }
  };

  // ── Playlist handlers ─────────────────────────────────────
  const handleCreatePlaylist = ({ name, description }) => {
    const pl = { id: 'pl-' + Date.now(), name, description, trackIds: [], createdAt: new Date().toISOString() };
    setPlaylists(ps => [...ps, pl]);
    showToast('Created · ' + name);
  };
  const handleDeletePlaylist = (id) => {
    setPlaylists(ps => ps.filter(p => p.id !== id));
  };
  const handleAddTrackToPlaylist = (playlistId, trackId) => {
    setPlaylists(ps => ps.map(p =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] } : p
    ));
  };
  const handleRemoveTrackFromPlaylist = (playlistId, trackId) => {
    setPlaylists(ps => ps.map(p =>
      p.id === playlistId ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId) } : p
    ));
  };

  const setTweak = (k, v) => {
    setTweaksState(t => {
      const next = { ...t, [k]: v };
      saveToStorage('crate:tweaks', next);
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return next;
    });
  };

  const active = tracks.find(t => t.id === activeId);

  return (
    React.createElement('div', { className: 'app' },
      React.createElement('header', { className: 'brand' },
        React.createElement('div', { className: 'brand-mark' },
          React.createElement('span', { className: 'word' }, 'Crate', React.createElement('span', { className: 'dot' })),
          React.createElement('span', { className: 'sub' }, 'Music curation · est. 2026')
        ),
        React.createElement('nav', { className: 'top-nav' },
          React.createElement('button', { className: 'nav-tab ' + (view === 'crate' ? 'on' : ''), onClick: () => setView('crate') },
            'The Crate ', React.createElement('span', { className: 'n' }, tracks.length)
          ),
          React.createElement('button', {
            className: 'nav-tab',
            disabled: true,
            title: 'Coming Soon',
            style: { opacity: 0.4, cursor: 'not-allowed' }
          },
            'Inbox ', React.createElement('span', { style: { fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 6 } }, 'Coming Soon')
          ),
          React.createElement('button', { className: 'nav-tab ' + (view === 'playlists' ? 'on' : ''), onClick: () => setView('playlists') },
            'Collections ', React.createElement('span', { className: 'n' }, playlists.length)
          )
        ),
        React.createElement('div', { className: 'brand-meta' },
          React.createElement('span', null, React.createElement('b', null, tracks.length), ' logged'),
          React.createElement('span', { style: { color: 'var(--accent)' } }, '●  Online')
        )
      ),

      loading ? React.createElement('div', {
        style: { padding: '60px 32px', fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-4)' }
      }, 'Loading your crate…') :

      view === 'crate' ? React.createElement(React.Fragment, null,
        React.createElement(window.FormPanel, { layout: tweaks.layout, onLog: handleLog }),
        React.createElement(window.Library, { tracks, activeId, onSelect: setActiveId, filter, setFilter })
      ) : view === 'playlists' ? React.createElement(window.Playlists, {
        tracks, playlists,
        onCreatePlaylist: handleCreatePlaylist,
        onDeletePlaylist: handleDeletePlaylist,
        onAddTrack: handleAddTrackToPlaylist,
        onRemoveTrack: handleRemoveTrackFromPlaylist,
      }) : null,

      React.createElement(window.Drawer, { track: active, onClose: () => setActiveId(null), onToggleOwned: handleToggleOwned, onUpdateTrack: handleUpdateTrack }),

      React.createElement('div', { className: 'tweaks ' + (tweaksOpen ? 'on' : '') },
        React.createElement('div', { className: 'tweaks-head' },
          React.createElement('span', null, 'Tweaks'),
          React.createElement('button', { onClick: () => setTweaksOpen(false), style: { border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 14 } }, '×')
        ),
        React.createElement('div', { className: 'tweaks-body' },
          React.createElement('div', { className: 't-field' },
            React.createElement('div', { className: 't-lbl' }, 'Typography'),
            React.createElement('div', { className: 't-seg' },
              [['sans','Sans'],['serif','Serif'],['mono','Mono']].map(([v,l]) =>
                React.createElement('button', { key: v, 'aria-pressed': tweaks.font === v, onClick: () => setTweak('font', v) }, l)
              )
            )
          ),
          React.createElement('div', { className: 't-field' },
            React.createElement('div', { className: 't-lbl' }, 'Density'),
            React.createElement('div', { className: 't-seg' },
              [['compact','Compact'],['cozy','Cozy']].map(([v,l]) =>
                React.createElement('button', { key: v, 'aria-pressed': tweaks.density === v, onClick: () => setTweak('density', v) }, l)
              )
            )
          ),
          React.createElement('div', { className: 't-field' },
            React.createElement('div', { className: 't-lbl' }, 'Form layout'),
            React.createElement('div', { className: 't-seg' },
              [['stacked','Stacked'],['chat','Chat'],['fast','Fast']].map(([v,l]) =>
                React.createElement('button', { key: v, 'aria-pressed': tweaks.layout === v, onClick: () => setTweak('layout', v) }, l)
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'toast ' + (toast ? 'on' : '') },
        React.createElement('span', { className: 'ok' }, '✓'), toast
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
