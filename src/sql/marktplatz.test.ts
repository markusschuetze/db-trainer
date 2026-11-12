import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, it } from 'vitest';
import { scenarioDb } from './sqlGrading';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

describe('Szenario Marktplatz', () => {
  for (const sc of ['marktplatz', 'marktplatz-leer'] as const)
    for (const d of ['A', 'B'] as const)
      it(`${sc}/${d} lässt sich laden`, () => {
        const db = scenarioDb(SQL, sc, d);
        db.close();
      });
});
