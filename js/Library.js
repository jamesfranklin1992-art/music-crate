// Library.jsx — scrollable table of logged tracks with filters

const { useState: useStateL, useMemo: useMemoL } = React;

function Library({ tracks, activeId, onSelect, filter, setFilter }) {
  const filtered = useMemoL(() => {
    let list = [...tracks].sort((a,b) => b.dateHeard.localeCompare(a.dateHeard));
    if (filter.source !== 'all') list = list.filter(t => t.source === filter.source);
    if (filter.owned === 'owned') list = list.filter(t => t.owned);
    if (filter.owned === 'wishlist') list = list.filter(t => !t.owned);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.label || '').toLowerCase().includes(q) ||
        (t.mood || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [tracks, filter]);

  const bySource = useMemoL(() => {
    const counts = {};
    for (const t of tracks) counts[t.source] = (counts[t.source]||0)+1;
    return counts;
  }, [tracks]);

  return (
    <main className="library">
      <div className="lib-head">
        <div>
          <h1>The Crate</h1>
          <div className="sub">Logbook · all sources · sorted by date heard</div>
        </div>
        <div className="stats">
          <div><span className="n">{tracks.length}</span>tracks</div>
          <div><span className="n">{new Set(tracks.map(t=>t.artist)).size}</span>artists</div>
          <div><span className="n">{new Set(tracks.map(t=>t.label)).size}</span>labels</div>
        </div>
      </div>

      <div className="lib-filter">
        <div className="search">
          <span className="icn">⌕</span>
          <input
            type="text"
            placeholder="Search title, artist, label, mood…"
            value={filter.q}
            onChange={e=>setFilter(f=>({...f, q: e.target.value}))}
          />
        </div>
        <div className="seg">
          <button aria-pressed={filter.source==='all'} onClick={()=>setFilter(f=>({...f,source:'all'}))}>All · {tracks.length}</button>
          {window.SOURCES.map(s => (
            <button key={s.id} aria-pressed={filter.source===s.id} onClick={()=>setFilter(f=>({...f,source:s.id}))}>
              <span style={{marginRight:4,opacity:.7}}>{s.glyph}</span>
              {s.label} · {bySource[s.id]||0}
            </button>
          ))}
        </div>
        <div className="seg">
          <button aria-pressed={!filter.owned || filter.owned==='all'} onClick={()=>setFilter(f=>({...f,owned:'all'}))}>All</button>
          <button aria-pressed={filter.owned==='owned'} onClick={()=>setFilter(f=>({...f,owned:'owned'}))}>■ Owned · {tracks.filter(t=>t.owned).length}</button>
          <button aria-pressed={filter.owned==='wishlist'} onClick={()=>setFilter(f=>({...f,owned:'wishlist'}))}>□ Wishlist · {tracks.filter(t=>!t.owned).length}</button>
        </div>
      </div>

      <div className="lib-table">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:32}}>#</th>
              <th>Title · Artist</th>
              <th style={{width:80}}>Owned</th>
              <th style={{width:150}}>Label</th>
              <th style={{width:140}}>Source</th>
              <th style={{width:170}}>Mood</th>
              <th style={{width:60}} className="num">BPM</th>
              <th style={{width:90}} className="num">Heard</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const src = window.SOURCE[t.source];
              return (
                <tr key={t.id} className={`${activeId===t.id?'active':''} ${t.owned?'owned':''}`} onClick={()=>onSelect(t.id)}>
                  <td className="num own-cell">
                    {t.owned
                      ? <span className="own-dot" title="Owned">■</span>
                      : <span style={{color:'var(--ink-4)',fontSize:11}}>{String(i+1).padStart(3,'0')}</span>}
                  </td>
                  <td className="title-cell">
                    {t.title}
                    <span className="yr">· {t.artist}{t.year?` · ${t.year}`:''}</span>
                  </td>
                  <td className="own-tag-cell">
                    {t.owned && <span className="own-tag">OWNED</span>}
                  </td>
                  <td className="label-cell">{t.label}</td>
                  <td>
                    <span className="src-tag"><span className="g">{src?.glyph}</span>{src?.label}</span>
                  </td>
                  <td className="moods">{(t.mood||'').replace(/,/g,' · ')}</td>
                  <td className="num">{t.bpm ?? '—'}</td>
                  <td className="num" style={{fontSize:11,color:'var(--ink-3)'}}>{formatDate(t.dateHeard)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{padding:'40px 20px',textAlign:'center',color:'var(--ink-4)',fontFamily:'var(--mono)',fontSize:11,letterSpacing:'.1em',textTransform:'uppercase'}}>No tracks match</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

Object.assign(window, { Library, formatDate });
