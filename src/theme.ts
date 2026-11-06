import { config } from './config';

/** Auswaehlbare Designs (Umschalter in der Kopfzeile, falls aktiviert) */
export const themes = ['auto', 'neutral', 'dark', 'th-koeln'] as const;
export const THEME_LABEL: Record<string, string> = {
  auto: 'Automatisch',
  neutral: 'Hell',
  dark: 'Dunkel',
  'th-koeln': 'TH Köln',
};

const valid = (t: string | null): t is string => !!t && (themes as readonly string[]).includes(t);

/** Gewaehltes Design: URL (?theme=) vor eigener Auswahl (nur mit Umschalter) vor Konfiguration */
export function currentTheme(): string {
  try {
    const fromUrl = new URLSearchParams(location.search).get('theme');
    if (valid(fromUrl)) return fromUrl;
    if (config.themeSwitcher) {
      const saved = localStorage.getItem('dbt:theme');
      if (valid(saved)) return saved;
    }
  } catch {
    /* Speicher gesperrt: Standard nutzen */
  }
  return valid(config.theme) ? config.theme : 'auto';
}

const prefersDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

/** Setzt Design, eigene Farben, Schrift, Titel und Favicon. */
export function applyTheme(name = currentTheme(), remember = false) {
  const resolved = name === 'auto' ? (prefersDark() ? 'dark' : 'neutral') : name;
  const root = document.documentElement;
  root.dataset.theme = resolved;

  // Eigene Markenfarben gelten im hellen Design; im dunklen bleiben die Dunkel-Tokens lesbar
  const vars: [string, string | undefined][] = [
    ['--brand', config.colors.brand],
    ['--brand-contrast', config.colors.brandContrast],
    ['--accent', config.colors.accent],
    ['--bg', config.colors.bg],
  ];
  for (const [v, value] of vars) {
    if (value && resolved !== 'dark') root.style.setProperty(v, value);
    else root.style.removeProperty(v);
  }
  if (config.font) root.style.setProperty('--font', config.font);

  if (remember) {
    try {
      localStorage.setItem('dbt:theme', name);
    } catch {
      /* ignorieren */
    }
  }
}

/** Einmalig beim Start: Titel, Favicon, Schrift-Stylesheet, Reaktion auf Hell/Dunkel */
export function applyBranding() {
  document.title = config.title || config.appName;
  if (config.favicon) {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? document.head.appendChild(document.createElement('link'));
    link.rel = 'icon';
    link.href = config.favicon;
  }
  if (config.fontUrl) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = config.fontUrl;
    document.head.appendChild(css);
  }
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
  } catch {
    /* aeltere Browser */
  }
  applyTheme();
}
