// Inbox data — tracks auto-ingested from integrations (YouTube Music, Shazam, etc.)
// These are pre-Crate: they carry integration metadata but need user-appended
// source/source-detail/moods/date before being promoted into The Crate.

window.INTEGRATIONS = [
  { id: 'ytm',     label: 'YouTube Music',  glyph: '▶', color: '#ff0033', detail: 'Liked Music playlist' },
  { id: 'shazam',  label: 'Shazam',         glyph: '≋', color: '#0066ff', detail: 'Recently Shazam\u2019d' },
  { id: 'spotify', label: 'Spotify',        glyph: '◉', color: '#1db954', detail: 'Liked Songs' },
];

const ib = (id, title, artist, year, label, genre, bpm, key, integration, ingested, integrationMeta) => ({
  id, title, artist, year, label, genre, bpm, key, integration, ingested, integrationMeta,
  // empty fields waiting for the user
  source: null, sourceDetail: '', mood: '', dateHeard: '', owned: false,
  prices: {
    discogs: Math.floor(5 + Math.random()*30),
    bandcamp: Math.random() > 0.5 ? +(1 + Math.random()*2).toFixed(2) : null,
    beatport: Math.random() > 0.5 ? +(2 + Math.random()*2).toFixed(2) : null,
  },
});

window.INBOX = [
  ib('ib-01','Midnight City','M83',2011,'Mute','Alternative',105,'Am','ytm','2026-04-21T09:12',
    { playlist: 'Liked Music', addedBy: 'you', plays: 47, url: 'youtube.com/watch?v=dX3k_QDnzHE' }),
  ib('ib-02','Whip It','Devo',1980,'Warner Bros.','Alternative',134,'Em','ytm','2026-04-21T08:44',
    { playlist: 'Liked Music', plays: 3, url: 'youtube.com/watch?v=xwJ-8JuF4yI' }),
  ib('ib-03','Got The Love (7\u201d mix)','Florence + The Machine',2009,'Island','Alternative',124,'Bm','shazam','2026-04-20T23:18',
    { location: 'Cafe Paradiso, Melbourne', confidence: 98 }),
  ib('ib-04','Sueño Latino','Sueño Latino',1989,'DFC','House',118,'Am','ytm','2026-04-20T21:02',
    { playlist: 'Liked Music', plays: 14 }),
  ib('ib-05','Watching You','Slave',1980,'Cotillion','Funk',108,'Bbm','spotify','2026-04-20T15:37',
    { playlist: 'Liked Songs', plays: 22 }),
  ib('ib-06','L.O.V.E.','Yello',1988,'Mercury','Italo Disco',120,'Em','ytm','2026-04-20T12:11',
    { playlist: 'Liked Music', plays: 6 }),
  ib('ib-07','Sun Is Shining','Bob Marley',1971,'Tuff Gong','Dub',116,'Am','shazam','2026-04-19T19:40',
    { location: 'Friend\u2019s house, Carlton', confidence: 99 }),
  ib('ib-08','Heaven & Hell Is On Earth','20th Century Steel Band',1975,'United Artists','Disco',112,'Gm','ytm','2026-04-19T14:22',
    { playlist: 'Liked Music', plays: 1 }),
  ib('ib-09','What\u2019s A Girl To Do','Bat For Lashes',2006,'Echo','Alternative',92,'Em','spotify','2026-04-18T22:05',
    { playlist: 'Liked Songs', plays: 11 }),
  ib('ib-10','Going Back To My Roots','Odyssey',1981,'RCA','Disco',118,'Fm','ytm','2026-04-18T10:58',
    { playlist: 'Liked Music', plays: 19 }),
  ib('ib-11','Feels Like I\u2019m In Love','Kelly Marie',1979,'Calibre','Disco',122,'Am','ytm','2026-04-17T16:30',
    { playlist: 'Liked Music', plays: 4 }),
  ib('ib-12','Pump Up The Volume','M|A|R|R|S',1987,'4AD','House',118,'Em','shazam','2026-04-17T11:12',
    { location: 'Chemist Warehouse', confidence: 97 }),
];

window.INTEGRATION = Object.fromEntries(window.INTEGRATIONS.map(i => [i.id, i]));
