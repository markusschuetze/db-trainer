import { config } from '../config';
import { L, getLang, t } from '../i18n';
import { useProgress } from '../progress';
import { readiness } from './ProgressPage';

interface Module {
  title: string;
  script: string;
  text: string;
  href?: string;
}

const modules: Module[] = [
  {
    title: L('Modellierung: Kardinalitäten'),
    script: L('Skript 02'),
    text: L('Kardinalitäten aus Anforderungen lesen und in Krähenfußnotation darstellen.'),
    href: '#/modellierung',
  },
  {
    title: L('Spezialisierung'),
    script: L('Skript 03'),
    text: L('Disjunkt oder überlappend, vollständig oder partiell: 32 Aufgaben mit Diagramm.'),
    href: '#/modellierung/spezialisierung',
  },
  {
    title: L('Relationenmodell'),
    script: L('Skript 04'),
    text: L('Vom ER-Modell zur Relation: Wohin kommt der Fremdschlüssel, NOT NULL, Zuordnungsrelationen.'),
    href: '#/relationen',
  },
  {
    title: L('Normalisierung'),
    script: L('Skript 05'),
    text: L('Von der Tabelle zur 3. Normalform, Schritt für Schritt mit Begründung.'),
    href: '#/normalisierung',
  },
  {
    title: L('SQL-DDL'),
    script: L('Skript 06'),
    text: L('CREATE, ALTER, DROP und Constraints, geprüft an echtem Verhalten.'),
    href: '#/ddl',
  },
  {
    title: L('SQL-DML und DQL'),
    script: L('Folgekapitel'),
    text: L('Drei Fall-Datenbanken (Hochschule, Gastro, Projekte) in den Stufen Leicht, Mittel, Schwer. Mit Schema-Diagramm und Spielwiese.'),
    href: '#/sql',
  },
  {
    title: L('Textaufgaben'),
    script: L('Klausurvorbereitung'),
    text: L('Aus Anforderungstexten Entitäten, Beziehungen, Kardinalitäten und Schlüssel erkennen und das Relationenschema ableiten.'),
    href: '#/textaufgaben',
  },
  {
    title: L('Praktikum'),
    script: L('Übungen'),
    text: L('Arbeiten wie im SQL Developer, aber im Browser: Datenbank bleibt erhalten, Fehlermeldungen, COMMIT/ROLLBACK, ER-Modell auf Knopfdruck.'),
    href: '#/praktikum',
  },
  {
    title: L('Zufallsmodus'),
    script: L('alle Kapitel'),
    text: L('Alle Aufgaben und Fragen bunt gemischt, von leicht bis schwer, mit sofortiger Lösung.'),
    href: '#/zufall',
  },
  {
    title: L('Prüfungsmodus'),
    script: L('alle Kapitel'),
    text: L('Probeklausur mit Zeitlimit, ohne Hilfen, mit Auswertung nach Kapiteln.'),
    href: '#/pruefung',
  },
];

export function Home() {
  const d = useProgress();
  const r = readiness(d);
  return (
    <>
      <h1 className="text-3xl font-bold">{config.appName}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {t(config.tagline)}. {t('Die Module folgen den Vorlesungsskripten. Keine Anmeldung im Trainer, kein Tracking.')}
      </p>
      {getLang() === 'en' && (
        <p role="note" className="mt-3 max-w-2xl rounded-lg border border-line bg-surface p-3 text-sm">
          {t('Hinweis: Die Oberfläche gibt es auch auf Englisch, die Lerninhalte (Fragen, Aufgaben, Erklärungen) sind bislang nur auf Deutsch verfügbar.')}
        </p>
      )}
      <a
        href="#/fortschritt"
        className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border-2 p-5 no-underline ${
          r.ready ? 'border-ok bg-ok-bg' : 'border-brand bg-surface'
        }`}
      >
        <span>
          <span className="block text-sm font-semibold uppercase tracking-wide text-muted">{t('Dein Stand')}</span>
          <span className="mt-1 block text-2xl font-bold">{t(r.title)}</span>
          <span className="mt-1 block text-sm text-muted">
            {t('{n} Probeklausuren · {a} von {b} in Folge bestanden · {c} von {e} Wissensfragen sicher', { n: d.exams.length, a: Math.min(r.streak, config.readyStreak), b: config.readyStreak, c: r.sure, e: r.total })}
          </span>
        </span>
        <span className="font-semibold underline">{t('Zum Fortschritt →')}</span>
      </a>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.title} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t(m.script)}</span>
            <h2 className="mt-1 text-lg font-bold">{t(m.title)}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{t(m.text)}</p>
            {m.href ? (
              <a
                href={m.href}
                className="mt-4 inline-block self-start rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline"
              >
                {t('Starten')}
              </a>
            ) : (
              <span className="mt-4 inline-block self-start rounded-lg border border-line px-3 py-1 text-sm text-muted">
                {t('in Arbeit')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
