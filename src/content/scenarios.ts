// Fall-Datenbanken (Szenarien) fuer DQL/DML. Jedes Szenario hat einen sichtbaren
// Datenbestand A und einen verdeckten Datenbestand B mit gleicher Struktur, aber
// anderen Werten: Wer Werte fest eintraegt statt Bedingungen zu formulieren, faellt auf.
//
// Neues Szenario: Datei in content/scenarios/ anlegen und hier eintragen.

import { DATA_A, DATA_B, HOCHSCHULE_SCHEMA, HOCHSCHULE_TABLES } from './hochschule';
import { GASTRO_A, GASTRO_B, GASTRO_RELATIONS, GASTRO_SCHEMA } from './scenarios/gastro';
import { PROJEKTE_A, PROJEKTE_B, PROJEKTE_RELATIONS, PROJEKTE_SCHEMA } from './scenarios/projekte';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  /** Bezug auf die Vorlesung */
  origin: string;
  schema: string;
  dataA: string;
  dataB: string;
  /** Tabellen in sinnvoller Reihenfolge (Eltern vor Kindern) */
  tables: string[];
  /** Relationenschema in Vorlesungsnotation */
  relations: string[];
}

export const scenarios: Scenario[] = [
  {
    id: 'hochschule',
    name: 'Hochschule',
    description: 'Fachbereiche, Professorinnen und Professoren, Studierende, Kurse und Anmeldungen mit Noten.',
    origin: 'Übung 05 (Kurs, Student, Anmelden), Skript 04/05 (Prof, Fachbereich)',
    schema: HOCHSCHULE_SCHEMA,
    dataA: DATA_A,
    dataB: DATA_B,
    tables: HOCHSCHULE_TABLES,
    relations: [
      'Fachbereich (FB_Nr, FB_Name)',
      'Prof (P_Nr, Name, FB_Nr <fk>, Raum)',
      'Student (Matrikelnummer, Namen, Studiengang, Semester, Geburtsdatum)',
      'Kurs (Kurs_ID, Bezeichnung, ECTS, P_Nr <fk>)',
      'Anmelden (Kurs_ID <fk>, Matrikelnummer <fk>, Anmeldedatum, Note)',
    ],
  },
  {
    id: 'gastro',
    name: 'Gastro',
    description: 'Bars, Cocktails, Zutaten, Rezepte und die Getränkekarte jeder Bar mit Preisen.',
    origin: 'Skript 01/02: Datenbank für einen Gastroüberblick (Bars, Cocktails, Zutaten)',
    schema: GASTRO_SCHEMA,
    dataA: GASTRO_A,
    dataB: GASTRO_B,
    tables: ['Bar', 'Cocktail', 'Zutat', 'Rezept', 'Karte'],
    relations: GASTRO_RELATIONS,
  },
  {
    id: 'projekte',
    name: 'Projekte',
    description: 'Abteilungen, Mitarbeitende mit Vorgesetzten (Selbstreferenz), Projekte und Rollen.',
    origin: 'Skript 03–05: Mitarbeiterin arbeitet in Projekt mit Rolle, Vorgesetzte, Abteilung',
    schema: PROJEKTE_SCHEMA,
    dataA: PROJEKTE_A,
    dataB: PROJEKTE_B,
    tables: ['Abteilung', 'Mitarbeiter', 'Projekt', 'Arbeitet_in'],
    relations: PROJEKTE_RELATIONS,
  },
];

export const scenarioById = (id = 'hochschule'): Scenario => scenarios.find((s) => s.id === id) ?? scenarios[0];

export const LEVEL_NAME = { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' } as const;
