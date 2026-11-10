import { useRef, useState } from 'react';
import { track } from '../analytics';
import { CrowLegend, ErDiagram } from '../components/ErDiagram';
import { CARD_LABEL, CARDS, phrases, relType, type Card } from '../content/erPhrases';
import { specializations } from '../content/specializations';
import { markDone } from '../progress';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';

function CardinalityTrainer() {
  const [i, setI] = useState(0);
  const [step, setStep] = useState<0 | 1>(0); // 0: erste Frage, 1: zweite Frage
  const [a12, setA12] = useState<Card | ''>('');
  const [a21, setA21] = useState<Card | ''>('');
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const started = useRef(Date.now());
  const p = phrases[i];
  const ok12 = a12 === p.c12;
  const ok21 = a21 === p.c21;
  const last = step === 1;
  const okNow = step === 0 ? ok21 : ok12;

  const check = () => {
    setChecked(true);
    if (!last) return;
    setScore((s) => ({ right: s.right + (ok12 && ok21 ? 1 : 0), total: s.total + 1 }));
    if (ok12 && ok21) markDone(`er:${p.id}`);
    track({ k: 'i', i: `er:${p.id}`, tp: '02-kraehenfuss', ch: '02', ok: ok12 && ok21 ? 1 : 0, s: Math.min(3600, Math.round((Date.now() - started.current) / 1000)), a: 1, h: 0, src: 'u' });
  };
  const reset = () => {
    setStep(0);
    setA12('');
    setA21('');
    setChecked(false);
    started.current = Date.now();
  };
  const next = () => {
    setI((i + 1) % phrases.length);
    reset();
  };

  const select = (value: Card | '', set: (c: Card | '') => void, label: string) => (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        className={`mt-1 block w-full max-w-md rounded-lg border bg-surface px-3 py-2 ${checked ? (okNow ? 'border-ok' : 'border-bad') : 'border-line'}`}
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

  const done = checked && last;

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">
          Phrase {i + 1} von {phrases.length} · Frage {step + 1} von 2
        </h2>
        <span className="text-sm text-muted">
          {score.right} von {score.total} richtig
        </span>
      </div>
      <p className="mt-3 text-lg">{p.text}</p>
      <div className="mt-4 flex justify-center">
        <ErDiagram
          e1={p.e1.name}
          e2={p.e2.name}
          verb={p.verb}
          c12={step === 1 || checked ? a12 || undefined : undefined}
          c21={a21 || undefined}
        />
      </div>
      <div className="mt-4">
        {step === 0
          ? select(a21, setA21, `Eine Instanz von „${p.e2.name}“ ist verbunden mit wie vielen „${p.e1.name}“-Instanzen?`)
          : select(a12, setA12, `Eine Instanz von „${p.e1.name}“ ist verbunden mit wie vielen „${p.e2.name}“-Instanzen?`)}
      </div>
      <p className="mt-2 text-xs text-muted">
        Das Symbol erscheint an der Entität, nach deren Anzahl gefragt ist. Gelesen wird von der Mitte zur Entität:
        erst das Minimum, dann das Maximum.
      </p>
      {checked && !last && (
        <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${okNow ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={okNow ? 'text-ok' : 'text-bad'}>{okNow ? 'Richtig.' : 'Nicht ganz.'}</strong>{' '}
          {p.e2.name} → {p.e1.plural}: {CARD_LABEL[p.c21]}
        </p>
      )}
      {done && (
        <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${ok12 && ok21 ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={ok12 ? 'text-ok' : 'text-bad'}>{ok12 ? 'Richtig.' : 'Nicht ganz.'}</strong>
          <ul className="mt-1 list-disc pl-5">
            <li>
              {p.e1.name} → {p.e2.plural}: {CARD_LABEL[p.c12]}
            </li>
            <li>
              {p.e2.name} → {p.e1.plural}: {CARD_LABEL[p.c21]} {ok21 ? '(Frage 1 richtig)' : '(Frage 1 falsch)'}
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
          <button className={btn} disabled={!(step === 0 ? a21 : a12)} onClick={check}>
            Prüfen
          </button>
        ) : !last ? (
          <button
            className={btn}
            onClick={() => {
              setStep(1);
              setChecked(false);
            }}
          >
            Weiter zu Frage 2
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
  const [step, setStep] = useState<0 | 1>(0); // 0: disjunkt/überlappend, 1: vollständig/partiell
  const [disjoint, setDisjoint] = useState<boolean | null>(null);
  const [total, setTotal] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const s = specializations[i];
  const okDis = disjoint === s.disjoint;
  const okTot = total === s.total;
  const last = step === 1;
  const okNow = step === 0 ? okDis : okTot;

  const radio = (name: string, value: boolean | null, set: (v: boolean) => void, a: string, b: string) => (
    <fieldset disabled={checked} className="mt-1 flex flex-wrap gap-4">
      {[true, false].map((v) => (
        <label key={String(v)} className="flex items-center gap-2">
          <input type="radio" name={name} checked={value === v} onChange={() => set(v)} />
          {v ? a : b}
        </label>
      ))}
    </fieldset>
  );

  const reset = () => {
    setStep(0);
    setDisjoint(null);
    setTotal(null);
    setChecked(false);
  };

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">
        Spezialisierung {i + 1} von {specializations.length} · Frage {step + 1} von 2
      </h2>
      <p className="mt-3">{s.text}</p>
      <p className="mt-2 text-sm text-muted">
        Supertyp <strong>{s.supertype}</strong>, Subtypen: {s.subtypes.join(', ')}
      </p>
      <div className="mt-4">
        {step === 0 ? (
          <>
            <p className="text-sm font-semibold">Kann eine Instanz zu mehreren Subtypen gehören?</p>
            {radio('dis', disjoint, setDisjoint, 'Nein: disjunkt (XOR)', 'Ja: überlappend (OR)')}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">Gehört jede Instanz zu mindestens einem Subtyp?</p>
            {radio('tot', total, setTotal, 'Ja: vollständig', 'Nein: partiell')}
          </>
        )}
      </div>
      {checked && (
        <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${okNow ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
          <strong className={okNow ? 'text-ok' : 'text-bad'}>{okNow ? 'Richtig.' : 'Nicht ganz.'}</strong>{' '}
          {step === 0
            ? `${s.disjoint ? 'Disjunkt' : 'Überlappend'}.`
            : `${s.disjoint ? 'Disjunkt' : 'Überlappend'} und ${s.total ? 'vollständig' : 'partiell'}. ${s.why}`}
        </div>
      )}
      <div className="mt-4">
        {!checked ? (
          <button
            className={btn}
            disabled={(step === 0 ? disjoint : total) === null}
            onClick={() => {
              setChecked(true);
              if (last) {
                if (okDis && okTot) markDone(`spez:${s.id}`);
              }
            }}
          >
            Prüfen
          </button>
        ) : !last ? (
          <button
            className={btn}
            onClick={() => {
              setStep(1);
              setChecked(false);
            }}
          >
            Weiter zu Frage 2
          </button>
        ) : (
          <button
            className={btn}
            onClick={() => {
              setI((i + 1) % specializations.length);
              reset();
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
  const [tab, setTab] = useState<'kard' | 'spez'>('kard');
  return (
    <>
      <a href="#/" className="inline-block py-2 text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Modellierung</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Kardinalitäten aus Anforderungstexten herauslesen und in Krähenfußnotation darstellen (Skript 02), Spezialisierungen
        einordnen (Skript 03).
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Aufgabentyp">
            {(
              [
                ['kard', 'Kardinalitäten'],
                ['spez', 'Spezialisierung'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                aria-pressed={tab === k}
                className={`rounded-full border px-4 py-2 text-sm ${tab === k ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'kard' ? <CardinalityTrainer /> : <SpecializationTrainer />}
        </div>
        <aside hidden={tab !== 'kard'} className="h-fit rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold">Legende Krähenfuß</h2>
          <CrowLegend />
          <p className="mt-3 text-xs text-muted">Kreis = Minimum 0, Strich = 1, Krähenfuß = viele (N).</p>
        </aside>
      </div>
    </>
  );
}
