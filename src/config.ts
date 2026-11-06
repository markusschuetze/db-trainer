// Konfiguration und Branding.
//
// Ohne Programmierung: Im fertigen Paket liegt neben index.html die Datei config.json.
// Alles, was dort steht, ueberschreibt die Standardwerte unten, beim naechsten Laden der
// Seite, ohne neuen Build. Fehlt die Datei oder ist sie fehlerhaft, gelten die Standardwerte.

export interface FooterLink {
  label: string;
  href: string;
}

export interface BrandColors {
  /** Kopfzeile, Hauptknoepfe */
  brand?: string;
  /** Schrift auf der Markenfarbe */
  brandContrast?: string;
  /** Fokusrahmen, Hervorhebungen */
  accent?: string;
  /** Seitenhintergrund */
  bg?: string;
}

export interface AppConfig {
  appName: string;
  tagline: string;
  /** Titel im Browser-Tab; leer = appName */
  title: string;
  /** Favicon-Datei relativ zu index.html, z. B. "brand/favicon.png"; leer = Standard */
  favicon: string;
  /** Logo-Datei im Ordner brand/, z. B. "logo.svg"; leer = kein Logo */
  logo: string;
  /** Name der Einrichtung (Alternativtext des Logos) */
  institution: string;
  /** 'auto' (hell/dunkel nach Systemeinstellung), 'neutral', 'dark' oder 'th-koeln' */
  theme: string;
  /** Design-Auswahl in der Kopfzeile anzeigen */
  themeSwitcher: boolean;
  /** Kopfzeile 'farbig' (Markenfarbe) oder 'hell' (weiss, passend fuer farbige Logos) */
  header: string;
  /** Eigene Farben (helles Design); ueberschreiben das Theme */
  colors: BrandColors;
  /** Schriftart (CSS font-family), z. B. "'Source Sans 3', sans-serif" */
  font: string;
  /** Optional: Stylesheet fuer die Schrift (z. B. Google Fonts oder lokale Datei) */
  fontUrl: string;
  footerLinks: FooterLink[];
  license: string;
  /** Repository fuer den Aufgaben-Editor ("Auf GitHub speichern"); leer = Knopf ausblenden */
  repo: string;
  branch: string;
  /** Pruefungsreife: so viele vollstaendige Probeklausuren in Folge bestanden ... */
  readyStreak: number;
  /** ... und dieser Anteil der Wissensfragen "sicher" (0 bis 1) */
  readySureShare: number;
}

export const defaults: AppConfig = {
  appName: 'DB-Trainer',
  tagline: 'Datenbanksysteme interaktiv üben',
  title: '',
  favicon: '',
  logo: '',
  institution: '',
  theme: 'auto',
  themeSwitcher: false,
  header: 'farbig',
  colors: {},
  font: '',
  fontUrl: '',
  footerLinks: [
    { label: 'Aufgabe hinzufügen (für Lehrende)', href: '#/autor' },
    { label: 'Quellcode (MIT)', href: 'https://github.com/markusschuetze/db-trainer' },
  ],
  license: 'Software: MIT · Inhalte: CC BY-SA 4.0',
  repo: 'markusschuetze/db-trainer',
  branch: 'main',
  readyStreak: 3,
  readySureShare: 0.8,
};

/** Aktive Konfiguration (wird beim Start mit config.json ergaenzt) */
export const config: AppConfig = structuredClone(defaults);

const isColor = (v: unknown) => typeof v === 'string' && /^(#[0-9a-f]{3,8}|rgb|hsl|oklch|[a-z]+$)/i.test(v.trim());

/**
 * Uebernimmt nur bekannte Felder mit passendem Typ. Unbekannte oder falsch
 * geschriebene Felder werden gemeldet und ignoriert, damit ein Tippfehler die
 * Seite nicht lahmlegt.
 */
export function mergeConfig(base: AppConfig, input: unknown): { config: AppConfig; warnings: string[] } {
  const out: AppConfig = structuredClone(base);
  const warnings: string[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { config: out, warnings: ['config.json ist kein Objekt.'] };
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key.startsWith('_')) continue; // Kommentare wie "_hinweis"
    if (!(key in base)) {
      warnings.push(`Unbekanntes Feld „${key}“ wird ignoriert.`);
      continue;
    }
    const k = key as keyof AppConfig;
    const expected = base[k];
    if (k === 'footerLinks') {
      if (Array.isArray(value) && value.every((l) => l && typeof l.label === 'string' && typeof l.href === 'string'))
        out.footerLinks = value as FooterLink[];
      else warnings.push('footerLinks muss eine Liste aus { "label": "…", "href": "…" } sein.');
    } else if (k === 'colors') {
      if (value && typeof value === 'object') {
        for (const [ck, cv] of Object.entries(value as Record<string, unknown>)) {
          if (['brand', 'brandContrast', 'accent', 'bg'].includes(ck) && isColor(cv)) out.colors[ck as keyof BrandColors] = String(cv);
          else warnings.push(`Farbe „${ck}“ ist ungültig oder unbekannt.`);
        }
      } else warnings.push('colors muss ein Objekt sein.');
    } else if (k === 'readySureShare') {
      if (typeof value === 'number' && value >= 0 && value <= 1) out.readySureShare = value;
      else warnings.push('readySureShare muss eine Zahl zwischen 0 und 1 sein, z. B. 0.8.');
    } else if (k === 'readyStreak') {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10) out.readyStreak = value;
      else warnings.push('readyStreak muss eine ganze Zahl zwischen 1 und 10 sein.');
    } else if (typeof value === typeof expected) {
      (out as unknown as Record<string, unknown>)[k] = value;
    } else warnings.push(`Feld „${key}“ hat den falschen Typ (erwartet: ${typeof expected}).`);
  }
  return { config: out, warnings };
}

/** Laedt config.json neben index.html (falls vorhanden). */
export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('./config.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const { config: merged, warnings } = mergeConfig(defaults, await res.json());
    Object.assign(config, merged);
    for (const w of warnings) console.warn(`[DB-Trainer] ${w}`);
  } catch (e) {
    console.warn('[DB-Trainer] config.json konnte nicht gelesen werden, es gelten die Standardwerte.', e);
  }
}
