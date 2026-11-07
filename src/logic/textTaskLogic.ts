// Bewertung und Ableitung fuer die Textaufgaben "Schema aus Text erkennen".
import { maxOf, minOf, type Card, type Relation } from '../content/erPhrases';
import type { TextTask, TtRelationship } from '../content/textTasks';

export const relKey = (r: { e1: string; e2: string; verb: string }) => `${r.e1}|${r.verb}|${r.e2}`;

/** Deterministische Mischung, damit die Reihenfolge nicht verraet, was richtig ist */
function shuffled<T>(list: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const entityCandidates = (t: TextTask) => shuffled([...t.entities.map((e) => e.name), ...t.distractors], t.id);

export const relationshipCandidates = (t: TextTask, chosenEntities: string[]) => {
  const all = [
    ...t.relationships.map((r) => ({ key: relKey(r), e1: r.e1, e2: r.e2, verb: r.verb, right: true, why: r.why })),
    ...t.wrongRelationships.map((r) => ({ key: relKey(r), e1: r.e1, e2: r.e2, verb: r.verb, right: false, why: r.why })),
  ];
  return shuffled(all, `${t.id}-r`).filter((c) => chosenEntities.includes(c.e1) && chosenEntities.includes(c.e2));
};

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export const gradeEntities = (t: TextTask, chosen: string[]) => sameSet(chosen, t.entities.map((e) => e.name));
export const gradeRelationships = (t: TextTask, chosen: string[]) => sameSet(chosen, t.relationships.map(relKey));

export type CardAnswers = Record<string, { c12?: Card; c21?: Card }>;
export const gradeCardinalities = (t: TextTask, a: CardAnswers) =>
  Object.fromEntries(t.relationships.map((r) => [relKey(r), a[relKey(r)]?.c12 === r.c12 && a[relKey(r)]?.c21 === r.c21]));

/** Schluessel-Auswahl: Name des Schluesselattributs oder "__kuenstlich" */
export const ARTIFICIAL = '__kuenstlich';
export const keyOptions = (t: TextTask, entity: string) => {
  const e = t.entities.find((x) => x.name === entity)!;
  return shuffled([...new Set([e.key, ...e.attrs].filter(Boolean)), ARTIFICIAL], `${t.id}-${entity}`);
};
export const correctKey = (t: TextTask, entity: string) => t.entities.find((x) => x.name === entity)!.key || ARTIFICIAL;

const idName = (e: string) => `${e.replace(/\s+/g, '_')}_ID`;
const colName = (s: string) => s.replace(/[\s-]+/g, '_');

/** Relationenschema nach den Regeln aus Skript 04 (Spezialisierung: Partitionierungsmodell) */
export function deriveSchema(t: TextTask): Relation[] {
  const rel = new Map<string, Relation>();
  const keyOf = (name: string) => {
    const e = t.entities.find((x) => x.name === name)!;
    return colName(e.key || idName(e.name));
  };
  const subtypeOf = new Map<string, string>();
  for (const s of t.specializations ?? []) for (const sub of s.subtypes) subtypeOf.set(sub, s.supertype);

  for (const e of t.entities) {
    const sup = subtypeOf.get(e.name);
    const cols = sup
      ? [{ name: keyOf(sup), pk: true, fk: sup }]
      : [{ name: colName(e.key || idName(e.name)), pk: true }];
    for (const a of e.attrs) if (colName(a) !== cols[0].name) cols.push({ name: colName(a) } as never);
    rel.set(e.name, { name: colName(e.name), columns: cols });
  }
  const fkCol = (entity: string) => `${colName(entity)}_${keyOf(entity)}`;

  for (const r of t.relationships) {
    const attrs = (r.attrs ?? []).map((a) => ({ name: colName(a) }));
    const m1 = maxOf(r.c12);
    const m2 = maxOf(r.c21);
    if (m1 === 'N' && m2 === 'N') {
      const name = `${colName(r.e1)}_${colName(r.e2)}`;
      rel.set(name, {
        name,
        columns: [{ name: fkCol(r.e1), pk: true, fk: colName(r.e1) }, { name: fkCol(r.e2), pk: true, fk: colName(r.e2) }, ...attrs],
      });
    } else {
      // FK auf die N-Seite; bei 1:1 in e2
      const onE1 = m1 === '1' && m2 === 'N';
      const holder = onE1 ? r.e1 : r.e2;
      const target = onE1 ? r.e2 : r.e1;
      const min = onE1 ? minOf(r.c12) : minOf(r.c21);
      const h = rel.get(holder)!;
      h.columns.push({ name: fkCol(target), fk: colName(target), notNull: min === '1', unique: m1 === '1' && m2 === '1' }, ...attrs);
    }
  }
  return [...rel.values()];
}

export const describeCard = (r: TtRelationship) => `${r.e1} → ${r.e2}: ${r.c12}, ${r.e2} → ${r.e1}: ${r.c21}`;
