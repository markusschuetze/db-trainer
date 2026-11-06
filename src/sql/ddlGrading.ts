import type { Database, SqlJsStatic } from 'sql.js';
import type { Check, DdlExercise, TypeFamily } from '../content/ddlTypes';
import { createDatabase, findTable, runScript, userTables, type StatementResult } from './oracle';

export interface CheckResult {
  label: string;
  ok: boolean;
  hint?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  pk: boolean;
  notNull: boolean;
  default: string | null;
}
export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  fks: { columns: string[]; refTable: string; refColumns: string[]; onDelete: string }[];
}

const FAMILIES: Record<TypeFamily, string[]> = {
  number: ['NUMBER', 'INTEGER', 'INT', 'SMALLINT', 'FLOAT', 'DECIMAL', 'NUMERIC', 'REAL'],
  text: ['VARCHAR2', 'VARCHAR', 'CHAR', 'NVARCHAR2', 'NCHAR', 'CLOB'],
  date: ['DATE', 'TIMESTAMP'],
};
const ORACLE_TYPES = [...Object.values(FAMILIES).flat(), 'BLOB', 'RAW', 'LONG'];

const baseType = (t: string) => t.replace(/\(.*\)/, '').trim().toUpperCase();
const lc = (s: string) => s.toLowerCase();
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.some((y) => lc(x) === lc(y)));

type Row = Record<string, unknown>;
function query(db: Database, sql: string): Row[] {
  const stmt = db.prepare(sql);
  const out: Row[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as Row);
  stmt.free();
  return out;
}

export function describeSchema(db: Database): TableInfo[] {
  return userTables(db).map((name) => {
    const cols = query(db, `PRAGMA table_info("${name}")`);
    const groups = new Map<number, Row[]>();
    for (const r of query(db, `PRAGMA foreign_key_list("${name}")`))
      groups.set(Number(r.id), [...(groups.get(Number(r.id)) ?? []), r]);
    return {
      name,
      columns: cols.map((c) => ({
        name: String(c.name),
        type: String(c.type),
        pk: Number(c.pk) > 0,
        notNull: Number(c.notnull) === 1 || Number(c.pk) > 0, // Oracle: PK ist implizit NOT NULL
        default: c.dflt_value == null ? null : String(c.dflt_value),
      })),
      fks: [...groups.values()].map((rows) => ({
        columns: rows.map((r) => String(r.from)),
        refTable: String(rows[0].table),
        refColumns: rows.map((r) => (r.to ? String(r.to) : '')).filter(Boolean),
        onDelete: String(rows[0].on_delete),
      })),
    };
  });
}

function describeCheck(c: Check): string {
  if (c.label) return c.label;
  switch (c.kind) {
    case 'table':
      return `Tabelle ${c.table} existiert`;
    case 'column':
      return `${c.table}.${c.column} existiert${c.family ? ` mit passendem Datentyp (${{ number: 'Zahl', text: 'Text', date: 'Datum' }[c.family]})` : ''}`;
    case 'pk':
      return `Primärschlüssel von ${c.table}: ${c.columns.join(', ')}`;
    case 'notnull':
      return `${c.table}.${c.column} ist NOT NULL`;
    case 'unique':
      return `${c.table}: ${c.columns.join(', ')} ist UNIQUE`;
    case 'fk':
      return `Fremdschlüssel ${c.table}(${c.columns.join(', ')}) → ${c.refTable}${c.onDelete === 'cascade' ? ' mit ON DELETE CASCADE' : c.onDelete === 'setnull' ? ' mit ON DELETE SET NULL' : ''}`;
    case 'default':
      return `${c.table}.${c.column} hat DEFAULT ${c.value}`;
    case 'constraintName':
      return `Constraint heißt ${c.name}`;
    case 'noTables':
      return 'Alle Tabellen sind gelöscht';
    case 'behavior':
      return 'Verhalten';
  }
}

