// Welche Uebungen und Wissensfragen gehoeren zu welchem Kapitel und Thema?
import { ddlExercises } from './content/ddlExercises';
import { phrases, relPhrases, relType, type Phrase } from './content/erPhrases';
import { nfExercises } from './content/exercises';
import { mcQuestions, type Chapter } from './content/mcQuestions';
import { specializations } from './content/specializations';
import { sqlExercises } from './content/sqlExercises';
import { textTasks } from './content/textTasks';
import { topicById, topics } from './content/topics';

/** Alle Kapitel in Reihenfolge (Standard + im Aufgabenpaket ergaenzte); wird in place erweitert */
export const CHAPTERS: Chapter[] = ['01', '02', '03', '04', '05', '06', 'SQL'];

/** Thema einer Beziehungs-Phrase: im ER-Trainer Krähenfuß, im Relationen-Trainer je nach Typ */
export const erTopic = () => '02-kraehenfuss';
export function relTopic(p: Phrase) {
  const t = relType(p);
  return t === 'M:N' ? '04-mn' : t === '1:1' ? '04-11-rekursiv' : '04-fk-1n';
}

/** Alle Fortschritts-IDs mit Thema (Uebungen und Wissensfragen) */
export const catalog: { id: string; topicId: string; kind: 'uebung' | 'frage' }[] = [];
const buildCatalog = () => [
  ...mcQuestions.map((q) => ({ id: `mc:${q.id}`, topicId: q.topicId, kind: 'frage' as const })),
  ...phrases.map((p) => ({ id: `er:${p.id}`, topicId: erTopic(), kind: 'uebung' as const })),
  ...specializations.map((s) => ({ id: `spez:${s.id}`, topicId: '03-spezialisierung', kind: 'uebung' as const })),
  ...relPhrases.map((p) => ({ id: `rel:${p.id}`, topicId: relTopic(p), kind: 'uebung' as const })),
  ...nfExercises.map((e) => ({ id: `nf:${e.id}`, topicId: e.topicId, kind: 'uebung' as const })),
  ...ddlExercises.map((e) => ({ id: `ddl:${e.id}`, topicId: e.topicId, kind: 'uebung' as const })),
  ...sqlExercises.map((e) => ({ id: `sql:${e.id}`, topicId: e.topicId, kind: 'uebung' as const })),
  ...textTasks.map((t) => ({ id: `tt:${t.id}`, topicId: t.topicId, kind: 'uebung' as const })),
];

export const topicOfItem = (id: string) => catalog.find((c) => c.id === id)?.topicId;

const chapterOf = (topicId: string) => topicById(topicId)?.chapter;

export const practiceIds: Record<string, string[]> = {};

export const questionIds: Record<string, string[]> = {};

export const itemsOfTopic = (topicId: string) => catalog.filter((i) => i.topicId === topicId);

export const practiceHref: Record<string, string> = {
  '01': '#/lernen',
  '02': '#/modellierung',
  '03': '#/modellierung',
  '04': '#/relationen',
  '05': '#/normalisierung',
  '06': '#/ddl',
  SQL: '#/sql',
};

/** Wo uebt man ein Thema? Bei reinen Wissensthemen: Fragen lernen zu diesem Thema */
export function topicHref(topicId: string): string {
  const t = topicById(topicId);
  if (!t) return '#/';
  const hasPractice = itemsOfTopic(topicId).some((i) => i.kind === 'uebung');
  return hasPractice ? practiceHref[t.chapter] : `#/lernen/${topicId}`;
}

export { topics };

/** Baut Katalog, Kapitel-Zuordnung und Links neu auf (nach dem Laden des Aufgabenpakets). */
export function rebuildCatalog() {
  catalog.length = 0;
  catalog.push(...buildCatalog());
  for (const c of CHAPTERS) {
    practiceIds[c] = catalog.filter((i) => i.kind === 'uebung' && chapterOf(i.topicId) === c).map((i) => i.id);
    questionIds[c] = catalog.filter((i) => i.kind === 'frage' && chapterOf(i.topicId) === c).map((i) => i.id);
    practiceHref[c] ??= '#/lernen';
  }
}
rebuildCatalog();
