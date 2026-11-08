import { describe, expect, it } from 'vitest';
import { catalog, itemsOfTopic } from '../progressCatalog';
import { ddlExercises } from './ddlExercises';
import { nfExercises } from './exercises';
import { mcQuestions } from './mcQuestions';
import { sqlExercises } from './sqlExercises';
import { topicById, topics } from './topics';

describe('Themen nach Vorlesungsfolien', () => {
  it('Themen-IDs sind eindeutig', () => {
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
  });

  it('jede Aufgabe verweist auf ein existierendes Thema im passenden Kapitel', () => {
    for (const q of mcQuestions) {
      expect(topicById(q.topicId), q.id).toBeDefined();
      expect(topicById(q.topicId)!.chapter, q.id).toBe(q.chapter);
    }
    for (const e of [...nfExercises, ...ddlExercises, ...sqlExercises]) expect(topicById(e.topicId), e.id).toBeDefined();
    for (const e of nfExercises) expect(topicById(e.topicId)!.chapter).toBe('05');
    for (const e of ddlExercises) expect(topicById(e.topicId)!.chapter).toBe('06');
    for (const e of sqlExercises) expect(topicById(e.topicId)!.chapter).toBe('SQL');
  });

  it('jedes Thema hat mindestens zwei Aufgaben oder Fragen und mindestens eine Wissensfrage', () => {
    for (const t of topics) {
      expect(itemsOfTopic(t.id).length, t.id).toBeGreaterThanOrEqual(2);
      expect(
        itemsOfTopic(t.id).some((i) => i.kind === 'frage'),
        t.id,
      ).toBe(true);
    }
  });

  it('jedes Thema hat mindestens 8 Wissensfragen', () => {
    for (const t of topics) expect(itemsOfTopic(t.id).filter((i) => i.kind === 'frage').length, t.id).toBeGreaterThanOrEqual(8);
  });

  it('Wissensfragen: richtige Antwort steht nicht immer an derselben Stelle', () => {
    const single = mcQuestions.filter((q) => q.correct.length === 1);
    const pos = [0, 1, 2, 3].map((i) => single.filter((q) => q.correct[0] === i).length);
    for (const n of pos) expect(n / single.length).toBeGreaterThan(0.15);
  });

  it('Wissensfragen: die richtige Antwort ist nicht auffällig oft die längste Option', () => {
    const single = mcQuestions.filter((q) => q.correct.length === 1);
    const longest = single.filter((q) => {
      const len = q.options.map((o) => o.length);
      const max = Math.max(...len);
      return len[q.correct[0]] === max && len.filter((l) => l === max).length === 1;
    }).length;
    expect(longest / single.length).toBeGreaterThan(0.1);
    expect(longest / single.length).toBeLessThan(0.4);
  });

  it('Fortschritts-IDs sind eindeutig', () => {
    expect(new Set(catalog.map((c) => c.id)).size).toBe(catalog.length);
  });
});
