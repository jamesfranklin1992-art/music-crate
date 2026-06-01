// main.js — top-level App + Tweaks wiring

// ── localStorage helpers ───────────────────────────────────
const STORAGE_KEYS = {
  tracks:    'crate:tracks',
  playlists: 'crate:playlists',
  tweaks:    'crate:tweaks',
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('[Crate] Failed to load', key, e);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Crate] Failed to save', key, e);
  }
}

function usePersisted(storageKey, fallback) {
  const [state, setState] = React.useState(() => loadFromStorage(storageKey, fallback));
  const set = React.useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveToStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);
  return [state, set];
}
// ──────────────────────────────────────────────────────────

function App() {
  // Tracks come from Supabase (loaded into window.TRACKS before mount) — not localStorage
  const [tracks, setTracks]       = React.useState(() => {
    localStorage.removeItem(STORAGE_KEYS.tracks); // clear any stale demo data
    return window.TRACKS || [];
  });
  const [playlists, setPlaylists] = usePersisted(STORAGE_KEYS.playlists, []);
  const [tweaks, setTweaksState]  = usePersisted(STORAGE_KEYS.tweaks,    window.TWEAKS_DEFAULTS);
  const [inbox, setInbox]         = React.useState(() => window.INBOX);  // inbox is session-only
  const [view, setView]           = React.useState('crate'); // 'crate' | 'inbox' | 'playlists'
  const [activeId, setActiveId]   = React.useState(null);
  const [filter, setFilter]       = React.useState({ source: 'all', owned: 'all', q: '' });
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [toast, setToast]         = React.useState(null);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-font', tweaks.font);
    document.documentElement.setAttribute('data-density', tweaks.density);
  }, [tweaks]);

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

  const setTweak = (k, v) => {
    setTweaksState(t => {
      const next = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return next;
    });
  };

  const handleToggleOwned = (id) => {
    setTracks(ts => ts.map(t => t.id === id ? { ...t, owned: !t.owned } : t));
  };

  const handleUpdateTrack = (updated) => {
    setTracks(ts => ts.map(t => t.id === updated.id ? updated : t));
    window.TRACKS = window.TRACKS.map(t => t.id === updated.id ? updated : t);
  };

  const handleLog = (newTrack) => {
    setTracks(ts => [newTrack, ...ts]);
    setToast('Logged · ' + newTrack.title);
    setTimeout(() => setToast(null), 2400);
  };

  const handleInboxUpdate = (id, patch) => {
    setInbox(items => items.map(t => t.id === id ? { ...t, ...patch } : t));
  };
  const handleInboxDismiss = (id) => {
    setInbox(items => items.filter(t => t.id !== id));
  };
  const handleInboxPromote = (id) => {
    const item = inbox.find(t => t.id === id);
    if (!item || !item.source) return;
    const promoted = {
      ...item,
      id: 'trk-' + Date.now(),
      dateHeard: item.dateHeard || new Date().toISOString().slice(0, 10),
      notes: '',
      _promoted: true,
      _fromIntegration: item.integration,
    };
    setTracks(ts => [promoted, ...ts]);
    setInbox(items => items.filter(t => t.id !== id));
    setToast('Moved to Crate · ' + item.title);
    setTimeout(() => setToast(null), 2400);
  };

  const handleCreatePlaylist = ({ name, description }) => {
    const pl = {
      id: 'pl-' + Date.now(),
      name,
      description,
      trackIds: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists(ps => [...ps, pl]);
    setToast('Created · ' + name);
    setTimeout(() => setToast(null), 2400);
  };

  const handleDeletePlaylist = (id) => {
    setPlaylists(ps => ps.filter(p => p.id !== id));
  };

  const handleAddTrackToPlaylist = (playlistId, trackId) => {
    setPlaylists(ps => ps.map(p =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId] }
        : p
    ));
  };

  const handleRemoveTrackFromPlaylist = (playlistId, trackId) => {
    setPlaylists(ps => ps.map(p =>
      p.id === playlistId
        ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId) }
        : p
    ));
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
          React.createElement('button', { className: 'nav-tab ' + (view === 'inbox' ? 'on' : ''), onClick: () => setView('inbox') },
            'Inbox ', inbox.length > 0 && React.createElement('span', { className: 'n pulse' }, inbox.length)
          ),
          React.createElement('button', { className: 'nav-tab ' + (view === 'playlists' ? 'on' : ''), onClick: () => setView('playlists') },
            'Collections ', React.createElement('span', { className: 'n' }, playlists.length)
          )
        ),
        React.createElement('div', { className: 'brand-meta' },
          React.createElement('span', null, React.createElement('b', null, tracks.length), ' logged'),
          React.createElement('span', null, React.createElement('b', null, inbox.length), ' pending'),
          React.createElement('span', { style: { color: 'var(--accent)' } }, '●  Online')
        )
      ),
      view === 'crate' ? React.createElement(React.Fragment, null,
        React.createElement(window.FormPanel, { layout: tweaks.layout, onLog: handleLog }),
        React.createElement(window.Library, { tracks, activeId, onSelect: setActiveId, filter, setFilter })
      ) : view === 'inbox' ? React.createElement(window.Inbox, {
        items: inbox, onPromote: handleInboxPromote, onDismiss: handleInboxDismiss, onUpdate: handleInboxUpdate
      }) : React.createElement(window.Playlists, {
        tracks, playlists,
        onCreatePlaylist: handleCreatePlaylist,
        onDeletePlaylist: handleDeletePlaylist,
        onAddTrack: handleAddTrackToPlaylist,
        onRemoveTrack: handleRemoveTrackFromPlaylist,
      }),
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

function mountApp() {
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
}

// Wait for Supabase data before mounting.
// If crate:ready already fired before Babel finished compiling this file, mount now.
if (window._crateReady) {
  mountApp();
} else {
  document.addEventListener('crate:ready', mountApp, { once: true });
}
