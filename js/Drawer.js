// Drawer.jsx — track detail drawer

function Drawer({ track, onClose, onToggleOwned, onUpdateTrack }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft]     = React.useState(null);
  const [saving, setSaving]   = React.useState(false);

  // Reset edit state whenever a different track is opened
  React.useEffect(() => {
    setEditing(false);
    setDraft(null);
  }, [track?.id]);

  if (!track) {
    return (
      <>
        <div className="drawer-backdrop"></div>
        <div className="drawer"></div>
      </>
    );
  }

  const src = window.SOURCE[track.source];
  const _label = track.label || '';
  const _digits = (track.id || '').replace(/\D/g,'');
  const _num = _digits.length > 0 ? (parseInt(_digits.slice(-6)) % 900 + 100) : Math.floor(Math.random()*900+100);
  const catno = _label && track.year
    ? `${_label.replace(/[^A-Z]/gi,'').slice(0,4).toUpperCase() || 'CAT'}-${String(track.year).slice(2)}${_num}`
    : '—';

  // Store search links
  const SEARCH_STORES = [
    { name: 'Discogs',  buildUrl: (t) => `https://www.discogs.com/search/?q=${encodeURIComponent(t.artist + ' ' + t.title)}&type=release` },
    { name: 'Bandcamp', buildUrl: (t) => `https://bandcamp.com/search?q=${encodeURIComponent(t.artist + ' ' + t.title)}` },
    { name: 'Beatport', buildUrl: (t) => `https://www.beatport.com/search?q=${encodeURIComponent(t.artist + ' ' + t.title)}` },
  ];

  // ── Edit helpers ──────────────────────────────────────────
  const startEditing = () => {
    setDraft({
      title:        track.title       || '',
      artist:       track.artist      || '',
      year:         track.year        ?? '',
      label:        track.label       || '',
      genre:        track.genre       || '',
      bpm:          track.bpm         ?? '',
      key:          track.key         || '',
      source:       track.source      || '',
      sourceDetail: track.sourceDetail|| '',
      mood:         track.mood        || '',
      dateHeard:    track.dateHeard   || '',
      notes:        track.notes       || '',
    });
    setEditing(true);
  };

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const toggleMood = (m) => {
    const arr = (draft.mood || '').split(',').filter(Boolean);
    const next = arr.includes(m) ? arr.filter(x => x !== m) : [...arr, m];
    set('mood', next.join(','));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = {
        ...track,
        ...draft,
        year: draft.year ? parseInt(draft.year) : null,
        bpm:  draft.bpm  ? parseInt(draft.bpm)  : null,
      };

      // Save to Supabase
      const { error } = await window._supabase
        .from('tracks')
        .update({
          title:         updated.title,
          artist:        updated.artist,
          year:          updated.year,
          label:         updated.label,
          genre:         updated.genre,
          bpm:           updated.bpm,
          key:           updated.key,
          source:        updated.source,
          source_detail: updated.sourceDetail,
          mood:          updated.mood,
          date_heard:    updated.dateHeard,
          notes:         updated.notes,
        })
        .eq('id', track.id);

      if (error) throw error;

      onUpdateTrack(updated);
      setEditing(false);
      setDraft(null);
    } catch (err) {
      console.error('[Crate] Failed to save track:', err);
      alert('Save failed — check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(null);
  };
  // ─────────────────────────────────────────────────────────

  const d = draft || track; // what to display

  return (
    <>
      <div className="drawer-backdrop on" onClick={onClose}></div>
      <div className={`drawer on ${track.owned?'is-owned':''}`}>
        <div className="drawer-head">
          <div>
            {editing
              ? <>
                  <input
                    style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,marginBottom:4,width:'100%'}}
                    value={draft.title}
                    onChange={e=>set('title',e.target.value)}
                    placeholder="Title"
                  />
                  <input
                    style={{fontFamily:'var(--font-display)',fontSize:15,fontStyle:'italic',marginBottom:4,width:'100%'}}
                    value={draft.artist}
                    onChange={e=>set('artist',e.target.value)}
                    placeholder="Artist"
                  />
                </>
              : <>
                  <div className="title">{track.title}</div>
                  <div className="artist">{track.artist}</div>
                  <div className="catno">CAT. {catno} · {track.label}{track.year?` · ${track.year}`:''}</div>
                </>
            }
            <label className={`own-check drawer-own ${track.owned?'on':''}`} style={{marginTop:10}}>
              <input type="checkbox" checked={!!track.owned} onChange={()=>onToggleOwned(track.id)}/>
              <span className="box">{track.owned?'✓':''}</span>
              <span className="txt">{track.owned?'In your library':'Mark as owned'}</span>
            </label>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
            {!editing && (
              <button className="btn sm" onClick={startEditing}>Edit</button>
            )}
            <button className="close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        <div className="drawer-body">
          {/* Metadata grid */}
          <div className="meta-grid">
            <div>
              <div className="k">Release year</div>
              {editing
                ? <input className="v mono" type="number" value={draft.year} onChange={e=>set('year',e.target.value)} placeholder="—" style={{width:'100%'}}/>
                : <div className="v mono">{track.year ?? '—'}</div>
              }
            </div>
            <div>
              <div className="k">Label</div>
              {editing
                ? <input className="v" value={draft.label} onChange={e=>set('label',e.target.value)} placeholder="Label" style={{width:'100%'}}/>
                : <div className="v">{track.label}</div>
              }
            </div>
            <div>
              <div className="k">Genre / Style</div>
              {editing
                ? <input className="v" value={draft.genre} onChange={e=>set('genre',e.target.value)} placeholder="Genre" style={{width:'100%'}}/>
                : <div className="v">{track.genre}</div>
              }
            </div>
            <div>
              <div className="k">BPM · Key</div>
              {editing
                ? <div style={{display:'flex',gap:6}}>
                    <input className="v mono" type="number" value={draft.bpm} onChange={e=>set('bpm',e.target.value)} placeholder="BPM" style={{width:'50%'}}/>
                    <input className="v mono" value={draft.key} onChange={e=>set('key',e.target.value)} placeholder="Key" style={{width:'50%'}}/>
                  </div>
                : <div className="v mono">{track.bpm ?? '—'}{track.key?` · ${track.key}`:''}</div>
              }
            </div>
          </div>

          {/* Provenance */}
          <div className="section-h">
            Provenance
            <span className="mini">HOW IT ENTERED THE CRATE</span>
          </div>
          {editing
            ? <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <div className="seg" style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {window.SOURCES.map(s => (
                    <button
                      key={s.id}
                      className={'btn sm' + (draft.source===s.id?' '+'active':' ghost')}
                      onClick={()=>set('source',s.id)}
                      style={draft.source===s.id?{background:'var(--ink)',color:'var(--paper)'}:{}}
                    >
                      <span style={{marginRight:4}}>{s.glyph}</span>{s.label}
                    </button>
                  ))}
                </div>
                <input value={draft.sourceDetail} onChange={e=>set('sourceDetail',e.target.value)} placeholder="Show, mix, who recommended it…" style={{width:'100%'}}/>
                <input type="date" value={draft.dateHeard} onChange={e=>set('dateHeard',e.target.value)} style={{width:'100%'}}/>
              </div>
            : <div className="prov">
                <div className="big">{src?.glyph}</div>
                <div className="txt">
                  <div className="l">{src?.label}</div>
                  <div className="v">{track.sourceDetail || '—'}</div>
                  <div className="d">Heard on {window.formatDate(track.dateHeard)}{track.dateHeard?`, ${track.dateHeard.slice(0,4)}`:''}</div>
                </div>
              </div>
          }

          {/* Mood tags */}
          <div className="section-h" style={{marginTop:16}}>
            Mood
            <span className="mini">USER-TAGGED</span>
          </div>
          <div className="chips chips-sm">
            {window.MOODS.map(m => {
              const active = (d.mood||'').split(',').includes(m);
              return editing
                ? <span key={m} className="chip" aria-pressed={active?'true':'false'} onClick={()=>toggleMood(m)} style={{cursor:'pointer'}}>{m}</span>
                : active
                  ? <span key={m} className="chip" aria-pressed="true">{m}</span>
                  : null;
            })}
          </div>

          {/* Notes */}
          <div className="section-h" style={{marginTop:16}}>Notes</div>
          {editing
            ? <textarea
                value={draft.notes}
                onChange={e=>set('notes',e.target.value)}
                placeholder="Any thoughts on this track…"
                style={{width:'100%',minHeight:72}}
              />
            : <div className="notes-block">{track.notes || <span style={{color:'var(--ink-4)'}}>—</span>}</div>
          }

          {/* Save / cancel */}
          {editing && (
            <div style={{display:'flex',gap:8,marginTop:20}}>
              <button className="btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="btn ghost" onClick={handleCancel} disabled={saving}>Cancel</button>
            </div>
          )}

          {/* Search links */}
          <div className="section-h" style={{marginTop:24}}>Search</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {SEARCH_STORES.map(s => (
              <button
                key={s.name}
                className="btn sm ghost"
                onClick={() => window.open(s.buildUrl(track), '_blank', 'noopener')}
              >{s.name} →</button>
            ))}
          </div>

          {/* Related / meta */}
          <div className="section-h">
            Related by label
            <span className="mini">ON {(track.label || '—').toUpperCase()}</span>
          </div>
          <RelatedList track={track} />
        </div>
      </div>
    </>
  );
}

function RelatedList({ track }) {
  const related = window.TRACKS.filter(t => t.label === track.label && t.id !== track.id).slice(0, 4);
  if (related.length === 0) {
    return <div style={{fontSize:12,color:'var(--ink-4)',fontFamily:'var(--mono)',padding:'4px 0'}}>No other tracks logged on this label.</div>;
  }
  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      {related.map(r => (
        <div key={r.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--rule)',alignItems:'baseline'}}>
          <div>
            <span style={{fontFamily:'var(--font-display)',fontWeight:500}}>{r.title}</span>
            <span style={{color:'var(--ink-3)',fontStyle:'italic',marginLeft:6}}>— {r.artist}</span>
          </div>
          <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink-3)'}}>{r.year}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Drawer });
