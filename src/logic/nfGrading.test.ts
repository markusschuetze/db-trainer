import { describe, expect, it } from 'vitest';
import { nfExercises } from '../content/exercises';
import { exerciseProblems, gradeFds, gradeHighest, gradeOneNf } from './nfGrading';

describe('Aufgabendaten', () => {
  for (const ex of nfExercises) {
    it(`${ex.id} ist konsistent`, () => {
      expect(exerciseProblems(ex)).toEqual([]);
    });
  }
  it('Zielschema-Stufen sind konsistent (Attribute aus der 1NF-Relation, jede Relation mit PK)', () => {
    for (const ex of nfExercises.filter((e) => e.stages)) {
      const cols = (ex.oneNF.fixed ?? ex.relation).columns;
      for (const st of ex.stages!) {
        for (const r of st.relations) {
          expect(r.columns.length).toBeGreaterThan(0);
          expect(r.columns.some((c) => c.pk)).toBe(true);
          for (const c of r.columns) expect(cols).toContain(c.name);
        }
        // jedes Attribut der 1NF-Relation kommt mindestens einmal vor
        for (const c of cols) expect(st.relations.some((r) => r.columns.some((x) => x.name === c))).toBe(true);
      }
    }
  });
  it('mindestens 8 Aufgaben je Bereich, und jeder Bereich mit Fallen-Hinweis oder Zerlegung', () => {
    const area = (e: (typeof nfExercises)[number]) => (e.tags.length >= 3 ? 'M' : e.tags[0]);
    for (const a of ['1NF', '2NF', '3NF', 'M']) expect(nfExercises.filter((e) => area(e) === a).length).toBeGreaterThanOrEqual(8);
    for (const e of nfExercises.filter((x) => x.tags[0] !== '1NF' || x.tags.length >= 3)) expect(e.stages?.length ?? 0).toBeGreaterThan(0);
  });
  it('IDs sind eindeutig', () => {
    const ids = nfExercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Bewertung', () => {
  const [fahrrad, projekte] = nfExercises;
  it('1NF: Ja/Nein und betroffene Spalten', () => {
    expect(gradeOneNf(fahrrad, false, ['Preis', 'Lief_Nr'])).toBe(true);
    expect(gradeOneNf(fahrrad, false, ['Preis'])).toBe(false);
    expect(gradeOneNf(fahrrad, true, [])).toBe(false);
    expect(gradeOneNf(projekte, true, [])).toBe(true);
  });
  it('Abhaengigkeiten werden einzeln bewertet', () => {
    expect(gradeFds(projekte, ['partiell', 'voll', 'voll'])).toEqual([true, false, true]);
  });
  it('hoechste NF', () => {
    expect(gradeHighest(projekte, 1)).toBe(true);
    expect(gradeHighest(projekte, 2)).toBe(false);
  });
});
