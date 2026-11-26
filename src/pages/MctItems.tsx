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
