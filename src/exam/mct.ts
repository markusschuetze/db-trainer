// MCT-Format wie im ILIAS-Test der Vorlesung: 7 Auswahlfragen, eine Frage pro Seite.
//   1. ER-Modell zu einer Anforderung waehlen        (1 P.)
//   2. ER-Modell mit mehreren Entitaeten waehlen     (4 P.)
//   3. Primaerschluessel aus Abhaengigkeiten ableiten (6 P., richtig/falsch je Attribut)
//   4. Relationen auf 3. Normalform pruefen           (6 P., richtig/falsch je Relation)
//   5. Relationenmodell zu einem ERD waehlen          (1 P.)
//   6. Teiltransformationen ERD -> Relationen         (8 P., richtig/falsch)
//   7. DDL-Code lesen und beurteilen                  (3 P., richtig/falsch)
// Alles wird aus den vorhandenen Inhalten erzeugt; die Wahrheit ist berechnet, nicht von Hand geraten.

import { ddlReadings } from '../content/mctDdl';
import { relationText, relType, toRelations, validMappings, type Card, type Phrase, type Relation } from '../content/erPhrases';
import { phrases, relPhrases } from '../content/erPhrases';
import { textTasks } from '../content/textTasks';
import { candidateKeys, is3NF, type Fd } from '../logic/nfSynth';
import { deriveSchema } from '../logic/textTaskLogic';

export interface ErRel {
  e1: string;
  e2: string;
  verb: string;
  c12: Card;
  c21: Card;
}
export interface Fig {
  er?: ErRel[];
  rel?: Relation[];
}
export interface PickData {
  scenario: string;
  question: string;
  stem?: Fig;
  options: Fig[];
  correct: number;
  why: string;
}
export interface TfStatement {
  text?: string;
  fig?: Fig;
  truth: boolean;
  why: string;
}
export interface TfData {
  intro: string;
  stem?: Fig;
  code?: string;
  question: string;
  statements: TfStatement[];
}

export type MctItem =
  | { kind: 'pick'; id: string; chapter: '02' | '04'; points: number; d: PickData }
  | { kind: 'tf'; id: string; chapter: '02' | '04' | '05' | '06'; points: number; d: TfData };

/* ---------------- Zufall ---------------- */

export type Rnd = () => number;
const shuffle = <T>(l: T[], r: Rnd): T[] => {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};
const sample = <T>(l: T[], r: Rnd): T => l[Math.floor(r() * l.length)];

/* ---------------- 1 und 2: ER-Modell waehlen ---------------- */

const flipMin = (c: Card): Card => (c[0] === '0' ? (`1${c[1]}` as Card) : (`0${c[1]}` as Card));
const flipMax = (c: Card): Card => (c[1] === 'N' ? (`${c[0]}1` as Card) : (`${c[0]}N` as Card));
const cardKey = (rels: ErRel[]) => rels.map((r) => `${r.c12}${r.c21}`).join('|');

/** Abwandlungen einer Beziehung: eine Seite aendern (Minimum oder Maximum) oder beide Seiten tauschen */
function variants(r: ErRel): ErRel[] {
  const v = (c12: Card, c21: Card): ErRel => ({ ...r, c12, c21 });
  return [v(flipMin(r.c12), r.c21), v(r.c12, flipMin(r.c21)), v(flipMax(r.c12), r.c21), v(r.c12, flipMax(r.c21)), v(r.c21, r.c12)];
}

function pickOptions(correct: ErRel[], r: Rnd): ErRel[][] {
  const seen = new Set([cardKey(correct)]);
  const out: ErRel[][] = [];
  const tries = [...Array(40)].map(() => correct.map((rel) => (r() < 0.5 ? rel : sample(variants(rel), r))));
  // mindestens eine Beziehung muss abweichen
  for (const t of tries) {
    const k = cardKey(t);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
    if (out.length === 3) break;
  }
  return out;
}

const cardWords: Record<Card, string> = { '01': 'höchstens einer (0,1)', '11': 'genau einer (1,1)', '0N': 'beliebig viele (0,N)', '1N': 'mindestens einer (1,N)' };

