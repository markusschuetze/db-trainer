import { describe, expect, it } from 'vitest';
import { acidTasks, afterRecovery, genRecovery, recoveryWhy, scheduleTasks } from './transactions';
import { mcQuestions } from './mcQuestions';
import { topicById } from './topics';

const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

describe('Kapitel 08', () => {
  it('Aufgaben haben eindeutige IDs', () => {
    for (const l of [acidTasks, scheduleTasks]) expect(new Set(l.map((x) => x.id)).size).toBe(l.length);
  });
  it('Wissensfragen gehören zu Themen von Kapitel 08', () => {
    const qs = mcQuestions.filter((x) => x.chapter === '08');
    expect(qs.length).toBeGreaterThanOrEqual(25);
    for (const x of qs) expect(topicById(x.topicId)?.chapter, x.id).toBe('08');
  });
  it('Crash Recovery: committed gilt, offen wird zurückgesetzt', () => {
    for (let s = 1; s <= 100; s++) {
      const t = genRecovery(rng(s));
      expect(t.txs).toHaveLength(3);
      expect(new Set(t.txs.flatMap((x) => x.writes.map((w) => w.item))).size).toBe(t.txs.flatMap((x) => x.writes).length);
      expect(t.txs.some((x) => x.committed) && t.txs.some((x) => !x.committed)).toBe(true);
      const res = afterRecovery(t);
      for (const tx of t.txs) for (const w of tx.writes) expect(res[w.item]).toBe(tx.committed ? 'neu' : 'alt');
      expect(recoveryWhy(t)).toHaveLength(3);
    }
  });
  it('Beispiel aus dem Skript', () => {
    const t = { items: ['A', 'B', 'C', 'D', 'E'], txs: [
      { name: 'T1', committed: true, writes: [{ item: 'A', persisted: true }, { item: 'B', persisted: false }] },
      { name: 'T2', committed: false, writes: [{ item: 'C', persisted: true }, { item: 'D', persisted: false }] },
      { name: 'T3', committed: true, writes: [{ item: 'E', persisted: true }] },
    ] };
    expect(afterRecovery(t)).toEqual({ A: 'neu', B: 'neu', C: 'alt', D: 'alt', E: 'neu' });
  });
});
