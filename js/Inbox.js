// Inbox.jsx — staging area for auto-ingested tracks (YouTube Music, Shazam, CSV, etc.)

function Inbox({ items, onPromote, onDismiss, onUpdate, onImport }) {
  const [expanded, setExpanded] = React.useState(null);
  const [integrationFilter, setIntegrationFilter] = React.useState('all');
  const [uploadMessage, setUploadMessage] = React.useState('');
  const fileInputRef = React.useRef(null);

  const byIntegration = React.useMemo(() => {
    const c = {};
    for (const t of items) c[t.integration] = (c[t.integration]||0)+1;
    return c;
  }, [items]);

  const filtered = integrationFilter === 'all'
    ? items
    : items.filter(t => t.integration === integrationFilter);

  const handleCsvFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = csvToInboxItems(text);
      if (!result.items.length) {
        setUploadMessage(result.error || 'No valid tracks found — title and artist are required.');
      } else {
        onImport(result.items);
        setUploadMessage(`Imported ${result.items.length} track${result.items.length === 1 ? '' : 's'}` +
          (result.skipped ? ` · ${result.skipped} skipped` : ''));
      }
    } catch (err) {
      console.error('[Crate] CSV import failed:', err);
      setUploadMessage('Could not read that CSV file.');
    }
    event.target.value = '';
  };

  return (
    <main className="library inbox-main">
      <div className="lib-head">
        <div>
          <h1>Inbox <span className="inbox-badge">{items.length}</span></h1>
          <div className="sub">Auto-ingested · append your details before moving to The Crate</div>
        </div>
        <div className="stats">
          <div><span className="n">{items.length}</span>pending</div>
          <div><span className="n">{window.INTEGRATIONS.length}</span>integrations</div>
          <div><span className="n" style={{color:'var(--accent)'}}>auto</span>sync · 6h</div>
        </div>
      </div>

      <div className="lib-filter">
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}}>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={handleCsvFile} />
          <button type="button" className="btn ghost sm" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            ⇪ Upload CSV
          </button>
          {uploadMessage && (
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink-3)'}}>{uploadMessage}</span>
          )}
        </div>

        <div className="integrations">
          <span className="int-lbl">Integrations</span>
          {window.INTEGRATIONS.map(i => (
            <div key={i.id} className="int-card">
              <span className="int-g" style={{color:i.color}}>{i.glyph}</span>
              <div className="int-meta">
                <div className="int-name">{i.label}</div>
                <div className="int-sub">{i.detail} · <b>{byIntegration[i.id]||0} new</b></div>
              </div>
              <span className="int-status">●</span>
            </div>
          ))}
          <button className="int-add">+ Add integration</button>
        </div>
      </div>

      <div className="lib-filter" style={{paddingTop:0, borderTop:'none'}}>
        <div className="seg">
          <button aria-pressed={integrationFilter==='all'} onClick={()=>setIntegrationFilter('all')}>
            All · {items.length}
          </button>
          {window.INTEGRATIONS.map(i => (
            <button key={i.id}
              aria-pressed={integrationFilter===i.id}
              onClick={()=>setIntegrationFilter(i.id)}>
              <span style={{marginRight:4, color:i.color}}>{i.glyph}</span>
              {i.label} · {byIntegration[i.id]||0}
            </button>
          ))}
        </div>
      </div>

      <div className="lib-table inbox-list">
        {filtered.length === 0 && (
          <div style={{padding:'60px 20px',textAlign:'center',color:'var(--ink-4)',
            fontFamily:'var(--mono)',fontSize:11,letterSpacing:'.14em',textTransform:'uppercase'}}>
            Inbox empty · everything in The Crate
          </div>
        )}
        {filtered.map(t => (
          <InboxRow
            key={t.id} track={t}
            isExpanded={expanded === t.id}
            onToggle={() => setExpanded(e => e === t.id ? null : t.id)}
            onPromote={onPromote}
            onDismiss={onDismiss}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </main>
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += char;
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field); field = '';
    } else if (char === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(value => value.trim() !== ''));
}

function csvToInboxItems(text) {
  const parsed = parseCsv(text);
  if (!parsed.length) return { items: [], skipped: 0, error: 'The CSV file was empty.' };

  const headers = parsed[0].map(h => h.trim().toLowerCase());
  const col = name => headers.indexOf(name.toLowerCase());
  const required = ['title', 'artist'];
  const missing = required.filter(name => col(name) === -1);
  if (missing.length) return { items: [], skipped: 0, error: `Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.` };

  const value = (row, name) => {
    const index = col(name);
    return index === -1 ? '' : (row[index] || '').trim();
  };
  const number = v => {
    if (!v) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  const bool = v => ['true', 'yes', 'y', '1'].includes(v.toLowerCase());
  const now = new Date().toISOString();
  const items = [];
  let skipped = 0;

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    const title = value(row, 'title');
    const artist = value(row, 'artist');
    if (!title || !artist) { skipped++; continue; }

    const source = value(row, 'source');
    const dateHeard = value(row, 'dateHeard');
    const parsedDate = dateHeard ? new Date(dateHeard) : null;
    const ingested = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : now;

    items.push({
      id: `csv-${Date.now()}-${i}`,
      title,
      artist,
      year: number(value(row, 'year')),
      label: value(row, 'label') || '—',
      genre: value(row, 'genre') || '—',
      bpm: number(value(row, 'bpm')),
      key: value(row, 'key') || null,
      integration: 'csv',
      ingested,
      integrationMeta: { playlist: 'CSV upload' },
      source: window.SOURCES.some(s => s.id === source) ? source : null,
      sourceDetail: value(row, 'sourceDetail'),
      mood: value(row, 'mood'),
      dateHeard,
      notes: value(row, 'notes'),
      owned: bool(value(row, 'owned')),
      prices: { discogs: null, bandcamp: null, beatport: null },
    });
  }

  return { items, skipped, error: '' };
}

