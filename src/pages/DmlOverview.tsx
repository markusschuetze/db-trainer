import { dmlErrorTasks } from '../content/dmlErrors';
import { provokeTasks } from '../content/dmlProvoke';
import { sqlExercises } from '../content/sqlExercises';
import { isDone } from '../progress';

export function DmlOverview() {
  const dml = sqlExercises.filter((e) => e.kind === 'dml');
  const tiles = [
    {
      title: 'Daten ändern',
      text: 'INSERT, UPDATE und DELETE auf Fall-Datenbanken (Marktplatz, Hochschule, Gastro, Projekte), geprüft am Ergebnis auf sichtbaren und verdeckten Daten.',
      href: '#/sql',
      done: dml.filter((e) => isDone(`sql:${e.id}`)).length,
      total: dml.length,
    },
    {
      title: 'DML-Fehler erkennen',
      text: 'Skripte lesen und bestimmen, ob und in welcher Zeile ein Fehler entsteht und woran er liegt (Übung 6, Aufgabe 4).',
      href: '#/dml/fehler',
      done: dmlErrorTasks.filter((t) => isDone(`dmlerr:${t.id}`)).length,
      total: dmlErrorTasks.length,
    },
    {
      title: 'Constraints prüfen',
      text: 'Bedingungen der Datenbank absichtlich verletzen und Datensätze korrekt manipulieren (Übung 6, Aufgabe 3).',
      href: '#/dml/constraints',
      done: provokeTasks.filter((t) => isDone(`prov:${t.id}`)).length,
      total: provokeTasks.length,
    },
  ];
  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">SQL-DML</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Daten in der Datenbank verwalten (Übung 6). Die Tabellen bleiben nicht erhalten, jeder Lauf startet frisch.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.title} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">{t.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{t.text}</p>
            <div className="mt-4 flex items-center gap-3">
              <a href={t.href} className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline">
                Start
              </a>
              <span className="text-sm text-muted">
                {t.done} von {t.total} erledigt
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <a href="#/sql/spielwiese" className="underline">
          Spielwiese: freie Abfragen und Änderungen →
        </a>
      </p>
    </>
  );
}
