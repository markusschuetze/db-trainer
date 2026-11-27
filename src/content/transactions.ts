// Uebungen zu Kapitel 08 (ACID-Transaktionen): ACID-Szenarien, Ablaeufe lesen, Crash Recovery.

export type AcidLetter = 'A' | 'C' | 'I' | 'D';
export const ACID_NAME: Record<AcidLetter, string> = {
  A: 'Atomicity (Atomarität)',
  C: 'Consistency (Integritätserhaltung)',
  I: 'Isolation',
  D: 'Durability (Dauerhaftigkeit)',
};

export interface AcidTask {
  id: string;
  scenario: string;
  answer: AcidLetter;
  why: string;
}

export const acidTasks: AcidTask[] = [
  {
    id: 'ueberweisung',
    scenario: 'Bei einer Überweisung von 500 € wird Konto A belastet. Dann fällt das Programm aus, bevor Konto B gutgeschrieben wurde. Die Abbuchung wird zurückgenommen, sodass Geld weder verloren geht noch zusätzlich gutgeschrieben wird.',
    answer: 'A',
    why: 'Die Überweisung ist eine nicht aufspaltbare Serie von Operationen: ganz oder gar nicht. Bei einem Abbruch wird zurückgerollt.',
  },
  {
    id: 'letzter-platz',
    scenario: 'Zwei Kundinnen buchen gleichzeitig den letzten freien Sitzplatz. Jede soll so arbeiten können, als wäre sie allein im System, und der Platz darf nicht doppelt vergeben werden.',
    answer: 'I',
    why: 'Parallel laufende Transaktionen dürfen sich nicht gegenseitig behindern oder stören. Das regelt die Isolation, zum Beispiel durch Sperren.',
  },
  {
    id: 'stromausfall',
    scenario: 'Eine Bestellung wurde mit COMMIT bestätigt. Kurz darauf fällt der Strom im Rechenzentrum aus. Nach dem Neustart ist die Bestellung weiterhin vorhanden.',
    answer: 'D',
    why: 'Nach einem Commit bleiben Updates dauerhaft erhalten, auch bei Systemausfall. Das sichern Log und Recovery.',
  },
  {
    id: 'fk-verletzt',
    scenario: 'Ein INSERT verweist auf einen Kunden, der nicht existiert (Fremdschlüssel verletzt). Die Transaktion wird zurückgerollt, die Datenbank bleibt in einem gültigen Zustand.',
    answer: 'C',
    why: 'Consistency: Nur valide Zustände werden gespeichert. Werden Integritätsbedingungen verletzt, wird der letzte valide Zustand hergestellt.',
  },
  {
    id: 'raid-log',
    scenario: 'Eine Bank speichert die Transaktionslogs in einem externen RAID-System, damit auch nach einem permanenten Ausfall des Servers keine bestätigte Buchung verloren geht.',
    answer: 'D',
    why: 'Logs auf nicht-flüchtigem, ausgelagertem Speicher sichern die Durability auch gegen schwere Systemfehler.',
  },
  {
    id: 'journal',
    scenario: 'Das DBMS schreibt jede Änderung zuerst in ein Journal. Dadurch lässt sich zu jedem Zeitpunkt der letzte konsistente Zustand rekonstruieren, falls die Transaktion nicht zu Ende läuft.',
    answer: 'A',
    why: 'Das Journal ist das Werkzeug der Atomarität: Eine unvollständige Transaktion kann zurückgesetzt werden.',
  },
  {
    id: 'check-gehalt',
    scenario: 'Ein UPDATE setzt das Gehalt auf −100 € und verletzt dabei ein CHECK-Constraint (Gehalt > 0). Die Änderung wird abgelehnt und die Transaktion zurückgesetzt.',
    answer: 'C',
    why: 'Die Regeln für einen validen Zustand (hier CHECK) werden eingehalten, sonst gibt es einen Rollback.',
  },
  {
    id: 'gehalt-b',
    scenario: 'Mitarbeiter B soll 10 % mehr verdienen als A. Die Berechnung benutzt das erhöhte Gehalt von A, obwohl diese Transaktion später abgebrochen wird. B verdient nun zu viel.',
    answer: 'I',
    why: 'Eine Transaktion hat ungültige, noch nicht committete Daten einer anderen gelesen (Dirty Read). Das verhindert die Isolation.',
  },
  {
    id: 'bestellung',
    scenario: 'Eine Bestellung besteht aus drei Positionen. Nach der Buchung von zwei Positionen im Lager tritt ein Fehler auf. Alle bisherigen Buchungen der Bestellung werden wieder zurückgenommen.',
    answer: 'A',
    why: 'Alle Operationen einer Transaktion werden ganz oder gar nicht ausgeführt, nie nur teilweise.',
  },
  {
    id: 'doppelbuchung',
    scenario: 'Zwei Programme („Überweisung“ und „Zinsgutschrift“) lesen gleichzeitig denselben Kontostand. Am Ende fehlt die Zinsgutschrift, weil sie überschrieben wurde.',
    answer: 'I',
    why: 'Das ist ein Lost Update und damit ein Isolationsproblem: Die Transaktionen haben sich gegenseitig gestört.',
  },
];

