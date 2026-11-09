// Oracle-Strenge: Dinge, die SQLite durchlaesst, Oracle aber ablehnt (typische Fehler von Studierenden).
// Jede Pruefung wirft einen OracleError mit deutscher Erklaerung und dem passenden ORA-Code.

import { OracleError } from './oracle';

/** Ersetzt Zeichenketten in einfachen Hochkommas durch Leerzeichen gleicher Laenge. */
export function maskSingleQuoted(sql: string): string {
  return sql.replace(/'(?:[^']|'')*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'");
}

/** Wie oben, zusaetzlich Kommentare. */
function masked(sql: string): string {
  return maskSingleQuoted(sql).replace(/--[^\n]*/g, (m) => ' '.repeat(m.length));
}

/** Position der schliessenden Klammer zur oeffnenden bei index (in maskiertem Text). */
function closing(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

const NOT_ORACLE_FUNCTIONS: Record<string, string> = {
  IFNULL: 'NVL(a, b) oder COALESCE(a, b)',
  ISNULL: 'NVL(a, b)',
  IIF: 'CASE WHEN ... THEN ... ELSE ... END',
  IF: 'CASE WHEN ... THEN ... ELSE ... END',
  GROUP_CONCAT: 'LISTAGG(spalte, \', \') WITHIN GROUP (ORDER BY spalte)',
  SUBSTRING: 'SUBSTR(text, start, länge)',
  NOW: 'SYSDATE',
  CURDATE: 'SYSDATE',
  CURTIME: 'SYSDATE',
  STRFTIME: 'TO_CHAR(datum, \'DD.MM.YYYY\')',
  DATETIME: 'TO_DATE(...) oder SYSDATE',
  DATE: 'TO_DATE(\'01.10.2026\', \'DD.MM.YYYY\')',
  LEN: 'LENGTH(text)',
  LCASE: 'LOWER(text)',
  UCASE: 'UPPER(text)',
  RAND: 'DBMS_RANDOM.VALUE (im Trainer nicht verfügbar)',
  RANDOM: 'DBMS_RANDOM.VALUE (im Trainer nicht verfügbar)',
  CONCAT_WS: 'der Operator || (a || \', \' || b)',
  TYPEOF: 'nicht vorhanden',
  PRINTF: 'TO_CHAR(...)',
};

const BAD_TYPES = 'TEXT|STRING|DATETIME|BOOLEAN|BOOL|TINYINT|MEDIUMINT|BIGINT|DOUBLE|BIT|ENUM|LONGTEXT|MEDIUMTEXT|TINYTEXT|SERIAL|UUID|JSON';

export function checkOracleStatement(stmt: string, kw: string | undefined): void {
  const m = masked(stmt);
  const isQuery = kw === 'SELECT' || kw === 'WITH' || kw === 'INSERT' || kw === 'UPDATE' || kw === 'DELETE' || kw === 'MERGE';
  const isDdl = kw === 'CREATE' || kw === 'ALTER';

  /* Doppelte Anfuehrungszeichen: in Oracle Bezeichner, nie Texte */
  if (isQuery) {
    for (const hit of m.matchAll(/"([^"]*)"/g)) {
      const before = m.slice(0, hit.index).trimEnd();
      if (/\bAS$/i.test(before)) continue; // Spaltenalias: AS "Jahresgehalt"
      throw new OracleError(
        `Ungültiger Bezeichner: "${hit[1]}". Doppelte Anführungszeichen stehen in Oracle für Namen (Spalten, Tabellen). Texte schreibst du in einfache Hochkommas: '${hit[1]}'.`,
        'ORA-00904',
      );
    }
  } else if (isDdl) {
    for (const part of m.matchAll(/\b(?:CHECK|DEFAULT)\b[^,;]*?"[^"]*"/gi)) {
      const lit = part[0].match(/"([^"]*)"/)![1];
      throw new OracleError(
        `Ungültiger Bezeichner: "${lit}". Texte stehen in Oracle in einfachen Hochkommas: '${lit}'.`,
        'ORA-00904',
      );
    }
  }

  if (isQuery) {
    /* SELECT ohne FROM */
    if (kw === 'SELECT') {
      const top = m.match(/^\s*SELECT\s+(?:DISTINCT\s+|ALL\s+)?TOP\s+\d+/i);
      if (top)
        throw new OracleError('TOP gibt es in Oracle nicht. Nutze am Ende FETCH FIRST n ROWS ONLY.', 'ORA-00923');
      if (!/\bFROM\b/i.test(m))
        throw new OracleError(
          'FROM-Schlüsselwort nicht an der erwarteten Stelle gefunden. Jede SELECT-Anweisung braucht FROM (für Berechnungen ohne Tabelle: FROM DUAL).',
          'ORA-00923',
        );
    }
    /* Mehrere Zeilen in einem VALUES */
    const v = m.match(/\bVALUES\s*\(/i);
    if (v && v.index !== undefined) {
      const open = m.indexOf('(', v.index);
      const end = closing(m, open);
      if (end > 0 && /^\s*,/.test(m.slice(end + 1)))
        throw new OracleError(
          'SQL-Befehl nicht korrekt beendet. Mehrere Zeilen in einem VALUES (…), (…) gibt es in Oracle nicht. Schreibe für jede Zeile ein eigenes INSERT.',
          'ORA-00933',
        );
    }
    /* Operator == */
    if (/==/.test(m)) throw new OracleError('Fehlender Ausdruck: In SQL vergleicht man mit einem einfachen =, nicht mit ==.', 'ORA-00936');
    /* Funktionen, die es in Oracle nicht gibt */
    for (const f of m.matchAll(/(?<![\w.$#])([A-Za-z_]+)\s*\(/g)) {
      const name = f[1].toUpperCase();
      if (NOT_ORACLE_FUNCTIONS[name])
        throw new OracleError(
          `Ungültiger Bezeichner: ${name} ist in Oracle keine Funktion. Stattdessen: ${NOT_ORACLE_FUNCTIONS[name]}.`,
          'ORA-00904',
        );
    }
  }

  if (isDdl) {
    if (/\bAUTO_?INCREMENT\b/i.test(m))
      throw new OracleError(
        'AUTO_INCREMENT gibt es in Oracle nicht (das ist MySQL). Nutze GENERATED ALWAYS AS IDENTITY.',
        'ORA-00907',
      );
    if (/\b(VARCHAR2?|NVARCHAR2)\b(?!\s*\()/i.test(m))
      throw new OracleError(
        'Fehlende linke Klammer: VARCHAR2 braucht eine Längenangabe, z. B. VARCHAR2(50).',
        'ORA-00906',
      );
    const bad = m.match(new RegExp(`(?:^|[(,]\\s*)[\\p{L}_][\\p{L}\\p{N}_$#]*\\s+(${BAD_TYPES})\\b`, 'iu'));
    if (bad)
      throw new OracleError(
        `Ungültiger Datentyp: ${bad[1].toUpperCase()} gibt es in Oracle nicht. Verwende NUMBER, CHAR(n), VARCHAR2(n), DATE oder BLOB.`,
        'ORA-00902',
      );
  }
}

/**
 * Einzeilige Unterabfragen: "= (SELECT ...)" darf hoechstens eine Zeile liefern (ORA-01427).
 * SQLite nimmt stillschweigend die erste Zeile. Hier wird jede unabhaengige Unterabfrage nach
 * einem Vergleichsoperator vorab gezaehlt. Abhaengige (korrelierte) Unterabfragen werden uebersprungen.
 */
export function singleRowSubqueries(stmt: string): string[] {
  const m = masked(stmt);
  const out: string[] = [];
  for (const hit of m.matchAll(/(?:<>|!=|<=|>=|=|<|>)\s*\(\s*SELECT\b/gi)) {
    const open = m.indexOf('(', hit.index);
    const end = closing(m, open);
    if (end < 0) continue;
    const inner = stmt.slice(open + 1, end);
    // Aggregat ohne GROUP BY liefert immer genau eine Zeile
    if (/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(masked(inner)) && !/\bGROUP\s+BY\b/i.test(masked(inner))) continue;
    out.push(inner);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Datentyp-Waechter (ORA-01722, ORA-12899) ueber Trigger               */
/* ------------------------------------------------------------------ */

interface Col {
  name: string;
  type: string;
}

const NUMERIC = /^(NUMBER|INTEGER|INT|SMALLINT|FLOAT|DECIMAL|NUMERIC|REAL)\b/i;

/** SQL fuer die Trigger einer Tabelle (leer, wenn nichts zu pruefen ist). */
export function guardTriggers(table: string, cols: Col[]): string {
  const conds: string[] = [];
  for (const c of cols) {
    const q = `NEW."${c.name}"`;
    if (NUMERIC.test(c.type.trim()))
      conds.push(
        `SELECT RAISE(ABORT, 'ORA-01722') WHERE ${q} IS NOT NULL AND typeof(${q}) = 'text' AND (${q} GLOB '*[A-DF-Za-df-z]*' OR trim(${q}) = '')`,
      );
    const len = c.type.match(/^(?:N?VARCHAR2?|N?CHAR)\s*\(\s*(\d+)/i);
    if (len)
      conds.push(
        `SELECT RAISE(ABORT, 'ORA-12899:${c.name}:${len[1]}') WHERE ${q} IS NOT NULL AND length(CAST(${q} AS TEXT)) > ${len[1]}`,
      );
  }
  if (!conds.length) return '';
  const body = conds.map((x) => `${x};`).join(' ');
  const base = `"__guard_${table}`;
  return `CREATE TRIGGER ${base}_i" BEFORE INSERT ON "${table}" BEGIN ${body} END; CREATE TRIGGER ${base}_u" BEFORE UPDATE ON "${table}" BEGIN ${body} END;`;
}
