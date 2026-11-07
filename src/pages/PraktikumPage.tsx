import { useEffect, useRef, useState } from 'react';
import type { SqlJsStatic } from 'sql.js';
import { SchemaDiagram } from '../components/SchemaDiagram';
import { SqlEditor } from '../components/SqlEditor';
import { ResultTable, StatementOutput } from '../components/SqlOutput';
import { allWorksheets, packWorksheets, type Worksheet } from '../content/worksheets';
import { isDone, loadDraft, markDone, saveDraft } from '../progress';
import type { StatementResult } from '../sql/oracle';
import { fkSentences, Session } from '../sql/session';
import { parseWorksheetFile } from '../sql/worksheetFile';
import { useSql } from '../useSql';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold disabled:opacity-50';
const IMPORT_KEY = 'dbt:imported-worksheets';

/** Importierte Blaetter (Datei vom Dozenten) aus dem Browser wiederherstellen */
function restoreImported() {
  try {
    const list = JSON.parse(localStorage.getItem(IMPORT_KEY) ?? '[]') as Worksheet[];
    for (const w of list) if (!packWorksheets.some((x) => x.id === w.id)) packWorksheets.push({ ...w, origin: 'datei' });
  } catch {
    /* ignorieren */
  }
}

function saveImported() {
  try {
    localStorage.setItem(IMPORT_KEY, JSON.stringify(packWorksheets.filter((w) => w.origin === 'datei')));
  } catch {
    /* ignorieren */
  }
}

/* ======================= Auswahl ======================= */