function InboxRow({ track, isExpanded, onToggle, onPromote, onDismiss, onUpdate }) {
  const integration = window.INTEGRATION[track.integration];
  const ready = !!(track.source && track.sourceDetail);

  const updateField = (k, v) => onUpdate(track.id, { [k]: v });

  return (
    <div className={`inbox-row ${isExpanded?'open':''} ${ready?'ready':''}`}>
      <div className="inbox-head" onClick={onToggle}>
        <div className="inbox-int" style={{color:integration.color}}>
          {integration.glyph}
        </div>
        <div className="inbox-main-col">
          <div className="inbox-title">
            {track.title}
            <span className="inbox-sep">·</span>
            <span className="inbox-artist">{track.artist}</span>
            {track.year && <span className="inbox-yr">· {track.year}</span>}
          </div>
          <div className="inbox-meta">
            <span>{integration.label}</span>
            <span className="dot">·</span>
            <span>{track.label}</span>
            {track.integrationMeta?.plays && <>
              <span className="dot">·</span>
              <span>{track.integrationMeta.plays} play{track.integrationMeta.plays===1?'':'s'}</span>
            </>}
            {track.integrationMeta?.playlist && <>
              <span className="dot">·</span>
              <span>from {track.integrationMeta.playlist}</span>
            </>}
            {track.integrationMeta?.location && <>
              <span className="dot">·</span>
              <span>at {track.integrationMeta.location}</span>
            </>}
            <span className="dot">·</span>
            <span className="ago">{formatRel(track.ingested)}</span>
          </div>
        </div>
        <div className="inbox-status">
          {ready
            ? <span className="pill pill-ready">READY</span>
            : <span className="pill pill-pending">NEEDS DETAILS</span>}
        </div>
        <div className="inbox-caret">{isExpanded ? '▾' : '▸'}</div>
      </div>

      {isExpanded && (
        <div className="inbox-body">
          <div className="inbox-append">
            <div className="append-lbl">Append details to move this into The Crate</div>

            <div className="field compact">
              <label><span className="num">A</span>Where did you hear it?</label>
              <div className="chips">
                {window.SOURCES.map(s => (
                  <button key={s.id} type="button" className="chip"
                    aria-pressed={track.source===s.id}
                    onClick={()=>updateField('source', s.id)}>
                    <span className="g">{s.glyph}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field compact">
              <label><span className="num">B</span>Source detail</label>
              <input type="text"
                value={track.sourceDetail || ''}
                onChange={e=>updateField('sourceDetail', e.target.value)}
                placeholder={sourceDetailPlaceholderInbox(track.source)}/>
            </div>

            <div className="field compact">
              <label><span className="num">C</span>Mood / tags</label>
              <div className="chips chips-sm">
                {window.MOODS.slice(0,12).map(m => {
                  const active = (track.mood||'').split(',').includes(m);
                  return (
                    <button key={m} type="button" className="chip"
                      aria-pressed={active}
                      onClick={()=>{
                        const arr = (track.mood||'').split(',').filter(Boolean);
                        const next = active ? arr.filter(x=>x!==m) : [...arr, m];
                        updateField('mood', next.join(','));
                      }}>{m}</button>
                  );
                })}
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="field compact">
                <label><span className="num">D</span>Date heard</label>
                <input type="date"
                  value={track.dateHeard || track.ingested.slice(0,10)}
                  onChange={e=>updateField('dateHeard', e.target.value)}/>
              </div>
              <div className="field compact">
                <label><span className="num">E</span>Library</label>
                <label className={`own-check ${track.owned?'on':''}`} style={{padding:'6px 10px'}}>
                  <input type="checkbox" checked={!!track.owned}
                    onChange={e=>updateField('owned', e.target.checked)}/>
                  <span className="box">{track.owned?'✓':''}</span>
                  <span className="txt">I own this</span>
                </label>
              </div>
            </div>

            <div className="inbox-actions">
              <button className="btn ghost sm" onClick={()=>onDismiss(track.id)}>Dismiss</button>
              <div style={{flex:1}}/>
              {!ready && <span className="hint-req">Set source + detail to move</span>}
              <button className="btn" disabled={!ready} onClick={()=>onPromote(track.id)}>
                Move to Crate →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function sourceDetailPlaceholderInbox(s) {
  return {
    radio: 'e.g. NTS — Floating Points',
    mix: 'e.g. Ben UFO — RA.889',
    rec: 'e.g. from Jules',
    ig: 'e.g. @dublab reel / TikTok / Reddit',
    algo: 'e.g. YouTube Music recommendation',
    live: 'e.g. Sub Club, Glasgow',
  }[s] || 'Pick a source above first…';
}

function formatRel(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = (now - then) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/86400)}d ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

Object.assign(window, { Inbox, InboxRow });
