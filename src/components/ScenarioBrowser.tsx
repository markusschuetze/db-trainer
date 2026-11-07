import { useMemo, useRef, useState } from 'react';
import type { SqlJsStatic } from 'sql.js';
import { scenarioById } from '../content/scenarios';
import { describeSchema } from '../sql/ddlGrading';
import { scenarioContent, scenarioDb } from '../sql/sqlGrading';
import { SchemaDiagram } from './SchemaDiagram';
import { ResultTable } from './SqlOutput';

/** Uebersicht einer Fall-Datenbank: Diagramm mit Fremdschluesseln, Relationen und Tabelleninhalte. */
export function ScenarioBrowser({ SQL, scenario, open = false }: { SQL: SqlJsStatic | null; scenario?: string; open?: boolean }) {
  const sc = scenarioById(scenario);
  const [view, setView] = useState<'diagramm' | 'daten'>('diagramm');
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useMemo(() => (SQL ? scenarioContent(SQL, sc.id) : []), [SQL, sc.id]);
  const schema = useMemo(() => {
    if (!SQL) return [];
    const db = scenarioDb(SQL, sc.id, 'A');
    try {
      const all = describeSchema(db);
      return sc.tables.map((t) => all.find((x) => x.name.toLowerCase() === t.toLowerCase())!).filter(Boolean);
    } finally {
      db.close();
    }
  }, [SQL, sc.id, sc.tables]);

  const tab = (v: typeof view, label: string) => (
    <button
      role="tab"
      aria-selected={view === v}
      onClick={() => setView(v)}
      className={`rounded-full border px-3 py-1 text-sm ${view === v ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
    >
      {label}
    </button>
  );

  return (
    <details className="rounded-card border border-line bg-surface p-5" open={open}>
      <summary className="cursor-pointer font-bold">Datenbank „{sc.name}“ ansehen</summary>
      <p className="mt-2 text-sm text-muted">{sc.description}</p>
      <div className="mt-3 flex gap-2" role="tablist">
        {tab('diagramm', 'Schema')}
        {tab('daten', 'Tabelleninhalte')}
      </div>
      {view === 'diagramm' ? (
        <div className="mt-3">
          {schema.length ? (
            <>
              <SchemaDiagram tables={schema} title={`Schema der Datenbank ${sc.name}`} fit maxCols={2} />
              <button className="mt-2 text-sm underline" onClick={() => dialog.current?.showModal()}>
                Vergrößern
              </button>
              <dialog
                ref={dialog}
                aria-label={`Schema der Datenbank ${sc.name}`}
                className="m-auto max-h-[90vh] max-w-[95vw] rounded-card border border-line bg-surface p-5 text-ink backdrop:bg-black/50"
                onClick={(e) => e.target === dialog.current && dialog.current?.close()}
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="font-bold">Schema „{sc.name}“</h2>
                  <button className="rounded-lg border border-line px-3 py-1 text-sm" onClick={() => dialog.current?.close()}>
                    Schließen
                  </button>
                </div>
                <SchemaDiagram tables={schema} title={`Schema der Datenbank ${sc.name}`} />
              </dialog>
            </>
          ) : (
            <p className="text-sm text-muted">Wird geladen …</p>
          )}
          <pre tabIndex={0} className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs leading-5">{sc.relations.join('\n')}</pre>
          <p className="mt-2 text-xs text-muted">Pfeile zeigen vom Fremdschlüssel zur referenzierten Tabelle. Unterstrichen: Primärschlüssel.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {content.map(({ table, data }) => (
            <details key={table}>
              <summary className="cursor-pointer font-mono text-sm">
                {table} ({data.rows.length} Zeilen)
              </summary>
              <div className="mt-2">
                <ResultTable columns={data.columns} rows={data.rows} />
              </div>
            </details>
          ))}
          <p className="text-xs text-muted">
            Datumswerte erscheinen als JJJJ-MM-TT. Geprüft wird zusätzlich auf einem verdeckten zweiten Datenbestand mit gleicher
            Struktur.
          </p>
        </div>
      )}
    </details>
  );
}
