// Arbeitssitzung fuer den Praktikums-Modus: Die Datenbank bleibt zwischen den
// Eingaben erhalten, wie im SQL Developer. Verhalten wie in Oracle:
//   - COMMIT bestaetigt die Aenderungen, ROLLBACK verwirft alles seit dem letzten COMMIT
//   - DDL (CREATE, ALTER, DROP, TRUNCATE) bestaetigt vorher offene Aenderungen implizit
// Erfolgreiche Anweisungen werden protokolliert, damit eine Sitzung nach dem Neuladen der
// Seite durch Wiederholen des Protokolls wiederhergestellt werden kann.

import type { Database, SqlJsStatic } from 'sql.js';
import { describeSchema, type TableInfo } from './ddlGrading';
import { createDatabase, executeStatement, restoreDatabase, runScript, splitStatements, userTables, type StatementResult } from './oracle';

const DDL = /^\s*(CREATE|ALTER|DROP|TRUNCATE)\b/i;
const MAX_LOG = 500;

export class Session {
  db: Database;
  /** Erfolgreich ausgefuehrte Anweisungen seit Start (ohne Schema-Skript) */
  log: string[] = [];
  private snapshot: Uint8Array;
  /** Anzahl nicht bestaetigter Aenderungen (DML seit COMMIT) */
  pending = 0;

  constructor(
    private SQL: SqlJsStatic,
    private schema: string,
    replay: string[] = [],
  ) {
    this.db = createDatabase(SQL);
    runScript(this.db, schema);
    this.snapshot = this.db.export();
    for (const s of replay) this.exec(s);
  }

  private exec(stmt: string): StatementResult {
    const kw = stmt.trim().match(/^(\w+)/)?.[1]?.toUpperCase();
    if (kw === 'COMMIT') {
      this.snapshot = this.db.export();
      this.pending = 0;
      return { sql: stmt, ok: true, message: 'Commit abgeschlossen.' };
    }
    if (kw === 'ROLLBACK') {
      this.db.close();
      this.db = restoreDatabase(this.SQL, this.snapshot);
      const n = this.pending;
      this.pending = 0;
      return { sql: stmt, ok: true, message: n ? `Rollback abgeschlossen: ${n} nicht bestätigte Änderung(en) verworfen.` : 'Rollback abgeschlossen (keine offenen Änderungen).' };
    }
    const r = executeStatement(this.db, stmt);
    if (r.ok) {
      if (DDL.test(stmt)) {
        this.snapshot = this.db.export(); // DDL bestaetigt implizit
        this.pending = 0;
      } else if (/^\s*(INSERT|UPDATE|DELETE|MERGE)\b/i.test(stmt)) this.pending++;
    }
    return r;
  }

  /** Fuehrt ein Skript aus. Fehler stoppen nicht (wie in SQL Developer). */
  run(script: string): StatementResult[] {
    return splitStatements(script).map((s) => {
      const r = this.exec(s);
      if (r.ok) {
        this.log.push(s);
        if (this.log.length > MAX_LOG) this.log.shift();
      }
      return r;
    });
  }

  reset() {
    this.db.close();
    this.db = createDatabase(this.SQL);
    runScript(this.db, this.schema);
    this.snapshot = this.db.export();
    this.log = [];
    this.pending = 0;
  }

  tables(): string[] {
    return userTables(this.db);
  }

  schemaInfo(): TableInfo[] {
    return describeSchema(this.db);
  }

  /** Inhalt einer Tabelle (zur Ansicht, begrenzt) */
  preview(table: string, limit = 100): { columns: string[]; rows: unknown[][]; total: number } {
    const q = this.db.prepare(`SELECT * FROM "${table}" LIMIT ${limit}`);
    const columns = q.getColumnNames();
    const rows: unknown[][] = [];
    while (q.step()) rows.push(q.get());
    q.free();
    const total = Number(this.db.exec(`SELECT COUNT(*) FROM "${table}"`)[0].values[0][0]);
    return { columns, rows, total };
  }

  close() {
    this.db.close();
  }
}

/** Beschreibung der Fremdschluessel als Text: "Anmelden.Kurs_ID → Kurs.Kurs_ID" */
export function fkSentences(schema: TableInfo[]): string[] {
  return schema.flatMap((t) =>
    t.fks.map((fk) => `${t.name}.${fk.columns.join(', ')} → ${fk.refTable}.${fk.refColumns.join(', ') || '(Primärschlüssel)'}`),
  );
}
