// Oracle-Anpassungsschicht ueber SQLite (sql.js).
//
// Ziel: Die Vorlesung arbeitet mit Oracle. Der Trainer laeuft im Browser auf
// SQLite. Diese Schicht fuehrt Skripte wie SQL Developer aus (Anweisung fuer
// Anweisung, Fehler stoppen das Skript nicht) und gleicht die wichtigsten
// Unterschiede an, damit Lernende nichts Falsches lernen:
//   - ALTER TABLE ... ADD/DROP CONSTRAINT (SQLite kann das nicht) per Tabellen-Neuaufbau
//   - Fremdschluessel muessen auf existierende Tabellen und PK/UNIQUE zeigen
//   - DROP TABLE ... CASCADE CONSTRAINTS, ORA-02449 ohne CASCADE
//   - GENERATED ... AS IDENTITY
//   - kein ON UPDATE, kein RESTRICT/NO ACTION, kein AUTOINCREMENT (nicht Oracle)
//   - Fehlermeldungen auf Deutsch inkl. dem passenden ORA-Code
// Bekannte Grenzen stehen in README.md.

import { checkOracleStatement, guardTriggers, singleRowSubqueries } from './oracleChecks';
import type { Database, SqlJsStatic } from 'sql.js';
import { checkGroupBy, registerOracleFunctions, rewriteQuery } from './dialect';

export interface StatementResult {
  sql: string;
  ok: boolean;
  /** Kurzmeldung, z.B. "Tabelle erstellt." oder Fehlertext */
  message: string;
  /** ORA-Code, der in Oracle zu erwarten waere */
  ora?: string;
  /** Ergebnismenge (bei SELECT) */
  columns?: string[];
  rows?: unknown[][];
}

const ID = '[\\p{L}\\p{N}_$#]+';
const re = (src: string, flags = 'iu') => new RegExp(src, flags);