export function erPick(r: Rnd, multi: boolean): MctItem {
  if (!multi) {
    let p: Phrase = sample(phrases.filter((x) => !x.recursive), r);
    let correct: ErRel = { e1: p.e1.name, e2: p.e2.name, verb: p.verb, c12: p.c12, c21: p.c21 };
    for (let i = 0; i < 30 && pickOptions([correct], r).length < 3; i++) {
      p = sample(phrases.filter((x) => !x.recursive), r);
      correct = { e1: p.e1.name, e2: p.e2.name, verb: p.verb, c12: p.c12, c21: p.c21 };
    }
    const opts = [[correct], ...pickOptions([correct], r)];
    const order = shuffle(opts.map((_, i) => i), r);
    return {
      kind: 'pick',
      id: `mct-er-${p.id}`,
      chapter: '02',
      points: 1,
      d: {
        scenario: p.text,
        question: 'Welches der folgenden ER-Modelle bildet die Anforderungen korrekt ab?',
        options: order.map((i) => ({ er: opts[i] })),
        correct: order.indexOf(0),
        why: `${p.e1.name} → ${p.e2.name}: ${cardWords[p.c12]}. ${p.e2.name} → ${p.e1.name}: ${cardWords[p.c21]}.`,
      },
    };
  }
  const t = sample(textTasks.filter((x) => x.relationships.length >= 2 && x.relationships.length <= 3 && !x.specializations?.length), r);
  const correct: ErRel[] = t.relationships.map((x) => ({ e1: x.e1, e2: x.e2, verb: x.verb, c12: x.c12, c21: x.c21 }));
  const opts = [correct, ...pickOptions(correct, r)];
  // pickOptions liefert bei zwei oder drei Beziehungen immer genug verschiedene Abwandlungen
  const order = shuffle(opts.map((_, i) => i), r);
  return {
    kind: 'pick',
    id: `mct-ertext-${t.id}`,
    chapter: '02',
    points: 4,
    d: {
      scenario: t.text,
      question: 'Welches der folgenden ER-Modelle gibt diesen Sachverhalt korrekt wieder?',
      options: order.map((i) => ({ er: opts[i] })),
      correct: order.indexOf(0),
      why: t.relationships.map((x) => x.why).join(' '),
    },
  };
}

/* ---------------- 5: Relationenmodell waehlen ---------------- */

const flipNotNull = (rels: Relation[]): Relation[] =>
  rels.map((rel) => ({ ...rel, columns: rel.columns.map((c) => (c.fk && !c.pk ? { ...c, notNull: !c.notNull } : c)) }));
const relKey = (rels: Relation[]) => rels.map(relationText).sort().join('\n');

export function relPick(r: Rnd): MctItem {
  const p: Phrase = sample(relPhrases.filter((x) => relType(x) !== '1:1'), r);
  const m = validMappings(p)[0];
  const correct = toRelations(p, m);
  const broken = (rels: Relation[]) => {
    const i = rels.findIndex((x) => corrupt(x, () => 0));
    return i < 0 ? rels : rels.map((x, k) => (k === i ? corrupt(x, () => 0)! : x));
  };
  const cand: Relation[][] = [
    toRelations(p, 'fk-e1'),
    toRelations(p, 'fk-e2'),
    toRelations(p, 'zuordnung'),
    flipNotNull(correct),
    broken(correct),
  ];
  const seen = new Set([relKey(correct)]);
  const wrong: Relation[][] = [];
  for (const c of shuffle(cand, r)) {
    if (!seen.has(relKey(c))) {
      seen.add(relKey(c));
      wrong.push(c);
    }
    if (wrong.length === 3) break;
  }
  const opts = [correct, ...wrong];
  const order = shuffle(opts.map((_, i) => i), r);
  const er: ErRel = { e1: p.e1.name, e2: p.e2.name, verb: p.verb, c12: p.c12, c21: p.c21 };
  return {
    kind: 'pick',
    id: `mct-rel-${p.id}`,
    chapter: '04',
    points: 1,
    d: {
      scenario: 'Welches der unten aufgeführten Relationenmodelle ist eine korrekte Transformation des folgenden ER-Modells?',
      question: '',
      stem: { er: [er] },
      options: order.map((i) => ({ rel: opts[i] })),
      correct: order.indexOf(0),
      why:
        m === 'zuordnung'
          ? 'Bei M:N entsteht eine eigene Zuordnungstabelle mit beiden Fremdschlüsseln als zusammengesetztem Primärschlüssel.'
          : 'Der Fremdschlüssel kommt auf die N-Seite. Er ist NOT NULL, wenn dort mindestens ein Partner Pflicht ist.',
    },
  };
}

