// Oracle-Dialekt fuer Abfragen und DML auf SQLite.
// - Oracle-Funktionen aus dem Syntaxdiagramm (NVL, TO_DATE, TO_CHAR, LPAD, ...)
// - SYSDATE, DUAL, DATE-Literale, MINUS, FETCH FIRST
// - Ablehnung von Nicht-Oracle-Syntax (LIMIT, AS bei Tabellenaliasen)
// - GROUP-BY-Pruefung wie Oracle (ORA-00979 / ORA-00937); SQLite waere hier nachsichtig

import type { Database } from 'sql.js';
import { OracleError, splitTopLevel } from './oracle';

/* ---------------- Funktionen ---------------- */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Wandelt einen Datumstext gemaess Oracle-Formatmaske in ISO (YYYY-MM-DD). */
export function toDate(value: unknown, fmt: unknown = 'DD.MM.YYYY'): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  const f = String(fmt).toUpperCase();
  const order: string[] = [];
  const pattern = f.replace(/YYYY|RRRR|YY|RR|DD|MM/g, (t) => {
    order.push(t);
    return t.length === 4 ? '(\\d{4})' : '(\\d{1,2})';
  });
  const m = s.match(new RegExp(`^${pattern.replace(/\./g, '\\.')}$`));
  if (!m) throw new Error(`TO_DATE: "${s}" passt nicht zur Formatmaske "${fmt}"`);
  let y = 0,
    mo = 0,
    d = 0;
  order.forEach((t, i) => {
    const v = Number(m[i + 1]);
    if (t === 'DD') d = v;
    else if (t === 'MM') mo = v;
    else y = t.length === 2 ? (v < 50 ? 2000 + v : 1900 + v) : v;
  });
  if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new Error('TO_DATE: ungültiges Datum');
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

export function toChar(value: unknown, fmt?: unknown): string | null {
  if (value == null) return null;
  const s = String(value);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!fmt || !iso) return s;
  return String(fmt)
    .toUpperCase()
    .replace(/YYYY|RRRR/g, iso[1])
    .replace(/YY|RR/g, iso[1].slice(2))
    .replace(/MM/g, iso[2])
    .replace(/DD/g, iso[3]);
}

export function registerOracleFunctions(db: Database) {
  db.create_function('NVL', (a: unknown, b: unknown) => (a == null ? b : a) as never);
  db.create_function('TO_DATE', (v: unknown, f: unknown) => toDate(v, f ?? 'DD.MM.YYYY') as never);
  db.create_function('TO_CHAR', (v: unknown, f: unknown) => toChar(v, f) as never);
  db.create_function('TO_NUMBER', (v: unknown) => (v == null ? null : Number(String(v).replace(',', '.'))) as never);
  db.create_function('LPAD', (s: unknown, n: unknown, c: unknown) =>
    s == null ? null : (String(s).padStart(Number(n), c == null ? ' ' : String(c)).slice(0, Number(n)) as never),
  );
  db.create_function('RPAD', (s: unknown, n: unknown, c: unknown) =>
    s == null ? null : (String(s).padEnd(Number(n), c == null ? ' ' : String(c)).slice(0, Number(n)) as never),
  );
  // Oracle: LIKE unterscheidet Gross-/Kleinschreibung, SQLite standardmaessig nicht
  db.exec('PRAGMA case_sensitive_like=ON');
  // DUAL wie in Oracle
  db.exec("CREATE TABLE IF NOT EXISTS DUAL (DUMMY VARCHAR2(1)); INSERT INTO DUAL VALUES ('X');");
}

/* ---------------- Textwerkzeuge ---------------- */

/** Ersetzt Inhalte von Zeichenketten durch Platzhalter gleicher Laenge (fuer Suche). */
function maskStrings(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'");
}

/** Wendet fn nur auf Teile ausserhalb von Zeichenketten an. */
function outsideStrings(sql: string, fn: (part: string) => string): string {
  return sql
    .split(/('(?:[^']|'')*')/g)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('');
}

/** Maskiert zusaetzlich alles in Klammern (nur oberste Ebene bleibt sichtbar). */
function maskNested(sql: string): string {
  const s = maskStrings(sql);
  let depth = 0;
  let out = '';
  for (const c of s) {
    if (c === '(') {
      depth++;
      out += depth === 1 ? '(' : ' ';
    } else if (c === ')') {
      out += depth === 1 ? ')' : ' ';
      depth--;
    } else out += depth > 0 ? ' ' : c;
  }
  return out;
}

/* ---------------- Umschreiben und Ablehnen ---------------- */

