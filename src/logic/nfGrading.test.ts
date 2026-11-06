import { describe, expect, it } from 'vitest';
import { nfExercises } from '../content/exercises';
import { exerciseProblems, gradeFds, gradeHighest, gradeOneNf } from './nfGrading';

describe('Aufgabendaten', () => {
  for (const ex of nfExercises) {
    it(`${ex.id} ist konsistent`, () => {
      expect(exerciseProblems(ex)).toEqual([]);
    });
  }
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
