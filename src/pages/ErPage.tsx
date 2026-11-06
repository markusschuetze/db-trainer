import { useState } from 'react';
import { CrowLegend, ErDiagram } from '../components/ErDiagram';
import { CARD_LABEL, CARDS, phrases, relType, type Card } from '../content/erPhrases';
import { specializations } from '../content/specializations';
import { markDone } from '../progress';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';

function CardinalityTrainer() {
  const [i, setI] = useState(0);
  const [a12, setA12] = useState<Card | ''>('');
  const [a21, setA21] = useState<Card | ''>('');
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const p = phrases[i];
  const ok12 = a12 === p.c12;
  const ok21 = a21 === p.c21;

  const check = () => {
    setChecked(true);
    setScore((s) => ({ right: s.right + (ok12 && ok21 ? 1 : 0), total: s.total + 1 }));
    if (ok12 && ok21) markDone(`er:${p.id}`);
  };
  const next = () => {
    setI((i + 1) % phrases.length);
    setA12('');
    setA21('');
    setChecked(false);
  };

  const select = (value: Card | '', set: (c: Card | '') => void, label: string, ok: boolean) => (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        className={`mt-1 block w-full rounded-lg border bg-surface px-3 py-2 ${checked ? (ok ? 'border-ok' : 'border-bad') : 'border-line'}`}
        value={value}
        disabled={checked}
        onChange={(e) => set(e.target.value as Card)}
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
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">
          Phrase {i + 1} von {phrases.length}
        </h2>
        <span className="text-sm text-muted">
          {score.right} von {score.total} richtig
        </span>
      </div>
      <p className="mt-3 text-lg">{p.text}</p>
      <div className="mt-4 flex justify-center">
        <ErDiagram e1={p.e1.name} e2={p.e2.name} verb={p.verb} c12={a12 || undefined} c21={a21 || undefined} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {select(a21, setA21, `Ein(e) ${p.e2.name} ist verbunden mit wie vielen ${p.e1.plural}?`, ok21)}
        {select(a12, setA12, `Ein(e) ${p.e1.name} ist verbunden mit wie vielen ${p.e2.plural}?`, ok12)}
      </div>
      <p className="mt-2 text-xs text-muted">
        Das Symbol erscheint an der Entität, nach deren Anzahl gefragt ist. Gelesen wird von der Mitte zur Entität:
        erst das Minimum, dann das Maximum.
      </p>
      {checked && (
        <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${ok12 && ok21 ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={ok12 && ok21 ? 'text-ok' : 'text-bad'}>{ok12 && ok21 ? 'Richtig.' : 'Nicht ganz.'}</strong>
          <ul className="mt-1 list-disc pl-5">
            <li>
              {p.e1.name} → {p.e2.plural}: {CARD_LABEL[p.c12]}
            </li>
            <li>
              {p.e2.name} → {p.e1.plural}: {CARD_LABEL[p.c21]}
            </li>
            <li>
              Beziehungstyp: <strong>{relType(p)}</strong>
              {p.recursive && ' (rekursive Beziehung: beide Rollen sind Mitarbeiter)'}
            </li>
          </ul>
          <div className="mt-3 flex justify-center">
            <ErDiagram e1={p.e1.name} e2={p.e2.name} verb={p.verb} c12={p.c12} c21={p.c21} label="Lösung" />
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-3">
        {!checked ? (
          <button className={btn} disabled={!a12 || !a21} onClick={check}>
            Prüfen
          </button>
        ) : (
          <button className={btn} onClick={next}>
            Nächste Phrase
          </button>
        )}
        {!checked && (
          <button className={btnGhost} onClick={next}>
            Überspringen
          </button>
        )}
      </div>
    </section>
  );
}

function SpecializationTrainer() {
  const [i, setI] = useState(0);
  const [disjoint, setDisjoint] = useState<boolean | null>(null);
  const [total, setTotal] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const s = specializations[i];
  const ok = disjoint === s.disjoint && total === s.total;

  const radio = (name: string, value: boolean | null, set: (v: boolean) => void, a: string, b: string) => (
    <fieldset disabled={checked} className="flex flex-wrap gap-4">
      {[true, false].map((v) => (
        <label key={String(v)} className="flex items-center gap-2">
          <input type="radio" name={name} checked={value === v} onChange={() => set(v)} />
          {v ? a : b}
        </label>
      ))}
    </fieldset>
  );

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">
        Spezialisierung {i + 1} von {specializations.length}
      </h2>
      <p className="mt-3">{s.text}</p>
      <p className="mt-2 text-sm text-muted">
        Supertyp <strong>{s.supertype}</strong>, Subtypen: {s.subtypes.join(', ')}
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Kann eine Instanz zu mehreren Subtypen gehören?</p>
          {radio('dis', disjoint, setDisjoint, 'Nein: disjunkt (XOR)', 'Ja: überlappend (OR)')}
        </div>
        <div>
          <p className="text-sm font-semibold">Gehört jede Instanz zu mindestens einem Subtyp?</p>
          {radio('tot', total, setTotal, 'Ja: vollständig', 'Nein: partiell')}
        </div>
      </div>
      {checked && (
        <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${ok ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={ok ? 'text-ok' : 'text-bad'}>{ok ? 'Richtig.' : 'Nicht ganz.'}</strong>{' '}
          {s.disjoint ? 'Disjunkt' : 'Überlappend'} und {s.total ? 'vollständig' : 'partiell'}. {s.why}
        </div>
      )}
      <div className="mt-4">
        {!checked ? (
          <button
            className={btn}
            disabled={disjoint === null || total === null}
            onClick={() => {
              setChecked(true);
              if (disjoint === s.disjoint && total === s.total) markDone(`spez:${s.id}`);
            }}
          >
            Prüfen
          </button>
        ) : (
          <button
            className={btn}
            onClick={() => {
              setI((i + 1) % specializations.length);
              setDisjoint(null);
              setTotal(null);
              setChecked(false);
            }}
          >
            Nächstes Beispiel
          </button>
        )}
      </div>
    </section>
  );
}

export function ErPage() {
  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Modellierung</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Kardinalitäten aus Anforderungstexten herauslesen und in Krähenfußnotation darstellen (Skript 02), Spezialisierungen
        einordnen (Skript 03).
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <CardinalityTrainer />
          <SpecializationTrainer />
        </div>
        <aside className="h-fit rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">Legende Krähenfuß</h2>
          <CrowLegend />
          <p className="mt-3 text-xs text-muted">Kreis = Minimum 0, Strich = 1, Krähenfuß = viele (N).</p>
        </aside>
      </div>
    </>
  );
}