export function runCheck(db: Database, c: Check): CheckResult {
  const label = describeCheck(c);
  const res = (ok: boolean, hint?: string): CheckResult => ({ label, ok, hint: ok ? undefined : (c.hint ?? hint) });
  const schema = describeSchema(db);
  const tbl = (n: string) => schema.find((t) => lc(t.name) === lc(n));

  switch (c.kind) {
    case 'table':
      return res(!!tbl(c.table), 'Die Tabelle fehlt oder hat einen anderen Namen.');
    case 'noTables':
      return res(schema.length === 0, `Es existieren noch Tabellen: ${schema.map((t) => t.name).join(', ')}.`);
    case 'column': {
      const col = tbl(c.table)?.columns.find((x) => lc(x.name) === lc(c.column));
      if (!col) return res(false, 'Die Spalte fehlt.');
      if (c.family && !FAMILIES[c.family].includes(baseType(col.type)))
        return res(false, `Datentyp ${col.type || '(keiner)'} passt nicht. Erwartet: ${FAMILIES[c.family].slice(0, 3).join(', ')} …`);
      return res(true);
    }
    case 'pk': {
      const t = tbl(c.table);
      if (!t) return res(false, 'Tabelle fehlt.');
      const pk = t.columns.filter((x) => x.pk).map((x) => x.name);
      return res(sameSet(pk, c.columns), pk.length ? `Aktueller Primärschlüssel: ${pk.join(', ')}.` : 'Kein Primärschlüssel definiert.');
    }
    case 'notnull': {
      const col = tbl(c.table)?.columns.find((x) => lc(x.name) === lc(c.column));
      return res(!!col?.notNull, 'Die Spalte erlaubt noch NULL.');
    }
    case 'unique': {
      const t = tbl(c.table);
      if (!t) return res(false, 'Tabelle fehlt.');
      const idx = query(db, `PRAGMA index_list("${t.name}")`).filter((i) => Number(i.unique) === 1);
      const sets = idx.map((i) => query(db, `PRAGMA index_info("${i.name}")`).map((r) => String(r.name)));
      const pk = t.columns.filter((x) => x.pk).map((x) => x.name);
      if (pk.length) sets.push(pk);
      return res(sets.some((s) => sameSet(s, c.columns)), 'Es gibt keine passende UNIQUE-Bedingung.');
    }
    case 'fk': {
      const t = tbl(c.table);
      const fk = t?.fks.find(
        (f) =>
          sameSet(f.columns, c.columns) &&
          lc(f.refTable) === lc(c.refTable) &&
          (!c.refColumns || !f.refColumns.length || sameSet(f.refColumns, c.refColumns)),
      );
      if (!fk) return res(false, 'Dieser Fremdschlüssel ist nicht definiert.');
      const expect = c.onDelete === 'cascade' ? 'CASCADE' : c.onDelete === 'setnull' ? 'SET NULL' : c.onDelete === 'restrict' ? 'NO ACTION' : undefined;
      if (expect && fk.onDelete !== expect)
        return res(false, `Löschverhalten ist ${fk.onDelete === 'NO ACTION' ? 'restriktiv (Standard)' : fk.onDelete}, erwartet: ${expect}.`);
      return res(true);
    }
    case 'default': {
      const col = tbl(c.table)?.columns.find((x) => lc(x.name) === lc(c.column));
      const v = col?.default?.replace(/^\((.*)\)$/, '$1').replace(/^'(.*)'$/, '$1');
      return res(v === c.value, col?.default == null ? 'Kein DEFAULT-Wert definiert.' : `Aktueller DEFAULT: ${col.default}.`);
    }
    case 'constraintName': {
      const all = userTables(db)
        .map((t) => String(query(db, `SELECT sql FROM sqlite_master WHERE name='${t}'`)[0]?.sql ?? ''))
        .join('\n');
      return res(new RegExp(`CONSTRAINT\\s+"?${c.name}"?(\\s|\\()`, 'i').test(all), 'Der Constraint hat keinen (oder einen anderen) Namen.');
    }
    case 'behavior': {
      db.exec('SAVEPOINT chk');
      try {
        for (const [i, s] of c.steps.entries()) {
          const expect = s.expect ?? 'ok';
          let failed = false;
          try {
            db.exec(s.sql);
          } catch (e) {
            // Fehlende Tabelle/Spalte ist keine "richtige" Ablehnung durch einen Constraint
            if (/no such table|no such column|has no column/i.test(String(e)))
              return res(false, 'Eine benötigte Tabelle oder Spalte fehlt, das Verhalten ist nicht prüfbar.');
            failed = true;
          }
          if (expect === 'ok' && failed) return res(false, `Schritt ${i + 1} sollte funktionieren, wurde aber abgelehnt: ${s.sql}`);
          if (expect === 'error' && !failed) return res(false, `Schritt ${i + 1} hätte abgelehnt werden müssen, wurde aber akzeptiert: ${s.sql}`);
        }
        if (c.expectValue) {
          const out = db.exec(c.expectValue.sql);
          const got = String(out[0]?.values[0]?.[0] ?? '');
          if (got !== c.expectValue.equals) return res(false, `Erwartet ${c.expectValue.equals}, erhalten ${got}.`);
        }
        return res(true);
      } catch {
        return res(false, 'Das Verhalten konnte nicht geprüft werden (fehlt eine Tabelle oder Spalte?).');
      } finally {
        try {
          db.exec('ROLLBACK TO chk');
          db.exec('RELEASE chk');
        } catch {
          /* ignorieren */
        }
      }
    }
  }
}

function oracleTypesCheck(db: Database): CheckResult {
  const bad: string[] = [];
  for (const t of describeSchema(db))
    for (const c of t.columns) if (!ORACLE_TYPES.includes(baseType(c.type))) bad.push(`${t.name}.${c.name}: ${c.type || '(kein Typ)'}`);
  return {
    label: 'Alle Datentypen sind Oracle-Datentypen',
    ok: bad.length === 0,
    hint: bad.length ? `Kein Oracle-Datentyp: ${bad.join('; ')}. In der Vorlesung: NUMBER, CHAR(n), VARCHAR2(n), DATE, BLOB.` : undefined,
  };
}

export interface ExerciseRun {
  results: StatementResult[];
  checks: CheckResult[];
  schema: TableInfo[];
  passed: boolean;
}

export function runExercise(SQL: SqlJsStatic, ex: DdlExercise, userScript: string): ExerciseRun {
  const db = createDatabase(SQL);
  try {
    if (ex.setup) runScript(db, ex.setup);
    const results = runScript(db, userScript);
    const checks = [...ex.checks.map((c) => runCheck(db, c)), ...(ex.checks.some((c) => c.kind === 'noTables') ? [] : [oracleTypesCheck(db)])];
    return { results, checks, schema: describeSchema(db), passed: checks.every((c) => c.ok) };
  } finally {
    db.close();
  }
}

export { findTable };
