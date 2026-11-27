import { ErDiagram } from '../components/ErDiagram';
import { RelationView } from '../components/RelationView';
import { SpecDiagram } from '../components/SpecDiagram';
import type { Fig, MctItem } from '../exam/mct';

type Pick = Extract<MctItem, { kind: 'pick' }>;
type Tf = Extract<MctItem, { kind: 'tf' }>;

/** Bild einer Antwort oder Aufgabe: ER-Diagramm(e) und/oder Relationenschema */
export function FigView({ fig, label }: { fig: Fig; label: string }) {
  return (
    <div className="space-y-2">
      {fig.er?.map((r, i) => (
        <ErDiagram key={i} e1={r.e1} e2={r.e2} verb={r.verb} c12={r.c12} c21={r.c21} label={`${label}: ${r.e1} ${r.verb} ${r.e2}`} />
      ))}
      {fig.rel && <RelationView relations={fig.rel} />}
      {fig.spec && <SpecDiagram s={fig.spec} reveal label={label} />}
    </div>
  );
}

export function PickInput({ item, value, onChange }: { item: Pick; value?: number[]; onChange: (v: number[]) => void }) {
  const d = item.d;
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line">{d.scenario}</p>
      {d.stem && <FigView fig={d.stem} label="Aufgabe" />}
      {d.question && <p className="font-semibold">{d.question}</p>}
      <div role="radiogroup" aria-label="Antwortmöglichkeiten" className="space-y-2">
        {d.options.map((o, i) => (
          <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${value?.[0] === i ? 'border-brand bg-bg' : 'border-line'}`}>
            <input type="radio" className="mt-1" name={item.id} checked={value?.[0] === i} onChange={() => onChange([i])} />
            <span className="min-w-0 flex-1 overflow-x-auto">
              <span className="sr-only">Antwort {i + 1}</span>
              <FigView fig={o} label={`Antwort ${i + 1}`} />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function TfInput({ item, value, onChange }: { item: Tf; value?: (boolean | null)[]; onChange: (v: { tf: (boolean | null)[] }) => void }) {
  const d = item.d;
  const v = value ?? d.statements.map(() => null);
  const set = (i: number, b: boolean) => onChange({ tf: d.statements.map((_, k) => (k === i ? b : v[k] ?? null)) });
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line">{d.intro}</p>
      {d.code && (
        <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-bg p-3 font-mono text-sm leading-5">
          {d.code}
        </pre>
      )}
      {d.stem && <FigView fig={d.stem} label="ER-Modell" />}
      {d.question && <p className="font-semibold">{d.question}</p>}
      <p className="text-sm italic text-muted">Für jede Aussage muss entschieden werden: richtig oder falsch.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-bg text-left">
              <th scope="col" className="p-2 font-semibold">
                Aussage
              </th>
              <th scope="col" className="w-20 p-2 text-center font-semibold">
                richtig
              </th>
              <th scope="col" className="w-20 p-2 text-center font-semibold">
                falsch
              </th>
            </tr>
          </thead>
          <tbody>
            {d.statements.map((st, i) => (
              <tr key={i} className="border-t border-line align-top">
                <th scope="row" className="p-2 text-left font-normal">
                  {st.text && <span>{st.text}</span>}
                  {st.fig && <FigView fig={st.fig} label={`Aussage ${i + 1}`} />}
                </th>
                <td className="p-2 text-center">
                  <input type="radio" name={`${item.id}-${i}`} aria-label={`Aussage ${i + 1}: richtig`} checked={v[i] === true} onChange={() => set(i, true)} className="h-5 w-5" />
                </td>
                <td className="p-2 text-center">
                  <input type="radio" name={`${item.id}-${i}`} aria-label={`Aussage ${i + 1}: falsch`} checked={v[i] === false} onChange={() => set(i, false)} className="h-5 w-5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MctSolution({ item }: { item: Pick | Tf }) {
  if (item.kind === 'pick')
    return (
      <>
        <p>
          Richtig ist Antwort {item.d.correct + 1}. <span className="text-muted">{item.d.why}</span>
        </p>
        <FigView fig={item.d.options[item.d.correct]} label="Lösung" />
      </>
    );
  return (
    <ul className="space-y-2">
      {item.d.statements.map((st, i) => (
        <li key={i}>
          <strong className={st.truth ? 'text-ok' : 'text-bad'}>{st.truth ? '✓ richtig' : '✗ falsch'}</strong>
          {st.text && <span>: {st.text}</span>}
          {st.fig && <FigView fig={st.fig} label={`Aussage ${i + 1}`} />}
          <span className="block text-muted">{st.why}</span>
        </li>
      ))}
    </ul>
  );
}

export const Mark = ({ ok }: { ok: boolean }) => (
  <span className={`text-lg font-bold ${ok ? 'text-ok' : 'text-bad'}`}>
    <span aria-hidden>{ok ? '✓' : '✗'}</span>
    <span className="sr-only">{ok ? 'richtig beantwortet' : 'falsch beantwortet'}</span>
  </span>
);

/** Auswertung: die eigenen Kreuze wie im Test, daneben Haken oder Kreuz, ob es stimmte, darunter die Erklärung */
export function MctReview({ item, answer }: { item: Pick | Tf; answer: unknown }) {
  if (item.kind === 'pick') {
    const sel = (answer as number[] | undefined)?.[0];
    return (
      <div className="space-y-2">
        {item.d.options.map((o, i) => {
          const mine = sel === i;
          const right = i === item.d.correct;
          return (
            <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${right ? 'border-ok bg-ok-bg' : mine ? 'border-bad bg-bad-bg' : 'border-line'}`}>
              <input type="radio" className="mt-1" disabled readOnly checked={mine} aria-label={`Antwort ${i + 1}${mine ? ', deine Auswahl' : ''}`} />
              <span className="min-w-0 flex-1 overflow-x-auto">
                <FigView fig={o} label={`Antwort ${i + 1}`} />
              </span>
              <span className="w-24 shrink-0 text-right text-sm">
                {mine && <Mark ok={right} />}
                {right && <span className="block font-semibold text-ok">Richtig</span>}
              </span>
            </div>
          );
        })}
        {sel === undefined && <p className="text-bad">Keine Antwort gegeben.</p>}
        <p className="text-muted">{item.d.why}</p>
      </div>
    );
  }
  const v = ((answer as { tf?: (boolean | null)[] } | undefined)?.tf ?? []) as (boolean | null)[];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-bg text-left">
            <th scope="col" className="p-2 font-semibold">
              Aussage
            </th>
            <th scope="col" className="w-16 p-2 text-center font-semibold">
              richtig
            </th>
            <th scope="col" className="w-16 p-2 text-center font-semibold">
              falsch
            </th>
            <th scope="col" className="w-16 p-2 text-center font-semibold">
              Ergebnis
            </th>
          </tr>
        </thead>
        <tbody>
          {item.d.statements.map((st, i) => {
            const mine = v[i] ?? null;
            const ok = mine === st.truth;
            return (
              <tr key={i} className="border-t border-line align-top">
                <th scope="row" className="p-2 text-left font-normal">
                  {st.text && <span>{st.text}</span>}
                  {st.fig && <FigView fig={st.fig} label={`Aussage ${i + 1}`} />}
                  <span className="mt-1 block text-muted">
                    <strong className={st.truth ? 'text-ok' : 'text-bad'}>{st.truth ? 'Richtig' : 'Falsch'}.</strong> {st.why}
                  </span>
                </th>
                <td className="p-2 text-center">
                  <input type="radio" disabled readOnly checked={mine === true} aria-label={`Aussage ${i + 1}: deine Antwort richtig`} className="h-5 w-5" />
                </td>
                <td className="p-2 text-center">
                  <input type="radio" disabled readOnly checked={mine === false} aria-label={`Aussage ${i + 1}: deine Antwort falsch`} className="h-5 w-5" />
                </td>
                <td className="p-2 text-center">
                  <Mark ok={ok} />
                  {mine === null && <span className="block text-xs text-muted">offen</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
