import type { DepKind, NfExercise } from '../content/types';

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

export function gradeOneNf(ex: NfExercise, says1NF: boolean, selectedColumns: string[]): boolean {
  if (says1NF !== ex.oneNF.ok) return false;
  if (ex.oneNF.ok) return true;
  return sameSet(
    selectedColumns,
    ex.oneNF.issues.map((i) => i.column),
  );
}

export function gradeFds(ex: NfExercise, answers: (DepKind | '')[]): boolean[] {
  return ex.fds.map((fd, i) => answers[i] === fd.kind);
}

export function gradeHighest(ex: NfExercise, answer: number): boolean {
  return answer === ex.highestNF;
}

/** Konsistenzpruefung der Aufgabendaten (laeuft in den Tests). */
export function exerciseProblems(ex: NfExercise): string[] {
  const problems: string[] = [];
  const base = ex.oneNF.fixed ?? ex.relation;
  const cols = base.columns;

  if (!ex.oneNF.ok && !ex.oneNF.fixed) problems.push('1NF verletzt, aber keine bereinigte Relation (fixed)');
  if (ex.oneNF.ok && ex.oneNF.issues.length) problems.push('1NF ok, aber issues angegeben');
  for (const issue of ex.oneNF.issues) {
    if (!ex.relation.columns.includes(issue.column)) problems.push(`issue-Spalte unbekannt: ${issue.column}`);
  }
  for (const t of [ex.relation, ex.oneNF.fixed].filter(Boolean)) {
    for (const [i, row] of t!.rows.entries()) {
      if (row.length !== t!.columns.length) problems.push(`Zeile ${i + 1}: Spaltenanzahl passt nicht`);
    }
    for (const k of t!.pk) if (!t!.columns.includes(k)) problems.push(`PK-Spalte unbekannt: ${k}`);
  }
  for (const fd of ex.fds) {
    for (const c of [...fd.lhs, ...fd.rhs]) if (!cols.includes(c)) problems.push(`FD-Spalte unbekannt: ${c}`);
  }
  // Abhaengigkeiten muessen in den Daten tatsaechlich gelten
  for (const fd of ex.fds) {
    const idx = (names: string[]) => names.map((n) => cols.indexOf(n));
    const seen = new Map<string, string>();
    for (const row of base.rows) {
      const l = idx(fd.lhs).map((i) => row[i]).join('|');
      const r = idx(fd.rhs).map((i) => row[i]).join('|');
      if (seen.has(l) && seen.get(l) !== r) problems.push(`FD verletzt in Daten: ${fd.lhs.join(',')} -> ${fd.rhs.join(',')}`);
      seen.set(l, r);
    }
  }
  const hasPartial = ex.fds.some((f) => f.kind === 'partiell');
  const hasTransitive = ex.fds.some((f) => f.kind === 'transitiv');
  const expected = hasPartial ? 1 : hasTransitive ? 2 : 3;
  if (expected !== ex.highestNF) problems.push(`highestNF ${ex.highestNF} passt nicht zu den FDs (erwartet ${expected})`);
  if (!ex.target.length) problems.push('Zielschema fehlt');
  return problems;
}
