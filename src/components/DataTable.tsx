import { t } from '../i18n';
import type { Table } from '../content/types';

export function DataTable({
  table,
  highlight = [],
  caption,
}: {
  table: Table;
  highlight?: string[];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-card border border-line" tabIndex={0} role="region" aria-label={caption ?? t('Tabelle')}>
      <table className="w-full border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-bg">
            {table.columns.map((c) => (
              <th
                key={c}
                scope="col"
                className={`whitespace-nowrap px-3 py-2 font-semibold ${
                  highlight.includes(c) ? 'bg-bad-bg text-bad' : ''
                }`}
              >
                {table.pk.includes(c) ? <u title={t('Primärschlüssel')}>{c}</u> : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`whitespace-nowrap px-3 py-2 ${
                    highlight.includes(table.columns[j]) ? 'bg-bad-bg' : ''
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
