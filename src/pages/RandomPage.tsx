import { useMemo, useRef, useState } from 'react';
import { track } from '../analytics';
import { CHAPTER_NAME } from '../content/mcQuestions';
import { buildPool, difficultyOf, gradeItem, LEVEL_NAME, pickRandom, type Answer, type ExamItem, type ItemResult, type Level } from '../exam/exam';
import { markDone, recordItem } from '../progress';
import { topicOfItem } from '../progressCatalog';
import { useSql } from '../useSql';
import { ItemInput, itemTitle, Solution } from './ExamPage';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
const LEVELS: Level[] = [1, 2, 3];

export function RandomPage() {
  const { SQL } = useSql();
  const pool = useMemo(buildPool, []);
  const [levels, setLevels] = useState<Level[]>([1, 2, 3]);
  const [programming, setProgramming] = useState(true);
  const history = useRef<string[]>([]);
  const started = useRef(Date.now());
  const [item, setItem] = useState<ExamItem | null>(() => pickRandom(pool, { levels: [1, 2, 3], programming: true }, []));
  const [answer, setAnswer] = useState<Answer | undefined>();
  const [result, setResult] = useState<ItemResult | null>(null);
  const [stats, setStats] = useState({ n: 0, right: 0, points: 0, max: 0, streak: 0, best: 0 });

  const draw = (lv = levels, prog = programming) => {
    const next = pickRandom(pool, { levels: lv, programming: prog }, history.current);
    if (next) history.current.push(next.id);
    setItem(next);
    setAnswer(undefined);
    setResult(null);
    started.current = Date.now();
  };
  if (item && !history.current.length) history.current.push(item.id);

  const toggleLevel = (l: Level) => {
    const lv = levels.includes(l) ? levels.filter((x) => x !== l) : [...levels, l];
    if (!lv.length) return; // mindestens eine Stufe
    setLevels(lv);
    draw(lv, programming);
  };

  const check = () => {
    if (!item) return;
    const r = gradeItem(item, answer, SQL);
    setResult(r);
    const full = r.points === r.max;
    if (item.kind === 'mc') recordItem(item.id, full);
    else if (full) markDone(item.id);
    track({
      k: 'i',
      i: item.id,
      tp: topicOfItem(item.id) ?? item.chapter,
      ch: item.chapter,
      ok: full ? 1 : 0,
      s: Math.min(3600, Math.round((Date.now() - started.current) / 1000)),
      a: 1,
      h: 0,
      ...(item.kind === 'mc' ? { o: (answer as number[] | undefined) ?? [] } : {}),
      src: 'u',
    });
    setStats((s) => ({
      n: s.n + 1,
      right: s.right + (full ? 1 : 0),
      points: s.points + r.points,
      max: s.max + r.max,
      streak: full ? s.streak + 1 : 0,
      best: Math.max(s.best, full ? s.streak + 1 : s.streak),
    }));
  };

  const lvl = item ? difficultyOf(item) : 1;
  const full = result && result.points === result.max;

  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Zufallsmodus</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Alle Aufgabenarten bunt gemischt, von leicht bis schwer: Wissensfragen, Kardinalitäten, Spezialisierung,
        Relationenmodell, Normalisierung, Textaufgaben, SQL-DDL und SQL-Abfragen. Nach jeder Aufgabe siehst du sofort die
        Lösung.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Schwierigkeit">
        <span className="text-sm text-muted">Schwierigkeit:</span>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => toggleLevel(l)}
            aria-pressed={levels.includes(l)}
            className={`rounded-full border px-3 py-1 text-sm ${levels.includes(l) ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {LEVEL_NAME[l]}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={programming}
            onChange={(e) => {
              setProgramming(e.target.checked);
              draw(levels, e.target.checked);
            }}
          />
          SQL- und DDL-Aufgaben einbeziehen
        </label>
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {stats.n} bearbeitet · {stats.right} komplett richtig · {stats.points.toLocaleString('de-DE')} von {stats.max} Punkten · Serie {stats.streak} (beste {stats.best})
      </p>

      {item && (
        <section className="mt-4 rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Aufgabe {stats.n + 1} · {CHAPTER_NAME[item.chapter] ?? item.chapter} · Schwierigkeit {LEVEL_NAME[lvl]} {'★'.repeat(lvl)}
            {'☆'.repeat(3 - lvl)}
          </p>
          <h2 className="mt-1 text-lg font-bold">{itemTitle(item)}</h2>
          <div className="mt-3">
            <fieldset disabled={!!result}>
              <ItemInput key={item.id} item={item} answer={answer} set={setAnswer} allowRun />
            </fieldset>
          </div>
          {result && (
            <div role="status" className={`mt-4 rounded-lg p-4 text-sm ${full ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
              <strong className={full ? 'text-ok' : 'text-bad'}>
                {full ? 'Richtig.' : result.points > 0 ? 'Teilweise richtig.' : 'Leider falsch.'}
              </strong>{' '}
              {result.points.toLocaleString('de-DE')} von {result.max} Punkten.
              <div className="mt-3 text-ink">
                <Solution item={item} />
              </div>
            </div>
          )}
          <div className="mt-4 flex gap-3">
            {!result ? (
              <>
                <button className={btn} onClick={check} disabled={answer === undefined}>
                  Prüfen
                </button>
                <button className={btnGhost} onClick={() => draw()}>
                  Überspringen
                </button>
              </>
            ) : (
              <button className={btn} onClick={() => draw()}>
                Nächste Aufgabe
              </button>
            )}
          </div>
        </section>
      )}
      {!item && <p className="mt-4">Für diese Auswahl gibt es keine Aufgaben.</p>}
    </>
  );
}
