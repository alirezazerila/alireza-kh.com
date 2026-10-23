/* Inline SVG icon set — 24×24 stroke icons, drawn to one grid so they sit
   together as a family. No external requests, so the page stays portable. */
const ICON_PATHS = {
  home:        '<path d="M3 10.6 12 3.6l9 7V20a1 1 0 0 1-1 1h-5v-6.2H9V21H4a1 1 0 0 1-1-1z"/>',
  tenure:      '<path d="M4 20.5V11l8-6.5 8 6.5v9.5"/><path d="M9.2 20.5v-5.3h5.6v5.3"/><circle cx="12" cy="10.4" r="1.5"/>',
  built:       '<rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2"/><path d="M3.2 9.8h17.6M8 3.2v4M16 3.2v4"/>',
  floors:      '<path d="M12 3.3 21 8l-9 4.7L3 8z"/><path d="M3 12.4 12 17l9-4.6M3 16.6 12 21.2l9-4.6"/>',
  area:        '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="2"/><path d="M8 3.4v17.2M3.4 16h17.2"/>',
  rooms:       '<rect x="4.4" y="3.3" width="15.2" height="17.4" rx="1.6"/><path d="M9.6 3.3v17.4"/><circle cx="13.4" cy="12" r="1.1"/>',
  people:      '<circle cx="9" cy="8.2" r="3.3"/><path d="M2.8 20.4c0-3.5 2.8-6 6.2-6s6.2 2.5 6.2 6"/><path d="M16.4 5.4a3.3 3.3 0 0 1 0 6.3M17.6 14.9c2.1.7 3.6 2.7 3.6 5.5"/>',
  heating:     '<rect x="4" y="6.6" width="16" height="11" rx="1.6"/><path d="M8.2 6.6v11M12 6.6v11M15.8 6.6v11M6.4 17.6v2.8M17.6 17.6v2.8"/>',
  thermostat:  '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2.3"/>',
  windows:     '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="1.6"/><path d="M12 3.6v16.8M3.6 12h16.8"/>',
  bedroom:     '<path d="M3 19.4v-9.2M3 14.6h18v4.8M3 14.6v-3.2h7.8a3 3 0 0 1 3 3v.2"/><circle cx="7" cy="9.4" r="2.1"/><path d="M21 19.4v-3.2a3.4 3.4 0 0 0-3.4-3.4"/>',
  compass:     '<circle cx="12" cy="12" r="8.8"/><path d="m15.3 8.7-2 5.3-5.3 2 2-5.3z"/>',
  pin:         '<path d="M12 21.4s6.8-6.1 6.8-11A6.8 6.8 0 0 0 5.2 10.4c0 4.9 6.8 11 6.8 11z"/><circle cx="12" cy="10.2" r="2.5"/>',
  temperature: '<path d="M14.2 14.3V5.4a2.2 2.2 0 1 0-4.4 0v8.9a4.3 4.3 0 1 0 4.4 0z"/><path d="M12 9.6v6"/>',
  humidity:    '<path d="M12 3.2s6.3 6.6 6.3 10.6A6.3 6.3 0 1 1 5.7 13.8C5.7 9.8 12 3.2 12 3.2z"/>',
  co2:         '<circle cx="7.6" cy="13" r="3.4"/><circle cx="16.4" cy="9.6" r="3.4"/><path d="M10.6 11.8 13.4 10.8"/><path d="M3 20.6h18"/>',
  light:       '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.6M12 19v2.6M4.2 12H1.6M22.4 12h-2.6M6.5 6.5 4.7 4.7M19.3 19.3l-1.8-1.8M17.5 6.5l1.8-1.8M4.7 19.3l1.8-1.8"/>',
  signal:      '<path d="M4.5 10.5a10.6 10.6 0 0 1 15 0M7.8 13.9a6 6 0 0 1 8.4 0"/><circle cx="12" cy="17.8" r="1.5"/>',
  clock:       '<circle cx="12" cy="12" r="8.8"/><path d="M12 6.8V12l3.6 2.2"/>',
  grid:        '<rect x="3.4" y="3.4" width="7" height="7" rx="1.4"/><rect x="13.6" y="3.4" width="7" height="7" rx="1.4"/><rect x="3.4" y="13.6" width="7" height="7" rx="1.4"/><rect x="13.6" y="13.6" width="7" height="7" rx="1.4"/>',
  users:       '<circle cx="12" cy="7.6" r="3.6"/><path d="M4.6 20.4c0-4 3.3-7.2 7.4-7.2s7.4 3.2 7.4 7.2"/>',
};
function icon(name, size){
  const d = ICON_PATHS[name] || ICON_PATHS.grid;
  return `<svg class="ico" viewBox="0 0 24 24" width="${size||18}" height="${size||18}"
    fill="none" stroke="currentColor" stroke-width="1.6"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
/* which icon belongs to which home-profile field */
const FIELD_ICON = {
  "Home type":"home", "Tenure":"tenure", "Built":"built", "Floors":"floors",
  "Floor area":"area", "Rooms":"rooms", "Occupants":"people", "Heating":"heating",
  "Thermostat":"thermostat", "Windows":"windows", "Bedroom":"bedroom",
  "Bedroom window faces":"compass", "Bedroom side of home":"compass", "ZIP code":"pin",
};
const METRIC_ICON = {
  Temperature:"temperature", Humidity:"humidity", SCD40_CO2:"co2", Lux:"light",
};
