import { useRef, useState } from 'react';
import { track } from '../analytics';
import { ErDiagram } from '../components/ErDiagram';
import { RelationView } from '../components/RelationView';
import { fkNotNull, relPhrases, relType, toRelations, validMappings, type Mapping } from '../content/erPhrases';
import { markDone } from '../progress';
import { relTopic } from '../progressCatalog';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';

type PkChoice = 'beide' | 'e1' | 'e2' | 'kuenstlich';

export function RelPage() {
  const [i, setI] = useState(0);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [nullable, setNullable] = useState<boolean | null>(null);
  const [pk, setPk] = useState<PkChoice | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const started = useRef(Date.now());
  const p = relPhrases[i];
  const valid = validMappings(p);
  const mappingOk = mapping !== null && valid.includes(mapping);
  const secondOk =
    mapping === 'zuordnung' ? pk === 'beide' : mapping !== null && mappingOk && nullable === !fkNotNull(p, mapping);
  const allOk = mappingOk && secondOk;
  const shown = mappingOk ? mapping! : valid[0];

  const reset = (n: number) => {
    setI(n);
    setMapping(null);
    setNullable(null);
    setPk(null);
    setChecked(false);
    started.current = Date.now();
  };

  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Relationenmodell</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Vom ER-Modell zur Relation (Skript 04): Wohin kommt der Fremdschlüssel, darf er NULL sein, wann braucht es eine
        Zuordnungsrelation?
      </p>

      <section className="mt-6 rounded-card border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">
            Beziehung {i + 1} von {relPhrases.length}
          </h2>
          <span className="text-sm text-muted">
            {score.right} von {score.total} richtig
          </span>
        </div>
        <p className="mt-3">{p.text}</p>
        <div className="mt-4 flex justify-center">
          <ErDiagram e1={p.e1.name} e2={p.e2.name} verb={p.verb} c12={p.c12} c21={p.c21} />
        </div>
        <p className="mt-1 text-center text-xs text-muted">
          {p.e1.name} ({p.e1.key}, {p.e1.attr}) · {p.e2.name} ({p.e2.key}, {p.e2.attr})
        </p>

        <fieldset className="mt-5" disabled={checked}>
          <legend className="font-semibold">1. Wie wird die Beziehung „{p.verb}“ abgebildet?</legend>
          <div className="mt-2 space-y-1">
            {(
              [
                ['fk-e1', `Fremdschlüssel in ${p.e1.name} (zeigt auf ${p.e2.name})`],
                ['fk-e2', `Fremdschlüssel in ${p.e2.name} (zeigt auf ${p.e1.name})`],
                ['zuordnung', 'Eigene Zuordnungsrelation'],
              ] as [Mapping, string][]
            ).map(([v, t]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="map" checked={mapping === v} onChange={() => setMapping(v)} />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        {mapping && mapping !== 'zuordnung' && (
          <fieldset className="mt-4" disabled={checked}>
            <legend className="font-semibold">2. Darf der Fremdschlüssel NULL sein?</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="nn" checked={nullable === false} onChange={() => setNullable(false)} />
                Nein, NOT NULL
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="nn" checked={nullable === true} onChange={() => setNullable(true)} />
                Ja, NULL erlaubt
              </label>
            </div>
          </fieldset>
        )}
        {mapping === 'zuordnung' && (
          <fieldset className="mt-4" disabled={checked}>
            <legend className="font-semibold">2. Was ist der Primärschlüssel der Zuordnungsrelation?</legend>
            <div className="mt-2 space-y-1">
              {(
                [
                  ['beide', `${p.e1.key} und ${p.e2.key} zusammen (beide zugleich Fremdschlüssel)`],
                  ['e1', `nur ${p.e1.key}`],
                  ['e2', `nur ${p.e2.key}`],
                  ['kuenstlich', 'ein neuer künstlicher Schlüssel, die FKs sind normale Spalten'],
                ] as [PkChoice, string][]
              ).map(([v, t]) => (
                <label key={v} className="flex items-center gap-2">
                  <input type="radio" name="pk" checked={pk === v} onChange={() => setPk(v)} />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {checked && (
          <div role="status" className={`mt-5 rounded-lg p-4 text-sm ${allOk ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
            <strong className={allOk ? 'text-ok' : 'text-bad'}>{allOk ? 'Richtig.' : 'Nicht ganz.'}</strong>{' '}
            {relType(p) === 'M:N' &&
              'Bei M:N braucht es eine Zuordnungsrelation. Die beiden Fremdschlüssel bilden zusammen ihren Primärschlüssel (identifizierende Beziehungen).'}
            {relType(p) === '1:N' &&
              `1:N: Der Fremdschlüssel kommt auf die N-Seite, also nach ${valid[0] === 'fk-e2' ? p.e2.name : p.e1.name}. `}
            {relType(p) === '1:1' &&
              '1:1: Der Fremdschlüssel kann in eine der beiden Relationen; er ist dann zusätzlich UNIQUE. '}
            {relType(p) !== 'M:N' &&
              `NOT NULL, wenn jede Zeile der Tabelle mit dem Fremdschlüssel zwingend einen Partner hat (Minimum 1). Hier: ${
                fkNotNull(p, shown as Exclude<Mapping, 'zuordnung'>) ? 'NOT NULL' : 'NULL erlaubt'
              }.`}
            <div className="mt-3 rounded-lg bg-surface p-3">
              <RelationView relations={toRelations(p, shown)} />
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {!checked ? (
            <button
              className={btn}
              disabled={!mapping || (mapping === 'zuordnung' ? !pk : nullable === null)}
              onClick={() => {
                setChecked(true);
                setScore((s) => ({ right: s.right + (allOk ? 1 : 0), total: s.total + 1 }));
                if (allOk) markDone(`rel:${p.id}`);
                track({ k: 'i', i: `rel:${p.id}`, tp: relTopic(p), ch: '04', ok: allOk ? 1 : 0, s: Math.min(3600, Math.round((Date.now() - started.current) / 1000)), a: 1, h: 0, src: 'u' });
              }}
            >
              Prüfen
            </button>
          ) : (
            <button className={btn} onClick={() => reset((i + 1) % relPhrases.length)}>
              Nächste Beziehung
            </button>
          )}
          {!checked && (
            <button className={btnGhost} onClick={() => reset((i + 1) % relPhrases.length)}>
              Überspringen
            </button>
          )}
        </div>
      </section>
    </>
  );
}
