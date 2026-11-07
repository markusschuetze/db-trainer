import { useRef, useState, type ReactNode } from 'react';
import { assetUrl, config, configToJson, defaults, mergeConfig, type AppConfig, type BrandColors } from '../config';
import { THEME_LABEL, themes } from '../theme';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
const input = 'mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2';

/** Farben der mitgelieferten Designs fuer die Vorschau */
const THEME_COLORS: Record<string, Required<BrandColors>> = {
  neutral: { brand: '#1d4e89', brandContrast: '#ffffff', accent: '#c2410c', bg: '#f4f5f7' },
  'th-koeln': { brand: '#c60c0f', brandContrast: '#ffffff', accent: '#b62584', bg: '#f4f4f4' },
  dark: { brand: '#7fb1ee', brandContrast: '#0b1320', accent: '#f59e6b', bg: '#0e141c' },
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      {children}
    </label>
  );
}

/** relative Helligkeit nach WCAG, fuer die Kontrastwarnung */
const lum = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const x = lum(a);
  const y = lum(b);
  if (x === null || y === null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

export function DesignEditor() {
  const [cfg, setCfg] = useState<AppConfig>(() => structuredClone(config));
  const [msg, setMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof AppConfig>(k: K, v: AppConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const base = THEME_COLORS[cfg.theme] ?? THEME_COLORS[cfg.theme === 'auto' ? 'neutral' : 'th-koeln'] ?? THEME_COLORS['th-koeln'];
  const colors = { ...base, ...cfg.colors };
  const ratio = contrast(colors.brand, colors.brandContrast);
  const light = cfg.header === 'hell';

  const readFile = (key: 'logo' | 'favicon') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 300_000) return setMsg('Die Datei ist größer als 300 KB. Bitte verkleinern, sonst wird config.json sehr groß.');
    const url = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.readAsDataURL(f);
    });
    set(key, url);
    setMsg(`${key === 'logo' ? 'Logo' : 'Favicon'} eingebettet. Es steckt dann direkt in der config.json, ein Ordner brand/ ist nicht nötig.`);
  };

  const color = (k: keyof BrandColors, label: string) => (
    <Field label={label}>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" aria-label={label} value={/^#[0-9a-f]{6}$/i.test(colors[k]) ? colors[k] : '#000000'} onChange={(e) => set('colors', { ...cfg.colors, [k]: e.target.value })} className="h-10 w-14 rounded border border-line" />
        <input className={input + ' mt-0'} value={cfg.colors[k] ?? ''} placeholder={base[k]} onChange={(e) => {
          const next = { ...cfg.colors };
          if (e.target.value) next[k] = e.target.value;
          else delete next[k];
          set('colors', next);
        }} />
      </div>
    </Field>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="space-y-4 rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Design und Texte</h2>
        <p className="text-sm text-muted">Änderungen siehst du rechts in der Vorschau. Am Ende lädst du die <code>config.json</code> herunter und legst sie neben <code>index.html</code>.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={input} value={cfg.appName} onChange={(e) => set('appName', e.target.value)} /></Field>
          <Field label="Untertitel der Startseite"><input className={input} value={cfg.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label="Titel im Browser-Tab" hint="leer = Name"><input className={input} value={cfg.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Einrichtung" hint="Alternativtext des Logos"><input className={input} value={cfg.institution} onChange={(e) => set('institution', e.target.value)} /></Field>
          <Field label="Design">
            <select className={input} value={cfg.theme} onChange={(e) => set('theme', e.target.value)}>
              {themes.map((t) => <option key={t} value={t}>{THEME_LABEL[t]}</option>)}
            </select>
          </Field>
          <Field label="Kopfzeile">
            <select className={input} value={cfg.header} onChange={(e) => set('header', e.target.value)}>
              <option value="farbig">farbig (Markenfarbe)</option>
              <option value="hell">hell (weiß, für farbige Logos)</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="font-semibold">Logo</span>
            <span className="block text-xs text-muted">PNG oder SVG, bis 300 KB. Logos sind Marken, nur mit Erlaubnis der Einrichtung verwenden.</span>
            <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={readFile('logo')} aria-label="Logo hochladen" />
            {cfg.logo && <button className="mt-1 text-sm underline" onClick={() => set('logo', '')}>Logo entfernen</button>}
          </div>
          <div>
            <span className="font-semibold">Favicon</span>
            <span className="block text-xs text-muted">Kleines Symbol im Browser-Tab (PNG, SVG, ICO).</span>
            <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={readFile('favicon')} aria-label="Favicon hochladen" />
            {cfg.favicon && <button className="mt-1 text-sm underline" onClick={() => set('favicon', '')}>Favicon entfernen</button>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {color('brand', 'Markenfarbe (Kopfzeile, Knöpfe)')}
          {color('brandContrast', 'Schrift auf der Markenfarbe')}
          {color('accent', 'Akzentfarbe (Fokus, Hinweise)')}
          {color('bg', 'Seitenhintergrund')}
        </div>
        {ratio !== null && (
          <p className={`text-sm ${ratio >= 4.5 ? 'text-ok' : 'text-bad'}`}>
            Kontrast Markenfarbe zu Schrift: {ratio.toFixed(1)} : 1 {ratio >= 4.5 ? '(gut lesbar)' : '(unter 4,5 : 1, schwer lesbar, bitte anpassen)'}
          </p>
        )}
        <button className="text-sm underline" onClick={() => set('colors', {})}>Eigene Farben zurücksetzen</button>

        <Field label="Schrift" hint="CSS-Schriftfamilie, z. B. 'Source Sans 3', Arial, sans-serif"><input className={input} value={cfg.font} onChange={(e) => set('font', e.target.value)} /></Field>
        <Field label="Fußzeilen-Links" hint="Eine Zeile pro Link: Text | Adresse (z. B. Impressum, Datenschutz)">
          <textarea className={`${input} font-mono text-sm`} rows={3} value={cfg.footerLinks.map((l) => `${l.label} | ${l.href}`).join('\n')} onChange={(e) => set('footerLinks', e.target.value.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((p) => p[0] && p[1]).map(([label, href]) => ({ label, href })))} />
        </Field>

        <h3 className="pt-2 font-bold">Statistik und Prüfungsreife</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse des Sammelservers" hint="leer = keine Lernstatistik"><input className={input} value={cfg.analyticsUrl} placeholder="https://statistik.example.org" onChange={(e) => set('analyticsUrl', e.target.value.trim())} /></Field>
          <Field label="Auswertung ab so vielen Lernenden" hint="Datenschutz: kleinere Gruppen werden ausgeblendet"><input type="number" min={1} max={100} className={input} value={cfg.analyticsMinGroup} onChange={(e) => set('analyticsMinGroup', Number(e.target.value))} /></Field>
          <Field label="Prüfungsreif nach … bestandenen Probeklausuren in Folge"><input type="number" min={1} max={10} className={input} value={cfg.readyStreak} onChange={(e) => set('readyStreak', Number(e.target.value))} /></Field>
          <Field label="… und Anteil sicherer Wissensfragen (0 bis 1)"><input type="number" step={0.05} min={0} max={1} className={input} value={cfg.readySureShare} onChange={(e) => set('readySureShare', Number(e.target.value))} /></Field>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">Vorschau</h2>
          <div className="overflow-hidden rounded-lg border border-line" style={{ background: colors.bg, fontFamily: cfg.font || undefined }}>
            <div className="flex items-center gap-3 px-4 py-3" style={light ? { background: '#fff', color: '#16202e', borderBottom: '1px solid #d9dde3' } : { background: colors.brand, color: colors.brandContrast }}>
              {cfg.logo && <img src={assetUrl(cfg.logo)} alt="" className="h-9" />}
              <strong className="text-lg">{cfg.appName}</strong>
              <span className="ml-auto text-sm font-semibold">Fortschritt · Probeklausur</span>
            </div>
            <div className="space-y-3 p-4" style={{ color: '#16202e' }}>
              <p className="text-sm">{cfg.tagline}</p>
              <div className="rounded-lg border bg-white p-3" style={{ borderColor: colors.brand }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skript 05</p>
                <p className="font-bold">Normalisierung</p>
                <span className="mt-2 inline-block rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ background: colors.brand, color: colors.brandContrast }}>Starten</span>
                <span className="ml-3 text-sm underline" style={{ color: colors.accent }}>Link in Akzentfarbe</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Status-Farben (richtig, falsch) und Diagrammfarben bleiben bewusst unabhängig vom Branding.</p>
        </section>

        <section className="space-y-3 rounded-card border-2 border-brand bg-surface p-5">
          <h2 className="font-bold">config.json</h2>
          <button className={btn} onClick={() => {
            const blob = new Blob([configToJson(cfg)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'config.json';
            a.click();
            URL.revokeObjectURL(a.href);
          }}>
            config.json herunterladen
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              const { config: merged, warnings } = mergeConfig(defaults, JSON.parse(await f.text()));
              setCfg(merged);
              setMsg(warnings.length ? `Geladen, aber: ${warnings.join(' ')}` : 'config.json geladen.');
            } catch {
              setMsg('Die Datei ist kein gültiges JSON.');
            }
          }} />
          <button className={btnGhost} onClick={() => importRef.current?.click()}>vorhandene config.json laden</button>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">Inhalt ansehen</summary>
            <pre tabIndex={0} className="mt-2 max-h-72 overflow-auto rounded-lg bg-bg p-3 font-mono text-xs">{configToJson(cfg)}</pre>
          </details>
          {msg && <p role="status" className="text-sm">{msg}</p>}
        </section>
      </aside>
    </div>
  );
}
