import type { Card } from '../content/erPhrases';

/*
  Binaere Beziehung in Krähenfußnotation (Skript 02).
  Das Symbol direkt an einer Entitaet X sagt, mit wie vielen X eine Instanz der
  GEGENUEBERLIEGENDEN Entitaet verbunden ist. Gelesen von der Mitte zur Entitaet:
  erst Minimum (Kreis = 0, Strich = 1), dann Maximum (Strich = 1, Krähenfuß = N).
*/

const W = 640;
const H = 130;
const BOX_W = 170;
const Y = 65;

function EndSymbol({ x, dir, card }: { x: number; dir: 1 | -1; card?: Card }) {
  // x = Rand der Entitaet, dir zeigt von der Entitaet weg in Richtung Mitte
  if (!card)
    return (
      <text x={x + dir * 22} y={Y - 10} textAnchor="middle" className="fill-muted" fontSize="14">
        ?
      </text>
    );
  const max = card[1];
  const min = card[0];
  const parts = [];
  // Maximum, direkt an der Entitaet
  if (max === 'N') {
    const tip = x + dir * 18;
    parts.push(
      <path key="crow" d={`M ${tip} ${Y} L ${x} ${Y - 11} M ${tip} ${Y} L ${x} ${Y} M ${tip} ${Y} L ${x} ${Y + 11}`} />,
    );
  } else {
    parts.push(<line key="max" x1={x + dir * 12} x2={x + dir * 12} y1={Y - 10} y2={Y + 10} />);
  }
  // Minimum, weiter zur Mitte
  const mx = x + dir * 30;
  if (min === '0') parts.push(<circle key="min" cx={mx} cy={Y} r={6} className="fill-surface" />);
  else parts.push(<line key="min" x1={mx} x2={mx} y1={Y - 10} y2={Y + 10} />);
  return <g>{parts}</g>;
}

export function ErDiagram({
  e1,
  e2,
  verb,
  c12,
  c21,
  label,
}: {
  e1: string;
  e2: string;
  verb: string;
  /** Symbol an E2 */
  c12?: Card;
  /** Symbol an E1 */
  c21?: Card;
  label?: string;
}) {
  const left = 10 + BOX_W;
  const right = W - 10 - BOX_W;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-w-2xl text-ink"
      role="img"
      aria-label={label ?? `${e1} ${verb} ${e2}`}
    >
      <g stroke="currentColor" strokeWidth={2} fill="none">
        <rect x={10} y={Y - 28} width={BOX_W} height={56} rx={6} className="fill-surface" />
        <rect x={right} y={Y - 28} width={BOX_W} height={56} rx={6} className="fill-surface" />
        <line x1={left} x2={right} y1={Y} y2={Y} />
        <EndSymbol x={left} dir={1} card={c21} />
        <EndSymbol x={right} dir={-1} card={c12} />
      </g>
      <g className="fill-ink" fontSize="16" textAnchor="middle">
        <text x={10 + BOX_W / 2} y={Y + 5}>
          {e1}
        </text>
        <text x={right + BOX_W / 2} y={Y + 5}>
          {e2}
        </text>
        <text x={W / 2} y={Y - 12} fontSize="14" className="fill-muted">
          {verb}
        </text>
      </g>
    </svg>
  );
}

/** Kleine Legende der Symbole */
export function CrowLegend() {
  const items: [Card, string][] = [
    ['11', 'genau eins'],
    ['01', 'keins oder eins'],
    ['1N', 'eins oder mehrere'],
    ['0N', 'keins, eins oder mehrere'],
  ];
  return (
    <ul className="grid grid-cols-2 gap-2 text-xs text-muted">
      {items.map(([c, t]) => (
        <li key={c} className="flex items-center gap-2">
          <svg viewBox="0 0 70 30" className="h-6 w-14 text-ink" aria-hidden>
            <g stroke="currentColor" strokeWidth={2} fill="none">
              <line x1={0} x2={60} y1={15} y2={15} />
              <rect x={60} y={2} width={10} height={26} className="fill-surface" stroke="none" />
              <line x1={60} x2={60} y1={2} y2={28} />
              {c[1] === 'N' ? (
                <path d="M 42 15 L 60 4 M 42 15 L 60 26" />
              ) : (
                <line x1={48} x2={48} y1={5} y2={25} />
              )}
              {c[0] === '0' ? <circle cx={30} cy={15} r={6} className="fill-surface" /> : <line x1={30} x2={30} y1={5} y2={25} />}
            </g>
          </svg>
          {t}
        </li>
      ))}
    </ul>
  );
}
