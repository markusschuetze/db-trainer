import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { dmlErrorTasks } from '../content/dmlErrors';
import { predictTasks } from '../content/dmlPredict';
import { provokeTasks } from '../content/dmlProvoke';
import { scenarioById } from '../content/scenarios';
import { Session } from './session';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const session = (id: string) => {
  const sc = scenarioById(id);
  return new Session(SQL, sc.schema + sc.dataA);
};

describe('DML-Fehler erkennen: Auflösung stimmt mit der Datenbank überein', () => {
  for (const t of dmlErrorTasks)
    it(t.id, () => {
      const s = session('marktplatz-leer');
      const res = s.run(t.statements.join('\n'));
      s.close();
      expect(res.length).toBe(t.statements.length);
      const failed = res.map((r, i) => (r.ok ? 0 : i + 1)).filter(Boolean);
      expect(failed, 'Zeilen mit Fehler').toEqual(t.errors.map((e) => e.line));
      for (const e of t.errors) {
        const r = res[e.line - 1];
        expect(e.causes, `Zeile ${e.line}: ${r.message}`).toContain(r.ora);
      }
    });
});

describe('Constraints prüfen: Musterlösung löst das Erwartete aus', () => {
  for (const t of provokeTasks)
    it(t.id, () => {
      const s = session('marktplatz');
      const res = s.run(t.solution);
      s.close();
      const bad = res.filter((r) => !r.ok);
      if ('error' in t.expect) {
        expect(bad.length, res.map((r) => r.message).join(' | ')).toBe(1);
        expect(bad[0].ora).toBe(t.expect.error);
        if (t.expect.constraint) expect(bad[0].message.toUpperCase()).toContain(t.expect.constraint);
      } else expect(bad).toEqual([]);
    });
  it('mindestens 8 Aufgaben, Ids eindeutig', () => {
    expect(provokeTasks.length).toBeGreaterThanOrEqual(8);
    expect(new Set(provokeTasks.map((t) => t.id)).size).toBe(provokeTasks.length);
  });
});

describe('Vorhersage-Aufgaben: richtige Antwort stimmt mit der Datenbank überein', () => {
  for (const t of predictTasks)
    it(t.id, () => {
      const s = session('marktplatz');
      s.run(t.script.join('\n'));
      const q = s.run(t.query)[0];
      s.close();
      expect(q.ok, q.message).toBe(true);
      const v = q.rows?.[0]?.[0];
      expect(String(v ?? 'NULL')).toBe(t.answer);
      expect(t.options).toContain(t.answer);
      expect(new Set(t.options).size).toBe(t.options.length);
    });
  it('mindestens 8 Aufgaben', () => {
    expect(predictTasks.length).toBeGreaterThanOrEqual(8);
  });
});
