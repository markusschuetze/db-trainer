import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { ErDiagram } from '../components/ErDiagram';
import { ScenarioBrowser } from '../components/ScenarioBrowser';
import { RelationView } from '../components/RelationView';
import { ARTIFICIAL, deriveSchema, entityCandidates, keyOptions, relationshipCandidates, relKey } from '../logic/textTaskLogic';
import { SqlEditor } from '../components/SqlEditor';
import { StatementOutput } from '../components/SqlOutput';
import { CARD_LABEL, CARDS, fkNotNull, toRelations, validMappings, type Card, type Mapping } from '../content/erPhrases';
import { BUILTIN_CHAPTERS, CHAPTER_NAME, type Chapter } from '../content/mcQuestions';
import type { DepKind } from '../content/types';
import {
  buildExam,
  gradeEstimate,
  gradeItem,
  loadExam,
  saveExam,
  type Answer,
  type ExamItem,
  type ExamState,
  type NfAnswer,
  type TtAnswer,
} from '../exam/exam';
import { topicById } from '../content/topics';
import { track } from '../analytics';
import { recordExam, type ExamAttempt } from '../progress';
import { topicOfItem } from '../progressCatalog';
import { reportScore } from '../scorm';
import { runExercise } from '../sql/ddlGrading';
import type { StatementResult } from '../sql/oracle';
import { runSqlExercise } from '../sql/sqlGrading';
import { useSql } from '../useSql';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
const allChapters = () => Object.keys(CHAPTER_NAME) as Chapter[];

/* ======================= Start ======================= */

