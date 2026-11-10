import { nfExercises } from '../content/exercises';
import { isDone } from '../progress';

export function NfList() {
  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Normalisierung</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Aufgabe 1 bis 3 trainieren je eine Normalform. Aufgabe 4 ist ganzheitlich: Du stellst selbst fest, bis zu welcher
        Normalform sich die Relation überführen lässt. Pro Aufgabe: 1NF prüfen, Abhängigkeiten einordnen, höchste
        Normalform bestimmen und das Zielschema ansehen. Die Schreibweise entspricht Skript 05.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {nfExercises.map((ex, i) => (
          <li key={ex.id} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Aufgabe {i + 1} · {ex.tags.length >= 3 ? 'Ganzheitlich: bis wohin ist es möglich?' : `${ex.tags.join(' · ')} trainieren`}
            </span>
            <h2 className="mt-1 text-lg font-bold">{ex.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{ex.scenario}</p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`#/normalisierung/${ex.id}`}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline"
              >
                Start
              </a>
              {isDone(`nf:${ex.id}`) && <span className="text-sm font-semibold text-ok">✓ erledigt</span>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
