// Mehrsprachigkeit (Deutsch, Englisch).
//
// Schluessel ist der deutsche Text selbst: t('Starten') liefert in der englischen Fassung 'Start'.
// Fehlt eine Uebersetzung, erscheint der deutsche Text (nie ein technischer Schluessel).
// Platzhalter: t('{n} Aufgaben', { n: 5 }).
// Ein Test stellt sicher, dass jeder im Code mit t('…') markierte Text eine englische Fassung hat.

import { en } from './i18n.en';

export type Lang = 'de' | 'en';
const KEY = 'dbt:lang';
export const LANGS: Lang[] = ['de', 'en'];

let current: Lang | null = null;
let configDefault: Lang = 'de';

/** Aus der Konfiguration: Standardsprache ('de', 'en' oder 'auto' = Browsersprache) */
export function setDefaultLang(v: string) {
  configDefault = v === 'en' ? 'en' : v === 'auto' && typeof navigator !== 'undefined' && /^en/i.test(navigator.language) ? 'en' : 'de';
  current = null;
}

export function getLang(): Lang {
  if (current) return current;
  let l: Lang = configDefault;
  try {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    const saved = localStorage.getItem(KEY);
    if (fromUrl === 'de' || fromUrl === 'en') l = fromUrl;
    else if (saved === 'de' || saved === 'en') l = saved;
  } catch {
    /* Speicher gesperrt */
  }
  current = l;
  return l;
}

/** Sprache wechseln: wird gespeichert, die Seite lädt neu (einfach und fehlerfrei). */
export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  } catch {
    /* ignorieren */
  }
  current = l;
  location.reload();
}

export function t(de: string, params?: Record<string, string | number>): string {
  const text = getLang() === 'en' ? (en[de] ?? de) : de;
  return params ? text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : text;
}

/** Markiert einen deutschen Text zur Uebersetzung, ohne ihn sofort zu uebersetzen (fuer Konstanten); angezeigt wird t(text). */
export const L = (de: string) => de;

export const applyLangToDocument = () => {
  document.documentElement.lang = getLang();
};
