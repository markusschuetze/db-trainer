import { useRef, useState, type ReactNode } from 'react';
import { track } from '../analytics';
import { ErDiagram } from '../components/ErDiagram';
import { RelationView } from '../components/RelationView';
import { CARD_LABEL, CARDS, type Card } from '../content/erPhrases';
import { textTasks, type TextTask } from '../content/textTasks';
import { LEVEL_NAME } from '../content/scenarios';
import { topicById } from '../content/topics';
import {
  ARTIFICIAL,
  correctKey,
  deriveSchema,
  entityCandidates,
  gradeCardinalities,
  gradeEntities,
  gradeRelationships,
  keyOptions,
  relationshipCandidates,
  relKey,
  type CardAnswers,
} from '../logic/textTaskLogic';
import { isDone, markDone } from '../progress';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
type Status = 'open' | 'wrong' | 'right' | 'revealed';

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
  return (
    <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${status === 'right' ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
      <strong className={status === 'right' ? 'text-ok' : 'text-bad'}>
        {status === 'right' ? 'Richtig.' : status === 'wrong' ? 'Nicht ganz, versuche es noch einmal.' : 'Lösung:'}
      </strong>
      {children && <div className="mt-1 text-ink">{children}</div>}
    </div>
  );
}

function Actions({ status, canCheck, onCheck, onReveal, onNext }: { status: Status; canCheck: boolean; onCheck: () => void; onReveal: () => void; onNext?: () => void }) {
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

/* ---------------- Schritt 1: Entitaeten ---------------- */
function StepEntities({ t, onDone, onNext, flag }: { t: TextTask; onDone: (chosen: string[]) => void; onNext?: () => void; flag: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('open');
  const locked = status === 'right' || status === 'revealed';
  const missing = t.entities.map((e) => e.name).filter((n) => !chosen.includes(n));
  const extra = chosen.filter((n) => !t.entities.some((e) => e.name === n));
  return (
    <Panel title="Schritt 1: Entitäten erkennen">
      <p className="mb-3 text-sm text-muted">
        Welche Begriffe aus dem Text sind <strong>Entitäten</strong> (eigene Objekte mit Eigenschaften)? Andere Begriffe sind nur Attribute
        oder kommen im Text gar nicht als eigenes Objekt vor.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Begriffe">
        {entityCandidates(t).map((c) => {
          const on = locked ? t.entities.some((e) => e.name === c) : chosen.includes(c);
          return (
            <button
              key={c}
              aria-pressed={on}
              disabled={locked}
              onClick={() => setChosen((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
              className={`rounded-full border px-4 py-1.5 ${on ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <Feedback status={status}>
        {status === 'wrong' && (
          <p>
            {missing.length > 0 && <>Es fehlen noch {missing.length} Entität(en). </>}
            {extra.length > 0 && <>„{extra.join('“, „')}“ ist keine Entität (eher Attribut oder nicht im Text als Objekt genannt).</>}
          </p>
        )}
        {locked && (
          <ul className="list-disc pl-5">
            {t.entities.map((e) => (
              <li key={e.name}>
                <strong>{e.name}</strong>: Attribute {e.attrs.length ? e.attrs.join(', ') : '–'}
              </li>
            ))}
            {t.distractors.length > 0 && <li className="text-muted">Keine Entitäten: {t.distractors.join(', ')} (Attribute oder Beziehungseigenschaften).</li>}
          </ul>
        )}
      </Feedback>
      <Actions
        status={status}
        canCheck={chosen.length > 0}
        onCheck={() => {
          const ok = gradeEntities(t, chosen);
          if (!ok) flag();
          setStatus(ok ? 'right' : 'wrong');
          if (ok) onDone(chosen);
        }}
        onReveal={() => {
          flag();
          setStatus('revealed');
          onDone(t.entities.map((e) => e.name));
        }}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------------- Schritt 2: Beziehungen ---------------- */
function StepRelationships({ t, onNext, flag }: { t: TextTask; onNext?: () => void; flag: () => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('open');
  const locked = status === 'right' || status === 'revealed';
  const cands = relationshipCandidates(t, t.entities.map((e) => e.name));
  return (
    <Panel title="Schritt 2: Beziehungen erkennen">
      <p className="mb-3 text-sm text-muted">Welche Beziehungen zwischen den Entitäten nennt der Text? Wähle alle, die sich begründen lassen.</p>
      <ul className="space-y-2">
        {cands.map((c) => {
          const on = locked ? c.right : chosen.includes(c.key);
          return (
            <li key={c.key}>
              <label className={`flex items-center gap-3 rounded-lg border p-3 ${locked && !c.right ? 'border-line opacity-70' : 'border-line'}`}>
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={on}
                  onChange={(e) => setChosen((cur) => (e.target.checked ? [...cur, c.key] : cur.filter((x) => x !== c.key)))}
                />
                <span>
                  <strong>{c.e1}</strong> <span className="text-muted">— {c.verb} —</span> <strong>{c.e2}</strong>
                </span>
              </label>
              {locked && !c.right && <p className="ml-9 mt-1 text-sm text-muted">Keine Beziehung des Textes: {c.why}</p>}
            </li>
          );
        })}
      </ul>
      <Feedback status={status}>{status === 'wrong' && <p>Prüfe, welche Verbindungen der Text wirklich beschreibt und ob eine fehlt.</p>}</Feedback>
      <Actions
        status={status}
        canCheck={chosen.length > 0}
        onCheck={() => {
          const ok = gradeRelationships(t, chosen);
          if (!ok) flag();
          setStatus(ok ? 'right' : 'wrong');
        }}
        onReveal={() => {
          flag();
          setStatus('revealed');
        }}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------------- Schritt 3: Kardinalitaeten ---------------- */
function StepCardinalities({ t, onNext, flag }: { t: TextTask; onNext?: () => void; flag: () => void }) {
  const [a, setA] = useState<CardAnswers>({});
  const [status, setStatus] = useState<Status>('open');
  const [res, setRes] = useState<Record<string, boolean>>({});
  const locked = status === 'right' || status === 'revealed';
  const sel = (k: string, f: 'c12' | 'c21', label: string, value?: Card, correct?: Card) => (
    <label className="block">
      <span className="text-sm">{label}</span>
      <select
        className={`mt-1 block w-full rounded-lg border bg-surface px-3 py-2 ${status === 'wrong' && value !== correct ? 'border-bad' : 'border-line'}`}
        disabled={locked}
        value={locked ? correct : (value ?? '')}
        onChange={(e) => setA((cur) => ({ ...cur, [k]: { ...cur[k], [f]: e.target.value as Card } }))}
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
  return (
    <Panel title="Schritt 3: Kardinalitäten bestimmen">
      <p className="mb-3 text-sm text-muted">
        Lies im Text, wie viele Partner eine Instanz mindestens und höchstens hat („kann“ = Minimum 0, „muss“ oder „mindestens einer“ = Minimum 1).
      </p>
      <div className="space-y-6">
        {t.relationships.map((r) => {
          const k = relKey(r);
          return (
            <div key={k}>
              <div className="flex justify-center">
                <ErDiagram e1={r.e1} e2={r.e2} verb={r.verb} c21={locked ? r.c21 : a[k]?.c21} c12={locked ? r.c12 : a[k]?.c12} />
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {sel(k, 'c21', `Ein(e) ${r.e2} ist verbunden mit wie vielen ${r.e1}?`, a[k]?.c21, r.c21)}
                {sel(k, 'c12', `Ein(e) ${r.e1} ist verbunden mit wie vielen ${r.e2}?`, a[k]?.c12, r.c12)}
              </div>
              {locked && <p className="mt-2 text-sm text-muted">{r.why}</p>}
              {status === 'wrong' && !res[k] && <p className="mt-1 text-sm text-bad">Hier stimmt noch etwas nicht.</p>}
            </div>
          );
        })}
      </div>
      <Feedback status={status} />
      <Actions
        status={status}
        canCheck={t.relationships.every((r) => a[relKey(r)]?.c12 && a[relKey(r)]?.c21)}
        onCheck={() => {
          const g = gradeCardinalities(t, a);
          setRes(g);
          const ok = Object.values(g).every(Boolean);
          if (!ok) flag();
          setStatus(ok ? 'right' : 'wrong');
        }}
        onReveal={() => {
          flag();
          setStatus('revealed');
        }}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------------- Schritt 4: Schluessel ---------------- */
function StepKeys({ t, onNext, flag }: { t: TextTask; onNext?: () => void; flag: () => void }) {
  const [a, setA] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('open');
  const locked = status === 'right' || status === 'revealed';
  const label = (o: string) => (o === ARTIFICIAL ? 'neuer künstlicher Schlüssel' : o);
  return (
    <Panel title="Schritt 4: Primärschlüssel wählen">
      <p className="mb-3 text-sm text-muted">
        Der Primärschlüssel muss jede Instanz eindeutig bestimmen. Steht im Text „wird identifiziert durch …“, ist das der Kandidat. Gibt es kein
        eindeutiges Attribut, wird ein künstlicher Schlüssel ergänzt.
      </p>
      <ul className="space-y-3">
        {t.entities.map((e) => (
          <li key={e.name} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:items-center">
            <span>
              <strong>{e.name}</strong>
              <span className="block text-xs text-muted">Attribute: {e.attrs.length ? e.attrs.join(', ') : '–'}</span>
            </span>
            <select
              aria-label={`Primärschlüssel von ${e.name}`}
              className={`rounded-lg border bg-surface px-3 py-2 ${status === 'wrong' && a[e.name] !== correctKey(t, e.name) ? 'border-bad' : 'border-line'}`}
              disabled={locked}
              value={locked ? correctKey(t, e.name) : (a[e.name] ?? '')}
              onChange={(ev) => setA((cur) => ({ ...cur, [e.name]: ev.target.value }))}
            >
              <option value="">bitte wählen</option>
              {keyOptions(t, e.name).map((o) => (
                <option key={o} value={o}>
                  {label(o)}
                </option>
              ))}
            </select>
            {locked && e.keyNote && <p className="text-sm text-muted sm:col-span-2">{e.keyNote}</p>}
          </li>
        ))}
      </ul>
      <Feedback status={status} />
      <Actions
        status={status}
        canCheck={t.entities.every((e) => a[e.name])}
        onCheck={() => {
          const ok = t.entities.every((e) => a[e.name] === correctKey(t, e.name));
          if (!ok) flag();
          setStatus(ok ? 'right' : 'wrong');
        }}
        onReveal={() => {
          flag();
          setStatus('revealed');
        }}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------------- Schritt 5: Spezialisierung ---------------- */
function StepSpecialization({ t, onNext, flag }: { t: TextTask; onNext?: () => void; flag: () => void }) {
  const specs = t.specializations ?? [];
  const [a, setA] = useState<Record<number, { disjoint?: boolean; total?: boolean }>>({});
  const [status, setStatus] = useState<Status>('open');
  const locked = status === 'right' || status === 'revealed';
  const radio = (i: number, f: 'disjoint' | 'total', yes: string, no: string, correct: boolean) => (
    <fieldset disabled={locked} className="flex flex-wrap gap-4">
      {[true, false].map((v) => (
        <label key={String(v)} className="flex items-center gap-2">
          <input type="radio" name={`spez-${i}-${f}`} checked={locked ? correct === v : a[i]?.[f] === v} onChange={() => setA((cur) => ({ ...cur, [i]: { ...cur[i], [f]: v } }))} />
          {v ? yes : no}
        </label>
      ))}
    </fieldset>
  );
  return (
    <Panel title="Schritt 5: Spezialisierung einordnen">
      {specs.map((s, i) => (
        <div key={s.supertype} className="mb-4">
          <p className="text-sm">
            Supertyp <strong>{s.supertype}</strong>, Subtypen: {s.subtypes.join(', ')}
          </p>
          <p className="mt-2 text-sm font-semibold">Kann eine Instanz zu mehreren Subtypen gehören?</p>
          {radio(i, 'disjoint', 'Nein: disjunkt (XOR)', 'Ja: überlappend (OR)', s.disjoint)}
          <p className="mt-2 text-sm font-semibold">Gehört jede Instanz zu mindestens einem Subtyp?</p>
          {radio(i, 'total', 'Ja: vollständig', 'Nein: partiell', s.total)}
          {locked && <p className="mt-2 text-sm text-muted">{s.why}</p>}
        </div>
      ))}
      <Feedback status={status} />
      <Actions
        status={status}
        canCheck={specs.every((_, i) => a[i]?.disjoint !== undefined && a[i]?.total !== undefined)}
        onCheck={() => {
          const ok = specs.every((s, i) => a[i]?.disjoint === s.disjoint && a[i]?.total === s.total);
          if (!ok) flag();
          setStatus(ok ? 'right' : 'wrong');
        }}
        onReveal={() => {
          flag();
          setStatus('revealed');
        }}
        onNext={onNext}
      />
    </Panel>
  );
}

/* ---------------- Ergebnis ---------------- */
function Result({ t, onFinish }: { t: TextTask; onFinish: () => void }) {
  return (
    <Panel title="Ergebnis: ER-Modell und Relationenschema">
      <div className="space-y-4">
        {t.relationships.map((r) => (
          <div key={relKey(r)} className="flex justify-center">
            <ErDiagram e1={r.e1} e2={r.e2} verb={r.verb} c12={r.c12} c21={r.c21} />
          </div>
        ))}
      </div>
      <h3 className="mt-5 font-semibold">Abgeleitetes Relationenschema</h3>
      <p className="mb-2 text-sm text-muted">
        M:N-Beziehungen werden zu Zuordnungsrelationen, bei 1:N kommt der Fremdschlüssel auf die N-Seite (NOT NULL bei Minimum 1), Subtypen übernehmen
        den Primärschlüssel des Supertyps. Primärschlüssel sind unterstrichen.
      </p>
      <div className="rounded-lg bg-bg p-3">
        <RelationView relations={deriveSchema(t)} />
      </div>
      <a href="#/textaufgaben" className={`${btn} mt-4 inline-block no-underline`} onClick={onFinish}>
        Aufgabe abschließen
      </a>
    </Panel>
  );
}

/* ======================= Seiten ======================= */

export function TextTaskList() {
  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Textaufgaben</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Klausurvorbereitung: Aus einem Anforderungstext erkennst du Entitäten, Beziehungen, Kardinalitäten und Schlüssel und leitest das
        Relationenschema ab. Die Texte sind den Hörsaalübungen der Vorlesung nachempfunden.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {textTasks.map((t) => (
          <li key={t.id} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {LEVEL_NAME[t.level]} · {topicById(t.topicId)?.title}
              {isDone(`tt:${t.id}`) && <span className="ml-2 text-ok">✓ gelöst</span>}
            </span>
            <h2 className="mt-1 text-lg font-bold">{t.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{t.text.slice(0, 140)}…</p>
            <a href={`#/textaufgaben/${t.id}`} className={`${btn} mt-4 self-start no-underline`}>
              Start
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export function TextTaskPage({ id }: { id: string }) {
  const t = textTasks.find((x) => x.id === id);
  const [step, setStep] = useState(0);
  const started = useRef(Date.now());
  const clean = useRef(true);
  if (!t)
    return (
      <p>
        Aufgabe nicht gefunden. <a href="#/textaufgaben" className="underline">Zur Liste</a>
      </p>
    );
  const flag = () => {
    clean.current = false;
  };
  const next = () => setStep((s) => s + 1);
  const hasSpec = !!t.specializations?.length;
  const last = hasSpec ? 4 : 3;
  const total = last + 2;
  const cur = (n: number) => (step === n ? next : undefined);
  const finish = () => {
    markDone(`tt:${t.id}`);
    track({
      k: 'i',
      i: `tt:${t.id}`,
      tp: t.topicId,
      ch: topicById(t.topicId)?.chapter ?? '02',
      ok: clean.current ? 1 : 0,
      s: Math.min(3600, Math.round((Date.now() - started.current) / 1000)),
      a: 1,
      h: 0,
      lv: t.level,
      src: 'u',
    });
  };

  return (
    <>
      <a href="#/textaufgaben" className="text-sm underline">
        ← Textaufgaben
      </a>
      <h1 className="mt-2 text-2xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {LEVEL_NAME[t.level]} · Schritt {Math.min(step + 1, total)} von {total}
      </p>
      <section className="mt-4 rounded-card border border-line bg-surface p-5">
        <h2 className="mb-2 font-bold">Text</h2>
        <p className="text-lg leading-8">{t.text}</p>
      </section>

      {step >= 0 && <StepEntities t={t} onDone={() => {}} onNext={cur(0)} flag={flag} />}
      {step >= 1 && <StepRelationships t={t} onNext={cur(1)} flag={flag} />}
      {step >= 2 && <StepCardinalities t={t} onNext={cur(2)} flag={flag} />}
      {step >= 3 && <StepKeys t={t} onNext={cur(3)} flag={flag} />}
      {hasSpec && step >= 4 && <StepSpecialization t={t} onNext={cur(4)} flag={flag} />}
      {step >= last + 1 && <Result t={t} onFinish={finish} />}
    </>
  );
}
