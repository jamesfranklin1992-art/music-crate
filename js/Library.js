// Library.js — track table with sortable columns

function Library({ tracks, activeId, onSelect, filter, setFilter }) {
  const [sort, setSort] = React.useState({ col: 'dateHeard', dir: 'desc' });

  const toggleSort = function(col) {
    setSort(function(s) {
      return s.col === col
        ? { col: col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { col: col, dir: 'asc' };
    });
  };

  const arrow = function(col) {
    if (sort.col !== col) return React.createElement('span', { style: { opacity: 0.2, marginLeft: 4 } }, '↕');
    return React.createElement('span', { style: { marginLeft: 4 } }, sort.dir === 'asc' ? '↑' : '↓');
  };

  const filtered = tracks.filter(function(t) {
    if (filter.source !== 'all' && t.source !== filter.source) return false;
    if (filter.owned === 'owned' && !t.owned) return false;
    if (filter.owned === 'unowned' && t.owned) return false;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      return (
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.artist && t.artist.toLowerCase().includes(q)) ||
        (t.label && t.label.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const sorted = filtered.slice().sort(function(a, b) {
    var av = a[sort.col];
    var bv = b[sort.col];
    if (av == null) return 1;
    if (bv == null) return -1;
    var cmp;
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv;
    } else {
      cmp = String(av).toLowerCase() < String(bv).toLowerCase() ? -1 : String(av).toLowerCase() > String(bv).toLowerCase() ? 1 : 0;
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const thStyle = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

  return (
    <main className="library">
      <div className="lib-head">
        <div>
          <h1>The Crate</h1>
          <div className="sub">Your personal record of heard music</div>
        </div>
        <div className="stats">
          <div><span className="n">{tracks.length}</span>logged</div>
          <div><span className="n">{tracks.filter(function(t){ return t.owned; }).length}</span>owned</div>
          <div><span className="n">{new Set(tracks.map(function(t){ return t.artist; })).size}</span>artists</div>
        </div>
      </div>

      <div className="lib-filter">
        <div className="search">
          <span className="icn">⌕</span>
          <input
            type="text"
            placeholder="Search title, artist, label, genre…"
            value={filter.q}
            onChange={function(e){ setFilter(function(f){ return Object.assign({}, f, { q: e.target.value }); }); }}
          />
        </div>
        <div className="chips">
          {window.SOURCES.map(function(s) {
            return React.createElement('button', {
              key: s.id,
              className: 'chip',
              'aria-pressed': filter.source === s.id,
              onClick: function(){ setFilter(function(f){ return Object.assign({}, f, { source: filter.source === s.id ? 'all' : s.id }); }); }
            }, s.glyph, ' ', s.label);
          })}
        </div>
        <label className="own-check">
          <input
            type="checkbox"
            checked={filter.owned === 'owned'}
            onChange={function(e){ setFilter(function(f){ return Object.assign({}, f, { owned: e.target.checked ? 'owned' : 'all' }); }); }}
          />
          <span className="box">{filter.owned === 'owned' ? '✓' : ''}</span>
          <span className="txt">Owned only</span>
        </label>
      </div>

      <div className="lib-table">
        <table className="tbl">
          <thead>
              <tr>
              <th style={{ width: 32 }}>#</th>
              <th style={thStyle} onClick={function(){ toggleSort('title'); }}>
                Title · Artist {arrow('title')}
              </th>
              <th style={Object.assign({ width: 150 }, thStyle)} onClick={function(){ toggleSort('label'); }}>
                Label {arrow('label')}
              </th>
              <th style={Object.assign({ width: 100 }, thStyle)} onClick={function(){ toggleSort('source'); }}>
                Source {arrow('source')}
              </th>
              <th style={Object.assign({ width: 60, textAlign: 'right' }, thStyle)} onClick={function(){ toggleSort('bpm'); }}>
                BPM {arrow('bpm')}
              </th>
              <th style={{ width: 140 }}>Mood / Tags</th>
              <th style={Object.assign({ width: 90, textAlign: 'right' }, thStyle)} onClick={function(){ toggleSort('dateHeard'); }}>
                Heard {arrow('dateHeard')}
              </th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-4)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  No tracks found
                </td>
              </tr>
            )}
            {sorted.map(function(t, i) {
              return (
                <tr
                  key={t.id}
                  className={activeId === t.id ? 'active' : ''}
                  onClick={function(){ onSelect(t.id); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="num" style={{ color: 'var(--ink-4)', fontSize: 11 }}>{String(i + 1).padStart(3, '0')}</td>
                  <td className="title-cell">
                    {t.title}
                    <span className="yr">· {t.artist}{t.year ? ' · ' + t.year : ''}</span>
                  </td>
                  <td className="label-cell">{t.label}</td>
                  <td style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {t.source && window.SOURCE[t.source] ? window.SOURCE[t.source].glyph + ' ' + window.SOURCE[t.source].label : '—'}
                  </td>
                  <td className="num">{t.bpm || '—'}</td>
                  <td style={{ fontSize: 11 }}>
                    {t.mood ? t.mood.split(',').filter(Boolean).map(function(m) {
                      return React.createElement('span', { key: m, className: 'chip', style: { marginRight: 4, fontSize: 10 } }, m);
                    }) : '—'}
                  </td>
                  <td className="num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  </td>
                  <td>
                    {t.owned && React.createElement('span', { style: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' } }, '✓')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

Object.assign(window, { Library });
