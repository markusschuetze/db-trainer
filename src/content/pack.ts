// Aufgabenpaket zur Laufzeit: Datei aufgaben.json neben index.html.
//
// Lehrende koennen damit ohne Programmierung und ohne neuen Build Wissensfragen, SQL-Aufgaben,
// Themen, Kapitel, Fall-Datenbanken, Uebungsblaetter und Textaufgaben ergaenzen. Jeder Eintrag
// wird beim Laden geprueft; fehlerhafte werden uebersprungen und im Dozentenmodus gemeldet.

import type { Database, SqlJsStatic } from 'sql.js';
import { describeSchema } from '../sql/ddlGrading';
import { createDatabase, runScript, userTables } from '../sql/oracle';
import { runSqlExercise } from '../sql/sqlGrading';
import { CARDS, phrases, relPhrases, type Phrase } from './erPhrases';
import { ddlExercises } from './ddlExercises';
import type { DdlExercise } from './ddlTypes';
import { nfExercises } from './exercises';
import type { NfExercise } from './types';
import { exerciseProblems } from '../logic/nfGrading';
import { runExercise } from '../sql/ddlGrading';
import { BUILTIN_CHAPTERS, CHAPTER_NAME, mcQuestions, type McQuestion } from './mcQuestions';
import { scenarios, type Scenario } from './scenarios';
import { dmlExercises, dqlExercises, sqlExercises } from './sqlExercises';
import type { SqlExercise } from './sqlTypes';
import { textTasks, type TextTask } from './textTasks';
import { topicById, topics, type Topic } from './topics';
import { packWorksheets, type Worksheet } from './worksheets';
import { CHAPTERS, rebuildCatalog } from '../progressCatalog';

export interface Pack {
  version?: number;
  chapters?: { id: string; name: string }[];
  topics?: Topic[];
  questions?: McQuestion[];
  sql?: SqlExercise[];
  scenarios?: (Partial<Scenario> & { id: string; name: string; schema: string; dataA: string })[];
  worksheets?: Omit<Worksheet, 'origin'>[];
  textTasks?: TextTask[];
  ddl?: DdlExercise[];
  nf?: NfExercise[];
  phrases?: Phrase[];
}

export interface Problem {
  kind: string;
  id: string;
  message: string;
}

export interface PackReport {
  counts: Record<string, number>;
  problems: Problem[];
  loaded: boolean;
}

export const packReport: PackReport = { counts: {}, problems: [], loaded: false };