/* ---------------- Ablaeufe lesen ---------------- */

export type Anomaly = 'lost' | 'dirty' | 'phantom' | 'none';
export const ANOMALY_NAME: Record<Anomaly, string> = {
  lost: 'Lost Update',
  dirty: 'Dirty Read',
  phantom: 'Phantom-Problem',
  none: 'Kein Problem',
};
export type Level = 'rc' | 'ser';
export const LEVEL_NAME: Record<Level, string> = {
  rc: 'READ COMMITTED genügt',
  ser: 'Dafür braucht es SERIALIZABLE',
};

export interface ScheduleRow {
  t1?: string;
  t2?: string;
  /** Zustand in der Datenbank nach diesem Schritt */
  state?: string;
}
export interface ScheduleTask {
  id: string;
  title: string;
  intro: string;
  stateLabel: string;
  rows: ScheduleRow[];
  answer: Anomaly;
  /** Welche Ebene reicht, um das Problem zu verhindern? */
  level: Level;
  why: string;
}

export const scheduleTasks: ScheduleTask[] = [
  {
    id: 'zinsen',
    title: 'Überweisung und Zinsgutschrift',
    intro: 'Zwei Programme arbeiten gleichzeitig auf dem Konto A.',
    stateLabel: 'Zustand von A',
    rows: [
      { t1: 'read (A, a1)', state: '1000' },
      { t1: 'a1 := a1 − 50' },
      { t2: 'read (A, a2)' },
      { t2: 'a2 := a2 * 1.03' },
      { t2: 'write (A, a2)', state: '1030' },
      { t2: 'commit' },
      { t1: 'write (A, a1)', state: '950' },
      { t1: 'commit', state: '950' },
    ],
    answer: 'lost',
    level: 'rc',
    why: 'T1 schreibt 950 und überschreibt damit die 1030 von T2. Die 3 % Zinsen sind verloren. READ COMMITTED und SERIALIZABLE verhindern Lost Updates.',
  },
  {
    id: 'gehalt-rollback',
    title: 'Gehaltserhöhung wird abgebrochen',
    intro: 'T1 erhöht das Gehalt von A um 100 €. T2 legt das Gehalt von B auf 110 % von A fest.',
    stateLabel: 'A / B',
    rows: [
      { t1: 'read (A, a1)', state: '2500 / –' },
      { t1: 'a1 := a1 + 100' },
      { t1: 'write (A, a1)', state: '2600 / –' },
      { t2: 'read (A, a2)' },
      { t2: 'b1 := a2 * 1.1' },
      { t2: 'write (B, b1)', state: '2600 / 2860' },
      { t2: 'commit' },
      { t1: 'rollback', state: '2500 / 2860' },
    ],
    answer: 'dirty',
    level: 'rc',
    why: 'T2 liest das Gehalt 2600, das T1 noch nicht committed hat. Nach dem Rollback von T1 verdient B zu viel (2860 statt 2750). READ COMMITTED liest nur committete Daten.',
  },
  {
    id: 'bonus',
    title: 'Bonus für alle Mitarbeiter',
    intro: 'T1 verteilt einen Bonus von 100.000 € gleichmäßig auf alle Mitarbeiter. Parallel stellt T2 jemanden ein.',
    stateLabel: 'Datenbank',
    rows: [
      { t1: 'select count(*) into X from Mitarbeiter;', state: 'X = 100' },
      { t2: 'insert into Mitarbeiter values (Meier, 50.000, …);', state: '101 Mitarbeiter' },
      { t2: 'commit;' },
      { t1: 'update Mitarbeiter set Gehalt = Gehalt + 100.000/X;' },
      { t1: 'commit;', state: '101 × 1.000 € verteilt' },
    ],
    answer: 'phantom',
    level: 'ser',
    why: 'T1 bezieht sich auf mehrere Datensätze, T2 fügt einen neuen hinzu. Das Geld reicht nicht für alle. Phantom-Probleme verhindert nur SERIALIZABLE, READ COMMITTED nicht.',
  },
  {
    id: 'lager',
    title: 'Zwei Bestellungen buchen das Lager',
    intro: 'Im Lager liegen 10 Stück. T1 bestellt 3, T2 bestellt 2.',
    stateLabel: 'Bestand',
    rows: [
      { t1: 'read (L, l1)', state: '10' },
      { t2: 'read (L, l2)' },
      { t1: 'l1 := l1 − 3' },
      { t2: 'l2 := l2 − 2' },
      { t1: 'write (L, l1)', state: '7' },
      { t1: 'commit' },
      { t2: 'write (L, l2)', state: '8' },
      { t2: 'commit', state: '8' },
    ],
    answer: 'lost',
    level: 'rc',
    why: 'Richtig wären 5 Stück. T2 überschreibt den Bestand von T1 mit 8, die Buchung von T1 ist verloren.',
  },
  {
    id: 'preis',
    title: 'Preisänderung und Angebot',
    intro: 'T1 ändert den Preis eines Artikels, T2 erstellt damit ein Angebot.',
    stateLabel: 'Preis',
    rows: [
      { t1: 'write (Preis, 120)', state: '120' },
      { t2: 'read (Preis, p)' },
      { t2: 'Angebot := p * 5' },
      { t2: 'write (Angebot)' },
      { t2: 'commit' },
      { t1: 'rollback', state: '100' },
    ],
    answer: 'dirty',
    level: 'rc',
    why: 'T2 liest 120, bevor T1 committed hat. Nach dem Rollback gilt 100, das Angebot basiert auf einem Preis, den es nie gab.',
  },
  {
    id: 'raum',
    title: 'Raumbelegung auswerten',
    intro: 'T1 zählt zweimal die Buchungen für Raum 1, T2 trägt dazwischen eine neue Buchung ein.',
    stateLabel: 'Buchungen Raum 1',
    rows: [
      { t1: 'select count(*) from Buchung where Raum = 1;', state: '2' },
      { t2: 'insert into Buchung values (…, Raum 1);', state: '3' },
      { t2: 'commit;' },
      { t1: 'select count(*) from Buchung where Raum = 1;', state: '3' },
      { t1: 'commit;' },
    ],
    answer: 'phantom',
    level: 'ser',
    why: 'Dieselbe Abfrage liefert in einer Transaktion zwei verschiedene Ergebnisse, weil ein neuer Datensatz („Phantom“) dazukam. Das verhindert nur SERIALIZABLE.',
  },
  {
    id: 'seriell',
    title: 'Nacheinander ausgeführt',
    intro: 'T2 startet erst, nachdem T1 committed hat.',
    stateLabel: 'Zustand von A',
    rows: [
      { t1: 'read (A, a1)', state: '1000' },
      { t1: 'a1 := a1 − 50' },
      { t1: 'write (A, a1)', state: '950' },
      { t1: 'commit' },
      { t2: 'read (A, a2)' },
      { t2: 'a2 := a2 * 1.03' },
      { t2: 'write (A, a2)', state: '978,50' },
      { t2: 'commit', state: '978,50' },
    ],
    answer: 'none',
    level: 'rc',
    why: 'Die Transaktionen überlappen sich nicht. T2 liest den bestätigten Wert 950 von T1. Es geht nichts verloren, ein Isolationsproblem entsteht nicht.',
  },
  {
    id: 'lesen-nach-commit',
    title: 'Lesen nach dem Commit',
    intro: 'T1 ändert ein Gehalt. T2 liest es erst nach dem Commit von T1.',
    stateLabel: 'Gehalt A',
    rows: [
      { t1: 'update Mitarbeiter set Gehalt = 2600 where Name = A;', state: '2600' },
      { t1: 'commit;' },
      { t2: 'select Gehalt from Mitarbeiter where Name = A;', state: '2600' },
      { t2: 'commit;' },
    ],
    answer: 'none',
    level: 'rc',
    why: 'T2 sieht nur bestätigte Daten. Es gibt weder verlorene Änderungen noch ungültige Werte.',
  },
];

