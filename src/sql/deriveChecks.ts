// Leitet aus einer DDL-Musterloesung die Pruefungen ab: Was die Loesung gegenueber dem
// Ausgangszustand (setup) neu anlegt, wird als Anforderung geprueft (Tabellen, Spalten mit
// Datentypfamilie, Primaerschluessel, NOT NULL, UNIQUE, Fremdschluessel inkl. Loeschverhalten,
// DEFAULT). So muessen Lehrende keine Pruefungen von Hand schreiben.

import type { SqlJsStatic } from 'sql.js';
import type { Check } from '../content/ddlTypes';
import { describeSchema, familyOf, type TableInfo } from './ddlGrading';
import { createDatabase, runScript, userTables } from './oracle';

export interface Derived {
  checks: Check[];
  /** Fehler beim Ausfuehren von setup oder Loesung */
  errors: string[];
}

function schemaOf(SQL: SqlJsStatic, script: string) {
  const db = createDatabase(SQL);
  const errors = runScript(db, script)
    // DROP TABLE am Skriptanfang meldet beim ersten Lauf ORA-00942: kein Fehler der Musterloesung
    .filter((r) => !r.ok && !(r.ora === 'ORA-00942' && /^\s*DROP\s+TABLE/i.test(r.sql)))
    .map((r) => `${r.message}${r.ora ? ` (${r.ora})` : ''} bei: ${r.sql.split('\n')[0].slice(0, 60)}`);
  const schema = describeSchema(db);
  const named = userTables(db).flatMap((t) => {
    const sql = String(db.exec(`SELECT sql FROM sqlite_master WHERE name='${t}'`)[0]?.values[0]?.[0] ?? '');
    return [...sql.matchAll(/CONSTRAINT\s+"?([\p{L}\p{N}_$#]+)"?/giu)].map((m) => m[1]);
  });
  db.close();
  return { schema, errors, named: [...new Set(named)] };
}

const lc = (s: string) => s.toLowerCase();
const sameCols = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.some((y) => lc(x) === lc(y)));

export function deriveChecks(SQL: SqlJsStatic, setup: string, solution: string, opts: { requireNames?: boolean } = {}): Derived {
  const before = schemaOf(SQL, setup);
  const after = schemaOf(SQL, `${setup}\n${solution}`);
  const errors = [...before.errors.map((e) => `Ausgangszustand: ${e}`), ...after.errors.filter((e) => !before.errors.includes(e)).map((e) => `Musterlösung: ${e}`)];
  const checks: Check[] = [];
  const old = new Map<string, TableInfo>(before.schema.map((t) => [lc(t.name), t]));

  for (const t of after.schema) {
    const o = old.get(lc(t.name));
    if (!o) checks.push({ kind: 'table', table: t.name });
    const known = (c: string) => o?.columns.some((x) => lc(x.name) === lc(c));
    for (const c of t.columns) {
      const oc = o?.columns.find((x) => lc(x.name) === lc(c.name));
      if (!oc || oc.type !== c.type) checks.push({ kind: 'column', table: t.name, column: c.name, family: familyOf(c.type) });
      if (c.notNull && !c.pk && !(oc?.notNull)) checks.push({ kind: 'notnull', table: t.name, column: c.name });
      if (c.default !== null && c.default !== oc?.default) {
        const v = c.default.replace(/^\((.*)\)$/, '$1').replace(/^'(.*)'$/, '$1');
        checks.push({ kind: 'default', table: t.name, column: c.name, value: v });
      }
    }
    void known;
    const pk = t.columns.filter((c) => c.pk).map((c) => c.name);
    const opk = o?.columns.filter((c) => c.pk).map((c) => c.name) ?? [];
    if (pk.length && !sameCols(pk, opk)) checks.push({ kind: 'pk', table: t.name, columns: pk });
    for (const fk of t.fks) {
      if (o?.fks.some((x) => sameCols(x.columns, fk.columns) && lc(x.refTable) === lc(fk.refTable))) continue;
      checks.push({
        kind: 'fk',
        table: t.name,
        columns: fk.columns,
        refTable: fk.refTable,
        ...(fk.onDelete === 'CASCADE' ? { onDelete: 'cascade' as const } : fk.onDelete === 'SET NULL' ? { onDelete: 'setnull' as const } : { onDelete: 'restrict' as const }),
      });
    }
  }

  // UNIQUE (ohne Primaerschluessel) ueber die Indexe
  const dbU = createDatabase(SQL);
  runScript(dbU, `${setup}\n${solution}`);
  const dbO = createDatabase(SQL);
  runScript(dbO, setup);
  const uniq = (db: ReturnType<typeof createDatabase>, table: string) => {
    const out: string[][] = [];
    const idx = db.exec(`PRAGMA index_list("${table}")`)[0];
    for (const row of idx?.values ?? []) {
      if (Number(row[2]) === 1 && String(row[3]) === 'u') {
        const info = db.exec(`PRAGMA index_info("${row[1]}")`)[0];
        out.push((info?.values ?? []).map((r) => String(r[2])));
      }
    }
    return out;
  };
  for (const t of after.schema) {
    const now = uniq(dbU, t.name);
    const was = old.has(lc(t.name)) ? uniq(dbO, t.name) : [];
    for (const cols of now) if (!was.some((w) => sameCols(w, cols))) checks.push({ kind: 'unique', table: t.name, columns: cols });
  }
  dbU.close();
  dbO.close();

  if (opts.requireNames) {
    const had = new Set(before.named.map(lc));
    for (const n of after.named) if (!had.has(lc(n))) checks.push({ kind: 'constraintName', name: n });
  }
  // Loeschen: Wenn die Loesung Tabellen entfernt, soll am Ende genau das gelten
  if (before.schema.length && !after.schema.length) return { checks: [{ kind: 'noTables' }], errors };
  return { checks, errors };
}
