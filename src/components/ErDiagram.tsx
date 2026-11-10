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

function EndSymbol({ x, dir, card, y = Y, later }: { x: number; dir: 1 | -1; card?: Card; y?: number; later?: boolean }) {
  // x = Rand der Entitaet, dir zeigt von der Entitaet weg in Richtung Mitte
  if (!card && later)
    return (
      <text x={x + dir * 8} y={y - 10} textAnchor={dir === 1 ? 'start' : 'end'} className="fill-muted" fontSize="12" fontStyle="italic">
        folgt in Frage 2
      </text>
    );
  if (!card)
    return (
      <text x={x + dir * 22} y={y - 10} textAnchor="middle" className="fill-muted" fontSize="14">
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
      <path key="crow" d={`M ${tip} ${y} L ${x} ${y - 11} M ${tip} ${y} L ${x} ${y} M ${tip} ${y} L ${x} ${y + 11}`} />,
    );
  } else {
    parts.push(<line key="max" x1={x + dir * 12} x2={x + dir * 12} y1={y - 10} y2={y + 10} />);
  }
  // Minimum, weiter zur Mitte
  const mx = x + dir * 30;
  if (min === '0') parts.push(<circle key="min" cx={mx} cy={y} r={6} className="fill-surface" />);
  else parts.push(<line key="min" x1={mx} x2={mx} y1={y - 10} y2={y + 10} />);
  return <g>{parts}</g>;
}

export function ErDiagram({
  e1,
  e2,
  verb,
  c12,
  c21,
  label,
  laterRight,
}: {
  e1: string;
  e2: string;
  verb: string;
  /** Symbol an E2 */
  c12?: Card;
  /** Symbol an E1 */
  c21?: Card;
  label?: string;
  /** Symbol an E2 wird erst in einer spaeteren Frage abgefragt */
  laterRight?: boolean;
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
        <EndSymbol x={right} dir={-1} card={c12} later={laterRight} />
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

/** Kleine Legende der Symbole (gleiche Geometrie wie im Diagramm; rechts die Entität als Kasten) */
export function CrowLegend() {
  const items: [Card, string][] = [
    ['11', 'genau eins'],
    ['01', 'keins oder eins'],
    ['1N', 'eins oder mehrere'],
    ['0N', 'keins, eins oder mehrere'],
  ];
  return (
    <ul className="grid grid-cols-1 gap-3 text-sm text-muted">
      {items.map(([c, t]) => (
        <li key={c} className="flex items-center gap-3">
          <svg viewBox="0 0 110 36" className="h-9 w-28 shrink-0 text-ink" aria-hidden>
            <g stroke="currentColor" strokeWidth={2} fill="none">
              <line x1={2} x2={84} y1={18} y2={18} />
              <rect x={84} y={4} width={24} height={28} rx={4} className="fill-surface" />
              <EndSymbol x={84} dir={-1} card={c} y={18} />
            </g>
          </svg>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
