import { useSyncExternalStore } from 'react';
import { t } from '../i18n';
import { analyticsAvailable, getConsent, onConsentChange, setConsent } from '../analytics';

const what = () => t(WHAT_DE);

export function useConsent() {
  return useSyncExternalStore(onConsentChange, getConsent, getConsent);
}

const WHAT_DE =
  'Gesendet werden nur: welche Aufgabe, richtig oder falsch, wie viele Sekunden und Versuche, ob ein Tipp genutzt wurde, bei Wissensfragen die gewählte Antwortnummer und bei Probeklausuren die Punkte je Kapitel. Nicht gesendet werden: Name, Login, deine SQL-Eingaben und Texte, IP-Adresse. Die Auswertung erscheint erst ab mehreren Lernenden pro Aufgabe. Du kannst die Entscheidung jederzeit unter „Fortschritt“ ändern.';

/** Einmalige, freiwillige Abfrage; ohne Antwort wird nichts gesendet. */
export function ConsentBanner() {
  const c = useConsent();
  if (!analyticsAvailable() || c !== null) return null;
  return (
    <section aria-label={t('Anonyme Lernstatistik')} className="border-b border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-3 text-sm">
        <p>
          <strong>Hilf mit, die Lehre zu verbessern?</strong> Teile anonym, bei welchen Aufgaben es hakt. So können Lehrende
          Erklärungen und Übungen gezielt verbessern.
        </p>
        <details className="mt-1">
          <summary className="cursor-pointer underline">{t('Was genau wird gesendet?')}</summary>
          <p className="mt-1 text-muted">{what()}</p>
        </details>
        <div className="mt-2 flex gap-3">
          <button className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-brand-contrast" onClick={() => setConsent('ja')}>
            {t('Ja, anonym teilen')}
          </button>
          <button className="rounded-lg border border-line px-3 py-1.5 font-semibold" onClick={() => setConsent('nein')}>
            {t('Nein, danke')}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Umschalter fuer die Fortschrittsseite */
export function ConsentSetting() {
  const c = useConsent();
  if (!analyticsAvailable()) return null;
  return (
    <section className="mt-6 rounded-card border border-line bg-surface p-5">
      <h2 className="font-bold">{t('Anonyme Lernstatistik')}</h2>
      <p className="mt-1 text-sm text-muted">{what()}</p>
      <label className="mt-3 flex items-center gap-2">
        <input type="checkbox" checked={c === 'ja'} onChange={(e) => setConsent(e.target.checked ? 'ja' : 'nein')} />
        {t('Anonym teilen')}
      </label>
    </section>
  );
}
