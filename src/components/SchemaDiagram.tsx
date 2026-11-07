import type { TableInfo } from '../sql/ddlGrading';

/*
  Relationenschema als Diagramm: Tabellen als Kaesten, Primaerschluessel unterstrichen,
  Fremdschluessel mit Pfeil zur referenzierten Tabelle (wie in den Folien zu Skript 04).
  Layout: Raster mit bis zu drei Spalten in der Reihenfolge des Szenarios.
*/

const BOX_W = 200;
const HEAD_H = 28;
const ROW_H = 20;
const GAP_X = 80;
const GAP_Y = 36;
const PAD = 16;

export function SchemaDiagram({ tables, title, fit = false, maxCols = 3 }: { tables: TableInfo[]; title: string; fit?: boolean; maxCols?: number }) {
  const cols = Math.min(maxCols, tables.length);
  const heights = tables.map((t) => HEAD_H + t.columns.length * ROW_H + 6);
  const rows = Math.ceil(tables.length / cols);
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(...heights.slice(r * cols, r * cols + cols)));
  const pos = tables.map((_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return { x: PAD + c * (BOX_W + GAP_X), y: PAD + rowH.slice(0, r).reduce((a, b) => a + b + GAP_Y, 0) };
  });
  const W = PAD * 2 + cols * BOX_W + (cols - 1) * GAP_X + 40;
  const H = PAD * 2 + rowH.reduce((a, b) => a + b, 0) + (rows - 1) * GAP_Y;
  const idx = (name: string) => tables.findIndex((t) => t.name.toLowerCase() === name.toLowerCase());

  const arrows = tables.flatMap((t, i) =>
    t.fks.map((fk, k) => {
      const j = idx(fk.refTable);
      const colIdx = t.columns.findIndex((c) => c.name.toLowerCase() === fk.columns[0].toLowerCase());
      const sy = pos[i].y + HEAD_H + colIdx * ROW_H + ROW_H / 2;
      if (j < 0) return null;
      const ty = pos[j].y + HEAD_H / 2;
      let d: string;
      if (i === j) {
        // Selbstreferenz: Schleife rechts
        const x = pos[i].x + BOX_W;
        d = `M ${x} ${sy} C ${x + 45} ${sy}, ${x + 45} ${ty}, ${x} ${ty}`;
      } else if (pos[j].x > pos[i].x) {
        const sx = pos[i].x + BOX_W;
        const tx = pos[j].x;
        d = `M ${sx} ${sy} C ${sx + GAP_X / 2} ${sy}, ${tx - GAP_X / 2} ${ty}, ${tx} ${ty}`;
      } else if (pos[j].x < pos[i].x) {
        const sx = pos[i].x;
        const tx = pos[j].x + BOX_W;
        d = `M ${sx} ${sy} C ${sx - GAP_X / 2} ${sy}, ${tx + GAP_X / 2} ${ty}, ${tx} ${ty}`;
      } else {
        // gleiche Spalte: Bogen rechts aussen
        const x = pos[i].x + BOX_W;
        const bulge = 40 + k * 8;
        d = `M ${x} ${sy} C ${x + bulge} ${sy}, ${x + bulge} ${ty}, ${x} ${ty}`;
      }
      return <path key={`${t.name}-${k}`} d={d} className="stroke-muted" strokeWidth={1.5} fill="none" markerEnd="url(#fk-arrow)" />;
    }),
  );

  return (
    <div className={fit ? '' : 'overflow-x-auto'} {...(fit ? {} : { tabIndex: 0, role: 'region', 'aria-label': title })}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={fit ? '100%' : W}
        style={fit ? { maxWidth: W } : undefined}
        className={`text-ink ${fit ? 'h-auto' : 'max-w-none'}`}
        role="img"
        aria-label={title}
      >
        <defs>
          <marker id="fk-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted" />
          </marker>
        </defs>
        {tables.map((t, i) => {
          const fkCols = new Set(t.fks.flatMap((f) => f.columns.map((c) => c.toLowerCase())));
          return (
            <g key={t.name} transform={`translate(${pos[i].x} ${pos[i].y})`}>
              <rect width={BOX_W} height={heights[i]} rx={6} className="fill-surface stroke-line" strokeWidth={1.5} />
              <rect width={BOX_W} height={HEAD_H} rx={6} className="fill-bg" />
              <line x1={0} x2={BOX_W} y1={HEAD_H} y2={HEAD_H} className="stroke-line" />
              <text x={10} y={19} fontSize="13" fontWeight="700" className="fill-ink">
                {t.name}
              </text>
              {t.columns.map((c, r) => (
                <g key={c.name} transform={`translate(0 ${HEAD_H + r * ROW_H})`}>
                  <text x={10} y={14} fontSize="12" className="fill-ink" textDecoration={c.pk ? 'underline' : undefined} fontWeight={c.pk ? 600 : 400}>
                    {c.name}
                  </text>
                  <text x={BOX_W - 8} y={14} fontSize="10" textAnchor="end" className="fill-muted">
                    {[c.pk && 'PK', fkCols.has(c.name.toLowerCase()) && 'FK'].filter(Boolean).join(' ')}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        {arrows}
      </svg>
    </div>
  );
}
