// Drawer.js — track detail drawer

function WhereToBuy({ track }) {
  var query = encodeURIComponent(track.artist + ' ' + track.title);
  var stores = [
    { id: 'discogs',  name: 'Discogs',  mark: 'D',  fmt: 'Vinyl',         url: 'https://www.discogs.com/search/?q=' + query + '&type=release' },
    { id: 'bandcamp', name: 'Bandcamp', mark: 'B',  fmt: 'Digital / WAV', url: 'https://bandcamp.com/search?q=' + query },
    { id: 'beatport', name: 'Beatport', mark: 'BP', fmt: 'Digital / MP3', url: 'https://www.beatport.com/search?q=' + query },
  ];
  return (
    <div>
      {stores.map(function(s) {
        return (
          <div key={s.id} className="price-row">
            <div className="store">
              <div className="mark">{s.mark}</div>
              <div>
                <div className="name">{s.name}</div>
                <span className="fmt">{s.fmt}</span>
              </div>
            </div>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn sm" style={{textDecoration:'none'}}>
              Search →
            </a>
          </div>
        );
      })}
    </div>
  );
}

function RelatedList({ track }) {
  var related = window.TRACKS.filter(function(t) { return t.label === track.label && t.id !== track.id; }).slice(0, 4);
  if (related.length === 0) {
    return <div style={{fontSize:12,color:'var(--ink-4)',fontFamily:'var(--mono)',padding:'4px 0'}}>No other tracks logged on this label.</div>;
  }
  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      {related.map(function(r) {
        return (
          <div key={r.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--rule)',alignItems:'baseline'}}>
            <div>
              <span style={{fontFamily:'var(--font-display)',fontWeight:500}}>{r.title}</span>
              <span style={{color:'var(--ink-3)',fontStyle:'italic',marginLeft:6}}>— {r.artist}</span>
            </div>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--ink-3)'}}>{r.year}</span>
          </div>
        );
      })}
    </div>
  );
}

function Drawer({ track, onClose, onToggleOwned }) {
  if (!track) {
    return (
      <div>
        <div className="drawer-backdrop"></div>
        <div className="drawer"></div>
      </div>
    );
  }

  var src = window.SOURCE[track.source];
  var catno = track.label && track.year
    ? track.label.replace(/[^A-Z]/gi,'').slice(0,4).toUpperCase() + '-' + String(track.year).slice(2) + ((parseInt(track.id.replace(/\D/g,''))%900)+100)
    : '—';

  return (
    <div>
      <div className="drawer-backdrop on" onClick={onClose}></div>
      <div className={'drawer on ' + (track.owned ? 'is-owned' : '')}>
        <div className="drawer-head">
          <div>
            <div className="title">{track.title}</div>
            <div className="artist">{track.artist}</div>
            <div className="catno">CAT. {catno} · {track.label}{track.year ? ' · ' + track.year : ''}</div>
            <label className={'own-check drawer-own ' + (track.owned ? 'on' : '')} style={{marginTop:10}}>
              <input type="checkbox" checked={!!track.owned} onChange={function(){ onToggleOwned(track.id); }}/>
              <span className="box">{track.owned ? '✓' : ''}</span>
              <span className="txt">{track.owned ? 'In your library' : 'Mark as owned'}</span>
            </label>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="drawer-body">
          <div className="meta-grid">
            <div>
              <div className="k">Release year</div>
              <div className="v mono">{track.year || '—'}</div>
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
              <div className="v mono">{track.bpm || '—'}{track.key ? ' · ' + track.key : ''}</div>
            </div>
          </div>

          <div className="section-h">
            Provenance
            <span className="mini">HOW IT ENTERED THE CRATE</span>
          </div>
          <div className="prov">
            <div className="big">{src && src.glyph}</div>
            <div className="txt">
              <div className="l">{src && src.label}</div>
              <div className="v">{track.sourceDetail || '—'}</div>
              <div className="d">Heard on {window.formatDate(track.dateHeard)}{track.dateHeard ? ', ' + track.dateHeard.slice(0,4) : ''}</div>
            </div>
          </div>

          {track.mood ? (
            <div>
              <div className="section-h">
                Mood
                <span className="mini">USER-TAGGED</span>
              </div>
              <div className="chips chips-sm">
                {track.mood.split(',').filter(Boolean).map(function(m) {
                  return <span key={m} className="chip" aria-pressed="true">{m}</span>;
                })}
              </div>
            </div>
          ) : null}

          {track.notes ? (
            <div>
              <div className="section-h">Notes</div>
              <div className="notes-block">{track.notes}</div>
            </div>
          ) : null}

          <div className="section-h">
            Where to buy
            <span className="mini">SEARCH STORES</span>
          </div>
          <div className="prices">
            <WhereToBuy track={track} />
          </div>

          <div className="section-h">
            Related by label
            <span className="mini">{'ON ' + track.label.toUpperCase()}</span>
          </div>
          <RelatedList track={track} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Drawer });