/* ---------------- 3 und 4: Normalformen ---------------- */

const spName = (n: number) => `Sp_${n}`;
const fdText = (f: Fd) => `${f.lhs.join(', ')} → ${f.rhs.join(', ')}`;

export function nfPk(r: Rnd): Extract<MctItem, { kind: 'tf' }> {
  const nums = shuffle([11, 12, 13, 14, 15, 16, 17, 18, 19], r).slice(0, 5).map(spName);
  const [k1, k2, a, b, c] = nums;
  const templates: Fd[][] = [
    [{ lhs: [k1, k2], rhs: [a, b] }, { lhs: [k2], rhs: [c] }, { lhs: [a], rhs: [b] }],
    [{ lhs: [k1, k2], rhs: [a] }, { lhs: [a], rhs: [b] }, { lhs: [k1], rhs: [c] }],
    [{ lhs: [k1, k2], rhs: [a, b, c] }, { lhs: [a], rhs: [b] }],
    [{ lhs: [k2, k1], rhs: [c, a] }, { lhs: [c], rhs: [b] }],
  ];
  const fds = shuffle(sample(templates, r), r);
  const attrs = shuffle(nums, r);
  const key = candidateKeys(attrs, fds)[0];
  const keyAttrs = attrs.filter((x) => key.includes(x));
  const others = attrs.filter((x) => !key.includes(x));
  const shown = shuffle([sample(keyAttrs, r), ...shuffle(others, r).slice(0, 2)], r);
  const stmts: TfStatement[] = shown.map((x) => ({
    text: x,
    truth: key.includes(x),
    why: key.includes(x)
      ? `${x} wird für den Schlüssel gebraucht: ohne ${x} lässt sich nicht jedes Attribut bestimmen.`
      : `${x} ist bereits durch den Schlüssel (${key.join(', ')}) bestimmt und gehört nicht dazu.`,
  }));
  stmts.push({ text: 'Der Primärschlüssel lässt sich aus diesen Angaben nicht ableiten.', truth: false, why: `Die Hülle von (${key.join(', ')}) enthält alle Attribute, der Schlüssel ist ableitbar.` });
  return {
    kind: 'tf',
    id: `mct-nfpk-${nums.join('')}`,
    chapter: '05',
    points: 6,
    d: {
      intro: `Es ist diese Relation Rel2 in der 1. Normalform mit folgenden Attributnamen gegeben:\nRel2 ( ${attrs.join(', ')} )\nEs sind diese funktionalen Abhängigkeiten (FD) gegeben:\n${fds.map(fdText).join('\n')}`,
      question: 'Welche der folgenden Attribute gehören nun zum Primärschlüssel für obige Relation in der 1. Normalform? Entscheiden Sie für jedes Attribut / jede Aussage.',
      statements: stmts,
    },
  };
}

export function nf3(r: Rnd): MctItem {
  const nums = shuffle([11, 12, 13, 14, 15, 16, 17, 18, 19], r).slice(0, 5).map(spName);
  const [y, x, z, w, v] = nums;
  const fds: Fd[] = [{ lhs: [x], rhs: [z] }, { lhs: [w], rhs: [v] }, { lhs: [y], rhs: [z, x, v, w] }];
  const all = [z, x, y, w, v];
  const pool: string[][] = [
    all,
    [x, z],
    [w, v],
    [y, x, w],
    [y, x, z],
    [y, w, v],
    [y, x, w, z],
    [y, z, v],
  ];
  let chosen: string[][] = [];
  for (let i = 0; i < 30; i++) {
    chosen = shuffle(pool, r).slice(0, 4);
    const truths = chosen.map((c) => is3NF(c, fds));
    if (truths.some(Boolean) && truths.some((t) => !t)) break;
  }
  const stmts: TfStatement[] = chosen.map((c, i) => {
    const t = is3NF(c, fds);
    return {
      text: `R${i + 1} ( ${c.join(', ')} )`,
      truth: t,
      why: t
        ? 'Alle Abhängigkeiten in dieser Relation haben links den Schlüssel, oder die rechte Seite gehört zum Schlüssel.'
        : 'Ein Nichtschlüsselattribut hängt von einem anderen Nichtschlüsselattribut ab (transitive Abhängigkeit). Das verletzt die 3NF.',
    };
  });
  return {
    kind: 'tf',
    id: `mct-nf3-${nums.join('')}`,
    chapter: '05',
    points: 6,
    d: {
      intro: `Betrachten Sie eine Relation R ( ${all.join(', ')} )\nmit dem Primärschlüssel ${y}\nund den folgenden funktionalen Abhängigkeiten:\n${fds.map(fdText).join('      ')}`,
      question: 'Welche Relationen gehören zur 3. Normalform?',
      statements: stmts,
    },
  };
}

