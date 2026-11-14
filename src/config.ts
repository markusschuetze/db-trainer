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
  /** Standardsprache: 'de', 'en' oder 'auto' (Browsersprache) */
  language: string;
  /** Sprachumschalter (DE/EN) in der Kopfzeile anzeigen */
  languageSwitcher: boolean;
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
  /** Adresse des Sammelservers fuer die anonyme Lernstatistik (leer = keine Statistik) */
  analyticsUrl: string;
  /** Eigener Feedbackbogen (z. B. ILIAS-Umfrage, MS Forms); leer = eingebauter Bogen mit GitHub-Meldung */
  feedbackUrl: string;
  /** E-Mail-Adresse fuer Feedback (zeigt zusaetzlich den Knopf "Per E-Mail"); leer = ausgeblendet */
  feedbackEmail: string;
  /** Auswertungen erst ab so vielen verschiedenen Lernenden zeigen (Datenschutz) */
  analyticsMinGroup: number;
  /** Pruefungsreife: so viele vollstaendige Probeklausuren in Folge bestanden ... */
  readyStreak: number;
  /** ... und dieser Anteil der Wissensfragen "sicher" (0 bis 1) */
  readySureShare: number;
}

export const defaults: AppConfig = {
  appName: 'DB-Trainer',
  tagline: 'Datenbanksysteme interaktiv üben · TH Köln, Campus Gummersbach',
  title: '',
  favicon: '',
  logo: '',
  institution: '',
  theme: 'th-koeln',
  language: 'de',
  languageSwitcher: true,
  themeSwitcher: false,
  header: 'farbig',
  colors: {},
  font: '',
  fontUrl: '',
  footerLinks: [
    { label: 'Feedback', href: '#/feedback' },
    { label: 'QR-Code', href: '#/teilen' },
    { label: 'Dozentenmodus', href: '#/dozent' },
    { label: 'Quellcode (MIT)', href: 'https://github.com/markusschuetze/db-trainer' },
  ],
  license: 'Software: MIT · Inhalte: CC BY-SA 4.0',
  repo: 'markusschuetze/db-trainer',
  branch: 'main',
  analyticsUrl: '',
  feedbackUrl: '',
  feedbackEmail: '',
  analyticsMinGroup: 5,
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
    } else if (k === 'language') {
      if (value === 'de' || value === 'en' || value === 'auto') out.language = value;
      else warnings.push('language muss "de", "en" oder "auto" sein.');
    } else if (k === 'analyticsUrl') {
      if (typeof value === 'string' && (value === '' || /^https?:\/\//.test(value))) out.analyticsUrl = value.replace(/\/+$/, '');
      else warnings.push('analyticsUrl muss leer sein oder mit http:// bzw. https:// beginnen.');
    } else if (k === 'analyticsMinGroup') {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 100) out.analyticsMinGroup = value;
      else warnings.push('analyticsMinGroup muss eine ganze Zahl zwischen 1 und 100 sein.');
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
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return; // HTML statt JSON: keine config.json vorhanden
    const { config: merged, warnings } = mergeConfig(defaults, JSON.parse(text));
    Object.assign(config, merged);
    for (const w of warnings) console.warn(`[DB-Trainer] ${w}`);
  } catch (e) {
    console.warn('[DB-Trainer] config.json konnte nicht gelesen werden, es gelten die Standardwerte.', e);
  }
}

/** Nur die vom Standard abweichenden Felder, als config.json-Text (fuer den Design-Editor) */
export function configToJson(cfg: AppConfig): string {
  const out: Record<string, unknown> = {
    _hinweis: 'Branding ohne Programmierung. Datei neben index.html legen, Seite neu laden. Nicht genannte Felder behalten ihren Standardwert. Anleitung: BRANDING.md.',
  };
  for (const k of Object.keys(defaults) as (keyof AppConfig)[]) {
    if (JSON.stringify(cfg[k]) !== JSON.stringify(defaults[k])) out[k] = cfg[k];
  }
  return JSON.stringify(out, null, 2) + '\n';
}

/** Logo/Favicon: Dateiname im Ordner brand/ oder eingebettete Datei (data:) oder Adresse (http) */
export const assetUrl = (v: string, folder = 'brand/') => (/^(data:|https?:\/\/|\/)/.test(v) ? v : `${folder}${v}`);
