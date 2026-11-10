/**
 * Gemischte Reihenfolge: zufaellig, aber moeglichst nie zwei Aufgaben desselben Typs hintereinander
 * (z. B. nicht dreimal 1:N in Folge). `avoid` ist der Typ der zuletzt gezeigten Aufgabe.
 */
export function mixedOrder<T>(items: T[], key: (t: T) => string, avoid?: string, rnd: () => number = Math.random): number[] {
  const pool = items.map((_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out: number[] = [];
  let last = avoid;
  while (pool.length) {
    // bevorzugt der Typ mit den meisten uebrigen Aufgaben, der vom letzten abweicht (verhindert Restbloecke am Ende)
    const counts = new Map<string, number>();
    for (const i of pool) counts.set(key(items[i]), (counts.get(key(items[i])) ?? 0) + 1);
    let pick = -1;
    let best = -1;
    pool.forEach((idx, p) => {
      const k = key(items[idx]);
      if (k === last) return;
      const c = counts.get(k)!;
      if (c > best) {
        best = c;
        pick = p;
      }
    });
    if (pick < 0) pick = 0; // nur noch derselbe Typ uebrig
    const [idx] = pool.splice(pick, 1);
    out.push(idx);
    last = key(items[idx]);
  }
  return out;
}
