import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { applyPack, packReport, type Pack } from './pack';
import { CHAPTER_NAME, mcQuestions } from './mcQuestions';
import { scenarioById } from './scenarios';
import { sqlExercises } from './sqlExercises';
import { textTasks } from './textTasks';
import { topicById } from './topics';
import { allWorksheets } from './worksheets';
import { CHAPTERS, catalog, questionIds } from '../progressCatalog';

let SQL: SqlJsStatic;
beforeAll(async () => {
  const dir = dirname(createRequire(import.meta.url).resolve('sql.js'));
  SQL = await initSqlJs({ locateFile: (f) => join(dir, f) });
});

const example = () => JSON.parse(readFileSync(new URL('../../public/aufgaben.beispiel.json', import.meta.url), 'utf8')) as Pack;

describe('Aufgabenpaket', () => {
  it('Beispielpaket wird vollstaendig und ohne Probleme uebernommen', () => {
    const r = applyPack(example(), SQL);
    expect(r.problems).toEqual([]);
    expect(r.counts).toEqual({ chapters: 1, topics: 2, questions: 2, sql: 1, scenarios: 1, worksheets: 1, textTasks: 1 });
    // neues Kapitel, Thema, Fragen und Katalog
    expect(CHAPTER_NAME.tx).toBe('Transaktionen');
    expect(CHAPTERS).toContain('tx');
    expect(topicById('tx-acid')?.chapter).toBe('tx');
    expect(mcQuestions.find((q) => q.id === 'tx-isolation')?.chapter).toBe('tx');
    expect(questionIds.tx).toEqual(['mc:tx-isolation', 'mc:tx-rollback']);
    expect(catalog.some((c) => c.id === 'tt:kino-text')).toBe(true);
    // neue Fall-Datenbank mit abgeleiteten Tabellen
    expect(scenarioById('kino').tables).toEqual(['Film', 'Saal', 'Vorstellung']);
    expect(sqlExercises.some((e) => e.id === 'kino-lange-filme')).toBe(true);
    expect(allWorksheets().some((w) => w.id === 'blatt-kino')).toBe(true);
    expect(allWorksheets().some((w) => w.id === 'db-kino')).toBe(true);
    expect(textTasks.some((t) => t.id === 'kino-text')).toBe(true);
  });

  it('fehlerhafte Eintraege werden uebersprungen und gemeldet, gueltige trotzdem uebernommen', () => {
    const bad: Pack = {
      questions: [
        { id: 'ok-frage', topicId: 'sql-select', chapter: 'x', question: 'Frage?', options: ['a', 'b'], correct: [0], explanation: 'Weil.' },
        { id: 'tx-isolation', topicId: 'tx-acid', chapter: 'x', question: 'doppelt', options: ['a', 'b'], correct: [0], explanation: 'x' },
        { id: 'ohne-thema', topicId: 'gibt-es-nicht', chapter: 'x', question: 'F', options: ['a', 'b'], correct: [0], explanation: 'x' },
        { id: 'falsch-index', topicId: 'sql-select', chapter: 'x', question: 'F', options: ['a', 'b'], correct: [5], explanation: 'x' },
        { id: 'Grossbuchstaben!', topicId: 'sql-select', chapter: 'x', question: 'F', options: ['a', 'b'], correct: [0], explanation: 'x' },
      ],
      sql: [
        { id: 'kaputte-loesung', topicId: 'sql-select', kind: 'dql', level: 1, title: 'T', task: 'x', hints: [], solution: 'SELECT * FROM gibtsnicht;', topic: 'x', source: 'x' },
        { id: 'nie-leer', topicId: 'sql-dml', kind: 'dml', level: 1, title: 'T', task: 'x', hints: [], solution: 'SELECT 1 FROM DUAL;', topic: 'x', source: 'x' },
        { id: 'falsche-db', topicId: 'sql-select', kind: 'dql', scenario: 'nix', level: 1, title: 'T', task: 'x', hints: [], solution: 'SELECT 1 FROM DUAL', topic: 'x', source: 'x' },
      ],
      scenarios: [{ id: 'defekt', name: 'Defekt', schema: 'CREATE TABLE a (x NUMBER PRIMARY KEY, y NUMBER REFERENCES nicht_da (z));', dataA: "INSERT INTO a VALUES (1, 1);" }],
      textTasks: [{ id: 'tt-kaputt', topicId: 'sql-select', title: 'T', level: 1, text: 'x', entities: [{ name: 'A', key: 'k', attrs: [] }], distractors: [], wrongRelationships: [], relationships: [{ e1: 'A', e2: 'B', verb: 'v', c12: '0N', c21: '0N', why: 'x' }], source: 'x' }],
    };
    const r = applyPack(bad, SQL);
    expect(r.counts.questions).toBe(1);
    expect(r.counts.sql).toBe(0);
    expect(r.counts.scenarios).toBe(0);
    expect(r.counts.textTasks).toBe(0);
    const msg = (id: string) => r.problems.find((p) => p.id === id)?.message ?? '';
    expect(msg('tx-isolation')).toMatch(/vergeben/);
    expect(msg('ohne-thema')).toMatch(/existiert nicht/);
    expect(msg('falsch-index')).toMatch(/Richtige Antworten/);
    expect(msg('kaputte-loesung')).toMatch(/Musterlösung läuft nicht/);
    expect(msg('nie-leer')).toMatch(/ändert keine Daten/);
    expect(msg('falsche-db')).toMatch(/Datenbank/);
    expect(msg('defekt')).toMatch(/fehlerhaft/);
    expect(msg('tt-kaputt')).toMatch(/Beziehungen/);
    expect(packReport.loaded).toBe(true);
  });

  it('Kapitel mit bereits vergebener ID wird abgelehnt', () => {
    const r = applyPack({ chapters: [{ id: '05', name: 'Doppelt' }, { id: 'neu', name: 'Neu' }] }, SQL);
    expect(r.counts.chapters).toBe(1);
    expect(CHAPTER_NAME['05']).toBe('Normalisierung');
  });
});