function Setup({ onStart }: { onStart: (s: ExamState) => void }) {
  const [chapters, setChapters] = useState<Chapter[]>(allChapters);
  const [minutes, setMinutes] = useState(60);
  const [allowRun, setAllowRun] = useState(false);
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">Probeklausur zusammenstellen</h2>
      <fieldset className="mt-4">
        <legend className="font-semibold">Kapitel</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {allChapters().map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={chapters.includes(c)}
                onChange={(e) => setChapters(e.target.checked ? [...chapters, c] : chapters.filter((x) => x !== c))}
              />
              {c === 'SQL' ? '' : `${c} `}
              {CHAPTER_NAME[c]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="font-semibold">Bearbeitungszeit</span>
        <select
          className="mt-1 block rounded-lg border border-line bg-surface px-3 py-2"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          <option value={30}>30 Minuten (kurz)</option>
          <option value={60}>60 Minuten</option>
          <option value={90}>90 Minuten (lang)</option>
          <option value={0}>Ohne Zeitlimit (zählt nicht für die Prüfungsreife)</option>
        </select>
      </label>
      <label className="mt-4 flex items-start gap-2">
        <input type="checkbox" className="mt-1" checked={allowRun} onChange={(e) => setAllowRun(e.target.checked)} />
        <span>
          SQL darf ausgeführt werden
          <span className="block text-sm text-muted">Aus: wie eine Papierklausur. An: wie eine Rechnerklausur.</span>
        </span>
      </label>
      <p className="mt-4 text-sm text-muted">
        Während der Klausur gibt es keine Rückmeldung. Die Antworten werden lokal in deinem Browser zwischengespeichert,
        ein Neuladen der Seite ist also unkritisch. Die Notenangabe am Ende ist nur eine Orientierung.
      </p>
      <button
        className={`${btn} mt-4`}
        disabled={chapters.length === 0}
        onClick={() =>
          onStart({
            chapters,
            minutes,
            allowRun,
            seed: Math.floor(Math.random() * 2 ** 31),
            startedAt: Date.now(),
            answers: {},
          })
        }
      >
        Probeklausur starten
      </button>
    </section>
  );
}

/* ======================= Aufgaben-Eingabe ======================= */

function McInput({ item, value, onChange }: { item: Extract<ExamItem, { kind: 'mc' }>; value?: number[]; onChange: (v: number[]) => void }) {
  const v = value ?? [];
  return (
    <fieldset>
      <legend className="mb-2">
        {item.q.question}
        {item.q.multi && <span className="ml-2 text-sm text-muted">(Mehrfachauswahl)</span>}
      </legend>
      <div className="space-y-1">
        {item.q.options.map((o, i) => (
          <label key={i} className="flex items-start gap-2">
            <input
              className="mt-1"
              type={item.q.multi ? 'checkbox' : 'radio'}
              name={item.id}
              checked={v.includes(i)}
              onChange={(e) => onChange(item.q.multi ? (e.target.checked ? [...v, i] : v.filter((x) => x !== i)) : [i])}
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CardSelect({ label, value, onChange }: { label: string; value?: Card; onChange: (c: Card) => void }) {
  return (
    <label className="block min-w-0">
      <span className="text-sm">{label}</span>
      <select
        className="mt-1 block w-full min-w-0 max-w-full rounded-lg border border-line bg-surface px-3 py-2"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as Card)}
      >
        <option value="">bitte wählen</option>
        {CARDS.map((c) => (
          <option key={c} value={c}>
            {CARD_LABEL[c]}
          </option>
        ))}
      </select>
    </label>
  );
}

function SqlInput({
  item,
  value,
  onChange,
  allowRun,
}: {
  item: Extract<ExamItem, { kind: 'ddl' | 'sql' }>;
  value?: string;
  onChange: (v: string) => void;
  allowRun: boolean;
}) {
  const { SQL } = useSql();
  const [out, setOut] = useState<StatementResult[] | null>(null);
  const run = () => {
    if (!SQL || !allowRun) return;
    setOut(item.kind === 'ddl' ? runExercise(SQL, item.ex, value ?? '').results : runSqlExercise(SQL, item.ex, value ?? '').results);
  };
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line">{item.ex.task}</p>
      {item.kind === 'ddl' && item.ex.setup && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Bereits vorhandene Tabellen</summary>
          <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs">{item.ex.setup.trim()}</pre>
        </details>
      )}
      {item.kind === 'sql' && <ScenarioBrowser SQL={SQL} scenario={item.ex.scenario} />}
      <SqlEditor value={value ?? ''} onChange={onChange} onRun={run} label={`SQL für Aufgabe ${item.ex.title}`} />
      {allowRun && (
        <button className={btnGhost} onClick={run} disabled={!SQL}>
          Ausführen
        </button>
      )}
      {out && <StatementOutput results={out} />}
    </div>
  );
}

function ItemInput({ item, answer, set, allowRun }: { item: ExamItem; answer?: Answer; set: (a: Answer) => void; allowRun: boolean }) {
  switch (item.kind) {
    case 'mc':
      return <McInput item={item} value={answer as number[]} onChange={set} />;
    case 'er': {
      const a = (answer as { a12?: Card; a21?: Card }) ?? {};
      return (
        <div className="space-y-3">
          <p>{item.p.text}</p>
          <div className="flex justify-center">
            <ErDiagram e1={item.p.e1.name} e2={item.p.e2.name} verb={item.p.verb} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CardSelect label={`Pro „${item.p.e2.name}“: wie viele „${item.p.e1.name}“?`} value={a.a21} onChange={(c) => set({ ...a, a21: c })} />
            <CardSelect label={`Pro „${item.p.e1.name}“: wie viele „${item.p.e2.name}“?`} value={a.a12} onChange={(c) => set({ ...a, a12: c })} />
          </div>
        </div>
      );
    }
    case 'spez': {
      const a = (answer as { disjoint?: boolean; total?: boolean }) ?? {};
      return (
        <div className="space-y-3">
          <p>{item.s.text}</p>
          <p className="text-sm text-muted">
            Supertyp {item.s.supertype}, Subtypen: {item.s.subtypes.join(', ')}
          </p>
          <div className="flex flex-wrap gap-4">
            {[true, false].map((v) => (
              <label key={String(v)} className="flex items-center gap-2">
                <input type="radio" name={`${item.id}-d`} checked={a.disjoint === v} onChange={() => set({ ...a, disjoint: v })} />
                {v ? 'disjunkt' : 'überlappend'}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {[true, false].map((v) => (
              <label key={String(v)} className="flex items-center gap-2">
                <input type="radio" name={`${item.id}-t`} checked={a.total === v} onChange={() => set({ ...a, total: v })} />
                {v ? 'vollständig' : 'partiell'}
              </label>
            ))}
          </div>
        </div>
      );
    }
    case 'rel': {
      const a = (answer as { mapping?: Mapping; nullable?: boolean; pk?: string }) ?? {};
      const p = item.p;
      return (
        <div className="space-y-3">
          <p>{p.text}</p>
          <div className="flex justify-center">
            <ErDiagram e1={p.e1.name} e2={p.e2.name} verb={p.verb} c12={p.c12} c21={p.c21} />
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Abbildung</legend>
            {(
              [
                ['fk-e1', `Fremdschlüssel in ${p.e1.name}`],
                ['fk-e2', `Fremdschlüssel in ${p.e2.name}`],
                ['zuordnung', 'Eigene Zuordnungsrelation'],
              ] as [Mapping, string][]
            ).map(([v, t]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name={`${item.id}-m`} checked={a.mapping === v} onChange={() => set({ ...a, mapping: v })} />
                {t}
              </label>
            ))}
          </fieldset>
          {a.mapping && a.mapping !== 'zuordnung' && (
            <fieldset>
              <legend className="text-sm font-semibold">Fremdschlüssel</legend>
              {[false, true].map((v) => (
                <label key={String(v)} className="flex items-center gap-2">
                  <input type="radio" name={`${item.id}-n`} checked={a.nullable === v} onChange={() => set({ ...a, nullable: v })} />
                  {v ? 'NULL erlaubt' : 'NOT NULL'}
                </label>
              ))}
            </fieldset>
          )}
          {a.mapping === 'zuordnung' && (
            <fieldset>
              <legend className="text-sm font-semibold">Primärschlüssel der Zuordnungsrelation</legend>
              {[
                ['beide', `${p.e1.key} und ${p.e2.key} zusammen`],
                ['e1', `nur ${p.e1.key}`],
                ['e2', `nur ${p.e2.key}`],
                ['kuenstlich', 'neuer künstlicher Schlüssel'],
              ].map(([v, t]) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="radio" name={`${item.id}-p`} checked={a.pk === v} onChange={() => set({ ...a, pk: v })} />
                  {t}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      );
    }
    case 'nf': {
      const a = (answer as NfAnswer) ?? {};
      const ex = item.ex;
      const fds = a.fds ?? ex.fds.map(() => '' as const);
      return (
        <div className="space-y-4">
          <p>{ex.scenario}</p>
          <DataTable table={ex.relation} caption={ex.title} />
          <fieldset>
            <legend className="text-sm font-semibold">a) Ist die Relation in 1NF? Wenn nein: welche Attribute verletzen sie?</legend>
            <div className="mt-1 flex gap-4">
              {[true, false].map((v) => (
                <label key={String(v)} className="flex items-center gap-2">
                  <input type="radio" name={`${item.id}-1`} checked={a.says1NF === v} onChange={() => set({ ...a, says1NF: v })} />
                  {v ? 'Ja' : 'Nein'}
                </label>
              ))}
            </div>
            {a.says1NF === false && (
              <div className="mt-2 flex flex-wrap gap-x-4">
                {ex.relation.columns.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(a.cols ?? []).includes(c)}
                      onChange={(e) =>
                        set({ ...a, cols: e.target.checked ? [...(a.cols ?? []), c] : (a.cols ?? []).filter((x) => x !== c) })
                      }
                    />
                    {c}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">
              b) Ordne die Abhängigkeiten ein{ex.oneNF.fixed ? ` (nach Herstellung der 1NF, Schlüssel: ${ex.oneNF.fixed.pk.join(', ')})` : ''}.
            </legend>
            <ul className="mt-1 space-y-2">
              {ex.fds.map((fd, i) => (
                <li key={i} className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm">
                    {fd.lhs.join(', ')} → {fd.rhs.join(', ')}
                  </span>
                  <select
                    aria-label={`Art der Abhängigkeit ${fd.lhs.join(', ')} → ${fd.rhs.join(', ')}`}
                    className="rounded border border-line bg-surface px-2 py-1"
                    value={fds[i]}
                    onChange={(e) => set({ ...a, fds: fds.map((x, j) => (j === i ? (e.target.value as DepKind) : x)) })}
                  >
                    <option value="">bitte wählen</option>
                    <option value="voll">voll</option>
                    <option value="partiell">partiell</option>
                    <option value="transitiv">transitiv</option>
                  </select>
                </li>
              ))}
            </ul>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">c) Höchste erfüllte Normalform (nach Bereinigung der 1NF)</legend>
            <div className="mt-1 flex gap-4">
              {[1, 2, 3].map((n) => (
                <label key={n} className="flex items-center gap-2">
                  <input type="radio" name={`${item.id}-h`} checked={a.highest === n} onChange={() => set({ ...a, highest: n })} />
                  {n}NF
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      );
    }
    case 'tt': {
      const a = (answer as TtAnswer) ?? {};
      const t = item.t;
      const upd = (patch: Partial<TtAnswer>) => set({ ...a, ...patch });
      const toggle = (list: string[] | undefined, v: string, on: boolean) => (on ? [...(list ?? []), v] : (list ?? []).filter((x) => x !== v));
      return (
        <div className="space-y-4">
          <p className="text-base leading-7">{t.text}</p>
          <fieldset>
            <legend className="text-sm font-semibold">a) Welche Begriffe sind Entitäten?</legend>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {entityCandidates(t).map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={(a.ents ?? []).includes(c)} onChange={(e) => upd({ ents: toggle(a.ents, c, e.target.checked) })} />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">b) Welche Beziehungen nennt der Text?</legend>
            <div className="mt-1 space-y-1">
              {relationshipCandidates(t, t.entities.map((e) => e.name)).map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={(a.rels ?? []).includes(c.key)} onChange={(e) => upd({ rels: toggle(a.rels, c.key, e.target.checked) })} />
                  {c.e1} — {c.verb} — {c.e2}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">c) Kardinalitäten der Beziehungen</legend>
            <div className="mt-1 space-y-3">
              {t.relationships.map((r) => {
                const k = relKey(r);
                return (
                  <div key={k} className="grid gap-2 sm:grid-cols-2">
                    <CardSelect label={`Pro „${r.e2}“: wie viele „${r.e1}“? (${r.verb})`} value={a.cards?.[k]?.c21} onChange={(c) => upd({ cards: { ...a.cards, [k]: { ...a.cards?.[k], c21: c } } })} />
                    <CardSelect label={`Pro „${r.e1}“: wie viele „${r.e2}“?`} value={a.cards?.[k]?.c12} onChange={(c) => upd({ cards: { ...a.cards, [k]: { ...a.cards?.[k], c12: c } } })} />
                  </div>
                );
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">d) Primärschlüssel</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {t.entities.map((e) => (
                <label key={e.name} className="block text-sm">
                  {e.name}
                  <select className="mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2" value={a.keys?.[e.name] ?? ''} onChange={(ev) => upd({ keys: { ...a.keys, [e.name]: ev.target.value } })}>
                    <option value="">bitte wählen</option>
                    {keyOptions(t, e.name).map((o) => (
                      <option key={o} value={o}>
                        {o === ARTIFICIAL ? 'neuer künstlicher Schlüssel' : o}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
          {t.specializations?.map((sp, i) => (
            <fieldset key={sp.supertype}>
              <legend className="text-sm font-semibold">e) Spezialisierung von {sp.supertype} ({sp.subtypes.join(', ')})</legend>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {[true, false].map((v) => (
                  <label key={`d${v}`} className="flex items-center gap-2">
                    <input type="radio" name={`${item.id}-d${i}`} checked={a.spec?.[i]?.disjoint === v} onChange={() => upd({ spec: { ...a.spec, [i]: { ...a.spec?.[i], disjoint: v } } })} />
                    {v ? 'disjunkt' : 'überlappend'}
                  </label>
                ))}
                {[true, false].map((v) => (
                  <label key={`t${v}`} className="flex items-center gap-2">
                    <input type="radio" name={`${item.id}-t${i}`} checked={a.spec?.[i]?.total === v} onChange={() => upd({ spec: { ...a.spec, [i]: { ...a.spec?.[i], total: v } } })} />
                    {v ? 'vollständig' : 'partiell'}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      );
    }
    case 'ddl':
    case 'sql':
      return <SqlInput item={item} value={answer as string} onChange={set} allowRun={allowRun} />;
  }
}

const itemTitle = (item: ExamItem) =>
  ({
    mc: 'Wissensfrage',
    er: 'Kardinalitäten bestimmen',
    spez: 'Spezialisierung einordnen',
    rel: 'Ins Relationenmodell überführen',
    nf: 'Normalisierung',
    ddl: `SQL-DDL: ${'ex' in item ? item.ex.title : ''}`,
    sql: `SQL: ${'ex' in item ? item.ex.title : ''}`,
    tt: 'Schema aus Text erkennen',
  })[item.kind];

/* ======================= Loesung ======================= */

function Solution({ item }: { item: ExamItem }) {
  switch (item.kind) {
    case 'mc':
      return (
        <p>
          Richtig: {item.q.correct.map((i) => item.q.options[i]).join('; ')}. <span className="text-muted">{item.q.explanation}</span>
        </p>
      );
    case 'er':
      return (
        <>
          <ErDiagram e1={item.p.e1.name} e2={item.p.e2.name} verb={item.p.verb} c12={item.p.c12} c21={item.p.c21} label="Lösung" />
          <p>
            {item.p.e1.name} → {item.p.e2.plural}: {CARD_LABEL[item.p.c12]}; {item.p.e2.name} → {item.p.e1.plural}:{' '}
            {CARD_LABEL[item.p.c21]}
          </p>
        </>
      );
    case 'spez':
      return (
        <p>
          {item.s.disjoint ? 'Disjunkt' : 'Überlappend'}, {item.s.total ? 'vollständig' : 'partiell'}. <span className="text-muted">{item.s.why}</span>
        </p>
      );
    case 'rel': {
      const m = validMappings(item.p)[0];
      return (
        <>
          <RelationView relations={toRelations(item.p, m)} />
          {m !== 'zuordnung' && validMappings(item.p).length > 1 && (
            <p className="text-muted">Bei 1:1 ist der Fremdschlüssel auch in der anderen Relation richtig.</p>
          )}
          {m !== 'zuordnung' && <p className="text-muted">{fkNotNull(item.p, m) ? 'FK ist NOT NULL (Minimum 1).' : 'FK darf NULL sein (Minimum 0).'}</p>}
        </>
      );
    }
    case 'nf':
      return (
        <>
          <p>
            1NF: {item.ex.oneNF.ok ? 'ja' : `nein (${item.ex.oneNF.issues.map((i) => `${i.column}: ${i.type}`).join(', ')})`}. Abhängigkeiten:{' '}
            {item.ex.fds.map((f) => `${f.lhs.join(', ')} → ${f.rhs.join(', ')} (${f.kind})`).join('; ')}. Höchste NF: {item.ex.highestNF}NF.
          </p>
          <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-lg bg-bg p-2 font-mono text-xs">{item.ex.target.join('\n')}</pre>
        </>
      );
    case 'tt':
      return (
        <>
          <p>
            Entitäten: {item.t.entities.map((e) => `${e.name} (Schlüssel: ${e.key || 'künstlich'})`).join(', ')}. Beziehungen:{' '}
            {item.t.relationships.map((r) => `${r.e1} ${r.verb} ${r.e2} (${r.e1} → ${r.e2}: ${r.c12}, ${r.e2} → ${r.e1}: ${r.c21})`).join('; ')}.
          </p>
          <div className="mt-2 rounded-lg bg-bg p-2">
            <RelationView relations={deriveSchema(item.t)} />
          </div>
        </>
      );
    case 'ddl':
    case 'sql':
      return <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-bg p-2 font-mono text-xs">{item.ex.solution}</pre>;
  }
}

const practiceHref = (item: ExamItem) =>
  ({ tt: `#/textaufgaben/${'t' in item ? item.t.id : ''}`, mc: '#/', er: '#/modellierung', spez: '#/modellierung', rel: '#/relationen', nf: `#/normalisierung/${'ex' in item ? item.ex.id : ''}`, ddl: `#/ddl/${'ex' in item ? item.ex.id : ''}`, sql: `#/sql/${'ex' in item ? item.ex.id : ''}` })[
    item.kind
  ];

/* ======================= Seite ======================= */

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function ExamPage() {
  const [state, setState] = useState<ExamState | null>(() => loadExam());
  const [confirm, setConfirm] = useState(false);
  const { SQL } = useSql();
  const items = useMemo(() => (state ? buildExam(state) : []), [state?.seed, state?.chapters.join(), state?.minutes]); // eslint-disable-line react-hooks/exhaustive-deps
  const running = !!state && !state.submittedAt;
  const now = useNow(running);
  const timed = !!state && state.minutes > 0;
  const left = timed ? state!.startedAt + state!.minutes * 60_000 - now : Infinity;

  const update = (s: ExamState | null) => {
    setState(s);
    saveExam(s);
  };
  const submit = () => state && update({ ...state, submittedAt: Date.now() });

  useEffect(() => {
    if (running && timed && left <= 0) submit();
  }, [running, left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(
    () => (state?.submittedAt ? items.map((i) => gradeItem(i, state.answers[i.id], SQL)) : []),
    [state?.submittedAt, items, SQL], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Ergebnis an die Lernplattform melden (nur im SCORM-Paket aktiv), sobald SQL bewertet werden konnte
  useEffect(() => {
    if (!state?.submittedAt || !SQL || !results.length) return;
    const max = items.reduce((s, i) => s + i.points, 0);
    const got = results.reduce((s, r) => s + r.points, 0);
    reportScore(max ? (100 * got) / max : 0);
    // Ins Fortschrittsverzeichnis eintragen (einmalig je Klausur)
    const k: ExamAttempt['k'] = {};
    items.forEach((it, i) => {
      const [p, x] = k[it.chapter] ?? [0, 0];
      k[it.chapter] = [p + results[i].points, x + it.points];
    });
    const fresh = recordExam(
      {
        id: `${state.seed}-${state.startedAt}`,
        t: Math.floor(state.submittedAt / 1000),
        m: state.minutes,
        c: state.chapters,
        p: got,
        x: max,
        k,
      },
      items.map((it, i) => ({ id: it.id, right: results[i].points === it.points })),
    );
    if (fresh) {
      items.forEach((it, i) =>
        track({
          k: 'i',
          i: it.id,
          tp: topicOfItem(it.id) ?? it.chapter,
          ch: it.chapter,
          ok: results[i].points === it.points ? 1 : 0,
          s: 0,
          a: 1,
          h: 0,
          ...(it.kind === 'mc' ? { o: (state.answers[it.id] as number[] | undefined) ?? [] } : {}),
          src: 'k',
        }),
      );
      track({ k: 'e', p: Math.round(got * 2) / 2, x: max, m: Math.max(1, state.minutes), ch: state.chapters, kc: Object.fromEntries(Object.entries(k).map(([c, v]) => [c, v as [number, number]])) });
    }
  }, [state?.submittedAt, SQL, results]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state)
    return (
      <>
        <a href="#/" className="inline-block py-2 text-sm underline">
          ← Übersicht
        </a>
        <h1 className="mt-2 text-3xl font-bold">Prüfungsmodus</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Eine Probeklausur aus allen Aufgabentypen: Wissensfragen, Kardinalitäten, Relationenmodell, Normalisierung und SQL.
          Mit Zeitlimit, ohne Hilfen, mit Auswertung nach Kapiteln.
        </p>
        <div className="mt-6 max-w-2xl">
          <Setup onStart={update} />
        </div>
      </>
    );

  const total = items.reduce((s, i) => s + i.points, 0);

  if (state.submittedAt) {
    const got = results.reduce((s, r) => s + r.points, 0);
    const percent = total ? (100 * got) / total : 0;
    const byChapter = state.chapters.map((c) => {
      const idx = items.map((it, k) => (it.chapter === c ? k : -1)).filter((k) => k >= 0);
      const max = idx.reduce((s, k) => s + items[k].points, 0);
      const pts = idx.reduce((s, k) => s + results[k].points, 0);
      return { c, max, pts };
    });
    return (
      <>
        <h1 className="text-3xl font-bold">Auswertung</h1>
        {!SQL && <p className="mt-2 text-sm text-muted">SQL-Aufgaben werden bewertet, sobald die Datenbank geladen ist …</p>}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Punkte</p>
            <p className="text-3xl font-bold">
              {got.toLocaleString('de-DE')} / {total}
            </p>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Anteil</p>
            <p className="text-3xl font-bold">{percent.toFixed(0)} %</p>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Notenorientierung*</p>
            <p className="text-3xl font-bold">{gradeEstimate(percent)}</p>
          </div>
        </section>
        <p className="mt-2 text-xs text-muted">* Lineare Skala ab 50 %. Keine offizielle Bewertung.</p>
        <a
          href="#/fortschritt"
          className={`mt-4 block rounded-card border-2 p-4 no-underline ${percent >= 50 ? 'border-ok bg-ok-bg' : 'border-line bg-surface'}`}
        >
          <strong>{percent >= 50 ? '✓ Bestanden.' : '✗ Diesmal nicht bestanden.'}</strong>{' '}
          {BUILTIN_CHAPTERS.every((c) => state.chapters.includes(c)) && state.minutes >= 60
            ? 'Diese vollständige Probeklausur zählt für deine Prüfungsreife.'
            : 'Teilklausuren zählen nicht für die Prüfungsreife, aber für deine Fragenstatistik.'}{' '}
          <span className="underline">Fortschritt ansehen →</span>
        </a>

        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">Nach Kapiteln</h2>
          <ul className="space-y-2">
            {byChapter.map(({ c, max, pts }) => {
              const p = max ? (100 * pts) / max : 0;
              return (
                <li key={c}>
                  <div className="flex justify-between text-sm">
                    <span>{CHAPTER_NAME[c]}</span>
                    <span className="tabular-nums">
                      {pts.toLocaleString('de-DE')} / {max} ({p.toFixed(0)} %)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-bg" aria-hidden>
                    <div className={`h-2 rounded-full ${p >= 50 ? 'bg-ok' : 'bg-bad'}`} style={{ width: `${p}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6 space-y-4">
          {items.map((item, k) => (
            <article key={item.id} className="rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-bold">
                  {k + 1}. {itemTitle(item)}
                </h3>
                <span className={`font-semibold tabular-nums ${results[k]?.points === item.points ? 'text-ok' : 'text-bad'}`}>
                  {(results[k]?.points ?? 0).toLocaleString('de-DE')} / {item.points} P.
                </span>
              </div>
              <p className="text-xs text-muted">
                {CHAPTER_NAME[item.chapter]} · Thema: {topicById(topicOfItem(item.id) ?? '')?.title ?? '–'}
              </p>
              {item.kind === 'mc' && <p className="mt-1 text-sm">{item.q.question}</p>}
              <div className="mt-2 space-y-2 text-sm">
                <Solution item={item} />
              </div>
              <a href={practiceHref(item)} className="mt-1 inline-block py-2 text-sm underline">
                Dazu üben →
              </a>
            </article>
          ))}
        </section>
        <button className={`${btn} mt-6`} onClick={() => update(null)}>
          Neue Probeklausur
        </button>
      </>
    );
  }

  const mm = timed ? Math.max(0, Math.floor(left / 60000)) : 0;
  const ss = timed ? Math.max(0, Math.floor((left % 60000) / 1000)) : 0;
  const answered = items.filter((i) => state.answers[i.id] !== undefined && state.answers[i.id] !== '').length;

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <span className="font-bold">Probeklausur</span>
        <span className="text-sm text-muted">
          {answered} von {items.length} bearbeitet · {total} Punkte
        </span>
        <span className={`font-mono text-lg font-bold tabular-nums ${timed && left < 5 * 60000 ? 'text-bad' : ''}`} aria-live="off">
          {timed ? `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : 'ohne Zeitlimit'}
        </span>
      </div>
      <div className="space-y-4">
        {items.map((item, k) => (
          <article key={item.id} className="rounded-card border border-line bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-bold">
                Aufgabe {k + 1}: {itemTitle(item)}
              </h2>
              <span className="text-sm text-muted">
                {item.points} {item.points === 1 ? 'Punkt' : 'Punkte'} · {CHAPTER_NAME[item.chapter]}
              </span>
            </div>
            <ItemInput
              item={item}
              answer={state.answers[item.id]}
              allowRun={state.allowRun}
              set={(a) => update({ ...state, answers: { ...state.answers, [item.id]: a } })}
            />
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!confirm ? (
          <button className={btn} onClick={() => setConfirm(true)}>
            Abgeben
          </button>
        ) : (
          <>
            <span className="text-sm">Wirklich abgeben? Danach sind keine Änderungen mehr möglich.</span>
            <button className={btn} onClick={submit}>
              Ja, abgeben
            </button>
            <button className={btnGhost} onClick={() => setConfirm(false)}>
              Weiter bearbeiten
            </button>
          </>
        )}
        <button
          className="ml-auto text-sm text-muted underline"
          onClick={() => {
            if (window.confirm('Probeklausur abbrechen? Alle Antworten gehen verloren.')) update(null);
          }}
        >
          Abbrechen
        </button>
      </div>
    </>
  );
}
