import { config } from '../config';
import { READY_STREAK, useProgress } from '../progress';
import { readiness } from './ProgressPage';

interface Module {
  title: string;
  script: string;
  text: string;
  href?: string;
}

const modules: Module[] = [
  {
    title: 'Modellierung',
    script: 'Skript 02–03',
    text: 'Kardinalitäten aus Anforderungen lesen, Krähenfußnotation, Spezialisierungen einordnen.',
    href: '#/modellierung',
  },
  {
    title: 'Relationenmodell',
    script: 'Skript 04',
    text: 'Vom ER-Modell zur Relation: Wohin kommt der Fremdschlüssel, NOT NULL, Zuordnungsrelationen.',
    href: '#/relationen',
  },
  {
    title: 'Normalisierung',
    script: 'Skript 05',
    text: 'Von der Tabelle zur 3. Normalform, Schritt für Schritt mit Begründung.',
    href: '#/normalisierung',
  },
  {
    title: 'SQL-DDL',
    script: 'Skript 06',
    text: 'CREATE, ALTER, DROP und Constraints, geprüft an echtem Verhalten.',
    href: '#/ddl',
  },
  {
    title: 'SQL-DML und DQL',
    script: 'Folgekapitel',
    text: 'Drei Fall-Datenbanken (Hochschule, Gastro, Projekte) in den Stufen Leicht, Mittel, Schwer. Mit Schema-Diagramm und Spielwiese.',
    href: '#/sql',
  },
  {
    title: 'Prüfungsmodus',
    script: 'alle Kapitel',
    text: 'Probeklausur mit Zeitlimit, ohne Hilfen, mit Auswertung nach Kapiteln.',
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
        {config.tagline}. Die Module folgen den Vorlesungsskripten. Keine Anmeldung im Trainer, kein Tracking.
      </p>
      <a
        href="#/fortschritt"
        className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border-2 p-5 no-underline ${
          r.ready ? 'border-ok bg-ok-bg' : 'border-brand bg-surface'
        }`}
      >
        <span>
          <span className="block text-sm font-semibold uppercase tracking-wide text-muted">Dein Stand</span>
          <span className="mt-1 block text-2xl font-bold">{r.title}</span>
          <span className="mt-1 block text-sm text-muted">
            {d.exams.length} Probeklausuren · {Math.min(r.streak, READY_STREAK)} von {READY_STREAK} in Folge bestanden · {r.sure} von{' '}
            {r.total} Wissensfragen sicher
          </span>
        </span>
        <span className="font-semibold underline">Zum Fortschritt →</span>
      </a>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.title} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{m.script}</span>
            <h2 className="mt-1 text-lg font-bold">{m.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{m.text}</p>
            {m.href ? (
              <a
                href={m.href}
                className="mt-4 inline-block self-start rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline"
              >
                Starten
              </a>
            ) : (
              <span className="mt-4 inline-block self-start rounded-lg border border-line px-3 py-1 text-sm text-muted">
                in Arbeit
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
