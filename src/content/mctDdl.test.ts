import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { Session } from '../sql/session';
import { ddlReadings } from './mctDdl';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('DDL lesen: jede Aussage stimmt mit der Datenbank überein', () => {
  for (const r of ddlReadings)
    describe(r.id, () => {
      it('Skript läuft fehlerfrei', () => {
        const s = new Session(SQL, '');
        const res = s.run(r.code);
        s.close();
        expect(res.filter((x) => !x.ok).map((x) => x.message)).toEqual([]);
      });
      for (const st of r.statements)
        it(st.text.slice(0, 60), () => {
          const s = new Session(SQL, '');
          s.run(r.code);
          const res = s.run(st.probe);
          s.close();
          // Alles vor dem letzten Befehl ist Vorbereitung und muss klappen
          expect(res.slice(0, -1).filter((x) => !x.ok).map((x) => x.message)).toEqual([]);
          const outcome = res[res.length - 1].ok ? 'ok' : 'error';
          expect(outcome === st.claim, `Ergebnis ${outcome}, behauptet ${st.claim}`).toBe(st.truth);
        });
    });
  it('je Skript vier Aussagen, gemischt richtig und falsch', () => {
    for (const r of ddlReadings) {
      expect(r.statements).toHaveLength(4);
      expect(r.statements.some((s) => s.truth)).toBe(true);
      expect(r.statements.some((s) => !s.truth)).toBe(true);
    }
  });
});
