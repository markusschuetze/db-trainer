import { useState } from 'react';
import { config } from '../config';
import { AREAS, RATINGS, feedbackText, hasContent, issueUrl, mailUrl, sendFeedback, type FeedbackInput } from '../feedback';
import { t } from '../i18n';
import pkg from '../../package.json';

const btn = 'inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline disabled:opacity-50';
const btnGhost = 'inline-block rounded-lg border border-line bg-surface px-4 py-2 font-semibold no-underline disabled:opacity-50';
const field = 'mt-1 w-full rounded-lg border border-line bg-bg p-2';

const guessDevice = () => {
  const w = window.innerWidth;
  return w < 640 ? 'Smartphone' : w < 1024 ? 'Tablet' : 'Laptop/PC';
};

export function FeedbackPage() {
  const [f, setF] = useState<FeedbackInput>({
    ratings: {},
    area: '',
    problem: '',
    wish: '',
    liked: '',
    device: guessDevice(),
    version: pkg.version,
  });
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle');
  const set = (p: Partial<FeedbackInput>) => setF((x) => ({ ...x, ...p }));
  const ok = hasContent(f);
  const submit = async () => {
    setSent('busy');
    try {
      await sendFeedback(config.analyticsUrl, f);
      setSent('ok');
    } catch {
      setSent('fail');
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedbackText(f));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← {t('Übersicht')}
      </a>
      <h1 className="mt-2 text-3xl font-bold">{t('Feedback')}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {t('Was läuft gut, was nervt, was fehlt? Der Trainer ist ein Studierendenprojekt und wird nach deinem Feedback weiterentwickelt. Alle Angaben sind freiwillig und anonym, es wird nichts automatisch gesendet.')}
      </p>

      {config.feedbackUrl && (
        <p className="mt-4">
          <a className={btn} href={config.feedbackUrl} target="_blank" rel="noreferrer">
            {t('Zum Feedbackbogen')}
          </a>
        </p>
      )}

      <form className="mt-6 grid max-w-3xl gap-6" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="rounded-card border border-line bg-surface p-5">
          <legend className="px-1 font-bold">{t('Wie sehr stimmst du zu?')}</legend>
          <p className="text-sm text-muted">{t('1 = trifft nicht zu, 5 = trifft voll zu')}</p>
          <div className="mt-3 space-y-3">
            {RATINGS.map(([k, label]) => (
              <div key={k} role="radiogroup" aria-label={t(label)} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">{t(label)}</span>
                <span className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label
                      key={n}
                      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border font-semibold focus-within:outline focus-within:outline-2 ${
                        f.ratings[k] === n ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-bg'
                      }`}
                    >
                      <input
                        type="radio"
                        name={k}
                        value={n}
                        className="sr-only"
                        checked={f.ratings[k] === n}
                        onChange={() => set({ ratings: { ...f.ratings, [k]: n } })}
                      />
                      {n}
                    </label>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="rounded-card border border-line bg-surface p-5">
          <label className="block font-bold" htmlFor="fb-area">
            {t('Worauf bezieht sich dein Feedback? (optional)')}
          </label>
          <select id="fb-area" className={field} value={f.area} onChange={(e) => set({ area: e.target.value })}>
            <option value="">{t('Keine Angabe')}</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className="mt-4 block font-bold" htmlFor="fb-problem">
            {t('Was hat nicht funktioniert oder war unklar?')}
          </label>
          <p className="text-sm text-muted">{t('Gern mit der Aufgabe, die du gerade gemacht hast, und dem, was du erwartet hast.')}</p>
          <textarea id="fb-problem" rows={4} className={field} value={f.problem} onChange={(e) => set({ problem: e.target.value })} />
          <label className="mt-4 block font-bold" htmlFor="fb-wish">
            {t('Was fehlt oder sollte besser werden?')}
          </label>
          <textarea id="fb-wish" rows={3} className={field} value={f.wish} onChange={(e) => set({ wish: e.target.value })} />
          <label className="mt-4 block font-bold" htmlFor="fb-liked">
            {t('Was gefällt dir?')}
          </label>
          <textarea id="fb-liked" rows={2} className={field} value={f.liked} onChange={(e) => set({ liked: e.target.value })} />
          <label className="mt-4 block font-bold" htmlFor="fb-device">
            {t('Auf welchem Gerät hast du den Trainer genutzt?')}
          </label>
          <select id="fb-device" className={field} value={f.device} onChange={(e) => set({ device: e.target.value })}>
            {['Smartphone', 'Tablet', 'Laptop/PC'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-bold">{t('Absenden')}</h2>
          <p className="mt-1 text-sm text-muted">
            {t('Wähle, wie dein Feedback bei uns ankommt. Dein Name und deine Lernstände werden nicht mitgeschickt.')}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {config.analyticsUrl && (
              <button type="button" className={btn} disabled={!ok || sent === 'busy' || sent === 'ok'} onClick={submit}>
                {t('Direkt absenden')}
              </button>
            )}
            <a
              className={`${config.analyticsUrl ? btnGhost : btn} ${ok ? '' : 'pointer-events-none opacity-50'}`}
              aria-disabled={!ok}
              href={ok ? issueUrl(config.repo, f) : undefined}
              target="_blank"
              rel="noreferrer"
            >
              {t('Als GitHub-Meldung senden')}
            </a>
            {config.feedbackEmail && (
              <a className={`${btnGhost} ${ok ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!ok} href={ok ? mailUrl(config.feedbackEmail, f) : undefined}>
                {t('Per E-Mail senden')}
              </a>
            )}
            <button type="button" className={btnGhost} disabled={!ok} onClick={copy}>
              {t('Text kopieren')}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            {t('Die GitHub-Meldung braucht ein GitHub-Konto und ist öffentlich sichtbar. Ohne Konto: Text kopieren und im ILIAS-Forum antworten.')}
          </p>
          {config.analyticsUrl && (
            <p className="mt-2 text-sm text-muted">
              {t('„Direkt absenden“ speichert deinen Text ohne Namen und ohne Kennung auf dem Server des Projekts. Schreibe bitte keine persönlichen Daten hinein.')}
            </p>
          )}
          <p role="status" className={`mt-2 text-sm font-semibold ${sent === 'fail' ? 'text-bad' : 'text-ok'}`}>
            {sent === 'ok' && t('Danke, dein Feedback ist angekommen.')}
            {sent === 'fail' && t('Das Senden hat nicht geklappt. Du kannst den Text kopieren und im ILIAS-Forum posten.')}
          </p>
          <p role="status" className="mt-2 text-sm font-semibold text-ok">
            {copied ? t('Text kopiert.') : ''}
          </p>
        </div>
      </form>
    </>
  );
}
