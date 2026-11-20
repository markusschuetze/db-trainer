// Funktionale Abhaengigkeiten: Huelle, Schluessel, 3. Normalform.
// Grundlage fuer die generierten Auswahlfragen im MCT-Modus (Primaerschluessel bestimmen,
// Relationen auf 3NF pruefen). Die Wahrheit wird immer berechnet, nie von Hand eingetragen.

export interface Fd {
  lhs: string[];
  rhs: string[];
}

export function closure(attrs: string[], fds: Fd[]): Set<string> {
  const out = new Set(attrs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of fds)
      if (f.lhs.every((a) => out.has(a))) for (const r of f.rhs) if (!out.has(r)) (out.add(r), (changed = true));
  }
  return out;
}

const subsets = <T>(list: T[]): T[][] => {
  const out: T[][] = [];
  for (let m = 1; m < 1 << list.length; m++) out.push(list.filter((_, i) => m & (1 << i)));
  return out;
};

/** Alle minimalen Schluessel der Relation `attrs` unter den Abhaengigkeiten `fds` */
export function candidateKeys(attrs: string[], fds: Fd[]): string[][] {
  const keys = subsets(attrs).filter((s) => attrs.every((a) => closure(s, fds).has(a)));
  return keys.filter((k) => !keys.some((o) => o.length < k.length && o.every((a) => k.includes(a))));
}

/** Auf `attrs` projizierte Abhaengigkeiten (alle nicht-trivialen X -> A mit X, A in attrs) */
export function projected(attrs: string[], fds: Fd[]): Fd[] {
  const out: Fd[] = [];
  for (const x of subsets(attrs)) {
    const cl = closure(x, fds);
    const rhs = attrs.filter((a) => cl.has(a) && !x.includes(a));
    if (rhs.length) out.push({ lhs: x, rhs });
  }
  return out;
}

/** Steht die Relation in 3NF? Jede nicht-triviale Abhaengigkeit X -> A: X ist Superschluessel oder A ist Schluesselattribut. */
export function is3NF(attrs: string[], fds: Fd[]): boolean {
  const prime = new Set(candidateKeys(attrs, fds).flat());
  for (const f of projected(attrs, fds)) {
    const superKey = attrs.every((a) => closure(f.lhs, fds).has(a));
    if (!superKey && f.rhs.some((a) => !prime.has(a))) return false;
  }
  return true;
}
