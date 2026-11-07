import { describe, expect, it } from 'vitest';
import { relationText } from '../content/erPhrases';
import { textTasks } from '../content/textTasks';
import { topicById } from '../content/topics';
import { correctKey, deriveSchema, entityCandidates, gradeCardinalities, gradeEntities, gradeRelationships, keyOptions, relKey, relationshipCandidates } from './textTaskLogic';

const task = (id: string) => textTasks.find((t) => t.id === id)!;

describe('Textaufgaben: Daten', () => {
  for (const t of textTasks) {
    it(`${t.id} ist konsistent`, () => {
      expect(topicById(t.topicId), 'Thema').toBeDefined();
      const names = t.entities.map((e) => e.name);
      expect(new Set(names).size).toBe(names.length);
      for (const r of t.relationships) {
        expect(names).toContain(r.e1);
        expect(names).toContain(r.e2);
      }
      for (const w of t.wrongRelationships) expect(t.relationships.some((r) => relKey(r) === relKey(w))).toBe(false);
      for (const d of t.distractors) expect(names).not.toContain(d);
      // jeder Entitaet wird ein Schluessel zugeordnet (leer = kuenstlich), Optionen enthalten die richtige Antwort
      for (const e of t.entities) expect(keyOptions(t, e.name)).toContain(correctKey(t, e.name));
      // Text nennt jede Entitaet (Subtypen nur ueber ihren Obertyp-Satz geprueft)
      const sub = new Set((t.specializations ?? []).flatMap((s) => s.subtypes));
      for (const n of names.filter((x) => !sub.has(x))) expect(t.text.toLowerCase()).toContain(n.toLowerCase().slice(0, 5));
      expect(deriveSchema(t).length).toBeGreaterThanOrEqual(names.length);
    });
  }
});

describe('Textaufgaben: Bewertung', () => {
  it('Entitaeten und Beziehungen werden als Menge verglichen', () => {
    const t = task('bars-cocktails');
    expect(gradeEntities(t, ['Bar', 'Cocktail', 'Zutat'])).toBe(true);
    expect(gradeEntities(t, ['Bar', 'Cocktail'])).toBe(false);
    expect(gradeEntities(t, ['Bar', 'Cocktail', 'Zutat', 'Gast'])).toBe(false);
    expect(gradeRelationships(t, t.relationships.map(relKey))).toBe(true);
    expect(gradeRelationships(t, [...t.relationships.map(relKey), relKey(t.wrongRelationships[0])])).toBe(false);
  });
  it('Kandidaten enthalten Richtiges und Falsches, aber nur zu gewaehlten Entitaeten', () => {
    const t = task('bars-cocktails');
    expect(entityCandidates(t)).toHaveLength(t.entities.length + t.distractors.length);
    const c = relationshipCandidates(t, ['Bar', 'Cocktail', 'Zutat']);
    expect(c.filter((x) => x.right)).toHaveLength(2);
    expect(c.filter((x) => !x.right)).toHaveLength(1);
    expect(relationshipCandidates(t, ['Bar', 'Cocktail']).every((x) => x.e1 !== 'Zutat' && x.e2 !== 'Zutat')).toBe(true);
  });
  it('Kardinalitaeten je Beziehung', () => {
    const t = task('profs-raeume');
    const a = Object.fromEntries(t.relationships.map((r) => [relKey(r), { c12: r.c12, c21: r.c21 }]));
    expect(Object.values(gradeCardinalities(t, a)).every(Boolean)).toBe(true);
    const k = relKey(t.relationships[1]);
    expect(gradeCardinalities(t, { ...a, [k]: { c12: '0N', c21: '0N' } })[k]).toBe(false);
  });
});

describe('Textaufgaben: abgeleitetes Relationenschema', () => {
  const text = (id: string) => deriveSchema(task(id)).map(relationText);

  it('M:N wird zur Zuordnungsrelation mit zusammengesetztem Schluessel', () => {
    expect(text('bars-cocktails')).toContain('Bar_Cocktail (_Bar_Name_ <fk>, _Cocktail_Name_ <fk>)');
  });
  it('Beziehungsattribut landet in der Zuordnungsrelation', () => {
    expect(text('mitarbeiterin-projekt')).toContain('Mitarbeiterin_Projekt (_Mitarbeiterin_ID_ <fk>, _Projekt_Projektnummer_ <fk>, Rolle)');
  });
  it('1:N: Fremdschluessel auf der N-Seite, NOT NULL bei Minimum 1', () => {
    expect(text('profs-raeume')).toContain('Büromaterial (_ID_, Bezeichnung, Typ, Raum_Raumnummer <fk> NOT NULL)');
  });
  it('fehlender Schluessel wird durch einen kuenstlichen ersetzt, Beziehungsattribut an der N-Seite', () => {
    const s = text('schueler-schule');
    expect(s).toContain('Schüler (_Schüler_ID_, Name, Klasse, Alter, Schule_Name <fk> NOT NULL, seit)');
  });
  it('Spezialisierung: Subtypen uebernehmen den Primaerschluessel als Fremdschluessel', () => {
    expect(text('produkte-spezialisierung')).toContain('Technisches_Produkt (_Produkt_ID_ <fk>, Spannung)');
  });
});
