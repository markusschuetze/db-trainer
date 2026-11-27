// Merkt sich ueber Sitzungen hinweg, welche Aufgaben zuletzt gezeigt wurden (nur lokal im Browser),
// damit Trainer, Lernmodus und Zufallsmodus zuerst Aufgaben waehlen, die lange nicht oder noch nie dran waren.

const KEY = 'dbt:practice-seen';
const MAX = 600;

export function loadSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Aufgabe als soeben gezeigt vermerken (landet am Ende der Liste) */
export function touchSeen(id: string) {
  try {
    const l = loadSeen().filter((x) => x !== id);
    l.push(id);
    localStorage.setItem(KEY, JSON.stringify(l.slice(-MAX)));
  } catch {
    /* ignorieren */
  }
}

/** Zufaellig gemischt, aber nie oder am laengsten nicht gezeigte Aufgaben zuerst */
export function freshOrder<T>(items: T[], id: (t: T) => string, rnd: () => number = Math.random, seen: string[] = loadSeen()): T[] {
  const a = items.map((t, i) => ({ t, i, r: rnd() }));
  return a
    .sort((x, y) => seen.lastIndexOf(id(x.t)) - seen.lastIndexOf(id(y.t)) || x.r - y.r)
    .map((x) => x.t);
}

/** Eine Aufgabe zufaellig unter den am laengsten nicht gezeigten */
export function freshPick<T>(items: T[], id: (t: T) => string, rnd: () => number = Math.random, seen: string[] = loadSeen()): T {
  const best = Math.min(...items.map((t) => seen.lastIndexOf(id(t))));
  const c = items.filter((t) => seen.lastIndexOf(id(t)) === best);
  return c[Math.floor(rnd() * c.length)];
}
