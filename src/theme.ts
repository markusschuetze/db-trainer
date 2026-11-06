import { config } from './config';

export const themes = ['neutral', 'institution-example', 'dark'] as const;

export function currentTheme(): string {
  try {
    const fromUrl = new URLSearchParams(location.search).get('theme');
    if (fromUrl && (themes as readonly string[]).includes(fromUrl)) return fromUrl;
    const saved = localStorage.getItem('dbt:theme');
    if (saved && (themes as readonly string[]).includes(saved)) return saved;
  } catch {
    /* Speicher gesperrt: Standard nutzen */
  }
  return config.theme;
}

export function applyTheme(name = currentTheme()) {
  document.documentElement.dataset.theme = name;
  try {
    localStorage.setItem('dbt:theme', name);
  } catch {
    /* ignorieren */
  }
}
