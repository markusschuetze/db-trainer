// Alle Inhalte als flache Liste fuer die fachliche Durchsicht (Dozentenmodus).
import { ddlExercises } from '../content/ddlExercises';
import { phrases, relType } from '../content/erPhrases';
import { nfExercises } from '../content/exercises';
import { CHAPTER_NAME, mcQuestions } from '../content/mcQuestions';
import { specializations } from '../content/specializations';
import { sqlExercises } from '../content/sqlExercises';
import { textTasks } from '../content/textTasks';
import { topicById } from '../content/topics';
import { CHAPTERS } from '../progressCatalog';

export interface ReviewRow {
  /** Art der Aufgabe */
  kind: string;
  chapter: string;
  topic: string;
  id: string;
  level?: string;
  text: string;
  answer: string;
  explanation: string;
  source: string;
}

const LEVEL = { 1: 'leicht', 2: 'mittel', 3: 'schwer' } as const;
const CARD = { '01': '(0,1)', '11': '(1,1)', '0N': '(0,N)', '1N': '(1,N)' } as const;
const letter = (i: number) => String.fromCharCode(65 + i);
const ch = (topicId: string) => CHAPTER_NAME[topicById(topicId)?.chapter ?? ''] ?? '';
const tp = (topicId: string) => topicById(topicId)?.title ?? topicId;

export function reviewRows(): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const q of mcQuestions)
    rows.push({
      kind: 'Wissensfrage', chapter: ch(q.topicId), topic: tp(q.topicId), id: `mc:${q.id}`,
      text: `${q.question}\n${q.options.map((o, i) => `${letter(i)}) ${o}`).join('\n')}${q.multi ? '\n(Mehrfachauswahl)' : ''}`,
      answer: q.correct.map((i) => `${letter(i)}) ${q.options[i]}`).join('\n'), explanation: q.explanation, source: '',
    });
  for (const e of sqlExercises)
    rows.push({
      kind: e.kind === 'dql' ? 'SQL-Abfrage' : 'SQL-Änderung', chapter: ch(e.topicId), topic: tp(e.topicId), id: `sql:${e.id}`, level: LEVEL[e.level],
      text: `[${e.scenario ?? 'hochschule'}] ${e.title}\n${e.task}`, answer: e.solution, explanation: e.hints.join('\n'), source: e.source,
    });
  for (const e of ddlExercises)
    rows.push({
      kind: 'DDL-Aufgabe', chapter: ch(e.topicId), topic: tp(e.topicId), id: `ddl:${e.id}`, level: LEVEL[e.level],
      text: `${e.title}\n${e.task}${e.setup ? `\n\nAusgangslage:\n${e.setup.trim()}` : ''}`, answer: e.solution, explanation: e.hints.join('\n'), source: e.source,
    });
  for (const e of nfExercises)
    rows.push({
      kind: 'Normalisierung', chapter: ch(e.topicId), topic: tp(e.topicId), id: `nf:${e.id}`,
      text: `${e.title}\n${e.scenario}\nSpalten: ${e.relation.columns.join(', ')} (Schlüssel: ${e.relation.pk.join(', ')})`,
      answer: `1NF: ${e.oneNF.ok ? 'ja' : 'nein (' + e.oneNF.issues.map((i) => `${i.column}: ${i.type}`).join(', ') + ')'}\nAbhängigkeiten: ${e.fds.map((f) => `${f.lhs.join(', ')} → ${f.rhs.join(', ')} (${f.kind})`).join('; ')}\nHöchste NF: ${e.highestNF}NF\nZielschema:\n${e.target.join('\n')}`,
      explanation: e.fds.map((f) => f.why).join('\n'), source: e.source,
    });
  for (const p of phrases)
    rows.push({
      kind: 'Kardinalität', chapter: CHAPTER_NAME['02'], topic: 'Kardinalitäten und Relationenmodell', id: `er:${p.id}`,
      text: p.text, answer: `${p.e1.name} → ${p.e2.plural}: ${CARD[p.c12]}; ${p.e2.name} → ${p.e1.plural}: ${CARD[p.c21]} (${relType(p)})`, explanation: '', source: '',
    });
  for (const s of specializations)
    rows.push({
      kind: 'Spezialisierung', chapter: ch('03-spezialisierung'), topic: tp('03-spezialisierung'), id: `spez:${s.id}`,
      text: `${s.text}\nSupertyp ${s.supertype}, Subtypen: ${s.subtypes.join(', ')}`, answer: `${s.disjoint ? 'disjunkt' : 'überlappend'}, ${s.total ? 'vollständig' : 'partiell'}`, explanation: s.why, source: '',
    });
  for (const t of textTasks)
    rows.push({
      kind: 'Textaufgabe', chapter: ch(t.topicId), topic: tp(t.topicId), id: `tt:${t.id}`, level: LEVEL[t.level], text: `${t.title}\n${t.text}`,
      answer: `Entitäten: ${t.entities.map((e) => `${e.name} (Schlüssel: ${e.key || 'künstlich'}; Attribute: ${e.attrs.join(', ') || '–'})`).join('; ')}\nBeziehungen: ${t.relationships.map((r) => `${r.e1} ${r.verb} ${r.e2} [${r.e1}→${r.e2} ${CARD[r.c12]}, ${r.e2}→${r.e1} ${CARD[r.c21]}${r.attrs?.length ? `, Attribute: ${r.attrs.join(', ')}` : ''}]`).join('; ')}`,
      explanation: t.relationships.map((r) => r.why).join('\n'), source: t.source,
    });
  const order = (c: string) => {
    const i = CHAPTERS.findIndex((x) => CHAPTER_NAME[x] === c);
    return i < 0 ? 99 : i;
  };
  return rows.sort((a, b) => order(a.chapter) - order(b.chapter) || a.topic.localeCompare(b.topic, 'de') || a.kind.localeCompare(b.kind, 'de'));
}

export function reviewCsv(rows: ReviewRow[]): string {
  const esc = (v: string | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Art', 'Kapitel', 'Thema', 'ID', 'Stufe', 'Aufgabe', 'Lösung', 'Erklärung/Tipps', 'Quelle', 'Fachlich geprüft (ja/nein)', 'Anmerkung'];
  return [head, ...rows.map((r) => [r.kind, r.chapter, r.topic, r.id, r.level ?? '', r.text, r.answer, r.explanation, r.source, '', ''])].map((r) => r.map(esc).join(';')).join('\n');
}
