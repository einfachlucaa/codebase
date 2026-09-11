/* ---------- ICON-SYSTEM ----------
   Schlanke Linien-Icons (Feather-Stil) statt Emojis für die UI-Chrome
   (Navigation, Kartentitel, Buttons). stroke="currentColor" -> die Farbe
   ergibt sich automatisch aus dem umgebenden Text (z.B. aktiver Nav-Zustand). */
const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a3 3 0 0 0 3 5"/><path d="M16 5h3a3 3 0 0 1-3 5"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M10 17h4v3h-4Z"/>',
  gamepad: '<rect x="2.5" y="7.5" width="19" height="10" rx="5"/><path d="M7 10.5v4"/><path d="M5 12.5h4"/><circle cx="16" cy="10.5" r="1" fill="currentColor"/><circle cx="18.2" cy="13" r="1" fill="currentColor"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.7 19c.6-3 3-5 6.3-5s5.7 2 6.3 5"/><circle cx="17" cy="8.5" r="2.6"/><path d="M16 13.3c2.6.3 4.4 2 4.9 4.3"/>',
  medal: '<circle cx="12" cy="14.5" r="6"/><path d="M9.5 8.5 7 2h3l2 4.5L14 2h3l-2.5 6.5"/><path d="M10 14.5 11.5 16l3-3.2"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1-4 4-6.2 7.5-6.2s6.5 2.2 7.5 6.2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
  shield: '<path d="M12 3 4.5 6v6c0 5 3.5 7.8 7.5 9 4-1.2 7.5-4 7.5-9V6L12 3Z"/><path d="M9 12l2 2 4-4.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M4.5 12.5 9 17l10.5-11"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9.5c0-1.4 1.3-2.3 3-2.3s3 .8 3 2c0 3-6 1.7-6 4.7 0 1.3 1.3 2.1 3 2.1s3-.9 3-2.3"/><path d="M12 6v1.2M12 16.8V18"/>',
  gem: '<path d="M4 9 12 2l8 7-8 13Z"/><path d="M4 9h16"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.2L6 21V3Z"/>',
  chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"/>',
  upload: '<path d="M12 16V4M12 4 7.5 8.5M12 4l4.5 4.5"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M19.5 19.5 15 15"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  logout: '<path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9"/><path d="M16 16l4-4-4-4"/><path d="M20 12H9"/>',
  cookie: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9.5" r="1" fill="currentColor"/><circle cx="14.5" cy="8.5" r="1" fill="currentColor"/><circle cx="15.5" cy="14" r="1" fill="currentColor"/><circle cx="9.5" cy="15" r="1" fill="currentColor"/>',
  factory: '<path d="M3 20V11l5 3.5V11l5 3.5V8l6 4v8Z"/><path d="M17 8V5h2v3"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.3" cy="8.3" r="1.1" fill="currentColor"/><circle cx="15.7" cy="8.3" r="1.1" fill="currentColor"/><circle cx="8.3" cy="15.7" r="1.1" fill="currentColor"/><circle cx="15.7" cy="15.7" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/>',
  wallet: '<rect x="3" y="6.5" width="18" height="12" rx="2.5"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor"/>',
  flame: '<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3 2-4.8 2.6-7.4.4 1.6 1.4 2.6 2.4 2.6-.2-2.6.8-5 3-6.7-.5 2.3.6 3.8 2 5.4 1.6 1.8 2.5 3.4 2.5 6.1 0 3.4-2.5 6-6 6Z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h18"/>',
  crown: '<path d="M4 8.5 8 12l4-7 4 7 4-3.5V17H4Z"/><path d="M4 20h16"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0v4l1.6 2.5H4.4L6 14Z"/><path d="M10 19.5a2 2 0 0 0 4 0"/>',
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>',
  trash: '<path d="M5 7h14"/><path d="M9 7V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8V7"/><path d="M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7"/>',
  edit: '<path d="M4 20l.9-4.2L15.8 4.9a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.2 19.1 4 20Z"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  warn: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10.5v4"/><circle cx="12" cy="17" r="0.9" fill="currentColor"/>',
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
};
function icon(name, size, extraClass){
  const body = ICONS[name] || ICONS.check;
  size = size || 18;
  return `<svg class="ui-icon ${extraClass||''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
// Logo-Mark für CodeBase: stilisierte spitze Klammern "< >" mit Akzentbalken.
function brandLogo(size){
  size = size || 26;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="vertical-align:-6px;">
    <path d="M9 6 3.5 12 9 18" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 6 20.5 12 15 18" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 4.5 11 19.5" stroke="var(--text-primary)" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}