export function rewriteQuery(stmt: string): string {
  const masked = maskStrings(stmt);
  if (/\bLIMIT\s+\d+/i.test(masked))
    throw new OracleError('LIMIT gibt es in Oracle nicht. Nutze FETCH FIRST n ROWS ONLY.', 'ORA-00933');
  if (/\b(FROM|JOIN)\s+[\p{L}_][\p{L}\p{N}_$#]*\s+AS\s+[\p{L}_]/iu.test(masked))
    throw new OracleError(
      'In Oracle steht vor einem Tabellen-Alias kein AS: FROM Kurs k statt FROM Kurs AS k. (AS ist nur bei Spaltenaliasen erlaubt.)',
      'ORA-00933',
    );
  return outsideStrings(stmt, (p) =>
    p
      .replace(/\bSYSDATE\b/gi, "date('now')")
      .replace(/\bMINUS\b/gi, 'EXCEPT')
      .replace(/\bFETCH\s+(?:FIRST|NEXT)\s+(\d+)\s+ROWS?\s+ONLY\b/gi, 'LIMIT $1')
      .replace(/\bOFFSET\s+(\d+)\s+ROWS?\b/gi, 'OFFSET $1'),
  ).replace(/\bDATE\s+('\d{4}-\d{2}-\d{2}')/gi, '$1');
}

/* ---------------- GROUP BY wie Oracle ---------------- */

const KEYWORDS = new Set(
  'select from where and or not null is in like between as distinct case when then else end asc desc all any exists'.split(' '),
);
const AGG = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i;

function identifiers(expr: string): string[] {
  const noStr = expr.replace(/'(?:[^']|'')*'/g, ' ');
  const ids: string[] = [];
  const re = /("?[\p{L}_][\p{L}\p{N}_$#]*"?)(\s*\.\s*"?[\p{L}_][\p{L}\p{N}_$#]*"?)?(\s*\()?/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noStr))) {
    if (m[3]) continue; // Funktionsname
    const full = (m[2] ? m[2].replace(/[\s.]/g, '') : m[1]).replace(/"/g, '').toLowerCase();
    if (!KEYWORDS.has(full) && full !== "date('now')") ids.push(full);
  }
  return ids;
}

function stripAlias(item: string): string {
  const m = item.match(/^(.*\S)\s+(?:AS\s+)?("[^"]+"|[\p{L}_][\p{L}\p{N}_$#]*)$/iu);
  if (m && !/(\|\||[+\-*/,(]|\b(AND|OR|NOT|IS|IN|LIKE|THEN|ELSE|WHEN|CASE|DISTINCT|SELECT))\s*$/i.test(m[1])) return m[1];
  return item;
}

/** Prueft die oberste SELECT-Ebene auf Oracles GROUP-BY-Regeln. */
export function checkGroupBy(stmt: string) {
  const top = maskNested(stmt);
  if (!/^\s*SELECT\b/i.test(top)) return;
  if (/\b(UNION|INTERSECT|EXCEPT|MINUS)\b/i.test(top)) return;
  const fromIdx = top.search(/\bFROM\b/i);
  if (fromIdx < 0) return;
  const selStart = top.search(/\bSELECT\b/i) + 6;
  let selectPart = stmt.slice(selStart, fromIdx).trim().replace(/^(DISTINCT|ALL)\s+/i, '');
  const groupIdx = top.search(/\bGROUP\s+BY\b/i);
  const items = splitTopLevel(selectPart);
  const hasAgg = items.some((i) => AGG.test(i));
  if (groupIdx < 0 && !hasAgg) return;

  let groupIds = new Set<string>();
  if (groupIdx >= 0) {
    const after = top.slice(groupIdx);
    const endRel = after.slice(8).search(/\b(HAVING|ORDER\s+BY)\b/i);
    const groupText = stmt.slice(groupIdx, endRel < 0 ? undefined : groupIdx + 8 + endRel).replace(/^GROUP\s+BY/i, '');
    groupIds = new Set(identifiers(groupText));
  }
  for (const raw of items) {
    if (AGG.test(raw)) continue;
    const expr = stripAlias(raw.trim());
    if (/(^|\.)\*$/.test(expr))
      throw new OracleError('SELECT * ist zusammen mit GROUP BY bzw. Aggregatfunktionen nicht erlaubt.', 'ORA-00979');
    const ids = identifiers(expr);
    const missing = ids.filter((id) => !groupIds.has(id));
    if (missing.length) {
      if (groupIdx < 0)
        throw new OracleError(
          `„${expr}“ steht neben einer Aggregatfunktion, aber es gibt kein GROUP BY. Entweder ${expr} in GROUP BY aufnehmen oder entfernen.`,
          'ORA-00937',
        );
      throw new OracleError(
        `„${expr}“ ist kein GROUP-BY-Ausdruck. Jede Spalte im SELECT muss entweder in GROUP BY stehen oder in einer Aggregatfunktion (COUNT, SUM, AVG, MIN, MAX).`,
        'ORA-00979',
      );
    }
  }
}
