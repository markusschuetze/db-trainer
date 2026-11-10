import { useMemo, useState } from 'react';
import { nfExercises } from '../content/exercises';
import type { NfExercise } from '../content/types';
import { isDone } from '../progress';
import { NfExercisePage } from './NfExercisePage';

export type NfArea = '1' | '2' | '3' | 'M';
export const NF_AREA_SLUG: Record<string, NfArea> = { '1nf': '1', '2nf': '2', '3nf': '3', ganzheitlich: 'M' };

const areaOf = (ex: NfExercise): NfArea => (ex.tags.length >= 3 ? 'M' : (ex.tags[0].charAt(0) as NfArea));
const AREAS: { id: NfArea; title: string; text: string }[] = [
  { id: '1', title: '1NF trainieren', text: 'Atomare Werte: mehrwertige und strukturierte Attribute erkennen und auflösen.' },
  { id: '2', title: '2NF trainieren', text: 'Abhängigkeiten erkennen und Relationen mit zusammengesetztem Schlüssel zerlegen.' },
  { id: '3', title: '3NF trainieren', text: 'Transitive Abhängigkeiten erkennen und auslagern.' },
  { id: 'M', title: 'Ganzheitlich: bis wohin ist es möglich?', text: 'Du stellst selbst fest, bis zu welcher Normalform sich die Relation überführen lässt.' },
];

const shuffle = <T,>(a: T[]): T[] => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

/** Aufgaben nacheinander wie in den anderen Trainern: gemischt, noch nicht erledigte zuerst. */
export function NfTrainerPage({ initialArea = '1' }: { initialArea?: NfArea }) {
  const [area, setArea] = useState<NfArea>(initialArea);
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const order = useMemo(() => {
    const list = nfExercises.filter((e) => areaOf(e) === area);
    return [...shuffle(list.filter((e) => !isDone(`nf:${e.id}`))), ...shuffle(list.filter((e) => isDone(`nf:${e.id}`)))];
  }, [area, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const ex = order[pos];
  const done = order.filter((e) => isDone(`nf:${e.id}`)).length;
  const current = AREAS.find((a) => a.id === area)!;

  const nextTask = () => {
    if (pos + 1 < order.length) setPos(pos + 1);
    else {
      setRound(round + 1);
      setPos(0);
    }
  };

  const header = (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <p className="mt-2 text-3xl font-bold">Normalisierung</p>
      <p className="mt-2 max-w-2xl text-muted">
        Die Aufgaben kommen nacheinander, gemischt. Abhängigkeiten kommen erst ab der 2NF dazu, wie im Skript 05. Achtung:
        Manche Aufgaben haben kleine Fallen.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Bereich">
        {AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setArea(a.id);
              setPos(0);
              setRound(round + 1);
            }}
            aria-pressed={area === a.id}
            className={`rounded-full border px-3 py-1 text-sm ${area === a.id ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {a.title}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{current.text}</p>
      <p className="mt-2 text-sm font-semibold" aria-live="polite">
        Aufgabe {pos + 1} von {order.length} · {done} erledigt
      </p>
    </>
  );

  if (!ex) return <p>Keine Aufgaben in diesem Bereich.</p>;
  return <NfExercisePage key={`${ex.id}-${round}`} id={ex.id} onTask={nextTask} header={header} />;
}
