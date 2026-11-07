import { t as tr } from '../i18n';
import type { TableInfo } from '../sql/ddlGrading';

/** Zeigt das aktuelle Schema als Relationen-Karten (PK unterstrichen, FK markiert). */
export function SchemaView({ schema }: { schema: TableInfo[] }) {
  if (!schema.length) return <p className="text-sm text-muted">{tr('Keine Tabellen vorhanden.')}</p>;
  return (
    <ul className="grid gap-3 xl:grid-cols-2">
      {schema.map((t) => {
        const fkCols = new Map<string, string>();
        for (const fk of t.fks)
          fk.columns.forEach((c, i) =>
            fkCols.set(
              c.toLowerCase(),
              `${fk.refTable}${fk.refColumns[i] ? `.${fk.refColumns[i]}` : ''}${fk.onDelete === 'CASCADE' ? ', ON DELETE CASCADE' : fk.onDelete === 'SET NULL' ? ', ON DELETE SET NULL' : ''}`,
            ),
          );
        return (
          <li key={t.name} className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface" tabIndex={0} aria-label={`${tr('Tabelle')} ${t.name}`}>
            <div className="border-b border-line bg-bg px-3 py-2 font-mono text-sm font-bold">{t.name}</div>
            <table className="w-full text-sm">
              <tbody>
                {t.columns.map((c) => {
                  const fk = fkCols.get(c.name.toLowerCase());
                  return (
                    <tr key={c.name} className="border-t border-line first:border-t-0 align-top">
                      <td className="px-3 py-1 font-mono">{c.pk ? <u title={tr('Primärschlüssel')}>{c.name}</u> : c.name}</td>
                      <td className="px-2 py-1 font-mono text-muted">{c.type}</td>
                      <td className="px-3 py-1 text-xs text-muted">
                        {[
                          c.pk && 'PK',
                          fk && `FK → ${fk}`,
                          c.notNull && !c.pk && 'NOT NULL',
                          c.default != null && `DEFAULT ${c.default}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </li>
        );
      })}
    </ul>
  );
}
