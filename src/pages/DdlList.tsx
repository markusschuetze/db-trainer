import { ddlExercises } from '../content/ddlExercises';
import { isDone } from '../progress';

import { LEVEL_NAME as levelName } from '../content/scenarios';

export function DdlList() {
  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">SQL-DDL</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Schreibe CREATE-, ALTER- und DROP-Anweisungen in Oracle-Syntax. Geprüft wird, ob deine Tabellen sich richtig
        verhalten, nicht ob der Text exakt der Musterlösung entspricht. Echte Oracle-Übung bleibt die Schulungsdatenbank
        mit SQL Developer; der Trainer ist zum schnellen Ausprobieren.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {ddlExercises.map((ex, i) => (
          <li key={ex.id} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Aufgabe {i + 1} · {levelName[ex.level]}
            </span>
            <h2 className="mt-1 text-lg font-bold">{ex.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{ex.topic}</p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`#/ddl/${ex.id}`}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline"
              >
                Start
              </a>
              {isDone(`ddl:${ex.id}`) && <span className="text-sm font-semibold text-ok">✓ gelöst</span>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
