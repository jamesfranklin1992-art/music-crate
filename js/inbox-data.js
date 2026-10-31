// Inbox data — CSV-imported tracks are added to the Inbox at runtime.
// The default Inbox is intentionally empty.

window.INTEGRATIONS = [
  { id: 'csv', label: 'CSV import', glyph: '⇪', color: '#f5a524', detail: 'Uploaded CSV file' },
  { id: 'ytm', label: 'YouTube Music', glyph: '▶', color: '#ff0033', detail: 'Liked Music playlist' },
  { id: 'shazam', label: 'Shazam', glyph: '≋', color: '#0066ff', detail: 'Recently Shazam\u2019d' },
  { id: 'spotify', label: 'Spotify', glyph: '◉', color: '#1db954', detail: 'Liked Songs' },
];

window.INBOX = [];

window.INTEGRATION = Object.fromEntries(window.INTEGRATIONS.map(i => [i.id, i]));
