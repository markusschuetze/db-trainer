// Themen je Kapitel, gegliedert nach den Inhaltsfolien der Vorlesungsskripte
// ("Inhalte der heutigen Veranstaltung"). Jede Aufgabe und jede Wissensfrage gehoert
// zu genau einem Thema. Fortschritt, Lernmodus und Probeklausur arbeiten damit.
//
// Neues Thema: Eintrag hier ergaenzen und in Aufgaben ueber "topicId" verwenden.

import type { Chapter } from './mcQuestions';

export interface Topic {
  id: string;
  chapter: Chapter;
  title: string;
  /** Bezug auf die Folien */
  slides: string;
}

export const topics: Topic[] = [
  // 01 Einleitung
  { id: '01-dbms', chapter: '01', title: 'Datenbanksysteme und DBMS', slides: 'Herausforderungen mit Dateien, Datenmanager, Terminologie DBS/DBMS/DB' },
  { id: '01-phasen', chapter: '01', title: 'Phasen des Datenbankentwurfs', slides: 'Anforderungsanalyse, konzeptioneller, logischer und physischer Entwurf' },
  { id: '01-sql-acid', chapter: '01', title: 'SQL-Teilsprachen und ACID', slides: 'DDL, DML (CRUD), DQL, ACID-Prinzipien' },

  // 02 ERM
  { id: '02-elemente', chapter: '02', title: 'Entitäten, Beziehungen, Attribute', slides: 'Kernelemente des ERM, Instanzen, obligatorische und optionale Attribute' },
  { id: '02-kardinalitaet', chapter: '02', title: 'Kardinalitäten 1:1, 1:N, M:N', slides: 'Kardinalitäten als Integritätsbedingungen' },
  { id: '02-kraehenfuss', chapter: '02', title: 'Krähenfußnotation (Minimum/Maximum)', slides: 'kann/muss, Leserichtung von der Mitte zur Entität' },

  // 03 eERM
  { id: '03-schluessel', chapter: '03', title: 'Primärschlüssel und Schlüsselkandidaten', slides: 'natürlicher, zusammengesetzter und künstlicher Schlüssel' },
  { id: '03-schwach', chapter: '03', title: 'Schwache Entitäten und M:N-Auflösung', slides: 'identifizierende Beziehungen, Beziehungen mit Attributen' },
  { id: '03-spezialisierung', chapter: '03', title: 'Spezialisierung und Generalisierung', slides: 'disjunkt/überlappend, vollständig/partiell' },

  // 04 Relationenmodell
  { id: '04-grundlagen', chapter: '04', title: 'Relation, Tupel, Grundregeln', slides: 'Terminologie, Grundregeln nach Codd' },
  { id: '04-fk-1n', chapter: '04', title: 'Fremdschlüssel und 1:N-Beziehungen', slides: 'FK auf der N-Seite, NULL/NOT NULL als Minimalkardinalität' },
  { id: '04-mn', chapter: '04', title: 'M:N-Beziehungen und Zuordnungsrelationen', slides: 'Zuordnungsrelation, FKs als Primärschlüssel' },
  { id: '04-11-rekursiv', chapter: '04', title: '1:1- und rekursive Beziehungen', slides: 'Alternativschlüssel, Selbstreferenz' },
  { id: '04-spezialisierung', chapter: '04', title: 'Abbildung von Spezialisierungen', slides: 'Hausklassen, Partitionierung, volle Redundanz, Hierarchierelation' },

  // 05 Normalisierung
  { id: '05-anomalien', chapter: '05', title: 'Anomalien und Motivation', slides: 'Redundanz, Einfüge-, Änderungs-, Löschanomalie' },
  { id: '05-1nf', chapter: '05', title: '1NF: mehrwertige und strukturierte Attribute', slides: 'atomare Werte, Auflösen, abhängige mehrwertige Attribute' },
  { id: '05-2nf', chapter: '05', title: '2NF: partielle Abhängigkeiten', slides: 'volle vs. partielle funktionale Abhängigkeit, Transformation 1NF → 2NF' },
  { id: '05-3nf', chapter: '05', title: '3NF: transitive Abhängigkeiten', slides: 'transitive Abhängigkeit, Transformation 2NF → 3NF' },

  // 06 SQL-DDL
  { id: '06-create', chapter: '06', title: 'CREATE TABLE und Oracle-Datentypen', slides: 'NUMBER, CHAR, VARCHAR2, DATE, BLOB' },
  { id: '06-constraints', chapter: '06', title: 'Spalten- und Tabellenconstraints', slides: 'NOT NULL, UNIQUE, CHECK, DEFAULT, benannte Constraints' },
  { id: '06-fk', chapter: '06', title: 'Fremdschlüssel und referenzielle Integrität', slides: 'REFERENCES, Reihenfolge, restricted vs. CASCADE' },
  { id: '06-alter-drop', chapter: '06', title: 'ALTER und DROP', slides: 'ADD CONSTRAINT, DROP TABLE … CASCADE CONSTRAINTS' },
  { id: '06-identity', chapter: '06', title: 'Identity Column und Sequenzen', slides: 'GENERATED … AS IDENTITY' },

  // SQL-DML/DQL
  { id: 'sql-select', chapter: 'SQL', title: 'SELECT, WHERE, ORDER BY', slides: 'Projektion, Selektion, Sortierung, LIKE, NULL' },
  { id: 'sql-funktionen', chapter: 'SQL', title: 'Zeilen- und Datumsfunktionen', slides: 'NVL, UPPER, TO_DATE, TO_CHAR' },
  { id: 'sql-gruppen', chapter: 'SQL', title: 'Aggregation, GROUP BY, HAVING', slides: 'COUNT, AVG, Gruppenbedingungen' },
  { id: 'sql-join', chapter: 'SQL', title: 'Joins', slides: 'INNER und OUTER JOIN' },
  { id: 'sql-unterabfrage', chapter: 'SQL', title: 'Unterabfragen und Mengenoperationen', slides: 'EXISTS, IN, skalare Unterabfragen, MINUS' },
  { id: 'sql-dml', chapter: 'SQL', title: 'INSERT, UPDATE, DELETE', slides: 'Datenänderung, Fremdschlüssel beim Löschen' },
];

export const topicById = (id: string) => topics.find((t) => t.id === id);
export const topicsOf = (c: Chapter) => topics.filter((t) => t.chapter === c);
