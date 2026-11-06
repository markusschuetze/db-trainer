import type { ReactNode } from 'react';
import { config } from '../config';
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
      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4">
        {children}
      </main>
    );
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-surface focus:p-2"
      >
        Zum Inhalt springen
      </a>
      <header className={light ? 'border-b border-line bg-surface text-ink' : 'bg-brand text-brand-contrast'}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <a href="#/" className="flex items-center gap-3 no-underline">
            {config.logo && <img src={`brand/${config.logo}`} alt={config.institution} className="h-10" />}
            <span className={`text-xl font-bold ${fg}`}>{config.appName}</span>
          </a>
          <nav aria-label="Hauptnavigation" className="ml-auto flex gap-4 text-sm font-semibold">
            <a href="#/fortschritt" className={`${fg} no-underline hover:underline`}>
              Fortschritt
            </a>
            <a href="#/pruefung" className={`${fg} no-underline hover:underline`}>
              Probeklausur
            </a>
          </nav>
          {config.themeSwitcher && (
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only">Design</span>
              <select
                className={`rounded border bg-transparent px-2 py-1 ${light ? 'border-line text-ink' : 'border-white/40 text-brand-contrast'}`}
                defaultValue={currentTheme()}
                onChange={(e) => applyTheme(e.target.value, true)}
              >
                {themes.map((t) => (
                  <option key={t} value={t} className="text-black">
                    {THEME_LABEL[t]}
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
      <footer className="border-t border-line bg-surface text-sm text-muted">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <span>{config.license}</span>
          <nav className="flex gap-4" aria-label="Fußzeile">
            {config.footerLinks.map((l) => (
              <a key={l.href} href={l.href} className="underline">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
