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

// Populated from Supabase at runtime
window.TRACKS = [];

// quick lookup
window.SOURCE = Object.fromEntries(window.SOURCES.map(s => [s.id, s]));

// Utility — defined here so it's available synchronously before any Babel scripts
window.formatDate = function(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()];
};
