import { nfExercises } from '../content/exercises';
import type { NfExercise } from '../content/types';
import { isDone } from '../progress';

type Area = '1' | '2' | '3' | 'M';
const areaOf = (ex: NfExercise): Area => (ex.tags.length >= 3 ? 'M' : (ex.tags[0].charAt(0) as Area));
const AREAS: { id: Area; title: string; text: string }[] = [
  { id: '1', title: '1NF trainieren', text: 'Atomare Werte: mehrwertige und strukturierte Attribute erkennen und auflösen.' },
  { id: '2', title: '2NF trainieren', text: 'Abhängigkeiten erkennen und Relationen mit zusammengesetztem Schlüssel zerlegen.' },
  { id: '3', title: '3NF trainieren', text: 'Transitive Abhängigkeiten erkennen und auslagern.' },
  { id: 'M', title: 'Ganzheitlich: bis wohin ist es möglich?', text: 'Du stellst selbst fest, bis zu welcher Normalform sich die Relation überführen lässt.' },
];

export function NfList() {
  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Normalisierung</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Vier Bereiche: 1NF, 2NF und 3NF trainieren je eine Normalform. Abhängigkeiten kommen erst ab der 2NF dazu, wie im
        Skript 05. Im ganzheitlichen Bereich stellst du selbst fest, bis zu welcher Normalform sich die Relation überführen
        lässt. Achtung: Manche Aufgaben haben kleine Fallen.
      </p>
      {AREAS.map((area) => {
        const list = nfExercises.filter((e) => areaOf(e) === area.id);
        const done = list.filter((e) => isDone(`nf:${e.id}`)).length;
        return (
          <section key={area.id} className="mt-8" aria-labelledby={`nf-${area.id}`}>
            <h2 id={`nf-${area.id}`} className="text-xl font-bold">
              {area.title}{' '}
              <span className="text-sm font-normal text-muted">
                ({done} von {list.length} erledigt)
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted">{area.text}</p>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {list.map((ex, i) => (
                <li key={ex.id} className="flex flex-col rounded-card border border-line bg-surface p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">Aufgabe {i + 1}</span>
                  <h3 className="mt-1 text-lg font-bold">{ex.title}</h3>
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
          </section>
        );
      })}
    </>
  );
}
