import type { SqlJsStatic } from 'sql.js';
import type { Worksheet } from '../content/worksheets';
import { createDatabase, runScript } from './oracle';

/** Datei (.json oder .sql) in Uebungsblaetter umwandeln und pruefen */
export function parseWorksheetFile(name: string, text: string, SQL: SqlJsStatic): { sheets: Worksheet[]; problems: string[] } {
  const problems: string[] = [];
  let raw: Omit<Worksheet, 'origin'>[] = [];
  if (/\.sql$/i.test(name)) {
    const id = `datei-${name.replace(/\.sql$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'schema'}`;
    raw = [{ id, title: name.replace(/\.sql$/i, ''), description: 'Datenbank aus SQL-Datei. Freies Arbeiten ohne vorgegebene Aufgaben.', schema: text, tasks: [] }];
  } else {
    try {
      const j = JSON.parse(text);
      raw = Array.isArray(j) ? j : Array.isArray(j.worksheets) ? j.worksheets : [j];
    } catch {
      return { sheets: [], problems: ['Die Datei ist kein gültiges JSON.'] };
    }
  }
  const sheets: Worksheet[] = [];
  for (const w of raw) {
    if (!w || typeof w.id !== 'string' || typeof w.title !== 'string' || typeof w.schema !== 'string' || !Array.isArray(w.tasks)) {
      problems.push('Ein Blatt braucht id, title, schema (SQL-Skript) und tasks.');
      continue;
    }
    const db = createDatabase(SQL);
    const err = runScript(db, w.schema).find((r) => !r.ok);
    db.close();
    if (err) {
      problems.push(`„${w.title}“: Schema fehlerhaft: ${err.message}${err.ora ? ` (${err.ora})` : ''}`);
      continue;
    }
    sheets.push({ ...w, tasks: w.tasks.filter((t) => t && typeof t.id === 'string' && typeof t.text === 'string'), origin: 'datei' });
  }
  return { sheets, problems };
}
