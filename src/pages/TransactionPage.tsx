import { useMemo, useState } from 'react';
import { track } from '../analytics';
import {
  ACID_NAME,
  ANOMALY_NAME,
  LEVEL_NAME,
  acidTasks,
  afterCrash,
  afterRecovery,
  genRecovery,
  recoveryText,
  recoveryWhy,
  scheduleTasks,
  type AcidLetter,
  type AcidTask,
  type Anomaly,
  type Level,
  type RecTask,
  type ScheduleTask,
} from '../content/transactions';
import { isDone, markDone, useProgress } from '../progress';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
type Mode = 'acid' | 'ablauf' | 'recovery';

const pickNext = <T extends { id: string }>(list: T[], prefix: string, skip?: string): T => {
  const open = list.filter((x) => x.id !== skip && !isDone(`${prefix}${x.id}`));
  const pool = open.length ? open : list.filter((x) => x.id !== skip);
  return pool[Math.floor(Math.random() * pool.length)] ?? list[0];
};

function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${ok ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
      <strong className={ok ? 'text-ok' : 'text-bad'}>{ok ? 'Richtig.' : 'Nicht ganz.'}</strong> {children}
    </div>
  );
}

function Actions({ checked, canCheck, onCheck, onNext }: { checked: boolean; canCheck: boolean; onCheck: () => void; onNext: () => void }) {
  return (
    <div className="mt-4 flex gap-3">
      {!checked ? (
        <>
          <button className={btn} disabled={!canCheck} onClick={onCheck}>
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
  );
}

function report(id: string, topic: string, ok: boolean, started: number) {
  if (ok) markDone(id);
  track({ k: 'i', i: id, tp: topic, ch: '08', ok: ok ? 1 : 0, s: Math.min(3600, Math.round((Date.now() - started) / 1000)), a: 1, h: 0, src: 'u' });
}

/* ---------------- ACID zuordnen ---------------- */

function AcidCard({ task, onNext }: { task: AcidTask; onNext: () => void }) {
  const [pick, setPick] = useState<AcidLetter | ''>('');
  const [checked, setChecked] = useState(false);
  const [started] = useState(Date.now());
  const ok = pick === task.answer;
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">Welche ACID-Eigenschaft steht hier im Mittelpunkt?</h2>
      <p className="mt-3">{task.scenario}</p>
      <fieldset className="mt-4 space-y-2" disabled={checked}>
        <legend className="sr-only">ACID-Eigenschaft</legend>
        {(Object.keys(ACID_NAME) as AcidLetter[]).map((l) => (
          <label key={l} className={`flex items-center gap-2 rounded-lg border p-2 ${checked && l === task.answer ? 'border-ok' : checked && l === pick ? 'border-bad' : 'border-line'}`}>
            <input type="radio" name="acid" checked={pick === l} onChange={() => setPick(l)} />
            <strong>{l}</strong> {ACID_NAME[l]}
          </label>
        ))}
      </fieldset>
      {checked && (
        <Verdict ok={ok}>
          Richtig ist {task.answer}: {ACID_NAME[task.answer]}. {task.why}
        </Verdict>
      )}
      <Actions
        checked={checked}
        canCheck={!!pick}
        onCheck={() => {
          setChecked(true);
          report(`tx:acid-${task.id}`, '08-acid', ok, started);
        }}
        onNext={onNext}
      />
    </section>
  );
}

/* ---------------- Ablauf lesen ---------------- */

function ScheduleCard({ task, onNext }: { task: ScheduleTask; onNext: () => void }) {
  const [an, setAn] = useState<Anomaly | ''>('');
  const [lv, setLv] = useState<Level | ''>('');
  const [checked, setChecked] = useState(false);
  const [started] = useState(Date.now());
  const okAn = an === task.answer;
  const okLv = lv === task.level;
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">{task.title}</h2>
      <p className="mt-2">{task.intro}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse font-mono text-sm">
          <caption className="sr-only">Ablauf der Transaktionen T1 und T2 über die Zeit</caption>
          <thead>
            <tr className="bg-bg text-left">
              <th className="border border-line px-2 py-1">Zeit</th>
              <th className="border border-line px-2 py-1">Transaktion 1</th>
              <th className="border border-line px-2 py-1">Transaktion 2</th>
              <th className="border border-line px-2 py-1">{task.stateLabel}</th>
            </tr>
          </thead>
          <tbody>
            {task.rows.map((r, i) => (
              <tr key={i}>
                <td className="border border-line px-2 py-1 text-muted">{i + 1}</td>
                <td className="border border-line px-2 py-1">{r.t1}</td>
                <td className="border border-line px-2 py-1">{r.t2}</td>
                <td className="border border-line px-2 py-1 text-right">{r.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <fieldset className="mt-4" disabled={checked}>
        <legend className="font-semibold">Welches Problem entsteht?</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {(Object.keys(ANOMALY_NAME) as Anomaly[]).map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input type="radio" name="an" checked={an === a} onChange={() => setAn(a)} /> {ANOMALY_NAME[a]}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4" disabled={checked}>
        <legend className="font-semibold">Welche Isolationsebene verhindert es?</legend>
        <div className="mt-2 flex flex-col gap-1">
          {(Object.keys(LEVEL_NAME) as Level[]).map((l) => (
            <label key={l} className="flex items-center gap-2">
              <input type="radio" name="lv" checked={lv === l} onChange={() => setLv(l)} /> {LEVEL_NAME[l]}
            </label>
          ))}
        </div>
      </fieldset>

      {checked && (
        <Verdict ok={okAn && okLv}>
          {okAn ? `${ANOMALY_NAME[task.answer]} stimmt.` : `Es ist: ${ANOMALY_NAME[task.answer]}.`}{' '}
          {okLv ? '' : `Bei der Ebene gilt: ${LEVEL_NAME[task.level]}. `}
          {task.why}
        </Verdict>
      )}
      <Actions
        checked={checked}
        canCheck={!!an && !!lv}
        onCheck={() => {
          setChecked(true);
          report(`tx:sched-${task.id}`, '08-isolation', okAn && okLv, started);
        }}
        onNext={onNext}
      />
    </section>
  );
}

/* ---------------- Crash Recovery ---------------- */

function RecoveryCard({ task, onNext }: { task: RecTask; onNext: () => void }) {
  const [ans, setAns] = useState<Record<string, 'neu' | 'alt' | ''>>({});
  const [checked, setChecked] = useState(false);
  const [started] = useState(Date.now());
  const truth = useMemo(() => afterRecovery(task), [task]);
  const crash = useMemo(() => afterCrash(task), [task]);
  const ok = task.items.every((i) => ans[i] === truth[i]);
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">Crash Recovery: Was steht nach der Wiederherstellung in der Datenbank?</h2>
      <p className="mt-2 text-sm text-muted">
        Ein Systemfehler tritt auf. Alle Daten im Buffer sind verloren, Log und persistente Datenbank sind noch da. Ein Strich bedeutet die neue Version (A′), ohne Strich ist die alte.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {task.txs.map((tx) => (
          <li key={tx.name}>{recoveryText(tx)}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        Direkt nach dem Absturz steht in der Datenbank:{' '}
        <span className="font-mono">{task.items.map((i) => `${i}${crash[i] === 'neu' ? '′' : ''}`).join('  ')}</span>
      </p>

      <fieldset className="mt-4" disabled={checked}>
        <legend className="font-semibold">Zustand nach Analyse, REDO und UNDO</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {task.items.map((i) => (
            <label key={i} className="flex items-center gap-2">
              <span className="w-6 font-mono font-bold">{i}</span>
              <select
                className={`flex-1 rounded border bg-surface px-2 py-1 ${checked ? (ans[i] === truth[i] ? 'border-ok' : 'border-bad') : 'border-line'}`}
                value={ans[i] ?? ''}
                aria-label={`Zustand von ${i}`}
                onChange={(e) => setAns({ ...ans, [i]: e.target.value as 'neu' | 'alt' })}
              >
                <option value="">bitte wählen</option>
                <option value="alt">{i} (alte Version)</option>
                <option value="neu">{i}′ (neue Version)</option>
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      {checked && (
        <Verdict ok={ok}>
          Nach der Recovery: <span className="font-mono">{task.items.map((i) => `${i}${truth[i] === 'neu' ? '′' : ''}`).join('  ')}</span>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
            {recoveryWhy(task).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            <li>Die Regel: Committete Transaktionen zählen komplett (REDO), offene werden zurückgesetzt (UNDO).</li>
          </ul>
        </Verdict>
      )}
      <Actions
        checked={checked}
        canCheck={task.items.every((i) => ans[i])}
        onCheck={() => {
          setChecked(true);
          report('tx:recovery', '08-durability', ok, started);
        }}
        onNext={onNext}
      />
    </section>
  );
}

/* ---------------- Seite ---------------- */

export function TransactionPage() {
  useProgress();
  const [mode, setMode] = useState<Mode>('acid');
  const [acid, setAcid] = useState(() => pickNext(acidTasks, 'tx:acid-'));
  const [sched, setSched] = useState(() => pickNext(scheduleTasks, 'tx:sched-'));
  const [rec, setRec] = useState(() => genRecovery(Math.random));
  const [n, setN] = useState(0);

  const next = () => {
    setN(n + 1);
    if (mode === 'acid') setAcid(pickNext(acidTasks, 'tx:acid-', acid.id));
    if (mode === 'ablauf') setSched(pickNext(scheduleTasks, 'tx:sched-', sched.id));
    if (mode === 'recovery') setRec(genRecovery(Math.random));
  };
  const tabs: [Mode, string][] = [
    ['acid', 'ACID zuordnen'],
    ['ablauf', 'Abläufe lesen'],
    ['recovery', 'Crash Recovery'],
  ];
  const done = (list: { id: string }[], p: string) => list.filter((x) => isDone(`${p}${x.id}`)).length;

  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Start
      </a>
      <h1 className="mt-2 text-3xl font-bold">Transaktionen und ACID</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Skript 08: Atomicity, Consistency, Isolation, Durability. Wissensfragen dazu findest du unter{' '}
        <a href="#/lernen" className="underline">
          Wissensfragen lernen
        </a>
        .
      </p>

      <details className="mt-4 rounded-card border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold">Das Wichtigste aus dem Skript</summary>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <strong>Atomicity:</strong> ganz oder gar nicht. Bei einem Abbruch gibt es einen Rollback.
          </p>
          <p>
            <strong>Consistency:</strong> nur valide Zustände. Garantiert nicht die semantische Korrektheit, dafür braucht es Trigger, PL/SQL oder Programmcode.
          </p>
          <p>
            <strong>Isolation:</strong> parallele Transaktionen stören sich nicht. Probleme ohne Isolation: Lost Update, Dirty Read, Phantom.
          </p>
          <p>
            <strong>Durability:</strong> nach COMMIT bleibt es erhalten, gesichert durch das Log (Write-Ahead-Logging).
          </p>
          <p className="sm:col-span-2">
            <strong>Isolationsebenen:</strong> READ COMMITTED (Standard in Oracle) liest nur committete Daten und verhindert Lost Update und Dirty Read, aber keine Phantome. SERIALIZABLE verhindert alles, ist aber aufwendig.
          </p>
          <p className="sm:col-span-2">
            <strong>Crash Recovery:</strong> Analyse, dann REDO (alle protokollierten Änderungen wiederholen), dann UNDO (offene Transaktionen zurücksetzen).
          </p>
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Aufgabenart">
        {tabs.map(([m, label]) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg border px-4 py-2 font-semibold ${mode === m ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {label}
            {m === 'acid' && <span className="ml-2 text-xs font-normal opacity-80">{done(acidTasks, 'tx:acid-')}/{acidTasks.length}</span>}
            {m === 'ablauf' && <span className="ml-2 text-xs font-normal opacity-80">{done(scheduleTasks, 'tx:sched-')}/{scheduleTasks.length}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {mode === 'acid' && <AcidCard key={`a${acid.id}${n}`} task={acid} onNext={next} />}
        {mode === 'ablauf' && <ScheduleCard key={`s${sched.id}${n}`} task={sched} onNext={next} />}
        {mode === 'recovery' && <RecoveryCard key={`r${n}`} task={rec} onNext={next} />}
      </div>
    </>
  );
}
