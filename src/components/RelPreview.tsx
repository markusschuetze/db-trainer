import { relType, toRelations, type Mapping, type Phrase } from '../content/erPhrases';

export type { PkChoice };

type PkChoice = 'beide' | 'e1' | 'e2' | 'kuenstlich';

interface Col {
  name: string;
  pk?: boolean;
  fk?: string;
  notNull?: boolean;
  nullOk?: boolean;
  unique?: boolean;
  added?: boolean;
}
interface Tab {
  name: string;
  added?: boolean;
  cols: Col[];
}

/** Tabellen so, wie sie nach den bisherigen Auswahlen aussehen (nicht die Loesung). */
export function previewTables(p: Phrase, mapping: Mapping | null, nullable: boolean | null, pk: PkChoice | null): Tab[] {
  const t1: Tab = { name: p.e1.name, cols: [{ name: p.e1.key, pk: true }, { name: p.e1.attr }] };
  const t2: Tab = { name: p.e2.name, cols: [{ name: p.e2.key, pk: true }, { name: p.e2.attr }] };
  if (!mapping) return [t1, t2];
  if (mapping === 'zuordnung') {
    const name = toRelations(p, 'zuordnung')[2].name;
    const a: Col = { name: p.e1.key, fk: p.e1.name, added: true };
    const b: Col = { name: p.e2.key, fk: p.e2.name, added: true };
    let cols: Col[];
    if (pk === 'beide') cols = [{ ...a, pk: true }, { ...b, pk: true }];
    else if (pk === 'e1') cols = [{ ...a, pk: true }, b];
    else if (pk === 'e2') cols = [a, { ...b, pk: true }];
    else if (pk === 'kuenstlich') cols = [{ name: `${name}_ID`, pk: true, added: true }, a, b];
    else cols = [a, b];
    return [t1, t2, { name, added: true, cols }];
  }
  const holder = mapping === 'fk-e2' ? t2 : t1;
  const target = mapping === 'fk-e2' ? p.e1 : p.e2;
  holder.cols.push({
    name: target.key,
    fk: target.name,
    added: true,
    notNull: nullable === false,
    nullOk: nullable === true,
    unique: relType(p) === '1:1',
  });
  return [t1, t2];
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'pk' | 'fk' | 'plain' }) {
  const cls =
    tone === 'pk' ? 'bg-brand text-brand-contrast' : tone === 'fk' ? 'border border-accent text-accent' : 'border border-line text-muted';
  return <span className={`ml-1 rounded px-1 text-[10px] font-semibold leading-4 ${cls}`}>{children}</span>;
}

/** Live-Vorschau: zeigt die Tabellen und was sich durch die gewaehlte Abbildung aendert. */
export function RelPreview({ tables }: { tables: Tab[] }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-4" aria-label="Vorschau der Tabellen" role="group">
      {tables.map((t) => (
        <table
          key={t.name}
          className={`min-w-40 border-collapse overflow-hidden rounded-lg border text-sm ${t.added ? 'border-brand ring-2 ring-brand/30' : 'border-line'}`}
        >
          <caption className="bg-bg px-3 py-1 text-left font-bold">
            {t.name}
            {t.added && <span className="ml-2 text-xs font-normal text-brand">neu</span>}
          </caption>
          <tbody>
            {t.cols.map((c) => (
              <tr key={c.name} className={c.added ? 'bg-ok-bg' : ''}>
                <td className="border-t border-line px-3 py-1 font-mono">
                  {c.pk ? <u>{c.name}</u> : c.name}
                  {c.pk && <Badge tone="pk">PK</Badge>}
                  {c.fk && <Badge tone="fk">FK → {c.fk}</Badge>}
                  {c.notNull && <Badge tone="plain">NOT NULL</Badge>}
                  {c.nullOk && <Badge tone="plain">NULL erlaubt</Badge>}
                  {c.unique && <Badge tone="plain">UNIQUE</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
