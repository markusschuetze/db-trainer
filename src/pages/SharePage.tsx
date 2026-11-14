import { useEffect, useState } from 'react';
import { t } from '../i18n';

const btn = 'inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline';
const btnGhost = 'inline-block rounded-lg border border-line bg-surface px-4 py-2 font-semibold no-underline';

const baseUrl = () => window.location.origin + window.location.pathname;

function download(name: string, href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
}

/** QR-Code zum Teilen des Trainers, z. B. fuer Folien oder das ILIAS-Forum. */
export function SharePage() {
  const [url, setUrl] = useState(baseUrl);
  const [svg, setSvg] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    import('qrcode')
      .then((Q) => Q.toString(url || ' ', { type: 'svg', margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }))
      .then((s) => alive && (setSvg(s), setErr('')))
      .catch(() => alive && setErr('Der QR-Code konnte nicht erzeugt werden. Ist die Adresse zu lang?'));
    return () => {
      alive = false;
    };
  }, [url]);

  const png = async () => {
    const Q = await import('qrcode');
    download('db-trainer-qr.png', await Q.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: 'M' }));
  };
  const saveSvg = () => download('db-trainer-qr.svg', URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));

  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← {t('Übersicht')}
      </a>
      <h1 className="mt-2 text-3xl font-bold">{t('QR-Code zum Teilen')}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {t('Mit diesem Code öffnen Studierende den Trainer direkt am Handy. Zum Einbinden in Folien, Aushänge oder das ILIAS-Forum.')}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="rounded-card border border-line bg-white p-4 print:border-0">
          {svg && !err ? (
            <div
              role="img"
              aria-label={`${t('QR-Code für')} ${url}`}
              className="h-64 w-64 [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="h-64 w-64 text-sm text-bad">{err}</p>
          )}
        </div>
        <div className="min-w-0 space-y-4 print:hidden">
          <div>
            <label className="block font-bold" htmlFor="share-url">
              {t('Adresse')}
            </label>
            <input id="share-url" className="mt-1 w-full rounded-lg border border-line bg-bg p-2" value={url} onChange={(e) => setUrl(e.target.value)} />
            <p className="mt-1 text-sm text-muted">{t('Voreingestellt ist die Adresse, unter der du diese Seite gerade geöffnet hast.')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className={btn} onClick={png}>
              {t('Als PNG speichern')}
            </button>
            <button className={btnGhost} onClick={saveSvg} disabled={!svg}>
              {t('Als SVG speichern')}
            </button>
            <button className={btnGhost} onClick={() => window.print()}>
              {t('Drucken')}
            </button>
          </div>
          <p className="text-sm text-muted">{t('Tipp: Vor dem Einbinden einmal mit dem Handy scannen und prüfen, dass die Seite sich öffnet.')}</p>
        </div>
      </div>
    </>
  );
}
