// App.jsx — Crate music curation prototype
// Renders form panel + library + drawer + tweaks

const { useState, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────
// Tweaks defaults (must stay a single parsable JSON block)
// ─────────────────────────────────────────────────
const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "font": "sans",
  "density": "compact",
  "layout": "stacked"
}/*EDITMODE-END*/;

// ─────────────────────────────────────────────────
// Form panel
// ─────────────────────────────────────────────────
function FormPanel({ layout, onLog }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [source, setSource] = useState('mix');
  const [sourceDetail, setSourceDetail] = useState('');
  const [moods, setMoods] = useState([]);
  const [customMoods, setCustomMoods] = useState([]); // user-added
  const [moodDraft, setMoodDraft] = useState('');
  const [owned, setOwned] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [lookup, setLookupState] = useState(null); // {state: 'idle'|'loading'|'found', data?}
  const [expanded, setExpanded] = useState(false);
  const [chatStep, setChatStep] = useState(0);

// Real Discogs API lookup
const lookupRef = useRef();
useEffect(() => {
  clearTimeout(lookupRef.current);
  if (!title || !artist) { setLookupState(null); return; }
  setLookupState({ state: 'loading' });
  lookupRef.current = setTimeout(async () => {
    try {
      const query = encodeURIComponent(`${title} ${artist}`);
      const res = await fetch(
        `https://api.discogs.com/database/search?q=${query}&type=release&per_page=1`,
        { headers: { 'User-Agent': 'CrateApp/1.0', 'Authorization': 'Discogs token=LetcheUbtOhLuqncYBHqVKXScpdZfIQIxRJLTnKs' } }
      );
      const data = await res.json();
      const result = data.results?.[0];
      if (result) {
        const year = result.year || null;
        const label = result.label?.[0] || '—';
        const genre = result.genre?.[0] || result.style?.[0] || '—';
        const catno = result.catno || '—';
        setLookupState({ state: 'found', data: { year, label, genre, bpm: null, key: null, catno } });
      } else {
        setLookupState({ state: 'found', data: { year: null, label: '—', genre: '—', bpm: null, key: null, catno: '—' } });
      }
    } catch (e) {
      setLookupState({ state: 'found', data: { year: null, label: '—', genre: '—', bpm: null, key: null, catno: '—' } });
    }
  }, 900);
  return () => clearTimeout(lookupRef.current);
}, [title, artist]);
  
  const toggleMood = (m) => {
    setMoods(ms => ms.includes(m) ? ms.filter(x=>x!==m) : [...ms, m]);
  };
  const addCustomMood = () => {
    const v = moodDraft.trim().toLowerCase().replace(/\s+/g,'-');
    if (!v) return;
    if (!customMoods.includes(v) && !window.MOODS.includes(v)) {
      setCustomMoods(cs => [...cs, v]);
    }
    setMoods(ms => ms.includes(v) ? ms : [...ms, v]);
    setMoodDraft('');
  };
  const removeCustomMood = (m) => {
    setCustomMoods(cs => cs.filter(x => x !== m));
    setMoods(ms => ms.filter(x => x !== m));
  };

  const canSubmit = title.trim() && artist.trim();

  const submit = () => {
    if (!canSubmit) return;
    const data = lookup?.data || {};
    const newTrack = {
      id: 'trk-' + Date.now(),
      title: title.trim(),
      artist: artist.trim(),
      year: data.year || null,
      label: data.label || '—',
      genre: data.genre || '—',
      bpm: data.bpm || null,
      key: data.key || null,
      source,
      sourceDetail: sourceDetail.trim(),
      mood: moods.join(','),
      dateHeard: date,
      owned,
      notes: '',
      _new: true,
    };
    onLog(newTrack);
    setTitle(''); setArtist(''); setSourceDetail(''); setMoods([]);
    setOwned(false);
    setChatStep(0);
    setLookupState(null);
  };

  // Chat-mode steps
  const chatFields = ['title', 'artist', 'source', 'sourceDetail', 'moods', 'date'];
  const totalSteps = chatFields.length;

  const renderField = (name, extraCls='') => {
    const isActive = layout === 'chat' ? chatFields[chatStep] === name : false;
    const cls = ['field', extraCls, isActive ? 'active' : ''].filter(Boolean).join(' ');
    switch (name) {
      case 'title': return (
        <div className={cls} key="f-title">
          <label><span className="num">01</span>Track title<span className="req">*</span></label>
          <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Plastic Dreams" autoFocus={layout==='chat'}/>
        </div>
      );
      case 'artist': return (
        <div className={cls} key="f-artist">
          <label><span className="num">02</span>Artist<span className="req">*</span></label>
          <input type="text" value={artist} onChange={e=>setArtist(e.target.value)} placeholder="e.g. Jaydee"/>
        </div>
      );
      case 'source': return (
        <div className={cls} key="f-source">
          <label><span className="num">03</span>Where did you hear it?</label>
          <div className="chips">
            {window.SOURCES.map(s => (
              <button key={s.id} type="button" className="chip"
                aria-pressed={source===s.id}
                onClick={()=>setSource(s.id)}>
                <span className="g">{s.glyph}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      );
      case 'sourceDetail': return (
        <div className={cls} key="f-sd">
          <label><span className="num">04</span>Source detail <span style={{color:'var(--ink-4)'}}>· which show / who / which mix</span></label>
          <input type="text" value={sourceDetail} onChange={e=>setSourceDetail(e.target.value)} placeholder={sourceDetailPlaceholder(source)}/>
        </div>
      );
      case 'moods': return (
        <div className={cls + ' advanced'} key="f-moods">
          <label><span className="num">05</span>Mood / tags <span style={{color:'var(--ink-4)'}}>· click to toggle, + to add your own</span></label>
          <div className="chips chips-sm">
            {window.MOODS.map(m => (
              <button key={m} type="button" className="chip"
                aria-pressed={moods.includes(m)}
                onClick={()=>toggleMood(m)}>{m}</button>
            ))}
            {customMoods.map(m => (
              <button key={m} type="button" className="chip custom"
                aria-pressed={moods.includes(m)}
                onClick={()=>toggleMood(m)}
                onContextMenu={(e)=>{e.preventDefault();removeCustomMood(m);}}
                title="right-click to remove">
                {m}
                <span className="rm" onClick={(e)=>{e.stopPropagation();removeCustomMood(m);}}>×</span>
              </button>
            ))}
          </div>
          <div className="mood-add">
            <input type="text" value={moodDraft}
              onChange={e=>setMoodDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCustomMood();}}}
              placeholder="+ add custom tag…"/>
            <button type="button" className="btn sm" onClick={addCustomMood} disabled={!moodDraft.trim()}>Add</button>
          </div>
        </div>
      );
      case 'owned': return null;
      case 'date': return (
        <div className={cls + ' advanced'} key="f-date">
          <label><span className="num">06</span>Date heard</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
      );
    }
  };

  return (
    <aside className={`form-panel ${expanded?'expanded':''}`} data-layout={layout}>
      <div className="form-head">
        <h2>Log a track</h2>
        <span className="fno">FORM · 001</span>
      </div>

      {layout==='chat' && (
        <div className="chat-progress">
          Step {chatStep+1} / {totalSteps} · {chatFields[chatStep]}
        </div>
      )}

      {chatFields.map(name => renderField(name))}

      {/* expand-more only in fast layout */}
      {layout === 'fast' && (
        <button className="expand-more" onClick={()=>setExpanded(e=>!e)}>
          + Add mood / date
        </button>
      )}

      {/* Auto-lookup card — hidden in chat layout */}
      {layout !== 'chat' && (
        <div className={`lookup ${lookup?.state==='found'?'has':''}`}>
          {!lookup && <span>Enter title & artist — metadata auto-fetched from Discogs</span>}
          {lookup?.state==='loading' && (
            <span className="src"><span className="pulse"></span>Searching Discogs + MusicBrainz…</span>
          )}
          {lookup?.state==='found' && (
            <>
              <div className="title">Match found</div>
              <div className="row"><span>Year</span><b>{lookup.data.year ?? '—'}</b></div>
              <div className="row"><span>Label</span><b>{lookup.data.label}</b></div>
              <div className="row"><span>Genre</span><b>{lookup.data.genre}</b></div>
              {lookup.data.bpm && <div className="row"><span>BPM · Key</span><b>{lookup.data.bpm} · {lookup.data.key}</b></div>}
              <div className="src">· via Discogs API</div>
            </>
          )}
        </div>
      )}

      {/* Chat nav */}
      <div className="chat-nav">
        <button className="btn ghost sm" disabled={chatStep===0} onClick={()=>setChatStep(s=>Math.max(0,s-1))}>← Back</button>
        {chatStep < totalSteps-1 && <button className="btn sm" onClick={()=>setChatStep(s=>s+1)}>Next →</button>}
        {chatStep === totalSteps-1 && <button className="btn sm" disabled={!canSubmit} onClick={submit}>✓ Log track</button>}
      </div>

      {/* Standard submit */}
      <div className="submit-row">
        <span className="hint"><span className="kbd">⌘</span> <span className="kbd">↵</span> to save</span>
        <button className="btn" disabled={!canSubmit} onClick={submit}>Log track →</button>
      </div>
    </aside>
  );
}

function sourceDetailPlaceholder(s) {
  return {
    radio: 'e.g. NTS — Floating Points',
    mix: 'e.g. Ben UFO — RA.889',
    rec: 'e.g. from Jules',
    ig: 'e.g. @dublab reel / TikTok / Reddit',
    algo: 'e.g. Spotify Discover Weekly',
    live: 'e.g. Sub Club, Glasgow',
  }[s] || '';
}

function generateCatno(label, year) {
  const pre = label.replace(/[^A-Z]/gi,'').slice(0,4).toUpperCase() || 'CAT';
  return `${pre}-${String(year).slice(2)}${Math.floor(Math.random()*999).toString().padStart(3,'0')}`;
}

Object.assign(window, { FormPanel, TWEAKS_DEFAULTS });