function Overview() {
  const { SQL } = useSql();
  const [, bump] = useState(0);
  const [msg, setMsg] = useState<string[]>([]);
  const file = useRef<HTMLInputElement>(null);
  restoreImported();
  const sheets = allWorksheets();

  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Praktikum</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Arbeiten wie im SQL Developer, aber im Browser: Die Datenbank bleibt zwischen den Eingaben erhalten, Anweisungen werden
        ausgeführt, Fehler erscheinen mit Oracle-Fehlercode, und das ER-Modell lässt sich jederzeit anzeigen. So siehst du, ob ein
        Fremdschlüssel wirklich auf den Primärschlüssel zeigt.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {sheets.map((w) => (
          <li key={w.id} className="flex flex-col rounded-card border border-line bg-surface p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {w.origin === 'eingebaut' ? 'Übungsblatt' : w.origin === 'paket' ? 'Vom Dozenten' : 'Geladene Datei'} · {w.tasks.length} Aufgaben
            </span>
            <h2 className="mt-1 text-lg font-bold">{w.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{w.description}</p>
            <a href={`#/praktikum/${w.id}`} className={`${btn} mt-4 self-start no-underline`}>
              Öffnen
            </a>
          </li>
        ))}
      </ul>
      <section className="mt-8 rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Übungsblatt oder Datenbank laden</h2>
        <p className="mt-1 text-sm text-muted">
          Hast du von deinen Lehrenden eine Datei bekommen? Eine <code>.json</code>-Datei (Übungsblatt mit Aufgaben) oder eine{' '}
          <code>.sql</code>-Datei (nur Datenbank) lässt sich hier laden. Sie bleibt auf deinem Gerät.
        </p>
        <input
          ref={file}
          type="file"
          accept=".json,.sql"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f || !SQL) return;
            const { sheets: loaded, problems } = parseWorksheetFile(f.name, await f.text(), SQL);
            for (const w of loaded) {
              const i = packWorksheets.findIndex((x) => x.id === w.id);
              if (i >= 0) packWorksheets.splice(i, 1);
              packWorksheets.push(w);
            }
            saveImported();
            setMsg([...(loaded.length ? [`${loaded.length} Blatt/Blätter geladen.`] : []), ...problems]);
            e.target.value = '';
            bump((n) => n + 1);
          }}
        />
        <button className={`${btnGhost} mt-3`} onClick={() => file.current?.click()} disabled={!SQL}>
          Datei auswählen
        </button>
        {msg.length > 0 && (
          <ul role="status" className="mt-3 list-disc pl-5 text-sm">
            {msg.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* ======================= Arbeitsplatz ======================= */

function WorkspaceInner({ sheet, session: s }: { sheet: Worksheet; session: Session }) {
  const logKey = `dbt:ws:${sheet.id}`;
  const [, bump] = useState(0);
  const [code, setCode] = useState(() => loadDraft(`ws:${sheet.id}`, sheet.tasks.length ? '-- Deine Anweisungen. Strg/Cmd+Enter führt aus (markierter Text oder alles).\n' : '-- Strg/Cmd+Enter führt aus (markierter Text oder alles).\n'));
  const [results, setResults] = useState<StatementResult[] | null>(null);
  const [view, setView] = useState<string | null>(null);
  const [showSol, setShowSol] = useState<Record<string, boolean>>({});
  const dialog = useRef<HTMLDialogElement>(null);

  const persist = () => {
    try {
      localStorage.setItem(logKey, JSON.stringify(s.log));
    } catch {
      /* ignorieren */
    }
  };
  const run = (text: string) => {
    if (!text.trim()) return;
    setResults(s.run(text));
    persist();
    bump((n) => n + 1);
  };
  const tables = s.tables();
  const preview = view && tables.includes(view) ? s.preview(view) : null;
  const schema = s.schemaInfo();

  return (
    <>
      <a href="#/praktikum" className="text-sm underline">
        ← Alle Übungsblätter
      </a>
      <h1 className="mt-2 text-2xl font-bold">{sheet.title}</h1>
      {sheet.description && <p className="mt-1 text-sm text-muted">{sheet.description}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="min-w-0 space-y-4">
          {sheet.tasks.length > 0 && (
            <div className="rounded-card border border-line bg-surface p-5">
              <h2 className="mb-2 font-bold">Aufgaben</h2>
              <ol className="space-y-3">
                {sheet.tasks.map((t, i) => {
                  const key = `ws:${sheet.id}:${t.id}`;
                  return (
                    <li key={t.id} className="rounded-lg border border-line p-3">
                      <label className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" checked={isDone(key)} onChange={() => !isDone(key) && markDone(key)} aria-label={`Aufgabe ${i + 1} erledigt`} />
                        <span className="whitespace-pre-line text-sm leading-6">
                          <strong>{i + 1}.</strong> {t.text}
                        </span>
                      </label>
                      {t.hint && (
                        <details className="mt-2 text-sm">
                          <summary className="cursor-pointer text-muted">Tipp</summary>
                          <p className="mt-1">{t.hint}</p>
                        </details>
                      )}
                      {t.solution && (
                        <div className="mt-2">
                          <button className="text-sm underline" onClick={() => setShowSol({ ...showSol, [t.id]: !showSol[t.id] })}>
                            {showSol[t.id] ? 'Musterlösung ausblenden' : 'Musterlösung zeigen'}
                          </button>
                          {showSol[t.id] && (
                            <>
                              <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs leading-5">{t.solution}</pre>
                              <button className="mt-1 text-sm underline" onClick={() => setCode((c) => `${c.trimEnd()}\n\n${t.solution}\n`)}>
                                In den Editor kopieren
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="rounded-card border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Tabellen</h2>
              <button className={`${btnGhost} px-3 py-1 text-sm`} onClick={() => dialog.current?.showModal()} disabled={!tables.length}>
                ER-Modell anzeigen
              </button>
            </div>
            {tables.length === 0 && <p className="mt-2 text-sm text-muted">Noch keine Tabellen. Lege mit CREATE TABLE welche an.</p>}
            <ul className="mt-2 flex flex-wrap gap-2">
              {tables.map((t) => (
                <li key={t}>
                  <button
                    aria-pressed={view === t}
                    onClick={() => setView(view === t ? null : t)}
                    className={`rounded-full border px-3 py-1 font-mono text-sm ${view === t ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
            {preview && (
              <div className="mt-3">
                <p className="mb-1 text-xs text-muted">
                  {view}: {preview.total} Zeilen{preview.total > preview.rows.length ? `, die ersten ${preview.rows.length}` : ''}
                </p>
                <div className="max-h-72 overflow-y-auto">
                  <ResultTable columns={preview.columns} rows={preview.rows} />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          <SqlEditor
            value={code}
            onChange={(v) => {
              setCode(v);
              saveDraft(`ws:${sheet.id}`, v);
            }}
            onRun={(sel) => run(sel.trim() ? sel : code)}
            label="SQL-Editor"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button className={btn} onClick={() => run(code)}>
              Alles ausführen
            </button>
            <button
              className={btnGhost}
              onClick={() => {
                if (window.confirm('Datenbank auf den Anfangszustand zurücksetzen? Alle Änderungen gehen verloren (der Editor bleibt).')) {
                  s.reset();
                  persist();
                  setResults(null);
                  setView(null);
                  bump((n) => n + 1);
                }
              }}
            >
              Datenbank zurücksetzen
            </button>
            <span className={`ml-auto text-sm ${s.pending ? 'font-semibold text-accent' : 'text-muted'}`}>
              {s.pending ? `${s.pending} nicht bestätigte Änderung(en): COMMIT oder ROLLBACK` : 'keine offenen Änderungen'}
            </span>
          </div>
          <p className="text-xs text-muted">
            Wie im SQL Developer läuft ein Skript Anweisung für Anweisung weiter, auch nach einem Fehler. Mit Strg/Cmd+Enter führst du nur
            den markierten Text aus. Änderungen bleiben erhalten, bis du zurücksetzt; nach dem Neuladen der Seite wird die Sitzung
            wiederhergestellt.
          </p>
          {results && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Skriptausgabe</h2>
              <StatementOutput results={results} />
            </div>
          )}
        </section>
      </div>

      <dialog
        ref={dialog}
        className="m-auto max-h-[90vh] max-w-[95vw] rounded-card border border-line bg-surface p-5 text-ink backdrop:bg-black/50"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        aria-label="ER-Modell der Datenbank"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-bold">ER-Modell deiner Datenbank</h2>
          <button className="rounded-lg border border-line px-3 py-1 text-sm" onClick={() => dialog.current?.close()}>
            Schließen
          </button>
        </div>
        {schema.length > 0 && <SchemaDiagram tables={schema} title="Schema der aktuellen Datenbank" />}
        <p className="mt-3 text-sm">
          <strong>So liest du das Diagramm:</strong> Der Pfeil zeigt vom <em>Fremdschlüssel</em> (FK) auf den <em>Primärschlüssel</em> (PK) der
          Tabelle, auf die verwiesen wird. Der Pfeil beginnt also in der Kindtabelle. Die Elterntabelle muss zuerst existieren.
        </p>
        {fkSentences(schema).length > 0 ? (
          <ul className="mt-2 list-disc pl-5 font-mono text-sm">
            {fkSentences(schema).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Bisher gibt es keine Fremdschlüssel.</p>
        )}
      </dialog>
    </>
  );
}

/** Legt die Sitzung im Effekt an: sauber auf- und abgebaut, auch im React-Entwicklungsmodus */
function Workspace({ sheet, SQL }: { sheet: Worksheet; SQL: SqlJsStatic }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let replay: string[] = [];
    try {
      replay = JSON.parse(localStorage.getItem(`dbt:ws:${sheet.id}`) ?? '[]');
    } catch {
      /* ignorieren */
    }
    const s = new Session(SQL, sheet.schema, replay);
    setSession(s);
    return () => {
      s.close();
      setSession(null);
    };
  }, [sheet, SQL]);
  if (!session) return <p className="text-muted">Sitzung wird vorbereitet …</p>;
  return <WorkspaceInner sheet={sheet} session={session} />;
}

export function PraktikumPage({ id }: { id?: string }) {
  const { SQL, error } = useSql();
  if (!id) return <Overview />;
  restoreImported();
  const sheet = allWorksheets().find((w) => w.id === id);
  if (!sheet)
    return (
      <p>
        Übungsblatt nicht gefunden. <a href="#/praktikum" className="underline">Zur Auswahl</a>
      </p>
    );
  if (error) return <p className="text-bad">Datenbank konnte nicht geladen werden: {error}</p>;
  if (!SQL) return <p className="text-muted">Datenbank wird geladen …</p>;
  return <Workspace key={sheet.id} sheet={sheet} SQL={SQL} />;
}
