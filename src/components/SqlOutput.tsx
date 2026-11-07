import { t } from '../i18n';
import type { CheckResult } from '../sql/ddlGrading';
import type { StatementResult } from '../sql/oracle';

const cell = (v: unknown) => (v === null || v === undefined ? 'NULL' : String(v));

export function ResultTable({ columns, rows, tone }: { columns: string[]; rows: unknown[][]; tone?: 'bad' | 'ok' }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line" tabIndex={0} role="region" aria-label={t('Ergebnistabelle')}>
      <table className="w-full text-xs">
        <thead className="bg-bg">
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-2 py-1 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length || 1} className="px-2 py-1 text-muted">
                {t('(keine Zeilen)')}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className={`border-t border-line ${tone === 'bad' ? 'bg-bad-bg' : tone === 'ok' ? 'bg-ok-bg' : ''}`}>
              {r.map((v, j) => (
                <td key={j} className={`whitespace-nowrap px-2 py-1 font-mono ${v === null ? 'text-muted' : ''}`}>
                  {cell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ausgabe pro Anweisung wie im Skriptausgabe-Fenster von SQL Developer */
export function StatementOutput({ results }: { results: StatementResult[] }) {
  if (!results.length) return <p className="text-sm text-muted">{t('Keine Anweisungen gefunden.')}</p>;
  return (
    <ol className="space-y-2 text-sm">
      {results.map((r, i) => (
        <li key={i} className={`rounded-lg p-2 ${r.ok ? 'bg-bg' : 'bg-bad-bg'}`}>
          <code className="block truncate font-mono text-xs text-muted">{r.sql.split('\n')[0]}</code>
          <span className={r.ok ? '' : 'text-bad'}>{r.message}</span>
          {r.ora && <span className="ml-2 font-mono text-xs text-muted">({r.ora})</span>}
          {r.columns && (
            <div className="mt-2 max-h-80 overflow-y-auto">
              <ResultTable columns={r.columns} rows={r.rows ?? []} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export function CheckList({ checks, passed, nextHref }: { checks: CheckResult[]; passed: boolean; nextHref?: string }) {
  return (
    <div role="status" className={`rounded-card border p-4 ${passed ? 'border-ok bg-ok-bg' : 'border-bad bg-bad-bg'}`}>
      <p className={`font-bold ${passed ? 'text-ok' : 'text-bad'}`}>
        {passed ? t('Alles erfüllt.') : t('{a} von {b} Anforderungen erfüllt.', { a: checks.filter((c) => c.ok).length, b: checks.length })}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {checks.map((c, i) => (
          <li key={i}>
            <span className={c.ok ? 'text-ok' : 'text-bad'} aria-hidden>
              {c.ok ? '✓' : '✗'}
            </span>{' '}
            <span className="sr-only">{c.ok ? t('erfüllt:') : t('nicht erfüllt:')}</span>
            {c.label}
            {c.hint && <div className="ml-5 text-muted">{c.hint}</div>}
          </li>
        ))}
      </ul>
      {passed && nextHref && (
        <a
          href={nextHref}
          className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline"
        >
          {t('Nächste Aufgabe')}
        </a>
      )}
    </div>
  );
}