export class OracleError extends Error {
  constructor(
    message: string,
    public ora?: string,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* Textwerkzeuge                                                       */
/* ------------------------------------------------------------------ */

/** Entfernt Kommentare, beachtet Zeichenketten. */
export function stripComments(sql: string): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'" || c === '"') {
      const q = c;
      out += c;
      i++;
      while (i < sql.length) {
        out += sql[i];
        if (sql[i] === q) {
          if (sql[i + 1] === q) {
            out += sql[i + 1];
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
    } else if (c === '/' && sql[i + 1] === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      out += ' ';
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Zerlegt ein Skript an ; (ausserhalb von Zeichenketten). */
export function splitStatements(script: string): string[] {
  const clean = stripComments(script).replace(/^\s*\/\s*$/gm, ';');
  const stmts: string[] = [];
  let cur = '';
  let quote = '';
  for (const c of clean) {
    if (quote) {
      cur += c;
      if (c === quote) quote = '';
    } else if (c === "'" || c === '"') {
      quote = c;
      cur += c;
    } else if (c === ';') {
      if (cur.trim()) stmts.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) stmts.push(cur.trim());
  return stmts;
}

/** Zerlegt an Kommas auf oberster Klammerebene. */
export function splitTopLevel(body: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let quote = '';
  let cur = '';
  for (const c of body) {
    if (quote) {
      cur += c;
      if (c === quote) quote = '';
      continue;
    }
    if (c === "'" || c === '"') quote = c;
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      items.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) items.push(cur.trim());
  return items;
}

/* ------------------------------------------------------------------ */
/* Fehlerabbildung                                                     */
/* ------------------------------------------------------------------ */

export function mapError(raw: string, kw?: string): { message: string; ora?: string } {
  let m: RegExpMatchArray | null;
  if ((m = raw.match(/UNIQUE constraint failed: (.+)/)))
    return { message: `Eindeutigkeit verletzt (UNIQUE/PRIMARY KEY): ${m[1]}`, ora: 'ORA-00001' };
  if ((m = raw.match(/NOT NULL constraint failed: (.+)/)))
    return { message: `NULL ist nicht erlaubt (NOT NULL): ${m[1]}`, ora: 'ORA-01400' };
  if (/FOREIGN KEY constraint failed/.test(raw)) {
    if (kw === 'INSERT')
      return {
        message: 'Übergeordneter Schlüssel nicht gefunden: In der Elterntabelle gibt es keinen passenden Datensatz.',
        ora: 'ORA-02291',
      };
    if (kw === 'DELETE')
      return {
        message: 'Kind-Datensatz gefunden: Es gibt noch Datensätze, die auf diesen Datensatz verweisen. Erst diese löschen oder ON DELETE CASCADE verwenden.',
        ora: 'ORA-02292',
      };
    return {
      message:
        'Fremdschlüssel verletzt: Entweder fehlt der Eltern-Datensatz (ORA-02291) oder es existieren noch Kind-Datensätze (ORA-02292).',
      ora: 'ORA-02291 / ORA-02292',
    };
  }
  if ((m = raw.match(/CHECK constraint failed: (.+)/)))
    return { message: `CHECK-Bedingung verletzt: ${m[1]}`, ora: 'ORA-02290' };
  if (/ORA-01722/.test(raw))
    return { message: 'Ungültige Zahl: Der Wert passt nicht zum Datentyp NUMBER (Text in einer Zahlenspalte).', ora: 'ORA-01722' };
  if ((m = raw.match(/ORA-12899:([^:]+):(\d+)/)))
    return { message: `Wert zu groß für die Spalte ${m[1]} (höchstens ${m[2]} Zeichen).`, ora: 'ORA-12899' };
  if ((m = raw.match(/table (.+) already exists/)))
    return { message: `Der Name ${m[1]} wird bereits von einem Objekt verwendet.`, ora: 'ORA-00955' };
  if ((m = raw.match(/no such table: (?:main\.)?(.+)/)))
    return { message: `Tabelle oder View ${m[1]} existiert nicht.`, ora: 'ORA-00942' };
  if ((m = raw.match(/no such column: (.+)/)))
    return { message: `Ungültiger Bezeichner (Spalte ${m[1]} unbekannt).`, ora: 'ORA-00904' };
  if ((m = raw.match(/has no column named (.+)/)))
    return { message: `Ungültiger Bezeichner (Spalte ${m[1]} unbekannt).`, ora: 'ORA-00904' };
  if ((m = raw.match(/table (.+) has (\d+) columns but (\d+) values were supplied/)))
    return Number(m[3]) < Number(m[2])
      ? { message: `Nicht genügend Werte: ${m[1]} hat ${m[2]} Spalten, angegeben sind ${m[3]}. Gib alle Werte an oder nenne die Spalten: INSERT INTO ${m[1]} (spalte1, …) VALUES (…).`, ora: 'ORA-00947' }
      : { message: `Zu viele Werte: ${m[1]} hat ${m[2]} Spalten, angegeben sind ${m[3]}.`, ora: 'ORA-00913' };
  if ((m = raw.match(/(\d+) values for (\d+) columns/)))
    return Number(m[1]) < Number(m[2])
      ? { message: `Nicht genügend Werte: ${m[2]} Spalten, aber nur ${m[1]} Werte.`, ora: 'ORA-00947' }
      : { message: `Zu viele Werte: ${m[2]} Spalten, aber ${m[1]} Werte.`, ora: 'ORA-00913' };
  if ((m = raw.match(/duplicate column name: (.+)/)))
    return { message: `Doppelter Spaltenname: ${m[1]}.`, ora: 'ORA-00957' };
  if ((m = raw.match(/wrong number of arguments to function (\w+)/i)))
    return { message: `Falsche Anzahl von Argumenten für die Funktion ${m[1].toUpperCase()}.`, ora: 'ORA-00909' };
  if ((m = raw.match(/no such function: (\w+)/i)))
    return { message: `Ungültiger Bezeichner: ${m[1].toUpperCase()} ist keine bekannte Funktion.`, ora: 'ORA-00904' };
  if (/ORDER BY term out of range/i.test(raw))
    return { message: 'ORDER BY: Die Spaltennummer liegt außerhalb der SELECT-Liste.', ora: 'ORA-01785' };
  if (/sub-?select returns \d+ columns|only a single result allowed/i.test(raw))
    return { message: 'Die Unterabfrage liefert eine andere Spaltenzahl, als der Vergleich erwartet.', ora: 'ORA-00913' };
  if (/misuse of aggregate/i.test(raw))
    return { message: 'Gruppenfunktion hier nicht erlaubt (z. B. COUNT in WHERE). Nutze HAVING nach GROUP BY.', ora: 'ORA-00934' };
  if (/HAVING clause on a non-aggregate/i.test(raw))
    return { message: 'HAVING braucht GROUP BY oder eine Aggregatfunktion.', ora: 'ORA-00979' };
  if (/unrecognized token: "'/.test(raw) || /unrecognized token: "\\'/.test(raw))
    return { message: 'Zeichenfolge nicht richtig mit Hochkomma abgeschlossen (schließendes \' fehlt).', ora: 'ORA-01756' };
  if ((m = raw.match(/unrecognized token: "(.*)"/)))
    return { message: `Ungültiges Zeichen oder ungültiger Name: ${m[1]}. Namen beginnen mit einem Buchstaben.`, ora: 'ORA-00911' };
  if (/syntax error/.test(raw)) {
    const near = raw.match(/near "([^"]*)"/);
    const first = near && kw && near[1].toUpperCase() === kw.toUpperCase();
    return {
      message: `Syntaxfehler${near ? ` nahe „${near[1]}“` : ''}. Prüfe Klammern, Kommas und Schlüsselwörter${first ? ' (Schreibfehler im Befehl?)' : ''}.`,
      ora: first ? 'ORA-00900' : 'ORA-00933',
    };
  }
  if (/incomplete input/.test(raw))
    return { message: 'Anweisung unvollständig (Klammer oder Wert fehlt).', ora: 'ORA-00907' };
  if (/foreign key mismatch/.test(raw))
    return {
      message: 'Der Fremdschlüssel verweist nicht auf einen PRIMARY KEY oder UNIQUE-Schlüssel.',
      ora: 'ORA-02270',
    };
  return { message: raw };
}

/* ------------------------------------------------------------------ */
/* Schema-Hilfen                                                       */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

function query(db: Database, sql: string, params: (string | number)[] = []): Row[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const out: Row[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as Row);
  stmt.free();
  return out;
}

export function userTables(db: Database): string[] {
  return query(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> 'DUAL' ORDER BY rowid",
  ).map(
    (r) => String(r.name),
  );
}

export function findTable(db: Database, name: string): string | undefined {
  return userTables(db).find((t) => t.toLowerCase() === name.toLowerCase());
}

function tableSql(db: Database, table: string): string {
  const r = query(db, "SELECT sql FROM sqlite_master WHERE type='table' AND lower(name)=lower(?)", [table]);
  return r.length ? String(r[0].sql) : '';
}

function pkColumns(db: Database, table: string): string[] {
  return query(db, `PRAGMA table_info("${table}")`)
    .filter((c) => Number(c.pk) > 0)
    .sort((a, b) => Number(a.pk) - Number(b.pk))
    .map((c) => String(c.name));
}

function uniqueKeys(db: Database, table: string): string[][] {
  const keys: string[][] = [];
  const pk = pkColumns(db, table);
  if (pk.length) keys.push(pk);
  for (const idx of query(db, `PRAGMA index_list("${table}")`)) {
    if (Number(idx.unique) === 1) {
      keys.push(
        query(db, `PRAGMA index_info("${idx.name}")`)
          .sort((a, b) => Number(a.seqno) - Number(b.seqno))
          .map((c) => String(c.name)),
      );
    }
  }
  return keys;
}

const sameCols = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.some((y) => y.toLowerCase() === x.toLowerCase()));

/** Oracle-Regeln fuer Fremdschluessel: Elterntabelle existiert, Ziel ist PK/UNIQUE. */
function validateForeignKeys(db: Database, table: string) {
  const fks = query(db, `PRAGMA foreign_key_list("${table}")`);
  const groups = new Map<number, Row[]>();
  for (const r of fks) groups.set(Number(r.id), [...(groups.get(Number(r.id)) ?? []), r]);
  for (const rows of groups.values()) {
    const parent = String(rows[0].table);
    if (parent.toLowerCase() === table.toLowerCase() && !findTable(db, parent)) continue;
    const real = findTable(db, parent);
    if (!real) throw new OracleError(`Tabelle ${parent} existiert nicht. Erst die referenzierte Tabelle anlegen.`, 'ORA-00942');
    const refCols = rows.map((r) => (r.to ? String(r.to) : '')).filter(Boolean);
    const target = refCols.length ? refCols : pkColumns(db, real);
    if (!uniqueKeys(db, real).some((k) => sameCols(k, target)))
      throw new OracleError(
        `Für die Spalte(n) ${target.join(', ')} in ${real} existiert kein PRIMARY KEY oder UNIQUE-Schlüssel.`,
        'ORA-02270',
      );
  }
}

function dependentsOf(db: Database, parent: string): string[] {
  return userTables(db).filter(
    (t) =>
      t.toLowerCase() !== parent.toLowerCase() &&
      query(db, `PRAGMA foreign_key_list("${t}")`).some((r) => String(r.table).toLowerCase() === parent.toLowerCase()),
  );
}

/* ------------------------------------------------------------------ */
/* Tabellen-Neuaufbau (fuer ALTER ... CONSTRAINT)                      */
/* ------------------------------------------------------------------ */

function splitCreate(createSql: string) {
  const open = createSql.indexOf('(');
  const close = createSql.lastIndexOf(')');
  return { head: createSql.slice(0, open), items: splitTopLevel(createSql.slice(open + 1, close)), tail: createSql.slice(close + 1) };
}

function rebuild(db: Database, table: string, transform: (items: string[]) => string[]) {
  const { head, items, tail } = splitCreate(tableSql(db, table));
  const next = transform(items);
  const tmp = `__neu_${table}`;
  const headTmp = head.replace(re(`(CREATE\\s+TABLE\\s+)("?${ID}"?)`), `$1"${tmp}"`);
  db.exec('PRAGMA foreign_keys=OFF');
  db.exec('BEGIN');
  try {
    db.exec(`${headTmp}(${next.join(', ')})${tail}`);
    db.exec(`INSERT INTO "${tmp}" SELECT * FROM "${table}"`);
    db.exec(`DROP TABLE "${table}"`);
    db.exec(`ALTER TABLE "${tmp}" RENAME TO "${table}"`);
    validateForeignKeys(db, table);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    db.exec('PRAGMA foreign_keys=ON');
  }
  installGuards(db, table);
}

/** Entfernt eine benannte Constraint aus einem Definitionselement. null = Element entfernen. */
function removeNamedConstraint(item: string, name: string): string | null {
  const named = re(`^CONSTRAINT\\s+"?${name}"?\\s+`);
  if (named.test(item)) return null; // Tabellenconstraint
  const inline = re(
    `\\s*CONSTRAINT\\s+"?${name}"?\\s+(PRIMARY\\s+KEY|UNIQUE|NOT\\s+NULL|REFERENCES\\s+${ID}\\s*(\\([^)]*\\))?(\\s+ON\\s+DELETE\\s+(CASCADE|SET\\s+NULL))?|CHECK\\s*\\((?:[^()]|\\([^()]*\\))*\\))`,
  );
  return inline.test(item) ? item.replace(inline, '') : item;
}

function removeFkTo(item: string, parent: string): string | null {
  if (re(`^(CONSTRAINT\\s+${ID}\\s+)?FOREIGN\\s+KEY\\b.*REFERENCES\\s+"?${parent}"?\\b`, 'ius').test(item)) return null;
  return item.replace(
    re(
      `(\\s*CONSTRAINT\\s+${ID})?\\s*REFERENCES\\s+"?${parent}"?\\s*(\\([^)]*\\))?(\\s+ON\\s+DELETE\\s+(CASCADE|SET\\s+NULL))?`,
    ),
    '',
  );
}

/* ------------------------------------------------------------------ */
/* Anweisungen                                                         */
/* ------------------------------------------------------------------ */

function rejectNonOracle(stmt: string) {
  if (/\bAUTOINCREMENT\b/i.test(stmt))
    throw new OracleError('AUTOINCREMENT gibt es in Oracle nicht. Nutze GENERATED ... AS IDENTITY oder eine Sequenz.', 'ORA-00907');
  if (/\bON\s+UPDATE\b/i.test(stmt))
    throw new OracleError('Oracle kennt kein ON UPDATE bei Fremdschlüsseln.', 'ORA-00907');
  if (/\bON\s+DELETE\s+(RESTRICT|NO\s+ACTION|SET\s+DEFAULT)\b/i.test(stmt))
    throw new OracleError(
      'Oracle kennt nur ON DELETE CASCADE und ON DELETE SET NULL. Ohne Angabe gilt das restriktive Verhalten.',
      'ORA-00905',
    );
  if (/\b(PRAGMA|ATTACH|DETACH|VACUUM)\b/i.test(stmt))
    throw new OracleError('Dieser Befehl ist im Trainer nicht erlaubt.', undefined);
  if (/\bCREATE\s+SEQUENCE\b/i.test(stmt) || /\.\s*NEXTVAL\b/i.test(stmt))
    throw new OracleError(
      'Sequenzen werden im Trainer noch nicht unterstützt. Probiere sie in Oracle SQL Developer aus oder nutze GENERATED ... AS IDENTITY.',
    );
}

function rewriteIdentity(stmt: string): string {
  // "id NUMBER GENERATED ALWAYS AS IDENTITY [PRIMARY KEY]" -> SQLite-Rowid-Spalte
  return stmt.replace(
    re(`(${ID})\\s+(?:NUMBER|INTEGER|INT)(?:\\s*\\([^)]*\\))?\\s+GENERATED\\s+(?:ALWAYS|BY\\s+DEFAULT(?:\\s+ON\\s+NULL)?)\\s+AS\\s+IDENTITY(?:\\s*\\([^)]*\\))?(?:\\s+PRIMARY\\s+KEY)?`),
    '$1 INTEGER PRIMARY KEY AUTOINCREMENT',
  );
}

function runDrop(db: Database, stmt: string): string {
  const m = stmt.match(re(`^DROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?"?(${ID})"?(\\s+CASCADE\\s+CONSTRAINTS)?(\\s+PURGE)?$`));
  if (!m) throw new OracleError('Syntaxfehler in DROP TABLE.', 'ORA-00933');
  const table = findTable(db, m[1]);
  if (!table) {
    if (/IF\s+EXISTS/i.test(stmt)) return 'Tabelle existierte nicht (übersprungen).';
    throw new OracleError(`Tabelle ${m[1]} existiert nicht.`, 'ORA-00942');
  }
  const deps = dependentsOf(db, table);
  if (deps.length && !m[2])
    throw new OracleError(
      `Auf die Tabelle ${table} verweisen noch Fremdschlüssel (aus ${deps.join(', ')}). Erst die abhängigen Tabellen löschen oder CASCADE CONSTRAINTS verwenden.`,
      'ORA-02449',
    );
  for (const child of deps) {
    rebuild(db, child, (items) => items.map((i) => removeFkTo(i, table)).filter((i): i is string => i !== null && i.trim() !== ''));
  }
  db.exec('PRAGMA foreign_keys=OFF');
  try {
    db.exec(`DROP TABLE "${table}"`);
  } finally {
    db.exec('PRAGMA foreign_keys=ON');
  }
  return `Tabelle ${table} gelöscht.`;
}

function runAlter(db: Database, stmt: string): string {
  const m = stmt.match(re(`^ALTER\\s+TABLE\\s+"?(${ID})"?\\s+(.*)$`, 'ius'));
  if (!m) throw new OracleError('Syntaxfehler in ALTER TABLE.', 'ORA-00933');
  const table = findTable(db, m[1]);
  if (!table) throw new OracleError(`Tabelle ${m[1]} existiert nicht.`, 'ORA-00942');
  const rest = m[2].trim();

  let c: RegExpMatchArray | null;
  if ((c = rest.match(re('^ADD\\s+(CONSTRAINT\\s+.*|PRIMARY\\s+KEY.*|UNIQUE.*|FOREIGN\\s+KEY.*|CHECK.*)$', 'ius')))) {
    const clause = c[1].trim();
    if (/^(CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY/i.test(clause) && pkColumns(db, table).length)
      throw new OracleError('Eine Tabelle kann nur einen PRIMARY KEY haben.', 'ORA-02260');
    const name = clause.match(re(`^CONSTRAINT\\s+"?(${ID})"?`))?.[1];
    if (name && new RegExp(`CONSTRAINT\\s+"?${name}"?\\b`, 'i').test(userTables(db).map((t) => tableSql(db, t)).join('\n')))
      throw new OracleError(`Der Constraint-Name ${name} wird bereits verwendet.`, 'ORA-02264');
    rebuild(db, table, (items) => [...items, clause]);
    return `Tabelle ${table} geändert (Constraint hinzugefügt).`;
  }
  if ((c = rest.match(re(`^DROP\\s+CONSTRAINT\\s+"?(${ID})"?$`)))) {
    const name = c[1];
    if (!re(`CONSTRAINT\\s+"?${name}"?\\b`).test(tableSql(db, table)))
      throw new OracleError(`Constraint ${name} existiert nicht.`, 'ORA-02443');
    rebuild(db, table, (items) =>
      items.map((i) => removeNamedConstraint(i, name)).filter((i): i is string => i !== null && i.trim() !== ''),
    );
    return `Tabelle ${table} geändert (Constraint ${name} entfernt).`;
  }
  if ((c = rest.match(re('^ADD\\s+(?:COLUMN\\s+)?\\(?(.*?)\\)?$', 'ius'))) && !/^MODIFY/i.test(rest)) {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN ${c[1]}`);
    installGuards(db, table);
    return `Tabelle ${table} geändert (Spalte hinzugefügt).`;
  }
  if (/^DROP\s+COLUMN\s+/i.test(rest) || /^RENAME\s+/i.test(rest)) {
    db.exec(`ALTER TABLE "${table}" ${rest}`);
    return `Tabelle ${table} geändert.`;
  }
  if ((c = rest.match(re(`^MODIFY\\s+\\(?\\s*(${ID})\\s+(.*?)\\)?$`, 'ius')))) {
    const col = c[1];
    const mod = c[2].trim();
    const typeM = mod.match(re('^((?:NUMBER|INTEGER|INT|FLOAT|DECIMAL|NUMERIC|REAL|DATE|TIMESTAMP|BLOB|CLOB|N?VARCHAR2?|N?CHAR)(?:\\s*\\([^)]*\\))?)\\s*(.*)$'));
    let found = false;
    rebuild(db, table, (items) =>
      items.map((item) => {
        const head = item.trim().match(re(`^"?(${ID})"?\\s+(\\S+?(?:\\s*\\([^)]*\\))?)(?=\\s|$)\\s*(.*)$`, 'ius'));
        if (!head || head[1].toLowerCase() !== col.toLowerCase()) return item;
        found = true;
        const oldRest = head[3];
        const newType = typeM ? typeM[1] : head[2];
        const extra = typeM ? typeM[2] : mod;
        const keepNotNull = /NOT\s+NULL/i.test(oldRest) && !/^NULL\b/i.test(extra) && !/\bNULL\b/i.test(extra.replace(/NOT\s+NULL/i, ''));
        const rest2 = oldRest.replace(/NOT\s+NULL/i, '').trim();
        const wantsNotNull = /NOT\s+NULL/i.test(extra) || keepNotNull;
        const withoutNn = extra.replace(/NOT\s+NULL/i, '').replace(/^NULL$/i, '').trim();
        return [`"${head[1]}"`, newType, withoutNn, rest2, wantsNotNull ? 'NOT NULL' : ''].filter(Boolean).join(' ');
      }),
    );
    if (!found) throw new OracleError(`Ungültiger Bezeichner: Spalte ${col} existiert nicht.`, 'ORA-00904');
    return `Tabelle ${table} geändert (Spalte ${col} angepasst).`;
  }
  throw new OracleError('Diese ALTER-TABLE-Variante wird im Trainer noch nicht unterstützt.');
}

function runCreateTable(db: Database, stmt: string): string {
  const name = stmt.match(re(`^CREATE\\s+TABLE\\s+"?(${ID})"?`))?.[1];
  if (!name) throw new OracleError('Syntaxfehler in CREATE TABLE.', 'ORA-00903');
  db.exec(rewriteIdentity(stmt));
  const created = findTable(db, name)!;
  try {
    validateForeignKeys(db, created);
  } catch (e) {
    db.exec('PRAGMA foreign_keys=OFF');
    db.exec(`DROP TABLE "${created}"`);
    db.exec('PRAGMA foreign_keys=ON');
    throw e;
  }
  installGuards(db, created);
  return `Tabelle ${created} erstellt.`;
}

/** Datentyp-Waechter (Zahl, Textlaenge) fuer eine Tabelle neu anlegen. */
function installGuards(db: Database, table: string) {
  const cols = query(db, `PRAGMA table_info("${table}")`).map((c) => ({ name: String(c.name), type: String(c.type) }));
  try {
    db.exec(`DROP TRIGGER IF EXISTS "__guard_${table}_i"; DROP TRIGGER IF EXISTS "__guard_${table}_u";`);
    const sql = guardTriggers(table, cols);
    if (sql) db.exec(sql);
  } catch {
    /* Waechter sind eine Zusatzpruefung: nie die Anweisung selbst scheitern lassen */
  }
}

/** Unabhaengige Unterabfragen nach einem Vergleichsoperator duerfen hoechstens eine Zeile liefern. */
function checkSingleRow(db: Database, stmt: string) {
  for (const inner of singleRowSubqueries(stmt)) {
    let n = 0;
    try {
      n = Number(query(db, `SELECT COUNT(*) AS n FROM (${rewriteQuery(inner)})`)[0]?.n ?? 0);
    } catch {
      continue; // abhaengige Unterabfrage oder Fehler: der eigentliche Lauf meldet es
    }
    if (n > 1)
      throw new OracleError(
        `Einzeilige Unterabfrage liefert mehr als eine Zeile (${n} Zeilen). Bei = < > muss die Unterabfrage genau einen Wert liefern. Nutze IN, ANY oder ALL.`,
        'ORA-01427',
      );
  }
}

export function executeStatement(db: Database, raw: string): StatementResult {
  const stmt = raw.trim();
  let kw: string | undefined;
  try {
    rejectNonOracle(stmt);
    kw = stmt.match(/^\s*(\w+)/)?.[1]?.toUpperCase();
    checkOracleStatement(stmt, kw);
    let message: string;
    if (kw === 'CREATE' && /^CREATE\s+TABLE/i.test(stmt)) message = runCreateTable(db, stmt);
    else if (kw === 'DROP' && /^DROP\s+TABLE/i.test(stmt)) message = runDrop(db, stmt);
    else if (kw === 'ALTER') message = runAlter(db, stmt);
    else if (kw === 'TRUNCATE') {
      const t = stmt.match(re(`^TRUNCATE\\s+TABLE\\s+"?(${ID})"?$`));
      if (!t) throw new OracleError('Syntaxfehler in TRUNCATE TABLE.', 'ORA-00933');
      const name = findTable(db, t[1]);
      if (!name) throw new OracleError(`Tabelle ${t[1]} existiert nicht.`, 'ORA-00942');
      if (dependentsOf(db, name).length)
        throw new OracleError(`Auf ${name} verweisen Fremdschlüssel. TRUNCATE ist dann nicht erlaubt.`, 'ORA-02266');
      db.exec(`DELETE FROM "${name}"`);
      message = `Tabelle ${name} geleert.`;
    }
    else {
      checkSingleRow(db, stmt);
      if (kw === 'SELECT' || kw === 'WITH') {
        checkGroupBy(stmt);
        // prepare statt exec, damit Spaltennamen auch bei 0 Zeilen bekannt sind
        const q = db.prepare(rewriteQuery(stmt));
        const columns = q.getColumnNames();
        const rows: unknown[][] = [];
        try {
          while (q.step()) rows.push(q.get());
        } finally {
          q.free();
        }
        return { sql: stmt, ok: true, message: `${rows.length} Zeile(n) gelesen.`, columns, rows };
      }
      const res = db.exec(rewriteQuery(stmt));
      if (res.length) return { sql: stmt, ok: true, message: `${res[0].values.length} Zeile(n) gelesen.`, columns: res[0].columns, rows: res[0].values };
      const changed = db.getRowsModified();
      message =
        kw === 'INSERT' || kw === 'UPDATE' || kw === 'DELETE'
          ? `${changed} Zeile(n) betroffen.`
          : kw === 'CREATE'
            ? 'Objekt erstellt.'
            : 'Ausgeführt.';
    }
    return { sql: stmt, ok: true, message };
  } catch (e) {
    if (e instanceof OracleError) return { sql: stmt, ok: false, message: e.message, ora: e.ora };
    const mapped = mapError(e instanceof Error ? e.message : String(e), kw);
    return { sql: stmt, ok: false, ...mapped };
  }
}

/** Fuehrt ein Skript wie SQL Developer aus: Fehler stoppen nicht. */
export function runScript(db: Database, script: string): StatementResult[] {
  return splitStatements(script).map((s) => executeStatement(db, s));
}

/** Datenbank aus einem Abbild (db.export()) wiederherstellen, z. B. fuer ROLLBACK */
export function restoreDatabase(SQL: SqlJsStatic, data: Uint8Array): Database {
  const db = new SQL.Database(data);
  db.exec('PRAGMA foreign_keys=ON');
  registerOracleFunctions(db);
  return db;
}

export function createDatabase(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  db.exec('PRAGMA foreign_keys=ON');
  registerOracleFunctions(db);
  return db;
}