/* ---------------- 6: Teiltransformationen ---------------- */

function corrupt(rel: Relation, r: Rnd): Relation | null {
  const fkCols = rel.columns.filter((c) => c.fk && !c.pk);
  const pkCols = rel.columns.filter((c) => c.pk);
  const opts: Relation[] = [];
  if (fkCols.length) {
    opts.push({ ...rel, columns: rel.columns.filter((c) => c !== fkCols[0]) }); // Fremdschluessel fehlt
    opts.push({ ...rel, columns: rel.columns.map((c) => (c === fkCols[0] ? { ...c, notNull: !c.notNull } : c)) });
    opts.push({ ...rel, columns: rel.columns.map((c) => (c === fkCols[0] ? { ...c, pk: true } : c)) }); // FK faelschlich im PK
  }
  if (pkCols.length > 1) opts.push({ ...rel, columns: rel.columns.map((c, i) => (i === rel.columns.indexOf(pkCols[1]) ? { ...c, pk: false } : c)) });
  const bad = opts.filter((o) => relationText(o) !== relationText(rel));
  return bad.length ? sample(bad, r) : null;
}

export function erRel(r: Rnd): MctItem {
  const t = sample(textTasks.filter((x) => x.relationships.length >= 2 && x.relationships.length <= 3 && !x.specializations?.length), r);
  const schema = deriveSchema(t);
  const want = Math.min(4, schema.length);
  const picked = shuffle(schema, r).slice(0, want);
  let stmts: TfStatement[] = [];
  for (let i = 0; i < 20; i++) {
    stmts = picked.map((rel) => {
      const bad = r() < 0.5 ? corrupt(rel, r) : null;
      return {
        fig: { rel: [bad ?? rel] },
        truth: !bad,
        why: bad
          ? `Richtig wäre: ${relationText(rel)}`
          : 'Diese Teiltransformation stimmt: Primärschlüssel, Fremdschlüssel und NOT NULL passen zu den Kardinalitäten.',
      };
    });
    if (stmts.some((s) => s.truth) && stmts.some((s) => !s.truth)) break;
  }
  const er: ErRel[] = t.relationships.map((x) => ({ e1: x.e1, e2: x.e2, verb: x.verb, c12: x.c12, c21: x.c21 }));
  return {
    kind: 'tf',
    id: `mct-errel-${t.id}`,
    chapter: '04',
    points: 8,
    d: {
      intro: 'Das folgende ERD wird in ein Relationenmodell überführt. Entscheiden Sie für jede der folgenden Teiltransformationen, ob diese korrekt oder falsch ist.\nFremdschlüssel aus nicht abgebildeten Relationen werden in den Teiltransformationen übernommen.',
      stem: { er },
      question: '',
      statements: stmts,
    },
  };
}

/* ---------------- 7: DDL lesen ---------------- */

export function ddlRead(r: Rnd): MctItem {
  const d = sample(ddlReadings, r);
  return {
    kind: 'tf',
    id: `mct-ddl-${d.id}`,
    chapter: '06',
    points: 3,
    d: {
      intro: 'Es werden folgende Tabellen erstellt sowie ggf. modifiziert:',
      code: d.code,
      question: 'Bewerten Sie folgende Aussagen hinsichtlich ihrer Richtigkeit:',
      statements: shuffle(d.statements, r).map((s) => ({ text: s.text, truth: s.truth, why: s.why })),
    },
  };
}

/** Die sieben Fragen eines MCT in der Reihenfolge des ILIAS-Tests */
export function buildMct(r: Rnd): MctItem[] {
  return [erPick(r, false), erPick(r, true), nfPk(r), nf3(r), relPick(r), erRel(r), ddlRead(r)];
}
