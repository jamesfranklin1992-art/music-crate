// Drawer.jsx — track detail drawer

function Drawer({ track, onClose, onToggleOwned }) {
  if (!track) {
    return (
      <>
        <div className="drawer-backdrop"></div>
        <div className="drawer"></div>
      </>
    );
  }

  const src = window.SOURCE[track.source];
  const catno = track.label && track.year
    ? `${track.label.replace(/[^A-Z]/gi,'').slice(0,4).toUpperCase() || 'CAT'}-${String(track.year).slice(2)}${(parseInt(track.id.replace(/\D/g,''))%900+100)}`
    : '—';

  // Price analysis
  const priceEntries = window.STORES.map(store => {
    const p = track.prices?.[store.id];
    const val = p == null ? null : (typeof p === 'string' ? parseFloat(p) : p);
    return { ...store, price: val, raw: p };
  });
  const available = priceEntries.filter(p => p.price != null);
  const best = available.length > 0 ? available.reduce((a,b) => a.price < b.price ? a : b).id : null;

  return (
    <>
      <div className="drawer-backdrop on" onClick={onClose}></div>
      <div className={`drawer on ${track.owned?'is-owned':''}`}>
        <div className="drawer-head">
          <div>
            <div className="title">{track.title}</div>
            <div className="artist">{track.artist}</div>
            <div className="catno">CAT. {catno} · {track.label}{track.year?` · ${track.year}`:''}</div>
            <label className={`own-check drawer-own ${track.owned?'on':''}`} style={{marginTop:10}}>
              <input type="checkbox" checked={!!track.owned} onChange={()=>onToggleOwned(track.id)}/>
              <span className="box">{track.owned?'✓':''}</span>
              <span className="txt">{track.owned?'In your library':'Mark as owned'}</span>
            </label>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="drawer-body">
          {/* Metadata grid */}
          <div className="meta-grid">
            <div>
              <div className="k">Release year</div>
              <div className="v mono">{track.year ?? '—'}</div>
            </div>
            <div>
              <div className="k">Label</div>
              <div className="v">{track.label}</div>
            </div>
            <div>
              <div className="k">Genre / Style</div>
              <div className="v">{track.genre}</div>
            </div>
            <div>
              <div className="k">BPM · Key</div>
              <div className="v mono">{track.bpm ?? '—'}{track.key?` · ${track.key}`:''}</div>
            </div>
          </div>

          {/* Provenance */}
          <div className="section-h">
            Provenance
            <span className="mini">HOW IT ENTERED THE CRATE</span>
          </div>
          <div className="prov">
            <div className="big">{src?.glyph}</div>
            <div className="txt">
              <div className="l">{src?.label}</div>
              <div className="v">{track.sourceDetail || '—'}</div>
              <div className="d">Heard on {window.formatDate(track.dateHeard)}{track.dateHeard?`, ${track.dateHeard.slice(0,4)}`:''}</div>
            </div>
          </div>

          {/* Mood tags */}
          {track.mood && (
            <>
              <div className="section-h">
                Mood
                <span className="mini">USER-TAGGED</span>
              </div>
              <div className="chips chips-sm">
                {track.mood.split(',').filter(Boolean).map(m => (
                  <span key={m} className="chip" aria-pressed="true">{m}</span>
                ))}
              </div>
            </>
          )}

          {/* Notes */}
          {track.notes && (
            <>
              <div className="section-h">Notes</div>
              <div className="notes-block">{track.notes}</div>
            </>
          )}

          {/* Download / price compare */}
          <div className="section-h">
            Where to buy
            <span className="mini">{available.length} / {priceEntries.length} AVAILABLE</span>
          </div>
          <div className="prices">
            {priceEntries.map(p => {
              const isBest = p.id === best;
              const unavail = p.price == null;
              return (
                <div key={p.id} className={`price-row ${isBest?'best':''} ${unavail?'unavail':''}`}>
                  <div className="store">
                    <div className="mark">{p.mark}</div>
                    <div>
                      <div className="name">
                        {p.name}
                        {isBest && <span className="best-badge">Best</span>}
                      </div>
                      <span className="fmt">{p.fmt}</span>
                    </div>
                  </div>
                  <div className="p">{unavail ? 'Not listed' : `$${p.price.toFixed(2)}`}</div>
                  <button className="btn sm" disabled={unavail}>{unavail ? '—' : 'Open →'}</button>
                </div>
              );
            })}
          </div>

          {/* Related / meta */}
          <div className="section-h">
            Related by label
            <span className="mini">ON {track.label.toUpperCase()}</span>
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
