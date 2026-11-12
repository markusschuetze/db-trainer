import { useMemo, useState } from 'react';
import { track } from '../analytics';
import { dmlErrorTasks } from '../content/dmlErrors';
import { predictTasks, type PredictTask } from '../content/dmlPredict';
import { mcQuestions, type McQuestion } from '../content/mcQuestions';
import { gradeItem, type Answer, type ExamItem } from '../exam/exam';
import { mixedOrder } from '../logic/order';
import { isDone, markDone, recordItem } from '../progress';
import { DmlErrorCard, MarktplatzAside } from './DmlErrorPage';
import { ItemInput, Solution } from './ExamPage';
import { sqlExercises } from '../content/sqlExercises';
import { SqlExercisePage } from './SqlExercisePage';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';

type Item =
  | { kind: 'mc'; id: string; q: McQuestion }
  | { kind: 'err'; id: string; t: (typeof dmlErrorTasks)[number] }
  | { kind: 'pred'; id: string; t: PredictTask }
  | { kind: 'sql'; id: string; exId: string };

const KIND_NAME = { mc: 'Wissensfrage', err: 'Fehler erkennen', pred: 'Ergebnis vorhersagen', sql: 'Eigener SQL-Code' } as const;

const pool = (): Item[] => [
  ...mcQuestions.filter((q) => q.topicId === 'sql-dml').map((q) => ({ kind: 'mc' as const, id: `mc:${q.id}`, q })),
  ...dmlErrorTasks.map((t) => ({ kind: 'err' as const, id: `dmlerr:${t.id}`, t })),
  ...predictTasks.map((t) => ({ kind: 'pred' as const, id: `dmlpred:${t.id}`, t })),
  ...sqlExercises.filter((e) => e.kind === 'dml').map((e) => ({ kind: 'sql' as const, id: `sql:${e.id}`, exId: e.id })),
];

