import { useState, type ReactNode } from 'react';
import { DataTable } from '../components/DataTable';
import { nfExercises } from '../content/exercises';
import type { DepKind, FunctionalDependency, NfExercise } from '../content/types';
import { gradeFds, gradeHighest, gradeOneNf } from '../logic/nfGrading';
import { markDone } from '../progress';

type Status = 'open' | 'wrong' | 'right' | 'revealed';

const btn =
  'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line px-4 py-2 font-semibold';

const fdText = (fd: FunctionalDependency) => `${fd.lhs.join(', ')} → ${fd.rhs.join(', ')}`;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Feedback({ status, children }: { status: Status; children?: ReactNode }) {
  if (status === 'open') return null;
  const good = status === 'right';
  return (
    <div
      role="status"
      className={`mt-4 rounded-lg p-3 text-sm ${good ? 'bg-ok-bg text-ok' : 'bg-bad-bg text-bad'}`}
    >
      <strong>
        {status === 'right' ? 'Richtig.' : status === 'wrong' ? 'Nicht ganz, versuche es noch einmal.' : 'Lösung:'}
      </strong>
      {children && <div className="mt-1 text-ink">{children}</div>}
    </div>
  );
}

function HintButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <p className="mb-3 rounded-lg bg-bg p-3 text-sm">
      <strong>Hinweis:</strong> {text}
    </p>
  ) : (
    <button className="mb-3 text-sm underline" onClick={() => setOpen(true)}>
      Hinweis anzeigen
    </button>
  );
}

function Actions({
  status,
  onCheck,
  onReveal,
  onNext,
  canCheck,
}: {
  status: Status;
  onCheck: () => void;
  onReveal: () => void;
  onNext?: () => void;
  canCheck: boolean;
}) {
  const solved = status === 'right' || status === 'revealed';
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {!solved && (
        <button className={btn} onClick={onCheck} disabled={!canCheck}>
          Prüfen
        </button>
      )}
      {status === 'wrong' && (
        <button className={btnGhost} onClick={onReveal}>
          Lösung zeigen
        </button>
      )}
      {solved && onNext && (
        <button className={btn} onClick={onNext}>
          Weiter
        </button>
      )}
    </div>
  );
}

