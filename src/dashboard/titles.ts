// Klartext-Namen fuer Aufgaben-IDs im Dashboard.
import { ddlExercises } from '../content/ddlExercises';
import { dmlErrorTasks } from '../content/dmlErrors';
import { predictTasks } from '../content/dmlPredict';
import { provokeTasks } from '../content/dmlProvoke';
import { phrases, relPhrases } from '../content/erPhrases';
import { nfExercises } from '../content/exercises';
import { CHAPTER_NAME, mcQuestions } from '../content/mcQuestions';
import { specializations } from '../content/specializations';
import { sqlExercises } from '../content/sqlExercises';
import { textTasks } from '../content/textTasks';
import { topicById } from '../content/topics';
import { catalog } from '../progressCatalog';

const cut = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function itemTitle(id: string): string {
  const [kind, key] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  switch (kind) {
    case 'mc':
      return cut(mcQuestions.find((q) => q.id === key)?.question ?? id);
    case 'sql':
      return sqlExercises.find((e) => e.id === key)?.title ?? id;
    case 'ddl':
      return ddlExercises.find((e) => e.id === key)?.title ?? id;
    case 'nf':
      return nfExercises.find((e) => e.id === key)?.title ?? id;
    case 'er':
      return cut(phrases.find((p) => p.id === key)?.text ?? id);
    case 'rel':
      return cut(relPhrases.find((p) => p.id === key)?.text ?? id);
    case 'spez':
      return cut(specializations.find((s) => s.id === key)?.supertype ?? id);
    case 'tt':
      return textTasks.find((t) => t.id === key)?.title ?? id;
    case 'dmlerr':
      return `DML-Fehler: ${dmlErrorTasks.find((t) => t.id === key)?.title ?? id}`;
    case 'dmlpred':
      return `Vorhersage: ${predictTasks.find((t) => t.id === key)?.title ?? id}`;
    case 'prov':
      return provokeTasks.find((t) => t.id === key)?.title ?? id;
    default:
      return id;
  }
}

export const KIND_LABEL: Record<string, string> = {
  mc: 'Wissensfrage',
  sql: 'SQL',
  ddl: 'DDL',
  nf: 'Normalisierung',
  er: 'Kardinalitäten',
  rel: 'Relationenmodell',
  spez: 'Spezialisierung',
  tt: 'Textaufgabe',
  dmlerr: 'DML-Fehler erkennen',
  dmlpred: 'DML-Ergebnis vorhersagen',
  prov: 'Constraints prüfen',
};
export const kindOf = (id: string) => KIND_LABEL[id.slice(0, id.indexOf(':'))] ?? 'Aufgabe';

export const topicTitle = (id: string) => topicById(id)?.title ?? id;
export const chapterTitle = (id: string) => CHAPTER_NAME[id] ?? id;

export const optionText = (id: string, i: number): string | undefined => {
  if (!id.startsWith('mc:')) return undefined;
  return mcQuestions.find((q) => q.id === id.slice(3))?.options[i];
};

/** Aufgaben fuer die Demo-Ansicht (mit Schwierigkeit und Antwortoptionen) */
export function demoItems() {
  return catalog.map((c) => {
    const topic = topicById(c.topicId);
    const [kind, key] = [c.id.slice(0, c.id.indexOf(':')), c.id.slice(c.id.indexOf(':') + 1)];
    const q = kind === 'mc' ? mcQuestions.find((m) => m.id === key) : undefined;
    const level = kind === 'sql' ? sqlExercises.find((e) => e.id === key)?.level : kind === 'ddl' ? ddlExercises.find((e) => e.id === key)?.level : undefined;
    return { id: c.id, topicId: c.topicId, chapter: topic?.chapter ?? 'SQL', level, options: q?.options.length, correct: q?.correct };
  });
}
