import type { NfExercise } from './types';

const SRC = 'Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)';

export const nfExercises: NfExercise[] = [
  {
    id: 'fahrradteile',
    topicId: '05-1nf',
    title: 'Fahrradteile und Lieferanten',
    scenario:
      'Zu Fahrrädern wird gespeichert, welche Lieferanten sie liefern.',
    hint: 'Beginne mit der 1. Normalform: Sind alle Werte atomar?',
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
    tags: ['1NF'],
    source: SRC,
  },
  {
    id: 'mitarbeiter-projekte',
    topicId: '05-2nf',
    title: 'Mitarbeitende in Projekten',
    scenario:
      'Welche Mitarbeitenden arbeiten in welchen Projekten und in welcher Rolle?',
    hint: 'Beginne mit der 1. Normalform: Sind alle Werte atomar?',
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
  {
    id: 'kursbuchung',
    topicId: '05-3nf',
    title: 'Kursbuchungen',
    scenario:
      'Teilnehmende buchen Kurse, die von Dozierenden gehalten werden. Gespeichert werden Teilnehmende, Kurse, Dozierende und die erreichte Note.',
    hint: 'Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.',
    relation: {
      columns: ['TeilnNr', 'KursNr', 'Teilnehmer', 'KursTitel', 'DozNr', 'DozName', 'Note'],
      pk: ['TeilnNr', 'KursNr'],
      rows: [
        ['101', 'K1', 'Anna Berg', 'Datenbanken', 'D7', 'Lorenz', '1,7'],
        ['101', 'K2', 'Anna Berg', 'Netzwerke', 'D3', 'Sommer', '2,0'],
        ['102', 'K1', 'Ben Roth', 'Datenbanken', 'D7', 'Lorenz', '2,3'],
        ['103', 'K1', 'Clara Voss', 'Datenbanken', 'D7', 'Lorenz', '1,3'],
        ['103', 'K2', 'Clara Voss', 'Netzwerke', 'D3', 'Sommer', '2,7'],
      ],
    },
    oneNF: {
      ok: false,
      issues: [
        {
          column: 'Teilnehmer',
          type: 'strukturiert',
          why: 'Vor- und Nachname stehen in einem Feld. Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten (Vorname, Nachname).',
        },
      ],
      fixNote: 'Teilnehmer ist in Vorname und Nachname aufgeteilt. Der Schlüssel bleibt (TeilnNr, KursNr).',
      fixed: {
        columns: ['TeilnNr', 'KursNr', 'Vorname', 'Nachname', 'KursTitel', 'DozNr', 'DozName', 'Note'],
        pk: ['TeilnNr', 'KursNr'],
        rows: [
          ['101', 'K1', 'Anna', 'Berg', 'Datenbanken', 'D7', 'Lorenz', '1,7'],
          ['101', 'K2', 'Anna', 'Berg', 'Netzwerke', 'D3', 'Sommer', '2,0'],
          ['102', 'K1', 'Ben', 'Roth', 'Datenbanken', 'D7', 'Lorenz', '2,3'],
          ['103', 'K1', 'Clara', 'Voss', 'Datenbanken', 'D7', 'Lorenz', '1,3'],
          ['103', 'K2', 'Clara', 'Voss', 'Netzwerke', 'D3', 'Sommer', '2,7'],
        ],
      },
    },
    fds: [
      {
        lhs: ['TeilnNr'],
        rhs: ['Vorname', 'Nachname'],
        kind: 'partiell',
        why: 'Der Name der teilnehmenden Person hängt nur von TeilnNr ab, einem Teil des Schlüssels (TeilnNr, KursNr).',
      },
      {
        lhs: ['KursNr'],
        rhs: ['KursTitel', 'DozNr'],
        kind: 'partiell',
        why: 'Kurstitel und Dozent gehören zum Kurs und hängen nur von KursNr ab, dem anderen Teil des Schlüssels.',
      },
      {
        lhs: ['DozNr'],
        rhs: ['DozName'],
        kind: 'transitiv',
        why: 'DozName hängt von DozNr ab, einem Nicht-Schlüsselattribut. Damit hängt es nur indirekt vom Kurs ab (transitiv), und der Name würde bei jedem Kurs desselben Dozenten wiederholt.',
      },
      {
        lhs: ['TeilnNr', 'KursNr'],
        rhs: ['Note'],
        kind: 'voll',
        why: 'Die Note gehört zur Kombination aus Teilnehmendem und Kurs. Es werden beide Schlüsselteile benötigt.',
      },
    ],
    highestNF: 1,
    target: [
      'Teilnehmer (TeilnNr, Vorname, Nachname)',
      'Dozent (DozNr, DozName)',
      'Kurs (KursNr, KursTitel, DozNr <fk>)',
      'Belegt (TeilnNr <fk>, KursNr <fk>, Note)',
    ],
    targetNote:
      'Erst werden die partiellen Abhängigkeiten ausgelagert (2NF): Teilnehmer und Kurs bekommen eigene Relationen, Belegt behält die Note. Danach wird die transitive Abhängigkeit DozNr → DozName ausgelagert (3NF): Dozent wird eine eigene Relation, in Kurs bleibt DozNr als Fremdschlüssel.',
    tags: ['1NF', '2NF', '3NF'],
    source: SRC,
  },
];