function McCard({ item, onNext }: { item: Extract<Item, { kind: 'mc' }>; onNext: () => void }) {
  const exam: ExamItem = { kind: 'mc', id: item.id, chapter: item.q.chapter, points: item.q.multi ? 2 : 1, q: item.q };
  const [answer, setAnswer] = useState<Answer | undefined>();
  const [done, setDone] = useState(false);
  const [started] = useState(Date.now());
  const r = done ? gradeItem(exam, answer, null) : null;
  const full = !!r && r.points === r.max;
  const check = () => {
    const g = gradeItem(exam, answer, null);
    const ok = g.points === g.max;
    setDone(true);
    recordItem(item.id, ok);
    track({ k: 'i', i: item.id, tp: item.q.topicId, ch: item.q.chapter, ok: ok ? 1 : 0, s: Math.min(3600, Math.round((Date.now() - started) / 1000)), a: 1, h: 0, o: (answer as number[] | undefined) ?? [], src: 'u' });
  };
  return (
    <section className="min-w-0 rounded-card border border-line bg-surface p-5 lg:col-span-2">
      <h2 className="text-lg font-bold">Wissensfrage</h2>
      <div className="mt-3">
        <fieldset disabled={done}>
          <ItemInput item={exam} answer={answer} set={setAnswer} allowRun={false} />
        </fieldset>
      </div>
      {r && (
        <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${full ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={full ? 'text-ok' : 'text-bad'}>{full ? 'Richtig.' : 'Leider falsch.'}</strong>
          <div className="mt-2 text-ink">
            <Solution item={exam} />
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-3">
        {!done ? (
          <>
            <button className={btn} disabled={answer === undefined} onClick={check}>
              Prüfen
            </button>
            <button className={btnGhost} onClick={onNext}>
              Überspringen
            </button>
          </>
        ) : (
          <button className={btn} onClick={onNext}>
            Nächste Aufgabe
          </button>
        )}
      </div>
    </section>
  );
}

function PredictCard({ task, onNext }: { task: PredictTask; onNext: () => void }) {
  const [pick, setPick] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [started] = useState(Date.now());
  const ok = pick === task.answer;
  const check = () => {
    setChecked(true);
    if (ok) markDone(`dmlpred:${task.id}`);
    track({ k: 'i', i: `dmlpred:${task.id}`, tp: 'sql-dml', ch: 'SQL', ok: ok ? 1 : 0, s: Math.min(3600, Math.round((Date.now() - started) / 1000)), a: 1, h: 0, src: 'u' });
  };
  return (
    <section className="min-w-0 rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">{task.title}</h2>
      <p className="mt-2 text-sm text-muted">Die Tabellen haben zu Beginn den Inhalt des Marktplatzes aus Übung 5 und 6.</p>
      <ol className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-sm" aria-label="Skript mit Zeilennummern">
        {task.script.map((s, i) => (
          <li key={i} className="flex gap-3 py-0.5">
            <span className="w-6 shrink-0 text-right text-muted">{i + 1}</span>
            <span className="whitespace-pre">{s}</span>
          </li>
        ))}
      </ol>
      <fieldset className="mt-4" disabled={checked}>
        <legend className="font-semibold">{task.question}</legend>
        <div className="mt-2 space-y-1">
          {task.options.map((o) => (
            <label key={o} className={`flex items-center gap-2 rounded-lg border p-2 ${checked && o === task.answer ? 'border-ok bg-ok-bg' : checked && o === pick ? 'border-bad bg-bad-bg' : 'border-line'}`}>
              <input type="radio" name="pred" checked={pick === o} onChange={() => setPick(o)} />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
      {checked && (
        <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${ok ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={ok ? 'text-ok' : 'text-bad'}>{ok ? 'Richtig.' : 'Nicht ganz.'}</strong> <span className="text-ink">{task.why}</span>
        </p>
      )}
      <div className="mt-4 flex gap-3">
        {!checked ? (
          <>
            <button className={btn} disabled={pick === null} onClick={check}>
              Prüfen
            </button>
            <button className={btnGhost} onClick={onNext}>
              Überspringen
            </button>
          </>
        ) : (
          <button className={btn} onClick={onNext}>
            Nächste Aufgabe
          </button>
        )}
      </div>
    </section>
  );
}

/** Gemischte, textbasierte Aufgaben: Wissensfragen, Fehler erkennen und Ergebnisse vorhersagen. */
export function DmlMixPage() {
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const all = useMemo(pool, []);
  const order = useMemo(() => {
    const undone = all.filter((i) => !isDone(i.id));
    const rest = all.filter((i) => !undone.includes(i));
    const mix = (l: Item[]) => mixedOrder(l, (i) => i.kind).map((k) => l[k]);
    return [...mix(undone), ...mix(rest)];
  }, [all, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const item = order[pos];
  const next = () => {
    if (pos + 1 < order.length) setPos(pos + 1);
    else {
      setRound(round + 1);
      setPos(0);
    }
  };
  const doneCount = all.filter((i) => isDone(i.id)).length;
  const key = `${item.id}-${round}`;

  return (
    <>
      <a href="#/dml" className="inline-block py-2 text-sm underline">
        ← SQL-DML
      </a>
      <h1 className="mt-2 text-3xl font-bold">Gemischt: Wissen, Fehler, Vorhersage und eigener Code</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Alles bunt gemischt: Wissensfragen zu DML, Fehler in Skripten finden, vorhersagen, was nach einem Skript in der Tabelle
        steht, und eigene INSERT-, UPDATE- und DELETE-Befehle schreiben.
      </p>
      <p className="mt-2 text-sm font-semibold" aria-live="polite">
        Aufgabe {pos + 1} von {order.length} · {KIND_NAME[item.kind]} · {doneCount} erledigt
      </p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {item.kind === 'mc' && <McCard key={key} item={item} onNext={next} />}
        {item.kind === 'err' && (
          <>
            <DmlErrorCard key={key} task={item.t} onNext={next} />
            <MarktplatzAside />
          </>
        )}
        {item.kind === 'sql' && (
          <div className="min-w-0 lg:col-span-2">
            <SqlExercisePage key={key} id={item.exId} onNext={next} />
          </div>
        )}
        {item.kind === 'pred' && (
          <>
            <PredictCard key={key} task={item.t} onNext={next} />
            <MarktplatzAside />
          </>
        )}
      </div>
    </>
  );
}
