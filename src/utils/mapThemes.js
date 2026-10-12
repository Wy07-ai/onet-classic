export const MAP_THEMES = [
  { id: 'faces', label: 'WAJAH', preview: '🙂', textureKey: 'face-tiles', frameCount: 24 },
  { id: 'countries', label: 'NEGARA', preview: '🌍', textureKey: 'country-tiles', frameCount: 24 },
  { id: 'food', label: 'MAKANAN & MINUMAN', preview: '🍕', textureKey: 'food-tiles', frameCount: 24 },
];

export const MAP_THEME_KEY = 'onet_map_theme';
export const DEFAULT_MAP_THEME_ID = MAP_THEMES[0].id;

let memoryThemeId = DEFAULT_MAP_THEME_ID;

export function getMapTheme(themeId) {
  return MAP_THEMES.find((theme) => theme.id === themeId) ?? MAP_THEMES[0];
}

export function getSelectedMapTheme() {
  try {
    const savedThemeId = globalThis.localStorage?.getItem(MAP_THEME_KEY);
    if (MAP_THEMES.some((theme) => theme.id === savedThemeId)) return getMapTheme(savedThemeId);
  } catch {
    // Browser storage may be unavailable in private mode or restricted contexts.
  }
  return getMapTheme(memoryThemeId);
}

export function setSelectedMapTheme(themeId) {
  const theme = MAP_THEMES.find((candidate) => candidate.id === themeId);
  if (!theme) throw new Error(`Tema map tidak dikenal: ${themeId}`);
  memoryThemeId = theme.id;
  try {
    globalThis.localStorage?.setItem(MAP_THEME_KEY, theme.id);
  } catch {
    // Keep the selection for the current session when browser storage is unavailable.
  }
  return theme;
}
