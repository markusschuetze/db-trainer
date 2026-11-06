import type { NfExercise } from './types';

const SRC = 'Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)';

export const nfExercises: NfExercise[] = [
  {
    id: 'fahrradteile',
    topicId: '05-1nf',
    title: 'Fahrradteile und Lieferanten',
    scenario:
      'Zu Fahrrädern wird gespeichert, welche Lieferanten sie liefern. Prüfe zuerst die 1. Normalform.',
    relation: {
      columns: ['TNr', 'Bezeichnung', 'Artikel_Typ', 'Preis', 'Umsatz_J', 'Lief_Nr', 'Zeitstempel'],
      pk: ['TNr'],
      rows: [
        ['1', 'Rocky Mountain Element', 'Mountainbike', '3500 €', '200', '1, 2', '06.10.23'],
        ['31', 'Herrenrad GT-LTS 18', 'Rennrad', '3500 $', '400', '1, 2, 3', '06.10.23'],
        ['57', 'Steppenwolf TAO', 'Mountainbike', '1900 €', '80', '2', '06.10.23'],
        ['58', 'SWITCHBACK AGENT', 'Jugendrad', '899 €', '80', '2, 3', '06.10.23'],
        ['59', 'STEVENS R.P.R.2 RX100', 'Rennmaschine', '1800 $', '80', '1', '06.10.23'],
      ],
    },
    oneNF: {
      ok: false,
      issues: [
        {
          column: 'Preis',
          type: 'strukturiert',
          why: 'Zahl und Währung stehen in einem Feld. Ein strukturiertes Attribut enthält Werte aus mehr als einer Domäne und wird in je ein Attribut pro Domäne aufgespalten (Preis, Währung).',
        },
        {
          column: 'Lief_Nr',
          type: 'mehrwertig',
          why: 'Mehrere Lieferanten stehen in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels.',
        },
      ],
      fixNote:
        'Preis ist in Preis und Währung aufgeteilt, jede Lieferantennummer hat ein eigenes Tupel. Lief_Nr ist jetzt Teil des Primärschlüssels.',
      fixed: {
        columns: ['TNr', 'Bezeichnung', 'Artikel_Typ', 'Preis', 'Währung', 'Umsatz_J', 'Lief_Nr', 'Zeitstempel'],
        pk: ['TNr', 'Lief_Nr'],
        rows: [
          ['1', 'Rocky Mountain Element', 'Mountainbike', '3500', '€', '200', '1', '06.10.23'],
          ['1', 'Rocky Mountain Element', 'Mountainbike', '3500', '€', '200', '2', '06.10.23'],
          ['31', 'Herrenrad GT-LTS 18', 'Rennrad', '3500', '$', '400', '1', '06.10.23'],
          ['31', 'Herrenrad GT-LTS 18', 'Rennrad', '3500', '$', '400', '2', '06.10.23'],
          ['31', 'Herrenrad GT-LTS 18', 'Rennrad', '3500', '$', '400', '3', '06.10.23'],
          ['57', 'Steppenwolf TAO', 'Mountainbike', '1900', '€', '80', '2', '06.10.23'],
          ['58', 'SWITCHBACK AGENT', 'Jugendrad', '899', '€', '80', '2', '06.10.23'],
          ['58', 'SWITCHBACK AGENT', 'Jugendrad', '899', '€', '80', '3', '06.10.23'],
          ['59', 'STEVENS R.P.R.2 RX100', 'Rennmaschine', '1800', '$', '80', '1', '06.10.23'],
        ],
      },
    },
    fds: [
      {
        lhs: ['TNr'],
        rhs: ['Bezeichnung', 'Artikel_Typ', 'Preis', 'Währung', 'Umsatz_J', 'Zeitstempel'],
        kind: 'partiell',
        why: 'Diese Attribute hängen schon von TNr allein ab, also nur von einem Teil des zusammengesetzten Schlüssels (TNr, Lief_Nr).',
      },
    ],
    highestNF: 1,
    target: [
      'Teil (TNr, Bezeichnung, Artikel_Typ, Preis, Währung, Umsatz_J, Zeitstempel)',
      'Liefert (TNr <fk>, Lief_Nr)',
    ],
    targetNote:
      'Die partiell abhängigen Attribute werden mit dem Teilschlüssel TNr ausgelagert. Übrig bleibt eine Relation, die nur aus dem ursprünglichen Schlüssel besteht (M:N-Beziehung ohne Attribut).',
    tags: ['1NF', '2NF'],
    source: SRC,
  },
  {
    id: 'mitarbeiter-projekte',
    topicId: '05-2nf',
    title: 'Mitarbeitende in Projekten',
    scenario:
      'Welche Mitarbeitenden arbeiten in welchen Projekten und in welcher Rolle? Die Tabelle ist bereits in 1NF.',
    relation: {
      columns: ['MitArb_ID', 'Projekt_ID', 'Rolle', 'ProjektName', 'MitArb_Name'],
      pk: ['MitArb_ID', 'Projekt_ID'],
      rows: [
        ['1', 'A35', 'Leitung', 'SocioHub', 'Kramer'],
        ['4', 'A35', 'IT', 'SocioHub', 'Lorenz'],
        ['56', 'A35', 'ProjectOwner', 'SocioHub', 'Sommer'],
        ['4', 'Z18', 'Leitung', 'Labor', 'Lorenz'],
        ['1', 'Z18', 'Tester', 'Labor', 'Kramer'],
      ],
    },
    oneNF: { ok: true, issues: [] },
    fds: [
      {
        lhs: ['MitArb_ID'],
        rhs: ['MitArb_Name'],
        kind: 'partiell',
        why: 'Der Name hängt nur von MitArb_ID ab, einem Teil des Schlüssels.',
      },
      {
        lhs: ['Projekt_ID'],
        rhs: ['ProjektName'],
        kind: 'partiell',
        why: 'Der Projektname hängt nur von Projekt_ID ab, dem anderen Teil des Schlüssels.',
      },
      {
        lhs: ['MitArb_ID', 'Projekt_ID'],
        rhs: ['Rolle'],
        kind: 'voll',
        why: 'Die Rolle ist erst durch die Kombination aus Mitarbeitendem und Projekt bestimmt. Beide Schlüsselteile werden benötigt.',
      },
    ],
    highestNF: 1,
    target: [
      'Mitarbeiter (MitArb_ID, MitArb_Name)',
      'Projekt (Projekt_ID, ProjektName)',
      'Arbeitet_in (MitArb_ID <fk>, Projekt_ID <fk>, Rolle)',
    ],
    targetNote:
      'Im Ergebnis ist Arbeitet_in eine M:N-Beziehung mit dem Attribut Rolle. Die Schlüsselteile verweisen als Fremdschlüssel auf die neuen Relationen.',
    tags: ['2NF'],
    source: SRC,
  },
  {
    id: 'bestellung-lieferant',
    topicId: '05-3nf',
    title: 'Bestellungen und Lieferanten',
    scenario:
      'Eine Bestellung (BNR) erfolgt zu einem Datum und wird über eine Liefernummer abgeschlossen, die durch Name und Adresse beschrieben wird.',
    relation: {
      columns: ['BNR', 'BDAT', 'LNR', 'LNAME', 'LADR'],
      pk: ['BNR'],
      rows: [
        ['1001', '04.11.2026', 'L1', 'Müller GmbH', 'Köln'],
        ['1002', '05.11.2026', 'L2', 'Schmidt AG', 'Bonn'],
        ['1003', '05.11.2026', 'L1', 'Müller GmbH', 'Köln'],
        ['1004', '06.11.2026', 'L1', 'Müller GmbH', 'Köln'],
      ],
    },
    oneNF: { ok: true, issues: [] },
    fds: [
      {
        lhs: ['BNR'],
        rhs: ['BDAT', 'LNR'],
        kind: 'voll',
        why: 'Datum und Lieferant gehören direkt zur Bestellung. Der Schlüssel ist nicht zusammengesetzt, daher kann nichts partiell sein.',
      },
      {
        lhs: ['LNR'],
        rhs: ['LNAME', 'LADR'],
        kind: 'transitiv',
        why: 'LNAME und LADR hängen von LNR ab und LNR hängt von BNR ab. Damit sind sie indirekt (transitiv) von BNR abhängig. Der Lieferant wird dadurch mehrfach gespeichert.',
      },
    ],
    highestNF: 2,
    target: ['Bestellung (BNR, BDAT, LNR <fk>)', 'Lieferant (LNR, LNAME, LADR)'],
    targetNote:
      'Das Attribut LNR, über das die Abhängigkeit läuft, wird Primärschlüssel der neuen Relation und bleibt in der Ursprungsrelation als Fremdschlüssel.',
    tags: ['3NF'],
    source: SRC,
  },
];
