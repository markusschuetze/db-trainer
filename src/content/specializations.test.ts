import { describe, expect, it } from 'vitest';
import { SPEC_VARIANTS, specMarker, specializations } from './specializations';

describe('Spezialisierungs-Aufgaben', () => {
  it('8 Aufgaben je Variante', () => {
    for (const v of SPEC_VARIANTS)
      expect(specializations.filter((s) => s.disjoint === v.disjoint && s.total === v.total)).toHaveLength(8);
  });
  it('eindeutige Ids, vollstaendige Angaben', () => {
    expect(new Set(specializations.map((s) => s.id)).size).toBe(specializations.length);
    for (const s of specializations) {
      expect(s.subtypes.length).toBeGreaterThanOrEqual(2);
      expect(s.subtypes.length).toBeLessThanOrEqual(3);
      expect(s.subAttrs).toHaveLength(s.subtypes.length);
      expect(s.superAttrs.length).toBeGreaterThan(0);
      expect(s.text.length).toBeGreaterThan(40);
    }
  });
  it('Dreieck-Beschriftung wie im Skript', () => {
    expect(specMarker({ disjoint: true, total: false })).toBe('X');
    expect(specMarker({ disjoint: true, total: true })).toBe('XV');
    expect(specMarker({ disjoint: false, total: true })).toBe('V');
    expect(specMarker({ disjoint: false, total: false })).toBe('');
  });
});