const ID = /^[a-z0-9][a-z0-9-]{0,60}$/;
const str = (v: unknown, max = 4000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function tempDb(SQL: SqlJsStatic, script: string): { db: Database; errors: string[] } {
  const db = createDatabase(SQL);
  const errors = runScript(db, script)
    .filter((r) => !r.ok)
    .map((r) => `${r.message}${r.ora ? ` (${r.ora})` : ''} bei: ${r.sql.split('\n')[0].slice(0, 60)}`);
  return { db, errors };
}

const relationText = (db: Database) =>
  describeSchema(db).map((t) => `${t.name} (${t.columns.map((c) => c.name + (c.pk ? ' [PK]' : '')).join(', ')})`);

/**
 * Prueft ein Paket und uebernimmt alle gueltigen Eintraege in die Inhalte des Trainers.
 * Gibt den Bericht zurueck. SQL wird nur gebraucht, wenn das Paket SQL-Inhalte enthaelt.
 */
export function applyPack(pack: Pack, SQL: SqlJsStatic | null): PackReport {
  const problems: Problem[] = [];
  const counts: Record<string, number> = { chapters: 0, topics: 0, questions: 0, sql: 0, scenarios: 0, worksheets: 0, textTasks: 0, ddl: 0, nf: 0, phrases: 0 };
  const bad = (kind: string, id: string, message: string) => problems.push({ kind, id: id || '(ohne ID)', message });

  // 1. Kapitel
  for (const c of pack.chapters ?? []) {
    if (!c || !ID.test(String(c.id)) || !str(c.name, 60)) bad('Kapitel', c?.id, 'ID (a-z, 0-9, -) oder Name fehlt.');
    else if (BUILTIN_CHAPTERS.includes(c.id) || CHAPTER_NAME[c.id]) bad('Kapitel', c.id, 'ID ist bereits vergeben.');
    else {
      CHAPTER_NAME[c.id] = c.name;
      CHAPTERS.push(c.id);
      counts.chapters++;
    }
  }

  // 2. Themen
  for (const t of pack.topics ?? []) {
    if (!t || !ID.test(String(t.id)) || !str(t.title, 120)) bad('Thema', t?.id, 'ID oder Titel fehlt.');
    else if (topicById(t.id)) bad('Thema', t.id, 'ID ist bereits vergeben.');
    else if (!CHAPTER_NAME[t.chapter]) bad('Thema', t.id, `Kapitel „${t.chapter}“ existiert nicht.`);
    else {
      topics.push({ id: t.id, chapter: t.chapter, title: t.title, slides: typeof t.slides === 'string' ? t.slides : '' });
      counts.topics++;
    }
  }

  // 3. Wissensfragen
  for (const q of pack.questions ?? []) {
    const id = q?.id;
    if (!q || !ID.test(String(id))) bad('Frage', id, 'ID fehlt oder ist ungültig.');
    else if (mcQuestions.some((m) => m.id === id)) bad('Frage', id, 'ID ist bereits vergeben.');
    else if (!topicById(q.topicId)) bad('Frage', id, `Thema „${q.topicId}“ existiert nicht.`);
    else if (!str(q.question, 600) || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8 || !q.options.every((o) => str(o, 400)))
      bad('Frage', id, 'Frage oder 2 bis 8 Antworten fehlen.');
    else if (!Array.isArray(q.correct) || !q.correct.length || !q.correct.every((c) => Number.isInteger(c) && c >= 0 && c < q.options.length))
      bad('Frage', id, 'Richtige Antworten fehlen oder verweisen ins Leere.');
    else if (!str(q.explanation, 800)) bad('Frage', id, 'Erklärung fehlt.');
    else {
      mcQuestions.push({ ...q, chapter: topicById(q.topicId)!.chapter, multi: q.correct.length > 1 });
      counts.questions++;
    }
  }

  // 4. Fall-Datenbanken
  for (const s of pack.scenarios ?? []) {
    if (!s || !ID.test(String(s.id)) || !str(s.name, 60) || !str(s.schema, 200000) || !str(s.dataA, 400000)) bad('Datenbank', s?.id, 'ID, Name, Schema oder Daten fehlen.');
    else if (scenarios.some((x) => x.id === s.id)) bad('Datenbank', s.id, 'ID ist bereits vergeben.');
    else if (!SQL) bad('Datenbank', s.id, 'SQL-Engine nicht verfügbar.');
    else {
      const a = tempDb(SQL, s.schema + s.dataA);
      const tables = userTables(a.db);
      const rel = relationText(a.db);
      a.db.close();
      if (a.errors.length) bad('Datenbank', s.id, `Schema/Daten fehlerhaft: ${a.errors[0]}`);
      else if (!tables.length) bad('Datenbank', s.id, 'Das Schema legt keine Tabellen an.');
      else {
        let dataB = s.dataB ?? s.dataA;
        if (s.dataB) {
          const b = tempDb(SQL, s.schema + s.dataB);
          b.db.close();
          if (b.errors.length) {
            bad('Datenbank', s.id, `Verdeckter Datenbestand fehlerhaft, es wird der sichtbare verwendet: ${b.errors[0]}`);
            dataB = s.dataA;
          }
        } else bad('Datenbank', s.id, 'Hinweis: Ohne dataB gibt es keinen verdeckten Datenbestand. Fest eingetragene Werte fallen dann nicht auf.');
        scenarios.push({
          id: s.id,
          name: s.name,
          description: s.description ?? '',
          origin: s.origin ?? 'Aufgabenpaket',
          schema: s.schema,
          dataA: s.dataA,
          dataB,
          tables: s.tables?.length ? s.tables : tables,
          relations: s.relations?.length ? s.relations : rel,
        });
        counts.scenarios++;
      }
    }
  }

  // 5. SQL-Aufgaben (Musterloesung wird ausgefuehrt)
  for (const e of pack.sql ?? []) {
    const id = e?.id;
    if (!e || !ID.test(String(id))) bad('SQL-Aufgabe', id, 'ID fehlt oder ist ungültig.');
    else if (sqlExercises.some((x) => x.id === id)) bad('SQL-Aufgabe', id, 'ID ist bereits vergeben.');
    else if (e.kind !== 'dql' && e.kind !== 'dml') bad('SQL-Aufgabe', id, 'kind muss "dql" oder "dml" sein.');
    else if (!topicById(e.topicId)) bad('SQL-Aufgabe', id, `Thema „${e.topicId}“ existiert nicht.`);
    else if (e.scenario && !scenarios.some((s) => s.id === e.scenario)) bad('SQL-Aufgabe', id, `Datenbank „${e.scenario}“ existiert nicht.`);
    else if (![1, 2, 3].includes(e.level) || !str(e.title, 120) || !str(e.task, 2000) || !str(e.solution, 4000)) bad('SQL-Aufgabe', id, 'Titel, Aufgabentext, Musterlösung oder level (1–3) fehlt.');
    else if (!SQL) bad('SQL-Aufgabe', id, 'SQL-Engine nicht verfügbar.');
    else {
      const ex: SqlExercise = { ...e, hints: Array.isArray(e.hints) ? e.hints : [], topic: e.topic ?? topicById(e.topicId)!.title, source: e.source ?? 'Aufgabenpaket' };
      const run = runSqlExercise(SQL, ex, ex.solution);
      if (run.results.some((r) => !r.ok)) bad('SQL-Aufgabe', id, `Musterlösung läuft nicht: ${run.results.find((r) => !r.ok)!.message}`);
      else if (!run.passed) bad('SQL-Aufgabe', id, `Musterlösung besteht die eigene Prüfung nicht: ${run.checks.find((c) => !c.ok)?.hint ?? ''}`);
      else if (ex.kind === 'dml' && !run.changed?.length) bad('SQL-Aufgabe', id, 'Die Musterlösung ändert keine Daten.');
      else if (runSqlExercise(SQL, ex, '').passed) bad('SQL-Aufgabe', id, 'Eine leere Abgabe würde bestehen.');
      else {
        sqlExercises.push(ex);
        (ex.kind === 'dql' ? dqlExercises : dmlExercises).push(ex);
        counts.sql++;
      }
    }
  }

  // 6. Uebungsblaetter
  for (const w of pack.worksheets ?? []) {
    const id = w?.id;
    if (!w || !ID.test(String(id)) || !str(w.title, 120)) bad('Übungsblatt', id, 'ID oder Titel fehlt.');
    else if (packWorksheets.some((x) => x.id === id)) bad('Übungsblatt', id, 'ID ist bereits vergeben.');
    else if (!Array.isArray(w.tasks) || !w.tasks.length || !w.tasks.every((t) => t && ID.test(String(t.id)) && str(t.text, 4000))) bad('Übungsblatt', id, 'Aufgaben fehlen (je id und text).');
    else if (typeof w.schema !== 'string') bad('Übungsblatt', id, 'schema muss ein SQL-Skript sein (darf leer sein).');
    else if (!SQL && w.schema.trim()) bad('Übungsblatt', id, 'SQL-Engine nicht verfügbar.');
    else {
      const t = w.schema.trim() && SQL ? tempDb(SQL, w.schema) : null;
      t?.db.close();
      if (t?.errors.length) bad('Übungsblatt', id, `Schema fehlerhaft: ${t.errors[0]}`);
      else {
        packWorksheets.push({ ...w, origin: 'paket' });
        counts.worksheets++;
      }
    }
  }

  // 7. Textaufgaben
  for (const t of pack.textTasks ?? []) {
    const id = t?.id;
    const names = new Set((t?.entities ?? []).map((e) => e.name));
    if (!t || !ID.test(String(id)) || !str(t.title, 120) || !str(t.text, 4000)) bad('Textaufgabe', id, 'ID, Titel oder Text fehlt.');
    else if (textTasks.some((x) => x.id === id)) bad('Textaufgabe', id, 'ID ist bereits vergeben.');
    else if (!topicById(t.topicId)) bad('Textaufgabe', id, `Thema „${t.topicId}“ existiert nicht.`);
    else if (!t.entities?.length || !t.entities.every((e) => str(e.name, 60) && Array.isArray(e.attrs))) bad('Textaufgabe', id, 'Entitäten fehlen (je name, key, attrs).');
    else if (!t.relationships?.length || !t.relationships.every((r) => names.has(r.e1) && names.has(r.e2) && str(r.verb, 60) && CARDS.includes(r.c12) && CARDS.includes(r.c21) && str(r.why, 800)))
      bad('Textaufgabe', id, 'Beziehungen unvollständig: e1/e2 müssen Entitäten sein, c12/c21 aus 11, 01, 1N, 0N, dazu why.');
    else {
      textTasks.push({ ...t, level: ([1, 2, 3].includes(t.level) ? t.level : 2) as 1 | 2 | 3, distractors: t.distractors ?? [], wrongRelationships: t.wrongRelationships ?? [], source: t.source ?? 'Aufgabenpaket' });
      counts.textTasks++;
    }
  }

  // 8. DDL-Aufgaben (Pruefungen werden mit der Musterloesung getestet)
  for (const e of pack.ddl ?? []) {
    const id = e?.id;
    if (!e || !ID.test(String(id))) bad('DDL-Aufgabe', id, 'ID fehlt oder ist ungültig.');
    else if (ddlExercises.some((x) => x.id === id)) bad('DDL-Aufgabe', id, 'ID ist bereits vergeben.');
    else if (!topicById(e.topicId)) bad('DDL-Aufgabe', id, `Thema „${e.topicId}“ existiert nicht.`);
    else if (![1, 2, 3].includes(e.level) || !str(e.title, 120) || !str(e.task, 3000) || !str(e.solution, 6000) || !Array.isArray(e.checks) || !e.checks.length)
      bad('DDL-Aufgabe', id, 'Titel, Aufgabentext, Musterlösung, Stufe (1–3) oder Prüfungen fehlen.');
    else if (!SQL) bad('DDL-Aufgabe', id, 'SQL-Engine nicht verfügbar.');
    else {
      const ex: DdlExercise = { ...e, hints: Array.isArray(e.hints) ? e.hints : [], topic: e.topic ?? topicById(e.topicId)!.title, source: e.source ?? 'Aufgabenpaket' };
      const run = runExercise(SQL, ex, ex.solution);
      if (!run.passed) bad('DDL-Aufgabe', id, `Die Musterlösung besteht die eigenen Prüfungen nicht: ${run.checks.find((c) => !c.ok)?.label ?? ''} ${run.checks.find((c) => !c.ok)?.hint ?? ''}`);
      else if (runExercise(SQL, ex, '-- nichts').passed) bad('DDL-Aufgabe', id, 'Eine leere Abgabe würde bestehen.');
      else {
        ddlExercises.push(ex);
        counts.ddl++;
      }
    }
  }

  // 9. Normalisierungsaufgaben (Daten werden auf Konsistenz geprueft: gelten die Abhaengigkeiten?)
  for (const e of pack.nf ?? []) {
    const id = e?.id;
    if (!e || !ID.test(String(id)) || !str(e.title, 120)) bad('Normalisierung', id, 'ID oder Titel fehlt.');
    else if (nfExercises.some((x) => x.id === id)) bad('Normalisierung', id, 'ID ist bereits vergeben.');
    else if (!topicById(e.topicId)) bad('Normalisierung', id, `Thema „${e.topicId}“ existiert nicht.`);
    else if (!e.relation || !Array.isArray(e.relation.columns) || !e.oneNF || !Array.isArray(e.fds) || !Array.isArray(e.target)) bad('Normalisierung', id, 'relation, oneNF, fds oder target fehlt.');
    else {
      const problems = exerciseProblems(e);
      if (problems.length) bad('Normalisierung', id, problems[0]);
      else {
        nfExercises.push({ ...e, tags: e.tags ?? [], source: e.source ?? 'Aufgabenpaket' });
        counts.nf++;
      }
    }
  }

  // 10. ER-Phrasen (Kardinalitaeten und Relationenmodell)
  for (const p of pack.phrases ?? []) {
    const id = p?.id;
    const ent = (e: { name?: string; key?: string; attr?: string; plural?: string } | undefined) => !!e && str(e.name, 60) && str(e.key, 60) && str(e.attr, 60) && str(e.plural, 60);
    if (!p || !ID.test(String(id))) bad('ER-Phrase', id, 'ID fehlt oder ist ungültig.');
    else if (phrases.some((x) => x.id === id)) bad('ER-Phrase', id, 'ID ist bereits vergeben.');
    else if (!str(p.text, 800) || !str(p.verb, 60) || !ent(p.e1) || !ent(p.e2)) bad('ER-Phrase', id, 'Text, Verb oder Entitäten (name, key, attr, plural) fehlen.');
    else if (!CARDS.includes(p.c12) || !CARDS.includes(p.c21)) bad('ER-Phrase', id, 'c12 und c21 müssen 11, 01, 1N oder 0N sein.');
    else {
      phrases.push(p);
      if (!p.recursive) relPhrases.push(p);
      counts.phrases++;
    }
  }

  rebuildCatalog();
  packReport.counts = counts;
  packReport.problems = problems;
  packReport.loaded = true;
  return packReport;
}

/**
 * Prueft ein Paket, ohne den Trainer zu veraendern (Probelauf): Alles, was applyPack hinzufuegt,
 * wird danach wieder entfernt. Fuer die Vorschau im Dozentenmodus.
 */
export function validatePack(pack: Pack, SQL: SqlJsStatic | null): PackReport {
  const len = {
    chapters: CHAPTERS.length, topics: topics.length, questions: mcQuestions.length, scenarios: scenarios.length,
    sql: sqlExercises.length, dql: dqlExercises.length, dml: dmlExercises.length, ws: packWorksheets.length, tt: textTasks.length,
    ddl: ddlExercises.length, nf: nfExercises.length, ph: phrases.length, rph: relPhrases.length,
  };
  const chapterNames = { ...CHAPTER_NAME };
  const before = { counts: packReport.counts, problems: packReport.problems, loaded: packReport.loaded };
  const r = applyPack(pack, SQL);
  const result: PackReport = { counts: { ...r.counts }, problems: [...r.problems], loaded: true };
  CHAPTERS.length = len.chapters;
  topics.length = len.topics;
  mcQuestions.length = len.questions;
  scenarios.length = len.scenarios;
  sqlExercises.length = len.sql;
  dqlExercises.length = len.dql;
  dmlExercises.length = len.dml;
  packWorksheets.length = len.ws;
  textTasks.length = len.tt;
  ddlExercises.length = len.ddl;
  nfExercises.length = len.nf;
  phrases.length = len.ph;
  relPhrases.length = len.rph;
  for (const k of Object.keys(CHAPTER_NAME)) if (!(k in chapterNames)) delete CHAPTER_NAME[k];
  rebuildCatalog();
  Object.assign(packReport, before);
  return result;
}

export const needsSql = (p: Pack) => !!(p.sql?.length || p.scenarios?.length || p.worksheets?.some((w) => w.schema?.trim()));

/** Laedt aufgaben.json neben index.html (falls vorhanden). Fehler stoppen den Start nicht. */
export async function loadContentPack(): Promise<void> {
  try {
    const res = await fetch('./aufgaben.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const text = await res.text();
    // Manche Server liefern bei fehlender Datei eine HTML-Seite mit Status 200: dann gibt es kein Paket
    if (text.trimStart().startsWith('<')) return;
    const pack = JSON.parse(text) as Pack;
    const SQL = needsSql(pack) ? await (await import('../sql/loader')).loadSql() : null;
    const r = applyPack(pack, SQL);
    for (const p of r.problems) console.warn(`[DB-Trainer] ${p.kind} ${p.id}: ${p.message}`);
  } catch (e) {
    packReport.problems.push({ kind: 'Paket', id: 'aufgaben.json', message: `Konnte nicht gelesen werden: ${e instanceof Error ? e.message : e}` });
    console.warn('[DB-Trainer] aufgaben.json konnte nicht gelesen werden.', e);
  }
}
