import type { Relation } from '../content/erPhrases';

/** Relationenschema in Vorlesungsnotation: PK unterstrichen, FK mit <fk>. */
export function RelationView({ relations }: { relations: Relation[] }) {
  return (
    <ul className="space-y-1 font-mono text-sm">
      {relations.map((r) => (
        <li key={r.name}>
          <strong>{r.name}</strong> (
          {r.columns.map((c, i) => (
            <span key={c.name}>
              {i > 0 && ', '}
              {c.pk ? <u>{c.name}</u> : c.name}
              {c.fk && <span className="text-accent"> &lt;fk → {c.fk}&gt;</span>}
              {c.notNull && !c.pk && <span className="text-muted"> NOT NULL</span>}
              {c.unique && <span className="text-muted"> UNIQUE</span>}
            </span>
          ))}
          )
        </li>
      ))}
    </ul>
  );
}
