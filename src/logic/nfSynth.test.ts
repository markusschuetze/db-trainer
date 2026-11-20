import { describe, expect, it } from 'vitest';
import { candidateKeys, closure, is3NF } from './nfSynth';

const fd = (l: string, r: string) => ({ lhs: l.split(','), rhs: r.split(',') });

describe('Funktionale Abhängigkeiten', () => {
  const fds = [fd('x', 'z'), fd('w', 'v'), fd('y', 'z,x,v,w')];
  it('Hülle und Schlüssel', () => {
    expect([...closure(['y'], fds)].sort()).toEqual(['v', 'w', 'x', 'y', 'z']);
    expect(candidateKeys(['z', 'x', 'y', 'w', 'v'], fds)).toEqual([['y']]);
  });
  it('3NF: Beispiel aus dem Probe-MCT', () => {
    expect(is3NF(['z', 'x', 'y', 'w', 'v'], fds)).toBe(false); // x -> z, w -> v transitiv
    expect(is3NF(['x', 'z'], fds)).toBe(true);
    expect(is3NF(['w', 'v'], fds)).toBe(true);
    expect(is3NF(['y', 'x', 'w'], fds)).toBe(true);
    expect(is3NF(['y', 'x', 'z'], fds)).toBe(false);
  });
  it('3NF erlaubt Schlüsselattribute auf der rechten Seite', () => {
    // AB -> C, C -> B: Schluessel AB und AC, C -> B verletzt BCNF, aber nicht 3NF
    expect(is3NF(['a', 'b', 'c'], [fd('a,b', 'c'), fd('c', 'b')])).toBe(true);
  });
});