/* ---------------- Crash Recovery ---------------- */

export interface RecWrite {
  item: string;
  /** Die neue Version steht bereits in der persistenten Datenbank */
  persisted: boolean;
}
export interface RecTx {
  name: string;
  committed: boolean;
  writes: RecWrite[];
}
export interface RecTask {
  items: string[];
  txs: RecTx[];
}

export type Rnd = () => number;
const shuffle = <T,>(l: T[], r: Rnd): T[] => {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

/** Eine Aufgabe wie im Skript: drei Transaktionen, ein Systemfehler, sechs Datensätze */
export function genRecovery(r: Rnd): RecTask {
  const items = ['A', 'B', 'C', 'D', 'E', 'F'];
  let best: RecTask | null = null;
  for (let tries = 0; tries < 60; tries++) {
    const letters = shuffle(items, r).slice(0, 5);
    const counts = shuffle([1, 2, 2], r);
    const flags = shuffle(r() < 0.5 ? [true, true, false] : [true, false, false], r);
    let at = 0;
    const txs: RecTx[] = counts.map((n, i) => ({
      name: `T${i + 1}`,
      committed: flags[i],
      writes: letters.slice(at, (at += n)).map((item) => ({ item, persisted: r() < 0.5 })),
    }));
    const cand: RecTask = { items, txs };
    best = cand;
    const redo = txs.some((t) => t.committed && t.writes.some((w) => !w.persisted));
    const undo = txs.some((t) => !t.committed && t.writes.some((w) => w.persisted));
    if (redo && undo) return cand;
  }
  return best!;
}

/** Nach der Recovery steht die neue Version genau dann in der Datenbank, wenn die Transaktion committed ist */
export function afterRecovery(t: RecTask): Record<string, 'neu' | 'alt'> {
  const out: Record<string, 'neu' | 'alt'> = {};
  for (const i of t.items) out[i] = 'alt';
  for (const tx of t.txs) if (tx.committed) for (const w of tx.writes) out[w.item] = 'neu';
  return out;
}

/** Zustand der Datenbank unmittelbar nach dem Absturz */
export function afterCrash(t: RecTask): Record<string, 'neu' | 'alt'> {
  const out: Record<string, 'neu' | 'alt'> = {};
  for (const i of t.items) out[i] = 'alt';
  for (const tx of t.txs) for (const w of tx.writes) if (w.persisted) out[w.item] = 'neu';
  return out;
}

export const recoveryText = (tx: RecTx) =>
  `${tx.name} (${tx.committed ? 'committed' : 'offen'}): ` +
  tx.writes
    .map((w) => `${w.item}′ ${w.persisted ? 'wurde bereits auf der DB persistiert' : tx.committed ? 'war nur im persistierten Log' : 'war noch im Buffer'}`)
    .join('; ');

export function recoveryWhy(t: RecTask): string[] {
  const out: string[] = [];
  for (const tx of t.txs) {
    const items = tx.writes.map((w) => w.item).join(', ');
    if (tx.committed) {
      const missing = tx.writes.filter((w) => !w.persisted).map((w) => `${w.item}′`);
      out.push(
        missing.length
          ? `${tx.name} ist committed: ${missing.join(', ')} steht nur im Log und wird durch partielles REDO nachgezogen. Danach gilt ${tx.writes.map((w) => `${w.item}′`).join(', ')}.`
          : `${tx.name} ist committed und bereits persistiert: ${tx.writes.map((w) => `${w.item}′`).join(', ')} bleibt bestehen.`,
      );
    } else {
      const done = tx.writes.filter((w) => w.persisted).map((w) => w.item);
      out.push(
        done.length
          ? `${tx.name} war offen: ${done.map((x) => `${x}′`).join(', ')} wurde schon geschrieben und wird per UNDO zurückgesetzt. ${items} ist danach wieder im alten Zustand.`
          : `${tx.name} war offen, die Änderungen standen nur im Buffer und sind verloren. ${items} bleibt im alten Zustand.`,
      );
    }
  }
  return out;
}