/* ---------- Schritt 1: 1NF ---------- */
function StepOneNf({ ex, onNext }: { ex: NfExercise; onNext?: () => void }) {
  const [says, setSays] = useState<boolean | null>(null);
  const [cols, setCols] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('open');
  const locked = status === 'right' || status === 'revealed';
  const flagged = locked ? ex.oneNF.issues.map((i) => i.column) : [];

  return (
    <Panel title="Schritt 1: Erste Normalform">
      <p className="text-sm text-muted">{ex.scenario}</p>
      <p className="mb-3 mt-2 font-semibold">
        {ex.tags.length >= 3
          ? 'Aufgabe: Stelle selbst fest, bis zu welcher Normalform sich die Relation überführen lässt, und überführe sie so weit wie möglich (höchstens bis zur 3NF).'
          : `Schwerpunkt dieser Aufgabe: ${ex.tags.join(' und ')}.`}
      </p>
      {ex.hint && <HintButton text={ex.hint} />}
      <DataTable table={ex.relation} highlight={flagged} caption={ex.title} />
      <fieldset className="mt-4" disabled={locked}>
        <legend className="font-semibold">Befindet sich die Relation in 1NF?</legend>
        <div className="mt-2 flex gap-4">
          {[true, false].map((v) => (
            <label key={String(v)} className="flex items-center gap-2">
              <input type="radio" name="1nf" checked={says === v} onChange={() => setSays(v)} />
              {v ? 'Ja' : 'Nein'}
            </label>
          ))}
        </div>
        {says === false && (
          <div className="mt-3">
            <p className="text-sm">Welche Attribute verletzen die 1NF?</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {ex.relation.columns.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cols.includes(c)}
                    onChange={(e) => setCols(e.target.checked ? [...cols, c] : cols.filter((x) => x !== c))}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>
      <Feedback status={status}>
        {locked && ex.oneNF.ok && <p>Alle Attribute sind atomar. Die Relation ist in 1NF.</p>}
        {locked && !ex.oneNF.ok && (
          <>
            <ul className="list-disc pl-5">
              {ex.oneNF.issues.map((i) => (
                <li key={i.column}>
                  <strong>{i.column}</strong> ({i.type}): {i.why}
                </li>
              ))}
            </ul>
            {ex.oneNF.fixed && (
              <div className="mt-3">
                <p className="mb-2">{ex.oneNF.fixNote}</p>
                <DataTable table={ex.oneNF.fixed} caption="Relation in 1NF" />
              </div>
            )}
          </>
        )}
      </Feedback>
      <Actions
        status={status}
        canCheck={says !== null}
        onCheck={() => setStatus(gradeOneNf(ex, says!, cols) ? 'right' : 'wrong')}
        onReveal={() => setStatus('revealed')}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------- Schritt 2: Abhaengigkeiten ---------- */
function StepFds({ ex, onNext }: { ex: NfExercise; onNext?: () => void }) {
  const [answers, setAnswers] = useState<(DepKind | '')[]>(ex.fds.map(() => ''));
  const [status, setStatus] = useState<Status>('open');
  const [result, setResult] = useState<boolean[]>([]);
  const locked = status === 'right' || status === 'revealed';
  const base = ex.oneNF.fixed ?? ex.relation;

  return (
    <Panel title="Schritt 2: Abhängigkeiten einordnen">
      <p className="mb-1 text-sm text-muted">
        Schlüssel: <strong>{base.pk.join(', ')}</strong>. Ordne jede funktionale Abhängigkeit als voll,
        partiell oder transitiv ein.
      </p>
      <DataTable table={base} caption="Relation in 1NF" />
      <ul className="mt-4 space-y-3">
        {ex.fds.map((fd, i) => {
          const ok = result[i];
          return (
            <li key={i} className="rounded-lg border border-line p-3">
              <label className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm">{fdText(fd)}</span>
                <select
                  className="rounded border border-line bg-surface px-2 py-1"
                  value={locked ? fd.kind : answers[i]}
                  disabled={locked}
                  onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? (e.target.value as DepKind) : a)))}
                  aria-label={`Art der Abhängigkeit ${fdText(fd)}`}
                >
                  <option value="">bitte wählen</option>
                  <option value="voll">voll</option>
                  <option value="partiell">partiell</option>
                  <option value="transitiv">transitiv</option>
                </select>
                {status === 'wrong' && (
                  <span className={ok ? 'text-ok' : 'text-bad'}>{ok ? '✓' : '✗'}</span>
                )}
              </label>
              {locked && <p className="mt-2 text-sm text-muted">{fd.why}</p>}
            </li>
          );
        })}
      </ul>
      <Feedback status={status} />
      <Actions
        status={status}
        canCheck={answers.every(Boolean)}
        onCheck={() => {
          const r = gradeFds(ex, answers);
          setResult(r);
          setStatus(r.every(Boolean) ? 'right' : 'wrong');
        }}
        onReveal={() => setStatus('revealed')}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------- Schritt 3: hoechste NF ---------- */
function StepHighest({ ex, onNext }: { ex: NfExercise; onNext?: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('open');
  const locked = status === 'right' || status === 'revealed';
  const why: Record<number, string> = {
    1: 'Es gibt partielle Abhängigkeiten. Die Relation ist also in 1NF, aber nicht in 2NF.',
    2: 'Es gibt keine partiellen, aber transitive Abhängigkeiten. Die Relation ist in 2NF, aber nicht in 3NF.',
    3: 'Weder partielle noch transitive Abhängigkeiten. Die Relation ist in 3NF.',
  };
  return (
    <Panel title="Schritt 3: Höchste erfüllte Normalform">
      <p className="mb-2">Welche Normalform erfüllt die Relation (nach Bereinigung der 1NF) höchstens?</p>
      <fieldset disabled={locked} className="flex gap-6">
        <legend className="sr-only">Höchste Normalform</legend>
        {[1, 2, 3].map((n) => (
          <label key={n} className="flex items-center gap-2">
            <input type="radio" name="hnf" checked={pick === n} onChange={() => setPick(n)} />
            {n}NF
          </label>
        ))}
      </fieldset>
      <Feedback status={status}>{locked && <p>{why[ex.highestNF]}</p>}</Feedback>
      <Actions
        status={status}
        canCheck={pick !== null}
        onCheck={() => setStatus(gradeHighest(ex, pick!) ? 'right' : 'wrong')}
        onReveal={() => setStatus('revealed')}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------- Schritt 4: Zielschema ---------- */
function StepTarget({ ex, doneNow }: { ex: NfExercise; doneNow: () => void }) {
  return (
    <Panel title={ex.tags.length >= 3 ? 'Schritt 4: Zielschema (so weit wie möglich, höchstens 3NF)' : 'Schritt 4: Zielschema'}>
      <p className="mb-3 text-sm text-muted">So sieht das normalisierte Schema aus (Notation wie in Skript 05):</p>
      <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-bg p-4 font-mono text-sm leading-7">
        {ex.target.join('\n')}
      </pre>
      {ex.targetNote && <p className="mt-3 text-sm">{ex.targetNote}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="#/normalisierung"
          className={`${btn} no-underline`}
          onClick={doneNow}
        >
          Aufgabe abschließen
        </a>
      </div>
    </Panel>
  );
}

export function NfExercisePage({ id }: { id: string }) {
  const ex = nfExercises.find((e) => e.id === id);
  const [step, setStep] = useState(0);
  if (!ex) {
    return (
      <>
        <p>Aufgabe nicht gefunden.</p>
        <a href="#/normalisierung" className="underline">
          Zur Aufgabenliste
        </a>
      </>
    );
  }
  const next = () => setStep((s) => s + 1);
  return (
    <>
      <a href="#/normalisierung" className="inline-block py-2 text-sm underline">
        ← Aufgaben
      </a>
      <h1 className="mt-2 text-2xl font-bold">{ex.title}</h1>
      <p className="mt-1 text-sm text-muted">Fortschritt: Schritt {Math.min(step + 1, 4)} von 4</p>
      {step >= 0 && <StepOneNf key="s1" ex={ex} onNext={step === 0 ? next : undefined} />}
      {step >= 1 && <StepFds key="s2" ex={ex} onNext={step === 1 ? next : undefined} />}
      {step >= 2 && <StepHighest key="s3" ex={ex} onNext={step === 2 ? next : undefined} />}
      {step >= 3 && <StepTarget key="s4" ex={ex} doneNow={() => markDone(`nf:${ex.id}`)} />}
    </>
  );
}
