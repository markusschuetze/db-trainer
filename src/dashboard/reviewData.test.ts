import { describe, expect, it } from 'vitest';
import { ddlExercises } from '../content/ddlExercises';
import { dmlErrorTasks } from '../content/dmlErrors';
import { predictTasks } from '../content/dmlPredict';
import { provokeTasks } from '../content/dmlProvoke';
import { phrases } from '../content/erPhrases';
import { nfExercises } from '../content/exercises';
import { mcQuestions } from '../content/mcQuestions';
import { specializations } from '../content/specializations';
import { sqlExercises } from '../content/sqlExercises';
import { textTasks } from '../content/textTasks';
import { reviewCsv, reviewRows } from './reviewData';

describe('Durchsicht-Export', () => {
  const rows = reviewRows();
  it('enthaelt jeden Inhalt genau einmal', () => {
    const expected = mcQuestions.length + sqlExercises.length + ddlExercises.length + nfExercises.length + phrases.length + specializations.length + textTasks.length + dmlErrorTasks.length + provokeTasks.length + predictTasks.length;
    expect(rows).toHaveLength(expected);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });
  it('jede Zeile hat Aufgabe, Loesung und Zuordnung zu Kapitel und Thema', () => {
    for (const r of rows) {
      expect(r.text.trim(), r.id).not.toBe('');
      expect(r.answer.trim(), r.id).not.toBe('');
      expect(r.chapter, r.id).not.toBe('');
      expect(r.topic, r.id).not.toBe('');
    }
  });
  it('Wissensfragen zeigen Antworten mit Buchstaben und markieren die richtigen', () => {
    const r = rows.find((x) => x.id === 'mc:acid')!;
    expect(r.text).toMatch(/A\) /);
    expect(r.answer).toMatch(/^[A-D]\) Atomicity/);
  });
  it('CSV maskiert Anfuehrungszeichen und Zeilenumbrueche und hat Prueffelder', () => {
    const csv = reviewCsv([{ kind: 'k', chapter: 'c', topic: 't', id: 'i', text: 'a "b"\nc', answer: 'x', explanation: '', source: '' }]);
    expect(csv).toContain('"a ""b""\nc"');
    expect(csv.split('\n')[0]).toContain('Fachlich geprüft');
  });
});
