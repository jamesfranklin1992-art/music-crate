window.SOURCES = [
  { id: 'radio',   label: 'Radio',           glyph: '◉' },
  { id: 'mix',     label: 'DJ Mix',          glyph: '◐' },
  { id: 'rec',     label: 'Recommendation',  glyph: '☉' },
  { id: 'ig',      label: 'Social Media',    glyph: '◇' },
  { id: 'algo',    label: 'Algorithm',       glyph: '△' },
  { id: 'live',    label: 'Live / Club',     glyph: '◼' },
];

window.MOODS = [
  'peak-time','warm-up','after-hours','sunday','driving','cooking',
  'heater','slow-burn','weapon','sentimental','hypnotic','raw',
  'euphoric','dubby','acid','soulful','stripped','party'
];

window.TRACKS = [];

window.SOURCE = Object.fromEntries(window.SOURCES.map(s => [s.id, s]));
