import { specMarker, type Specialization } from '../content/specializations';

/*
  Spezialisierung in der Notation der Folien (Skript 03): Supertyp oben, Dreieck mit Kennzeichen,
  darunter die Subtypen. Kennzeichen: X = disjunkt/partiell, XV = disjunkt/vollstaendig,
  leer = ueberlappend/partiell, V = ueberlappend/vollstaendig.
*/

const W = 640;
const BOX_W = 176;
const LINE = 18;

function Box({ x, y, name, attrs, pk }: { x: number; y: number; name: string; attrs: string[]; pk?: boolean }) {
  const h = 30 + attrs.length * LINE;
  return (
    <g>
      <rect x={x} y={y} width={BOX_W} height={h} rx={6} className="fill-surface" stroke="currentColor" strokeWidth={2} />
      <line x1={x} x2={x + BOX_W} y1={y + 26} y2={y + 26} stroke="currentColor" strokeWidth={1} />
      <text x={x + BOX_W / 2} y={y + 18} textAnchor="middle" fontSize="15" fontWeight="700" className="fill-ink">
        {name}
      </text>
      {attrs.map((a, i) => (
        <text key={a} x={x + 10} y={y + 26 + 16 + i * LINE} fontSize="12" className="fill-ink" fontFamily="ui-monospace, monospace" textDecoration={pk && i === 0 ? 'underline' : undefined}>
          {a}
        </text>
      ))}
    </g>
  );
}

export function SpecDiagram({ s, reveal, label }: { s: Specialization; reveal: boolean; label?: string }) {
  const n = s.subtypes.length;
  const superH = 30 + s.superAttrs.length * LINE;
  const top = 8;
  const triTop = top + superH + 14;
  const triBase = triTop + 38;
  const barY = triBase + 20;
  const subY = barY + 22;
  const subH = 30 + LINE;
  const H = subY + subH + 8;
  const gap = (W - n * BOX_W) / (n + 1);
  const cx = (i: number) => gap + BOX_W / 2 + i * (BOX_W + gap);
  const marker = reveal ? specMarker(s) : '?';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-2xl text-ink" role="img" aria-label={label ?? `${s.supertype} mit Subtypen ${s.subtypes.join(', ')}`}>
      <Box x={W / 2 - BOX_W / 2} y={top} name={s.supertype} attrs={s.superAttrs} pk />
      <line x1={W / 2} x2={W / 2} y1={top + superH} y2={triTop} stroke="currentColor" strokeWidth={2} />
      <polygon points={`${W / 2},${triTop} ${W / 2 - 26},${triBase} ${W / 2 + 26},${triBase}`} fill="#f5c400" stroke="currentColor" strokeWidth={2} />
      <text x={W / 2} y={triBase - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#16202e">
        {marker}
      </text>
      <line x1={W / 2} x2={W / 2} y1={triBase} y2={barY} stroke="currentColor" strokeWidth={2} />
      <line x1={cx(0)} x2={cx(n - 1)} y1={barY} y2={barY} stroke="currentColor" strokeWidth={2} />
      {s.subtypes.map((name, i) => (
        <g key={name}>
          <line x1={cx(i)} x2={cx(i)} y1={barY} y2={subY} stroke="currentColor" strokeWidth={2} />
          <Box x={cx(i) - BOX_W / 2} y={subY} name={name} attrs={[s.subAttrs[i]]} />
        </g>
      ))}
    </svg>
  );
}

/** Legende der vier Kennzeichen */
export function SpecLegend() {
  const items: [string, string][] = [
    ['X', 'disjunkt, partiell'],
    ['XV', 'disjunkt, vollständig'],
    ['', 'überlappend, partiell (Dreieck leer)'],
    ['V', 'überlappend, vollständig'],
  ];
  return (
    <ul className="grid gap-3 text-sm text-muted">
      {items.map(([m, t]) => (
        <li key={t} className="flex items-center gap-3">
          <svg viewBox="0 0 56 44" className="h-10 w-12 shrink-0 text-ink" aria-hidden>
            <polygon points="28,4 4,40 52,40" fill="#f5c400" stroke="currentColor" strokeWidth={2} />
            <text x="28" y="35" textAnchor="middle" fontSize="13" fontWeight="700" fill="#16202e">
              {m}
            </text>
          </svg>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
