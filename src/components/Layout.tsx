import type { ReactNode } from 'react';
import { assetUrl, config } from '../config';
import { ConsentBanner } from './ConsentBanner';
import { getLang, LANGS, setLang, t, type Lang } from '../i18n';
const tl = (de: string) => t(de);
import { applyTheme, currentTheme, THEME_LABEL, themes } from '../theme';

/** ?embed=1 blendet Kopf- und Fußzeile aus (für iFrames in ILIAS, Moodle, Webseiten). */
const embedded = (() => {
  try {
    return new URLSearchParams(location.search).get('embed') === '1';
  } catch {
    return false;
  }
})();

export function Layout({ children }: { children: ReactNode }) {
  const light = config.header === 'hell';
  const fg = light ? 'text-ink' : 'text-brand-contrast';
  if (embedded)
    return (
      <>
        <ConsentBanner />
        <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4">
          {children}
        </main>
      </>
    );
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#/"
        onClick={(e) => {
          // Sprunglink ohne Hash-Aenderung (sonst wuerde das Routing zur Startseite springen)
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2 focus:text-ink"
      >
        {t('Zum Inhalt springen')}
      </a>
      <div className="print:hidden">
        <ConsentBanner />
      </div>
      <header className={`print:hidden ${light ? 'border-b border-line bg-surface text-ink' : 'bg-brand text-brand-contrast'}`}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
          <a href="#/" className="flex items-center gap-3 no-underline">
            {config.logo && <img src={assetUrl(config.logo)} alt={config.institution} className="h-10" />}
            <span className={`whitespace-nowrap text-xl font-bold ${fg}`}>{config.appName}</span>
          </a>
          <nav aria-label={t('Hauptnavigation')} className="ml-auto flex gap-2 text-sm font-semibold">
            <a href="#/fortschritt" className={`${fg} inline-block px-2 py-2.5 no-underline hover:underline`}>
              {t('Fortschritt')}
            </a>
            <a href="#/pruefung" className={`${fg} inline-block px-2 py-2.5 no-underline hover:underline`}>
              {t('Probeklausur')}
            </a>
          </nav>
          {config.languageSwitcher && (
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">{t('Sprache')}</span>
              <select
                className={`min-h-9 rounded border bg-transparent px-2 py-1 ${light ? 'border-line text-ink' : 'border-white/40 text-brand-contrast'}`}
                value={getLang()}
                onChange={(e) => setLang(e.target.value as Lang)}
                aria-label={t('Sprache')}
              >
                {LANGS.map((l) => (
                  <option key={l} value={l} className="text-black">
                    {l === 'de' ? 'Deutsch' : 'English'}
                  </option>
                ))}
              </select>
            </label>
          )}
          {config.themeSwitcher && (
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only">{t('Design')}</span>
              <select
                className={`min-h-9 rounded border bg-transparent px-2 py-1 ${light ? 'border-line text-ink' : 'border-white/40 text-brand-contrast'}`}
                defaultValue={currentTheme()}
                onChange={(e) => applyTheme(e.target.value, true)}
              >
                {themes.map((th) => (
                  <option key={th} value={th} className="text-black">
                    {tl(THEME_LABEL[th])}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-line bg-surface text-sm text-muted print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <span>{t(config.license)}</span>
          <nav className="flex gap-4" aria-label={t('Fußzeile')}>
            {config.footerLinks.map((l) => (
              <a key={l.href} href={l.href} className="inline-block py-2 underline">
                {t(l.label)}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
