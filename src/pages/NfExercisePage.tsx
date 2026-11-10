import { useState, type ReactNode } from 'react';
import { DataTable } from '../components/DataTable';
import { RelationView } from '../components/RelationView';
import type { Relation } from '../content/erPhrases';
import { nfExercises } from '../content/exercises';
import type { DepKind, NfExercise, Table } from '../content/types';
import { gradeHighest, gradeOneNf } from '../logic/nfGrading';
import { markDone } from '../progress';

type Status = 'open' | 'wrong' | 'right' | 'revealed';

const btn =
  'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line px-4 py-2 font-semibold';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-card border border-line bg-surface p-5">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** Tabelle mit einer Erklaerung der Spaltenkuerzel rechts daneben (auf schmalen Bildschirmen darunter). */
function TableWithGlossary({ ex, table, caption, highlight }: { ex: NfExercise; table: Table; caption: string; highlight?: string[] }) {
  const entries = Object.entries(ex.glossary ?? {}).filter(([k]) => table.columns.includes(k));
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <DataTable table={table} highlight={highlight} caption={caption} />
      </div>
      {entries.length > 0 && (
        <aside className="rounded-lg border border-line p-3 text-sm lg:w-64 lg:shrink-0" aria-label="Bedeutung der Spalten">
          <h3 className="mb-1 font-semibold">Bedeutung der Spalten</h3>
          <dl className="space-y-1">
            {entries.map(([k, v]) => (
              <div key={k}>
                <dt className="inline font-mono font-semibold">{k}</dt>
                <dd className="inline text-muted"> = {v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </div>
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
      <TableWithGlossary ex={ex} table={ex.relation} highlight={flagged} caption={ex.title} />
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
        {locked && ex.oneNF.ok && (
          <p>
            Alle Attribute sind atomar. Die Relation ist in 1NF. {ex.oneNF.fixNote}
          </p>
        )}
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

/* ---------- Schritt 2: Abhaengigkeiten selbst erkennen ---------- */

/** Erwartete Abhaengigkeit je Nichtschluessel-Attribut (aus den hinterlegten FDs abgeleitet). */
export function expectedDependency(ex: NfExercise, attr: string): { lhs: string[]; kind: DepKind; why?: string } {
  const base = ex.oneNF.fixed ?? ex.relation;
  const fd = ex.fds.find((f) => f.rhs.includes(attr));
  return fd ? { lhs: fd.lhs, kind: fd.kind, why: fd.why } : { lhs: base.pk, kind: 'voll' };
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

function StepFds({ ex, onNext }: { ex: NfExercise; onNext?: () => void }) {
  const base = ex.oneNF.fixed ?? ex.relation;
  const attrs = base.columns.filter((c) => !base.pk.includes(c));
  const [ans, setAns] = useState<Record<string, { from: string[]; kind: DepKind | '' }>>(
    Object.fromEntries(attrs.map((a) => [a, { from: [], kind: '' as const }])),
  );
  const [status, setStatus] = useState<Status>('open');
  const [result, setResult] = useState<Record<string, boolean>>({});
  const locked = status === 'right' || status === 'revealed';

  const shown = (a: string) => {
    if (!locked) return ans[a];
    const e = expectedDependency(ex, a);
    return { from: e.lhs, kind: e.kind };
  };
  const toggle = (a: string, c: string, on: boolean) =>
    setAns({ ...ans, [a]: { ...ans[a], from: on ? [...ans[a].from, c] : ans[a].from.filter((x) => x !== c) } });

  return (
    <Panel title="Schritt 2: Abhängigkeiten erkennen">
      <p className="mb-3 text-sm text-muted">
        Welches Attribut hängt wovon ab? Kreuze für jedes Attribut an, von welchen Attributen es funktional abhängt, und
        ordne die Abhängigkeit als voll, partiell oder transitiv ein.
      </p>
      <TableWithGlossary ex={ex} table={base} caption="Relation in 1NF" />
      <ul className="mt-4 space-y-3">
        {attrs.map((a) => {
          const v = shown(a);
          const ok = result[a];
          const e = expectedDependency(ex, a);
          return (
            <li key={a} className="rounded-lg border border-line p-3">
              <fieldset disabled={locked}>
                <legend className="font-mono text-sm font-semibold">
                  {a} hängt ab von
                  {status === 'wrong' && <span className={`ml-2 ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? '✓' : '✗'}</span>}
                </legend>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {base.columns
                    .filter((c) => c !== a)
                    .map((c) => (
                      <label key={c} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={v.from.includes(c)} onChange={(ev) => toggle(a, c, ev.target.checked)} />
                        <span className="font-mono">{c}</span>
                      </label>
                    ))}
                </div>
                <label className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  Art der Abhängigkeit:
                  <select
                    className="rounded border border-line bg-surface px-2 py-1"
                    value={v.kind}
                    onChange={(ev) => setAns({ ...ans, [a]: { ...ans[a], kind: ev.target.value as DepKind } })}
                    aria-label={`Art der Abhängigkeit von ${a}`}
                  >
                    <option value="">bitte wählen</option>
                    <option value="voll">voll</option>
                    <option value="partiell">partiell</option>
                    <option value="transitiv">transitiv</option>
                  </select>
                </label>
              </fieldset>
              {locked && (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-mono">
                    {e.lhs.join(', ')} → {a}
                  </span>
                  : {e.why ?? 'Das Attribut hängt vom gesamten Schlüssel ab.'}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <Feedback status={status} />
      <Actions
        status={status}
        canCheck={attrs.every((a) => ans[a].from.length > 0 && ans[a].kind)}
        onCheck={() => {
          const r = Object.fromEntries(
            attrs.map((a) => {
              const e = expectedDependency(ex, a);
              return [a, sameSet(ans[a].from, e.lhs) && ans[a].kind === e.kind];
            }),
          );
          setResult(r);
          setStatus(Object.values(r).every(Boolean) ? 'right' : 'wrong');
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

/* ---------- Schritt 4/5: Tabellen selbst bilden ---------- */

interface DraftRel {
  name: string;
  cols: string[];
  pk: string[];
  fk: string[];
}
const sig = (cols: string[], pk: string[], fk: string[]) =>
  [[...cols].sort().join(','), [...pk].sort().join(','), [...fk].sort().join(',')].join('|');
const toDraft = (r: Relation): DraftRel => ({
  name: r.name,
  cols: r.columns.map((c) => c.name),
  pk: r.columns.filter((c) => c.pk).map((c) => c.name),
  fk: r.columns.filter((c) => c.fk).map((c) => c.name),
});

function StepBuild({
  ex,
  stage,
  from,
  title,
  last,
  onNext,
  doneNow,
}: {
  ex: NfExercise;
  stage: Relation[];
  from: Relation[] | null;
  title: string;
  last: boolean;
  onNext?: () => void;
  doneNow: () => void;
}) {
  const base = ex.oneNF.fixed ?? ex.relation;
  const hint = ex.stages!.find((s) => s.relations === stage)?.hint;
  // Erste Stufe: leer beginnen. Folgestufen: mit dem (richtigen) Ergebnis der vorigen Stufe starten und weiter zerlegen.
  const [rels, setRels] = useState<DraftRel[]>(from ? from.map(toDraft) : [{ name: '', cols: [], pk: [], fk: [] }]);
  const [status, setStatus] = useState<Status>('open');
  const [result, setResult] = useState<boolean[]>([]);
  const [showHint, setShowHint] = useState(false);
  const locked = status === 'right' || status === 'revealed';

  const upd = (i: number, f: (r: DraftRel) => DraftRel) => setRels(rels.map((r, j) => (j === i ? f(r) : r)));
  const toggle = (list: string[], c: string, on: boolean) => (on ? [...list, c] : list.filter((x) => x !== c));

  const check = () => {
    const expected = stage.map((r) => {
      const d = toDraft(r);
      return sig(d.cols, d.pk, d.fk);
    });
    const left = [...expected];
    const res = rels.map((r) => {
      const k = left.indexOf(sig(r.cols, r.pk, r.fk));
      if (k >= 0) left.splice(k, 1);
      return k >= 0;
    });
    setResult(res);
    setStatus(res.every(Boolean) && rels.length === expected.length ? 'right' : 'wrong');
  };

  return (
    <Panel title={title}>
      <p className="mb-3 text-sm text-muted">
        {from
          ? 'Du startest mit dem Ergebnis des letzten Schritts. Zerlege die Relationen weiter, bis das Schema in 3NF ist.'
          : 'Bilde die Relationen der Zielnormalform: Welche Attribute gehören zusammen in eine Relation? Wähle pro Relation ihre Attribute, ihren Primärschlüssel (PK) und ihre Fremdschlüssel (FK).'}
      </p>
      {hint && !locked && (showHint ? (
        <p className="mb-3 rounded-lg bg-bg p-3 text-sm">
          <strong>Hinweis:</strong> {hint}
        </p>
      ) : (
        <button className="mb-3 text-sm underline" onClick={() => setShowHint(true)}>
          Hinweis anzeigen
        </button>
      ))}
      {locked ? (
        <div className="rounded-lg bg-surface p-3">
          <RelationView relations={stage} />
        </div>
      ) : (
        <div className="space-y-3">
          {rels.map((r, i) => (
            <fieldset key={i} className="rounded-lg border border-line p-3">
              <legend className="px-1 text-sm font-semibold">
                Relation {i + 1}
                {status === 'wrong' && <span className={`ml-2 ${result[i] ? 'text-ok' : 'text-bad'}`}>{result[i] ? '✓' : '✗'}</span>}
              </legend>
              <label className="flex flex-wrap items-center gap-2 text-sm">
                Name
                <input
                  className="rounded border border-line bg-surface px-2 py-1"
                  value={r.name}
                  placeholder="z. B. Kurs"
                  onChange={(e) => upd(i, (x) => ({ ...x, name: e.target.value }))}
                />
              </label>
              <table className="mt-2 text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="pr-4 font-normal">Attribut</th>
                    <th className="pr-3 font-normal">PK</th>
                    <th className="font-normal">FK</th>
                  </tr>
                </thead>
                <tbody>
                  {base.columns.map((c) => {
                    const inRel = r.cols.includes(c);
                    return (
                      <tr key={c}>
                        <td className="pr-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={inRel}
                              onChange={(e) =>
                                upd(i, (x) => ({
                                  ...x,
                                  cols: toggle(x.cols, c, e.target.checked),
                                  pk: e.target.checked ? x.pk : x.pk.filter((y) => y !== c),
                                  fk: e.target.checked ? x.fk : x.fk.filter((y) => y !== c),
                                }))
                              }
                            />
                            <span className="font-mono">{c}</span>
                          </label>
                        </td>
                        <td className="pr-3">
                          <input type="checkbox" aria-label={`${c} ist Primärschlüssel`} disabled={!inRel} checked={r.pk.includes(c)} onChange={(e) => upd(i, (x) => ({ ...x, pk: toggle(x.pk, c, e.target.checked) }))} />
                        </td>
                        <td>
                          <input type="checkbox" aria-label={`${c} ist Fremdschlüssel`} disabled={!inRel} checked={r.fk.includes(c)} onChange={(e) => upd(i, (x) => ({ ...x, fk: toggle(x.fk, c, e.target.checked) }))} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {rels.length > 1 && (
                <button className="mt-2 text-sm underline" onClick={() => setRels(rels.filter((_, j) => j !== i))}>
                  Relation entfernen
                </button>
              )}
            </fieldset>
          ))}
          <button className={btnGhost} onClick={() => setRels([...rels, { name: '', cols: [], pk: [], fk: [] }])}>
            + Relation hinzufügen
          </button>
        </div>
      )}
      <Feedback status={status}>
        {status === 'wrong' && <p>Noch nicht ganz. Prüfe Attribute, Primärschlüssel und Fremdschlüssel der markierten Relationen und die Anzahl der Relationen.</p>}
        {locked && last && ex.targetNote && <p>{ex.targetNote}</p>}
      </Feedback>
      <div className="mt-4 flex flex-wrap gap-3">
        {!locked && (
          <button className={btn} onClick={check} disabled={rels.some((r) => !r.cols.length || !r.pk.length)}>
            Prüfen
          </button>
        )}
        {status === 'wrong' && (
          <button className={btnGhost} onClick={() => setStatus('revealed')}>
            Lösung zeigen
          </button>
        )}
        {locked && !last && onNext && (
          <button className={btn} onClick={onNext}>
            Weiter
          </button>
        )}
        {locked && last && (
          <a href="#/normalisierung" className={`${btn} no-underline`} onClick={doneNow}>
            Aufgabe abschließen
          </a>
        )}
      </div>
    </Panel>
  );
}

/* ---------- Abschluss der reinen 1NF-Aufgabe ---------- */
function StepFinishOneNf({ ex, doneNow }: { ex: NfExercise; doneNow: () => void }) {
  const base = ex.oneNF.fixed ?? ex.relation;
  return (
    <Panel title="Schritt 2: Ergebnis">
      <p className="mb-3 text-sm">
        Die Relation ist jetzt in 1NF: alle Attribute sind atomar, der Schlüssel ist <strong>{base.pk.join(', ')}</strong>.
        Abhängigkeiten zwischen den Attributen (partiell, transitiv) sind Thema der Aufgaben zur 2NF und 3NF.
      </p>
      <TableWithGlossary ex={ex} table={base} caption="Relation in 1NF" />
      <div className="mt-4 flex flex-wrap gap-3">
        <a href="#/normalisierung" className={`${btn} no-underline`} onClick={doneNow}>
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
  // Reine 1NF-Aufgabe: Abhaengigkeiten kommen erst in den Aufgaben zur 2NF und 3NF (wie im Skript).
  const oneOnly = ex.tags.length === 1 && ex.tags[0] === '1NF';
  const stages = ex.stages;
  const steps = oneOnly ? 2 : stages ? 3 + stages.length : 4;
  const next = () => setStep((s) => s + 1);
  return (
    <>
      <a href="#/normalisierung" className="inline-block py-2 text-sm underline">
        ← Aufgaben
      </a>
      <h1 className="mt-2 text-2xl font-bold">{ex.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Fortschritt: Schritt {Math.min(step + 1, steps)} von {steps}
      </p>
      {step >= 0 && <StepOneNf key="s1" ex={ex} onNext={step === 0 ? next : undefined} />}
      {oneOnly ? (
        step >= 1 && <StepFinishOneNf key="s2" ex={ex} doneNow={() => markDone(`nf:${ex.id}`)} />
      ) : (
        <>
          {step >= 1 && <StepFds key="s2" ex={ex} onNext={step === 1 ? next : undefined} />}
          {step >= 2 && <StepHighest key="s3" ex={ex} onNext={step === 2 ? next : undefined} />}
          {stages
            ? stages.map(
                (st, k) =>
                  step >= 3 + k && (
                    <StepBuild
                      key={`b${k}`}
                      ex={ex}
                      stage={st.relations}
                      from={k > 0 ? stages[k - 1].relations : null}
                      title={st.title}
                      last={k === stages.length - 1}
                      onNext={step === 3 + k ? next : undefined}
                      doneNow={() => markDone(`nf:${ex.id}`)}
                    />
                  ),
              )
            : step >= 3 && <StepTarget key="s4" ex={ex} doneNow={() => markDone(`nf:${ex.id}`)} />}
        </>
      )}
    </>
  );
}
