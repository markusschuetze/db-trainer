// GENERIERT von scripts/content/nf_more.py, nicht von Hand bearbeiten.
// Weitere Normalisierungsaufgaben: je Bereich (1NF, 2NF, 3NF, ganzheitlich) zusammen mit exercises.ts mindestens 8.
import type { NfExercise } from './types';

export const moreNfExercises: NfExercise[] = [
 {
  "id": "kunden-telefon",
  "topicId": "05-1nf",
  "title": "Kunden und Telefonnummern",
  "scenario": "Zu Kundinnen und Kunden werden Name, Ort und Telefonnummern gespeichert.",
  "glossary": {
   "KdNr": "Kundennummer",
   "Ort": "Wohnort"
  },
  "relation": {
   "columns": [
    "KdNr",
    "Name",
    "Ort",
    "Telefon"
   ],
   "pk": [
    "KdNr"
   ],
   "rows": [
    [
     "1",
     "Berg",
     "Köln",
     "0221 4711, 0171 9988"
    ],
    [
     "2",
     "Roth",
     "Bonn",
     "0228 1234"
    ],
    [
     "3",
     "Voss",
     "Köln",
     "0221 8080, 02261 55"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Telefon",
     "type": "mehrwertig",
     "why": "Telefon enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels."
    }
   ],
   "fixNote": "Jeder Wert aus Telefon hat ein eigenes Tupel, Telefon ist jetzt Teil des Primärschlüssels.",
   "fixed": {
    "columns": [
     "KdNr",
     "Name",
     "Ort",
     "Telefon"
    ],
    "pk": [
     "KdNr",
     "Telefon"
    ],
    "rows": [
     [
      "1",
      "Berg",
      "Köln",
      "0221 4711"
     ],
     [
      "1",
      "Berg",
      "Köln",
      "0171 9988"
     ],
     [
      "2",
      "Roth",
      "Bonn",
      "0228 1234"
     ],
     [
      "3",
      "Voss",
      "Köln",
      "0221 8080"
     ],
     [
      "3",
      "Voss",
      "Köln",
      "02261 55"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "KdNr"
    ],
    "rhs": [
     "Name",
     "Ort"
    ],
    "kind": "partiell",
    "why": "Name, Ort hängt nur von KdNr ab, einem Teil des Schlüssels."
   }
  ],
  "highestNF": 1,
  "target": [
   "Relation in 1NF (KdNr, Name, Ort, Telefon)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "adressbuch",
  "topicId": "05-1nf",
  "title": "Adressbuch",
  "scenario": "Ein Adressbuch speichert zu jedem Kontakt Name und Anschrift.",
  "glossary": {
   "KtNr": "Kontaktnummer",
   "Anschrift": "Straße und Ort"
  },
  "relation": {
   "columns": [
    "KtNr",
    "Name",
    "Anschrift"
   ],
   "pk": [
    "KtNr"
   ],
   "rows": [
    [
     "1",
     "Anna Berg",
     "Hauptstr. 5, Gummersbach"
    ],
    [
     "2",
     "Ben Roth",
     "Ring 7, Köln"
    ],
    [
     "3",
     "Clara Voss",
     "Bahnhofstr. 2, Bonn"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Name",
     "type": "strukturiert",
     "why": "Name enthält mehrere Angaben in einem Feld (Vorname, Nachname). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    },
    {
     "column": "Anschrift",
     "type": "strukturiert",
     "why": "Anschrift enthält mehrere Angaben in einem Feld (Straße, Ort). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Name ist in Vorname und Nachname aufgeteilt. Anschrift ist in Straße und Ort aufgeteilt.",
   "fixed": {
    "columns": [
     "KtNr",
     "Vorname",
     "Nachname",
     "Straße",
     "Ort"
    ],
    "pk": [
     "KtNr"
    ],
    "rows": [
     [
      "1",
      "Anna",
      "Berg",
      "Hauptstr. 5",
      "Gummersbach"
     ],
     [
      "2",
      "Ben",
      "Roth",
      "Ring 7",
      "Köln"
     ],
     [
      "3",
      "Clara",
      "Voss",
      "Bahnhofstr. 2",
      "Bonn"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "KtNr"
    ],
    "rhs": [
     "Vorname",
     "Nachname",
     "Straße",
     "Ort"
    ],
    "kind": "voll",
    "why": "Vorname, Nachname, Straße, Ort hängt vom gesamten Schlüssel (KtNr) ab."
   }
  ],
  "highestNF": 3,
  "target": [
   "Relation in 1NF (KtNr, Vorname, Nachname, Straße, Ort)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "band-trap",
  "topicId": "05-1nf",
  "title": "Bands im Archiv",
  "scenario": "Ein Musikarchiv speichert Bands mit Genre und Gründungsjahr.",
  "glossary": {
   "BandNr": "Bandnummer",
   "Gegruendet": "Gründungsjahr"
  },
  "relation": {
   "columns": [
    "BandNr",
    "Name",
    "Genre",
    "Gegruendet"
   ],
   "pk": [
    "BandNr"
   ],
   "rows": [
    [
     "1",
     "Earth, Wind & Fire",
     "Funk",
     "1971"
    ],
    [
     "2",
     "AC/DC",
     "Rock",
     "1973"
    ],
    [
     "3",
     "Simon & Garfunkel",
     "Folk",
     "1957"
    ],
    [
     "4",
     "Crosby, Stills, Nash & Young",
     "Rock",
     "1968"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": [],
   "fixNote": "Achtung, Falle: Kommas und „&“ gehören hier zum Namen der Band („Earth, Wind & Fire“ ist ein einziger Wert). Mehrwertig wäre nur, wenn mehrere voneinander unabhängige Werte in einem Feld stünden."
  },
  "fds": [
   {
    "lhs": [
     "BandNr"
    ],
    "rhs": [
     "Name",
     "Genre",
     "Gegruendet"
    ],
    "kind": "voll",
    "why": "Name, Genre, Gegruendet hängt vom gesamten Schlüssel (BandNr) ab."
   }
  ],
  "highestNF": 3,
  "target": [
   "Relation in 1NF (BandNr, Name, Genre, Gegruendet)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "buch-autoren",
  "topicId": "05-1nf",
  "title": "Bücher und Autoren",
  "scenario": "Eine Buchhandlung verwaltet Bücher mit Autoren, Verlag und Preis.",
  "glossary": {
   "ISBN": "Internationale Standardbuchnummer",
   "Autoren": "Autorinnen und Autoren"
  },
  "relation": {
   "columns": [
    "ISBN",
    "Titel",
    "Autoren",
    "Verlag",
    "Preis"
   ],
   "pk": [
    "ISBN"
   ],
   "rows": [
    [
     "978-1",
     "Datenbanken",
     "Meier; Schulz",
     "Pearson",
     "29,90 €"
    ],
    [
     "978-2",
     "Netzwerke",
     "Kaya",
     "Springer",
     "34,00 €"
    ],
    [
     "978-3",
     "Statistik",
     "Lang; Voss; Roth",
     "Pearson",
     "24,50 $"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Autoren",
     "type": "mehrwertig",
     "why": "Autoren enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels."
    },
    {
     "column": "Preis",
     "type": "strukturiert",
     "why": "Preis enthält mehrere Angaben in einem Feld (Preis, Währung). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Jeder Wert aus Autoren hat ein eigenes Tupel, Autoren ist jetzt Teil des Primärschlüssels. Preis ist in Preis und Währung aufgeteilt.",
   "fixed": {
    "columns": [
     "ISBN",
     "Titel",
     "Autoren",
     "Verlag",
     "Preis",
     "Währung"
    ],
    "pk": [
     "ISBN",
     "Autoren"
    ],
    "rows": [
     [
      "978-1",
      "Datenbanken",
      "Meier",
      "Pearson",
      "29,90",
      "€"
     ],
     [
      "978-1",
      "Datenbanken",
      "Schulz",
      "Pearson",
      "29,90",
      "€"
     ],
     [
      "978-2",
      "Netzwerke",
      "Kaya",
      "Springer",
      "34,00",
      "€"
     ],
     [
      "978-3",
      "Statistik",
      "Lang",
      "Pearson",
      "24,50",
      "$"
     ],
     [
      "978-3",
      "Statistik",
      "Voss",
      "Pearson",
      "24,50",
      "$"
     ],
     [
      "978-3",
      "Statistik",
      "Roth",
      "Pearson",
      "24,50",
      "$"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "ISBN"
    ],
    "rhs": [
     "Titel",
     "Verlag",
     "Preis",
     "Währung"
    ],
    "kind": "partiell",
    "why": "Titel, Verlag, Preis, Währung hängt nur von ISBN ab, einem Teil des Schlüssels."
   }
  ],
  "highestNF": 1,
  "target": [
   "Relation in 1NF (ISBN, Titel, Autoren, Verlag, Preis, Währung)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "raum-trap",
  "topicId": "05-1nf",
  "title": "Räume der Hochschule",
  "scenario": "Die Raumverwaltung speichert Räume mit Bezeichnung, Standort und Plätzen.",
  "glossary": {
   "RaumNr": "Raumnummer",
   "Plaetze": "Anzahl Sitzplätze"
  },
  "relation": {
   "columns": [
    "RaumNr",
    "Bezeichnung",
    "Gebaeude",
    "Plaetze"
   ],
   "pk": [
    "RaumNr"
   ],
   "rows": [
    [
     "R1",
     "A 1.04",
     "Campus Gummersbach",
     "48"
    ],
    [
     "R2",
     "B 2.11",
     "Campus Gummersbach",
     "120"
    ],
    [
     "R3",
     "Hörsaal 3",
     "Campus Deutz",
     "300"
    ],
    [
     "R4",
     "Labor C 0.02",
     "Campus Gummersbach",
     "24"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": [],
   "fixNote": "Achtung, Falle: „A 1.04“ oder „Campus Gummersbach“ sehen zusammengesetzt aus, sind aber je ein einzelner, nicht weiter sinnvoll teilbarer Wert. Atomar heißt nicht „ein Wort“."
  },
  "fds": [
   {
    "lhs": [
     "RaumNr"
    ],
    "rhs": [
     "Bezeichnung",
     "Gebaeude",
     "Plaetze"
    ],
    "kind": "voll",
    "why": "Bezeichnung, Gebaeude, Plaetze hängt vom gesamten Schlüssel (RaumNr) ab."
   }
  ],
  "highestNF": 3,
  "target": [
   "Relation in 1NF (RaumNr, Bezeichnung, Gebaeude, Plaetze)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "rezept-zutaten",
  "topicId": "05-1nf",
  "title": "Rezeptsammlung",
  "scenario": "Eine Rezeptsammlung speichert Rezepte mit Zutaten und Zubereitungsdauer.",
  "glossary": {
   "RezNr": "Rezeptnummer",
   "Dauer": "Zubereitungsdauer"
  },
  "relation": {
   "columns": [
    "RezNr",
    "Name",
    "Zutaten",
    "Dauer"
   ],
   "pk": [
    "RezNr"
   ],
   "rows": [
    [
     "1",
     "Pfannkuchen",
     "Mehl, Eier, Milch",
     "20 min"
    ],
    [
     "2",
     "Salat",
     "Tomaten, Gurke",
     "10 min"
    ],
    [
     "3",
     "Rührei",
     "Eier, Butter",
     "5 min"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Zutaten",
     "type": "mehrwertig",
     "why": "Zutaten enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels."
    },
    {
     "column": "Dauer",
     "type": "strukturiert",
     "why": "Dauer enthält mehrere Angaben in einem Feld (Dauer, Einheit). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Jeder Wert aus Zutaten hat ein eigenes Tupel, Zutaten ist jetzt Teil des Primärschlüssels. Dauer ist in Dauer und Einheit aufgeteilt.",
   "fixed": {
    "columns": [
     "RezNr",
     "Name",
     "Zutaten",
     "Dauer",
     "Einheit"
    ],
    "pk": [
     "RezNr",
     "Zutaten"
    ],
    "rows": [
     [
      "1",
      "Pfannkuchen",
      "Mehl",
      "20",
      "min"
     ],
     [
      "1",
      "Pfannkuchen",
      "Eier",
      "20",
      "min"
     ],
     [
      "1",
      "Pfannkuchen",
      "Milch",
      "20",
      "min"
     ],
     [
      "2",
      "Salat",
      "Tomaten",
      "10",
      "min"
     ],
     [
      "2",
      "Salat",
      "Gurke",
      "10",
      "min"
     ],
     [
      "3",
      "Rührei",
      "Eier",
      "5",
      "min"
     ],
     [
      "3",
      "Rührei",
      "Butter",
      "5",
      "min"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "RezNr"
    ],
    "rhs": [
     "Name",
     "Dauer",
     "Einheit"
    ],
    "kind": "partiell",
    "why": "Name, Dauer, Einheit hängt nur von RezNr ab, einem Teil des Schlüssels."
   }
  ],
  "highestNF": 1,
  "target": [
   "Relation in 1NF (RezNr, Name, Zutaten, Dauer, Einheit)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "kurs-termine",
  "topicId": "05-1nf",
  "title": "Kurse und Termine",
  "scenario": "Eine Weiterbildung verwaltet Kurse mit Raum und wöchentlichen Terminen.",
  "glossary": {
   "KursNr": "Kursnummer",
   "Termine": "Wochentag und Uhrzeit"
  },
  "relation": {
   "columns": [
    "KursNr",
    "Titel",
    "Raum",
    "Termine"
   ],
   "pk": [
    "KursNr"
   ],
   "rows": [
    [
     "K1",
     "Datenbanken",
     "A1",
     "Mo 10:00, Mi 14:00"
    ],
    [
     "K2",
     "Netzwerke",
     "B2",
     "Di 08:00"
    ],
    [
     "K3",
     "Statistik",
     "A1",
     "Do 12:00, Fr 10:00, Fr 14:00"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Termine",
     "type": "mehrwertig",
     "why": "Termine enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels."
    }
   ],
   "fixNote": "Jeder Wert aus Termine hat ein eigenes Tupel, Termine ist jetzt Teil des Primärschlüssels.",
   "fixed": {
    "columns": [
     "KursNr",
     "Titel",
     "Raum",
     "Termine"
    ],
    "pk": [
     "KursNr",
     "Termine"
    ],
    "rows": [
     [
      "K1",
      "Datenbanken",
      "A1",
      "Mo 10:00"
     ],
     [
      "K1",
      "Datenbanken",
      "A1",
      "Mi 14:00"
     ],
     [
      "K2",
      "Netzwerke",
      "B2",
      "Di 08:00"
     ],
     [
      "K3",
      "Statistik",
      "A1",
      "Do 12:00"
     ],
     [
      "K3",
      "Statistik",
      "A1",
      "Fr 10:00"
     ],
     [
      "K3",
      "Statistik",
      "A1",
      "Fr 14:00"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "KursNr"
    ],
    "rhs": [
     "Titel",
     "Raum"
    ],
    "kind": "partiell",
    "why": "Titel, Raum hängt nur von KursNr ab, einem Teil des Schlüssels."
   }
  ],
  "highestNF": 1,
  "target": [
   "Relation in 1NF (KursNr, Titel, Raum, Termine)"
  ],
  "tags": [
   "1NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "lieferung-teile",
  "topicId": "05-2nf",
  "title": "Lieferungen von Teilen",
  "scenario": "Lieferanten liefern Teile in bestimmten Mengen.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "LiefNr": "Lieferantennummer",
   "TeilNr": "Teilenummer",
   "LiefName": "Name des Lieferanten",
   "TeilName": "Bezeichnung des Teils"
  },
  "relation": {
   "columns": [
    "LiefNr",
    "TeilNr",
    "Menge",
    "LiefName",
    "TeilName"
   ],
   "pk": [
    "LiefNr",
    "TeilNr"
   ],
   "rows": [
    [
     "L1",
     "T1",
     "100",
     "Müller",
     "Schraube"
    ],
    [
     "L1",
     "T2",
     "50",
     "Müller",
     "Mutter"
    ],
    [
     "L2",
     "T1",
     "70",
     "Schmidt",
     "Schraube"
    ],
    [
     "L3",
     "T3",
     "20",
     "Kaya",
     "Dübel"
    ],
    [
     "L2",
     "T3",
     "30",
     "Schmidt",
     "Dübel"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "LiefNr"
    ],
    "rhs": [
     "LiefName"
    ],
    "kind": "partiell",
    "why": "LiefName hängt nur von LiefNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "TeilNr"
    ],
    "rhs": [
     "TeilName"
    ],
    "kind": "partiell",
    "why": "TeilName hängt nur von TeilNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "LiefNr",
     "TeilNr"
    ],
    "rhs": [
     "Menge"
    ],
    "kind": "voll",
    "why": "Menge hängt vom gesamten Schlüssel (LiefNr, TeilNr) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Lieferant",
      "columns": [
       {
        "name": "LiefNr",
        "pk": true
       },
       {
        "name": "LiefName"
       }
      ]
     },
     {
      "name": "Teil",
      "columns": [
       {
        "name": "TeilNr",
        "pk": true
       },
       {
        "name": "TeilName"
       }
      ]
     },
     {
      "name": "Liefert",
      "columns": [
       {
        "name": "LiefNr",
        "fk": "Lieferant",
        "pk": true
       },
       {
        "name": "TeilNr",
        "fk": "Teil",
        "pk": true
       },
       {
        "name": "Menge"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Lieferant (LiefNr, LiefName)",
   "Teil (TeilNr, TeilName)",
   "Liefert (LiefNr <fk>, TeilNr <fk>, Menge)"
  ],
  "targetNote": "Name des Lieferanten und Bezeichnung des Teils werden mit ihren Teilschlüsseln ausgelagert. Liefert behält die Menge, die nur durch beide Schlüsselteile bestimmt ist.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "pruefung-ergebnis",
  "topicId": "05-2nf",
  "title": "Prüfungsergebnisse",
  "scenario": "Studierende legen Prüfungen in Fächern ab und erhalten Noten.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "MatrNr": "Matrikelnummer",
   "FachNr": "Fachnummer",
   "StudName": "Name der Studentin bzw. des Studenten",
   "Credits": "Leistungspunkte des Fachs"
  },
  "relation": {
   "columns": [
    "MatrNr",
    "FachNr",
    "Note",
    "StudName",
    "FachName",
    "Credits"
   ],
   "pk": [
    "MatrNr",
    "FachNr"
   ],
   "rows": [
    [
     "1001",
     "F1",
     "1,7",
     "Berg",
     "Datenbanken",
     "6"
    ],
    [
     "1001",
     "F2",
     "2,3",
     "Berg",
     "Netzwerke",
     "5"
    ],
    [
     "1002",
     "F1",
     "3,0",
     "Roth",
     "Datenbanken",
     "6"
    ],
    [
     "1003",
     "F2",
     "1,3",
     "Voss",
     "Netzwerke",
     "5"
    ],
    [
     "1003",
     "F1",
     "2,0",
     "Voss",
     "Datenbanken",
     "6"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "MatrNr"
    ],
    "rhs": [
     "StudName"
    ],
    "kind": "partiell",
    "why": "StudName hängt nur von MatrNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "FachNr"
    ],
    "rhs": [
     "FachName",
     "Credits"
    ],
    "kind": "partiell",
    "why": "FachName, Credits hängt nur von FachNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "MatrNr",
     "FachNr"
    ],
    "rhs": [
     "Note"
    ],
    "kind": "voll",
    "why": "Note hängt vom gesamten Schlüssel (MatrNr, FachNr) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Student",
      "columns": [
       {
        "name": "MatrNr",
        "pk": true
       },
       {
        "name": "StudName"
       }
      ]
     },
     {
      "name": "Fach",
      "columns": [
       {
        "name": "FachNr",
        "pk": true
       },
       {
        "name": "FachName"
       },
       {
        "name": "Credits"
       }
      ]
     },
     {
      "name": "Prueft",
      "columns": [
       {
        "name": "MatrNr",
        "fk": "Student",
        "pk": true
       },
       {
        "name": "FachNr",
        "fk": "Fach",
        "pk": true
       },
       {
        "name": "Note"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Student (MatrNr, StudName)",
   "Fach (FachNr, FachName, Credits)",
   "Prueft (MatrNr <fk>, FachNr <fk>, Note)"
  ],
  "targetNote": "Die Credits gehören zum Fach und nicht zur einzelnen Prüfung. Nur die Note hängt von Studierendem und Fach zugleich ab.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "auftragsposition",
  "topicId": "05-2nf",
  "title": "Aufträge und Positionen",
  "scenario": "Aufträge enthalten Positionen mit Artikel, Menge und Rabatt.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "AuftrNr": "Auftragsnummer",
   "ArtNr": "Artikelnummer",
   "ArtBez": "Artikelbezeichnung",
   "ArtPreis": "Listenpreis des Artikels"
  },
  "relation": {
   "columns": [
    "AuftrNr",
    "ArtNr",
    "Menge",
    "Rabatt",
    "ArtBez",
    "ArtPreis",
    "Auftragsdatum"
   ],
   "pk": [
    "AuftrNr",
    "ArtNr"
   ],
   "rows": [
    [
     "A1",
     "P1",
     "10",
     "0",
     "Stift",
     "1,20",
     "03.11."
    ],
    [
     "A1",
     "P2",
     "2",
     "5",
     "Block",
     "3,50",
     "03.11."
    ],
    [
     "A2",
     "P1",
     "100",
     "10",
     "Stift",
     "1,20",
     "04.11."
    ],
    [
     "A3",
     "P2",
     "5",
     "0",
     "Block",
     "3,50",
     "05.11."
    ],
    [
     "A3",
     "P1",
     "20",
     "5",
     "Stift",
     "1,20",
     "05.11."
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "AuftrNr"
    ],
    "rhs": [
     "Auftragsdatum"
    ],
    "kind": "partiell",
    "why": "Auftragsdatum hängt nur von AuftrNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "ArtNr"
    ],
    "rhs": [
     "ArtBez",
     "ArtPreis"
    ],
    "kind": "partiell",
    "why": "ArtBez, ArtPreis hängt nur von ArtNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "AuftrNr",
     "ArtNr"
    ],
    "rhs": [
     "Menge",
     "Rabatt"
    ],
    "kind": "voll",
    "why": "Menge, Rabatt hängt vom gesamten Schlüssel (AuftrNr, ArtNr) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Auftrag",
      "columns": [
       {
        "name": "AuftrNr",
        "pk": true
       },
       {
        "name": "Auftragsdatum"
       }
      ]
     },
     {
      "name": "Artikel",
      "columns": [
       {
        "name": "ArtNr",
        "pk": true
       },
       {
        "name": "ArtBez"
       },
       {
        "name": "ArtPreis"
       }
      ]
     },
     {
      "name": "Position",
      "columns": [
       {
        "name": "AuftrNr",
        "fk": "Auftrag",
        "pk": true
       },
       {
        "name": "ArtNr",
        "fk": "Artikel",
        "pk": true
       },
       {
        "name": "Menge"
       },
       {
        "name": "Rabatt"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Auftrag (AuftrNr, Auftragsdatum)",
   "Artikel (ArtNr, ArtBez, ArtPreis)",
   "Position (AuftrNr <fk>, ArtNr <fk>, Menge, Rabatt)"
  ],
  "targetNote": "Achtung, Falle: Der Rabatt sieht artikelbezogen aus, unterscheidet sich aber je Auftrag (Stift: 0, 10 und 5 Prozent). Er hängt deshalb von Auftrag und Artikel zusammen ab und bleibt in der Position.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "zimmerbelegung",
  "topicId": "05-2nf",
  "title": "Zimmerbelegung im Hotel",
  "scenario": "Ein Hotel speichert, wer an welchem Tag welches Zimmer belegt.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "ZimmerNr": "Zimmernummer",
   "Preis": "Preis pro Nacht"
  },
  "relation": {
   "columns": [
    "ZimmerNr",
    "Datum",
    "Gast",
    "Zimmerart",
    "Preis"
   ],
   "pk": [
    "ZimmerNr",
    "Datum"
   ],
   "rows": [
    [
     "101",
     "03.11.",
     "Berg",
     "Einzel",
     "80"
    ],
    [
     "101",
     "04.11.",
     "Roth",
     "Einzel",
     "80"
    ],
    [
     "102",
     "03.11.",
     "Voss",
     "Doppel",
     "120"
    ],
    [
     "102",
     "05.11.",
     "Berg",
     "Doppel",
     "120"
    ],
    [
     "103",
     "03.11.",
     "Kaya",
     "Suite",
     "250"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "ZimmerNr"
    ],
    "rhs": [
     "Zimmerart",
     "Preis"
    ],
    "kind": "partiell",
    "why": "Zimmerart, Preis hängt nur von ZimmerNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "ZimmerNr",
     "Datum"
    ],
    "rhs": [
     "Gast"
    ],
    "kind": "voll",
    "why": "Gast hängt vom gesamten Schlüssel (ZimmerNr, Datum) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Zimmer",
      "columns": [
       {
        "name": "ZimmerNr",
        "pk": true
       },
       {
        "name": "Zimmerart"
       },
       {
        "name": "Preis"
       }
      ]
     },
     {
      "name": "Belegung",
      "columns": [
       {
        "name": "ZimmerNr",
        "fk": "Zimmer",
        "pk": true
       },
       {
        "name": "Datum",
        "pk": true
       },
       {
        "name": "Gast"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Zimmer (ZimmerNr, Zimmerart, Preis)",
   "Belegung (ZimmerNr <fk>, Datum, Gast)"
  ],
  "targetNote": "Achtung, Falle: Datum gehört zum Schlüssel von Belegung, ist aber kein Fremdschlüssel, denn es gibt keine eigene Datumsrelation.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "schulung-trap",
  "topicId": "05-2nf",
  "title": "Schulungsteilnahme",
  "scenario": "Beschäftigte nehmen an Schulungen teil und erhalten Zertifikate.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "PersNr": "Personalnummer",
   "KursNr": "Schulungsnummer",
   "ZertNr": "Zertifikatsnummer"
  },
  "relation": {
   "columns": [
    "PersNr",
    "KursNr",
    "Teilnahmedatum",
    "Bestanden",
    "ZertNr"
   ],
   "pk": [
    "PersNr",
    "KursNr"
   ],
   "rows": [
    [
     "P1",
     "K1",
     "03.11.",
     "ja",
     "Z100"
    ],
    [
     "P1",
     "K2",
     "10.11.",
     "nein",
     "Z101"
    ],
    [
     "P2",
     "K1",
     "03.11.",
     "ja",
     "Z102"
    ],
    [
     "P3",
     "K2",
     "10.11.",
     "ja",
     "Z103"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "PersNr",
     "KursNr"
    ],
    "rhs": [
     "Teilnahmedatum",
     "Bestanden",
     "ZertNr"
    ],
    "kind": "voll",
    "why": "Teilnahmedatum, Bestanden, ZertNr hängt vom gesamten Schlüssel (PersNr, KursNr) ab."
   }
  ],
  "highestNF": 3,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Teilnahme",
      "columns": [
       {
        "name": "PersNr",
        "pk": true
       },
       {
        "name": "KursNr",
        "pk": true
       },
       {
        "name": "Teilnahmedatum"
       },
       {
        "name": "Bestanden"
       },
       {
        "name": "ZertNr"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Teilnahme (PersNr, KursNr, Teilnahmedatum, Bestanden, ZertNr)"
  ],
  "targetNote": "Achtung, Falle: Hier ist nichts auszulagern. Der Schlüssel ist zusammengesetzt, aber jedes Attribut hängt von beiden Teilen ab (jede Teilnahme hat ihr eigenes Datum, Ergebnis und Zertifikat). Die Relation ist bereits in 2NF.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "produkt-trap",
  "topicId": "05-2nf",
  "title": "Produktkatalog",
  "scenario": "Ein Katalog führt Produkte mit Name, Preis und Kategorie.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "ProdNr": "Produktnummer"
  },
  "relation": {
   "columns": [
    "ProdNr",
    "Name",
    "Preis",
    "Kategorie"
   ],
   "pk": [
    "ProdNr"
   ],
   "rows": [
    [
     "1",
     "Stift",
     "1,20",
     "Büro"
    ],
    [
     "2",
     "Block",
     "3,50",
     "Büro"
    ],
    [
     "3",
     "Gießkanne",
     "12,00",
     "Garten"
    ],
    [
     "4",
     "Spaten",
     "19,90",
     "Garten"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "ProdNr"
    ],
    "rhs": [
     "Name",
     "Preis",
     "Kategorie"
    ],
    "kind": "voll",
    "why": "Name, Preis, Kategorie hängt vom gesamten Schlüssel (ProdNr) ab."
   }
  ],
  "highestNF": 3,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Produkt",
      "columns": [
       {
        "name": "ProdNr",
        "pk": true
       },
       {
        "name": "Name"
       },
       {
        "name": "Preis"
       },
       {
        "name": "Kategorie"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Produkt (ProdNr, Name, Preis, Kategorie)"
  ],
  "targetNote": "Achtung, Falle: Bei einem einfachen Primärschlüssel kann es keine partielle Abhängigkeit geben. Auch die Kategorie wiederholt sich zwar, hängt aber nicht von einem anderen Attribut ab, sondern direkt vom Produkt.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "projekt-stunden",
  "topicId": "05-2nf",
  "title": "Stundenerfassung",
  "scenario": "Beschäftigte erfassen Stunden auf Projekten.",
  "hint": "Beginne mit der 1. Normalform: Sind alle Werte atomar?",
  "glossary": {
   "PersNr": "Personalnummer",
   "ProjNr": "Projektnummer",
   "Stundensatz": "Verrechnungssatz pro Stunde"
  },
  "relation": {
   "columns": [
    "PersNr",
    "ProjNr",
    "Stunden",
    "PersName",
    "Stundensatz",
    "ProjName"
   ],
   "pk": [
    "PersNr",
    "ProjNr"
   ],
   "rows": [
    [
     "P1",
     "J1",
     "40",
     "Berg",
     "50",
     "Web"
    ],
    [
     "P1",
     "J2",
     "20",
     "Berg",
     "50",
     "App"
    ],
    [
     "P2",
     "J1",
     "35",
     "Roth",
     "60",
     "Web"
    ],
    [
     "P3",
     "J2",
     "10",
     "Voss",
     "55",
     "App"
    ],
    [
     "P2",
     "J2",
     "25",
     "Roth",
     "60",
     "App"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "PersNr"
    ],
    "rhs": [
     "PersName",
     "Stundensatz"
    ],
    "kind": "partiell",
    "why": "PersName, Stundensatz hängt nur von PersNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "ProjNr"
    ],
    "rhs": [
     "ProjName"
    ],
    "kind": "partiell",
    "why": "ProjName hängt nur von ProjNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "PersNr",
     "ProjNr"
    ],
    "rhs": [
     "Stunden"
    ],
    "kind": "voll",
    "why": "Stunden hängt vom gesamten Schlüssel (PersNr, ProjNr) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Person",
      "columns": [
       {
        "name": "PersNr",
        "pk": true
       },
       {
        "name": "PersName"
       },
       {
        "name": "Stundensatz"
       }
      ]
     },
     {
      "name": "Projekt",
      "columns": [
       {
        "name": "ProjNr",
        "pk": true
       },
       {
        "name": "ProjName"
       }
      ]
     },
     {
      "name": "Arbeitet",
      "columns": [
       {
        "name": "PersNr",
        "fk": "Person",
        "pk": true
       },
       {
        "name": "ProjNr",
        "fk": "Projekt",
        "pk": true
       },
       {
        "name": "Stunden"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Person (PersNr, PersName, Stundensatz)",
   "Projekt (ProjNr, ProjName)",
   "Arbeitet (PersNr <fk>, ProjNr <fk>, Stunden)"
  ],
  "targetNote": "Der Stundensatz gehört zur Person, nicht zur einzelnen Buchung. Nur die Stunden hängen von Person und Projekt zugleich ab.",
  "tags": [
   "2NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "mitarbeiter-abteilung",
  "topicId": "05-3nf",
  "title": "Mitarbeitende und Abteilungen",
  "scenario": "Mitarbeitende gehören zu Abteilungen mit Leitung.",
  "glossary": {
   "PersNr": "Personalnummer",
   "AbtNr": "Abteilungsnummer",
   "AbtName": "Name der Abteilung",
   "AbtLeiter": "Leitung der Abteilung"
  },
  "relation": {
   "columns": [
    "PersNr",
    "Name",
    "AbtNr",
    "AbtName",
    "AbtLeiter"
   ],
   "pk": [
    "PersNr"
   ],
   "rows": [
    [
     "1",
     "Berg",
     "A1",
     "Entwicklung",
     "Lorenz"
    ],
    [
     "2",
     "Roth",
     "A2",
     "Vertrieb",
     "Sommer"
    ],
    [
     "3",
     "Voss",
     "A1",
     "Entwicklung",
     "Lorenz"
    ],
    [
     "4",
     "Kaya",
     "A3",
     "Einkauf",
     "Meier"
    ],
    [
     "5",
     "Lang",
     "A2",
     "Vertrieb",
     "Sommer"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "PersNr"
    ],
    "rhs": [
     "Name",
     "AbtNr"
    ],
    "kind": "voll",
    "why": "Name, AbtNr hängt vom gesamten Schlüssel (PersNr) ab."
   },
   {
    "lhs": [
     "AbtNr"
    ],
    "rhs": [
     "AbtName",
     "AbtLeiter"
    ],
    "kind": "transitiv",
    "why": "AbtName, AbtLeiter hängt von AbtNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Mitarbeiter",
      "columns": [
       {
        "name": "PersNr",
        "pk": true
       },
       {
        "name": "Name"
       },
       {
        "name": "AbtNr",
        "fk": "Abteilung"
       }
      ]
     },
     {
      "name": "Abteilung",
      "columns": [
       {
        "name": "AbtNr",
        "pk": true
       },
       {
        "name": "AbtName"
       },
       {
        "name": "AbtLeiter"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Mitarbeiter (PersNr, Name, AbtNr <fk>)",
   "Abteilung (AbtNr, AbtName, AbtLeiter)"
  ],
  "targetNote": "Name und Leitung der Abteilung hängen von AbtNr ab und nur dadurch von PersNr. Sie werden mit AbtNr als Schlüssel ausgelagert.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "kunde-plz",
  "topicId": "05-3nf",
  "title": "Kunden und Orte",
  "scenario": "Kundinnen und Kunden werden mit Postleitzahl und Ort gespeichert.",
  "glossary": {
   "KdNr": "Kundennummer",
   "PLZ": "Postleitzahl"
  },
  "relation": {
   "columns": [
    "KdNr",
    "Name",
    "PLZ",
    "Ort"
   ],
   "pk": [
    "KdNr"
   ],
   "rows": [
    [
     "1",
     "Berg",
     "51643",
     "Gummersbach"
    ],
    [
     "2",
     "Roth",
     "50667",
     "Köln"
    ],
    [
     "3",
     "Voss",
     "51643",
     "Gummersbach"
    ],
    [
     "4",
     "Kaya",
     "53111",
     "Bonn"
    ],
    [
     "5",
     "Lang",
     "50667",
     "Köln"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "KdNr"
    ],
    "rhs": [
     "Name",
     "PLZ"
    ],
    "kind": "voll",
    "why": "Name, PLZ hängt vom gesamten Schlüssel (KdNr) ab."
   },
   {
    "lhs": [
     "PLZ"
    ],
    "rhs": [
     "Ort"
    ],
    "kind": "transitiv",
    "why": "Ort hängt von PLZ ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Kunde",
      "columns": [
       {
        "name": "KdNr",
        "pk": true
       },
       {
        "name": "Name"
       },
       {
        "name": "PLZ",
        "fk": "Postleitzahl"
       }
      ]
     },
     {
      "name": "Postleitzahl",
      "columns": [
       {
        "name": "PLZ",
        "pk": true
       },
       {
        "name": "Ort"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Kunde (KdNr, Name, PLZ <fk>)",
   "Postleitzahl (PLZ, Ort)"
  ],
  "targetNote": "Der Ort ist durch die Postleitzahl bestimmt und hängt damit nur indirekt von KdNr ab. Mit PLZ als Schlüssel wird er ausgelagert.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "buch-verlag",
  "topicId": "05-3nf",
  "title": "Bücher und Verlage",
  "scenario": "Bücher erscheinen bei Verlagen.",
  "glossary": {
   "ISBN": "Buchnummer",
   "VerlagNr": "Verlagsnummer",
   "VerlagOrt": "Sitz des Verlags"
  },
  "relation": {
   "columns": [
    "ISBN",
    "Titel",
    "VerlagNr",
    "VerlagName",
    "VerlagOrt"
   ],
   "pk": [
    "ISBN"
   ],
   "rows": [
    [
     "978-1",
     "Datenbanken",
     "V1",
     "Pearson",
     "München"
    ],
    [
     "978-2",
     "Netzwerke",
     "V2",
     "Springer",
     "Berlin"
    ],
    [
     "978-3",
     "Statistik",
     "V1",
     "Pearson",
     "München"
    ],
    [
     "978-4",
     "Algorithmen",
     "V3",
     "Hanser",
     "München"
    ],
    [
     "978-5",
     "Logik",
     "V2",
     "Springer",
     "Berlin"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "ISBN"
    ],
    "rhs": [
     "Titel",
     "VerlagNr"
    ],
    "kind": "voll",
    "why": "Titel, VerlagNr hängt vom gesamten Schlüssel (ISBN) ab."
   },
   {
    "lhs": [
     "VerlagNr"
    ],
    "rhs": [
     "VerlagName",
     "VerlagOrt"
    ],
    "kind": "transitiv",
    "why": "VerlagName, VerlagOrt hängt von VerlagNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Buch",
      "columns": [
       {
        "name": "ISBN",
        "pk": true
       },
       {
        "name": "Titel"
       },
       {
        "name": "VerlagNr",
        "fk": "Verlag"
       }
      ]
     },
     {
      "name": "Verlag",
      "columns": [
       {
        "name": "VerlagNr",
        "pk": true
       },
       {
        "name": "VerlagName"
       },
       {
        "name": "VerlagOrt"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Buch (ISBN, Titel, VerlagNr <fk>)",
   "Verlag (VerlagNr, VerlagName, VerlagOrt)"
  ],
  "targetNote": "Achtung, Falle: Mehrere Verlage haben denselben Sitz (München), trotzdem bestimmt der Ort nicht den Verlag. Maßgeblich ist VerlagNr.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "student-studiengang",
  "topicId": "05-3nf",
  "title": "Studierende und Studiengänge",
  "scenario": "Studierende sind in Studiengängen eingeschrieben.",
  "glossary": {
   "MatrNr": "Matrikelnummer",
   "StgNr": "Studiengangsnummer",
   "StgName": "Name des Studiengangs"
  },
  "relation": {
   "columns": [
    "MatrNr",
    "Name",
    "StgNr",
    "StgName",
    "Fachbereich"
   ],
   "pk": [
    "MatrNr"
   ],
   "rows": [
    [
     "1001",
     "Berg",
     "S1",
     "Informatik",
     "FB10"
    ],
    [
     "1002",
     "Roth",
     "S2",
     "Wirtschaftsinformatik",
     "FB10"
    ],
    [
     "1003",
     "Voss",
     "S1",
     "Informatik",
     "FB10"
    ],
    [
     "1004",
     "Kaya",
     "S3",
     "Maschinenbau",
     "FB11"
    ],
    [
     "1005",
     "Lang",
     "S2",
     "Wirtschaftsinformatik",
     "FB10"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "MatrNr"
    ],
    "rhs": [
     "Name",
     "StgNr"
    ],
    "kind": "voll",
    "why": "Name, StgNr hängt vom gesamten Schlüssel (MatrNr) ab."
   },
   {
    "lhs": [
     "StgNr"
    ],
    "rhs": [
     "StgName",
     "Fachbereich"
    ],
    "kind": "transitiv",
    "why": "StgName, Fachbereich hängt von StgNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Student",
      "columns": [
       {
        "name": "MatrNr",
        "pk": true
       },
       {
        "name": "Name"
       },
       {
        "name": "StgNr",
        "fk": "Studiengang"
       }
      ]
     },
     {
      "name": "Studiengang",
      "columns": [
       {
        "name": "StgNr",
        "pk": true
       },
       {
        "name": "StgName"
       },
       {
        "name": "Fachbereich"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Student (MatrNr, Name, StgNr <fk>)",
   "Studiengang (StgNr, StgName, Fachbereich)"
  ],
  "targetNote": "Studiengangsname und Fachbereich hängen von StgNr ab. Sie werden mit StgNr als Schlüssel ausgelagert.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "fahrzeug-modell",
  "topicId": "05-3nf",
  "title": "Fahrzeuge und Modelle",
  "scenario": "Ein Fuhrpark verwaltet Fahrzeuge mit Modell und Hersteller.",
  "glossary": {
   "FzgNr": "Fahrzeugnummer",
   "ModellNr": "Modellnummer"
  },
  "relation": {
   "columns": [
    "FzgNr",
    "Kennzeichen",
    "ModellNr",
    "ModellName",
    "Hersteller"
   ],
   "pk": [
    "FzgNr"
   ],
   "rows": [
    [
     "1",
     "GM-AB 12",
     "M1",
     "Golf",
     "VW"
    ],
    [
     "2",
     "GM-CD 34",
     "M2",
     "Corsa",
     "Opel"
    ],
    [
     "3",
     "K-EF 56",
     "M1",
     "Golf",
     "VW"
    ],
    [
     "4",
     "GM-GH 78",
     "M3",
     "Polo",
     "VW"
    ],
    [
     "5",
     "K-IJ 90",
     "M2",
     "Corsa",
     "Opel"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "FzgNr"
    ],
    "rhs": [
     "Kennzeichen",
     "ModellNr"
    ],
    "kind": "voll",
    "why": "Kennzeichen, ModellNr hängt vom gesamten Schlüssel (FzgNr) ab."
   },
   {
    "lhs": [
     "ModellNr"
    ],
    "rhs": [
     "ModellName",
     "Hersteller"
    ],
    "kind": "transitiv",
    "why": "ModellName, Hersteller hängt von ModellNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Fahrzeug",
      "columns": [
       {
        "name": "FzgNr",
        "pk": true
       },
       {
        "name": "Kennzeichen"
       },
       {
        "name": "ModellNr",
        "fk": "Modell"
       }
      ]
     },
     {
      "name": "Modell",
      "columns": [
       {
        "name": "ModellNr",
        "pk": true
       },
       {
        "name": "ModellName"
       },
       {
        "name": "Hersteller"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Fahrzeug (FzgNr, Kennzeichen, ModellNr <fk>)",
   "Modell (ModellNr, ModellName, Hersteller)"
  ],
  "targetNote": "Modellname und Hersteller gehören zum Modell, nicht zum einzelnen Fahrzeug.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "bestellung-trap",
  "topicId": "05-3nf",
  "title": "Bestellungen mit Lieferadresse",
  "scenario": "Kundinnen und Kunden bestellen und geben eine Lieferadresse an.",
  "glossary": {
   "BNr": "Bestellnummer",
   "KdNr": "Kundennummer"
  },
  "relation": {
   "columns": [
    "BNr",
    "Datum",
    "KdNr",
    "Lieferadresse"
   ],
   "pk": [
    "BNr"
   ],
   "rows": [
    [
     "B1",
     "03.11.",
     "K1",
     "Hauptstr. 5, Köln"
    ],
    [
     "B2",
     "04.11.",
     "K1",
     "Büro, Bonn"
    ],
    [
     "B3",
     "04.11.",
     "K2",
     "Ring 7, Köln"
    ],
    [
     "B4",
     "05.11.",
     "K1",
     "Hauptstr. 5, Köln"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "BNr"
    ],
    "rhs": [
     "Datum",
     "KdNr",
     "Lieferadresse"
    ],
    "kind": "voll",
    "why": "Datum, KdNr, Lieferadresse hängt vom gesamten Schlüssel (BNr) ab."
   }
  ],
  "highestNF": 3,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Bestellung",
      "columns": [
       {
        "name": "BNr",
        "pk": true
       },
       {
        "name": "Datum"
       },
       {
        "name": "KdNr"
       },
       {
        "name": "Lieferadresse"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Bestellung (BNr, Datum, KdNr, Lieferadresse)"
  ],
  "targetNote": "Achtung, Falle: Die Lieferadresse sieht kundenabhängig aus. Kunde K1 hat aber je Bestellung eine andere (Köln und Bonn), also hängt sie von der Bestellung ab und nicht von KdNr. Es gibt keine transitive Abhängigkeit, die Relation ist bereits in 3NF.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "rechnung-zwei-ketten",
  "topicId": "05-3nf",
  "title": "Rechnungen mit Kunde und Zahlungsart",
  "scenario": "Rechnungen gehören zu Kunden und werden auf eine bestimmte Art bezahlt.",
  "glossary": {
   "ReNr": "Rechnungsnummer",
   "KdNr": "Kundennummer",
   "ZahlNr": "Nummer der Zahlungsart"
  },
  "relation": {
   "columns": [
    "ReNr",
    "Datum",
    "KdNr",
    "KdName",
    "ZahlNr",
    "ZahlArt"
   ],
   "pk": [
    "ReNr"
   ],
   "rows": [
    [
     "R1",
     "03.11.",
     "K1",
     "Berg",
     "Z1",
     "Überweisung"
    ],
    [
     "R2",
     "04.11.",
     "K2",
     "Roth",
     "Z2",
     "Lastschrift"
    ],
    [
     "R3",
     "04.11.",
     "K1",
     "Berg",
     "Z2",
     "Lastschrift"
    ],
    [
     "R4",
     "05.11.",
     "K3",
     "Voss",
     "Z1",
     "Überweisung"
    ],
    [
     "R5",
     "06.11.",
     "K2",
     "Roth",
     "Z3",
     "Karte"
    ]
   ]
  },
  "oneNF": {
   "ok": true,
   "issues": []
  },
  "fds": [
   {
    "lhs": [
     "ReNr"
    ],
    "rhs": [
     "Datum",
     "KdNr",
     "ZahlNr"
    ],
    "kind": "voll",
    "why": "Datum, KdNr, ZahlNr hängt vom gesamten Schlüssel (ReNr) ab."
   },
   {
    "lhs": [
     "KdNr"
    ],
    "rhs": [
     "KdName"
    ],
    "kind": "transitiv",
    "why": "KdName hängt von KdNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   },
   {
    "lhs": [
     "ZahlNr"
    ],
    "rhs": [
     "ZahlArt"
    ],
    "kind": "transitiv",
    "why": "ZahlArt hängt von ZahlNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Rechnung",
      "columns": [
       {
        "name": "ReNr",
        "pk": true
       },
       {
        "name": "Datum"
       },
       {
        "name": "KdNr",
        "fk": "Kunde"
       },
       {
        "name": "ZahlNr",
        "fk": "Zahlungsart"
       }
      ]
     },
     {
      "name": "Kunde",
      "columns": [
       {
        "name": "KdNr",
        "pk": true
       },
       {
        "name": "KdName"
       }
      ]
     },
     {
      "name": "Zahlungsart",
      "columns": [
       {
        "name": "ZahlNr",
        "pk": true
       },
       {
        "name": "ZahlArt"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Rechnung (ReNr, Datum, KdNr <fk>, ZahlNr <fk>)",
   "Kunde (KdNr, KdName)",
   "Zahlungsart (ZahlNr, ZahlArt)"
  ],
  "targetNote": "Achtung, Falle: Es gibt zwei getrennte transitive Abhängigkeiten (Kunde und Zahlungsart). Jede wird in eine eigene Relation ausgelagert.",
  "tags": [
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "bibliothek-ausleihe",
  "topicId": "05-3nf",
  "title": "Ausleihen in der Bibliothek",
  "scenario": "Leserinnen und Leser leihen Medien aus, die bei Verlagen erscheinen.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "MedNr": "Mediennummer",
   "LeserNr": "Lesernummer",
   "VerlagNr": "Verlagsnummer"
  },
  "relation": {
   "columns": [
    "MedNr",
    "LeserNr",
    "Titel",
    "VerlagNr",
    "VerlagName",
    "Leser",
    "Datum"
   ],
   "pk": [
    "MedNr",
    "LeserNr"
   ],
   "rows": [
    [
     "M1",
     "L1",
     "Datenbanken",
     "V1",
     "Pearson",
     "Anna Berg",
     "03.11."
    ],
    [
     "M2",
     "L1",
     "Netzwerke",
     "V2",
     "Springer",
     "Anna Berg",
     "05.11."
    ],
    [
     "M1",
     "L2",
     "Datenbanken",
     "V1",
     "Pearson",
     "Ben Roth",
     "06.11."
    ],
    [
     "M3",
     "L3",
     "Statistik",
     "V2",
     "Springer",
     "Clara Voss",
     "07.11."
    ],
    [
     "M2",
     "L2",
     "Netzwerke",
     "V2",
     "Springer",
     "Ben Roth",
     "08.11."
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Leser",
     "type": "strukturiert",
     "why": "Leser enthält mehrere Angaben in einem Feld (Vorname, Nachname). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Leser ist in Vorname und Nachname aufgeteilt.",
   "fixed": {
    "columns": [
     "MedNr",
     "LeserNr",
     "Titel",
     "VerlagNr",
     "VerlagName",
     "Vorname",
     "Nachname",
     "Datum"
    ],
    "pk": [
     "MedNr",
     "LeserNr"
    ],
    "rows": [
     [
      "M1",
      "L1",
      "Datenbanken",
      "V1",
      "Pearson",
      "Anna",
      "Berg",
      "03.11."
     ],
     [
      "M2",
      "L1",
      "Netzwerke",
      "V2",
      "Springer",
      "Anna",
      "Berg",
      "05.11."
     ],
     [
      "M1",
      "L2",
      "Datenbanken",
      "V1",
      "Pearson",
      "Ben",
      "Roth",
      "06.11."
     ],
     [
      "M3",
      "L3",
      "Statistik",
      "V2",
      "Springer",
      "Clara",
      "Voss",
      "07.11."
     ],
     [
      "M2",
      "L2",
      "Netzwerke",
      "V2",
      "Springer",
      "Ben",
      "Roth",
      "08.11."
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "LeserNr"
    ],
    "rhs": [
     "Vorname",
     "Nachname"
    ],
    "kind": "partiell",
    "why": "Vorname, Nachname hängt nur von LeserNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "MedNr"
    ],
    "rhs": [
     "Titel",
     "VerlagNr"
    ],
    "kind": "partiell",
    "why": "Titel, VerlagNr hängt nur von MedNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "VerlagNr"
    ],
    "rhs": [
     "VerlagName"
    ],
    "kind": "transitiv",
    "why": "VerlagName hängt von VerlagNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   },
   {
    "lhs": [
     "MedNr",
     "LeserNr"
    ],
    "rhs": [
     "Datum"
    ],
    "kind": "voll",
    "why": "Datum hängt vom gesamten Schlüssel (MedNr, LeserNr) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Leser",
      "columns": [
       {
        "name": "LeserNr",
        "pk": true
       },
       {
        "name": "Vorname"
       },
       {
        "name": "Nachname"
       }
      ]
     },
     {
      "name": "Medium",
      "columns": [
       {
        "name": "MedNr",
        "pk": true
       },
       {
        "name": "Titel"
       },
       {
        "name": "VerlagNr"
       },
       {
        "name": "VerlagName"
       }
      ]
     },
     {
      "name": "Ausleihe",
      "columns": [
       {
        "name": "MedNr",
        "fk": "Medium",
        "pk": true
       },
       {
        "name": "LeserNr",
        "fk": "Leser",
        "pk": true
       },
       {
        "name": "Datum"
       }
      ]
     }
    ]
   },
   {
    "title": "Schritt 5: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Leser",
      "columns": [
       {
        "name": "LeserNr",
        "pk": true
       },
       {
        "name": "Vorname"
       },
       {
        "name": "Nachname"
       }
      ]
     },
     {
      "name": "Verlag",
      "columns": [
       {
        "name": "VerlagNr",
        "pk": true
       },
       {
        "name": "VerlagName"
       }
      ]
     },
     {
      "name": "Medium",
      "columns": [
       {
        "name": "MedNr",
        "pk": true
       },
       {
        "name": "Titel"
       },
       {
        "name": "VerlagNr",
        "fk": "Verlag"
       }
      ]
     },
     {
      "name": "Ausleihe",
      "columns": [
       {
        "name": "MedNr",
        "fk": "Medium",
        "pk": true
       },
       {
        "name": "LeserNr",
        "fk": "Leser",
        "pk": true
       },
       {
        "name": "Datum"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Leser (LeserNr, Vorname, Nachname)",
   "Verlag (VerlagNr, VerlagName)",
   "Medium (MedNr, Titel, VerlagNr <fk>)",
   "Ausleihe (MedNr <fk>, LeserNr <fk>, Datum)"
  ],
  "targetNote": "Erst wird der Name aufgespalten (1NF), dann werden Leser und Medium ausgelagert (2NF) und zuletzt der Verlag (3NF).",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "personal-skills",
  "topicId": "05-3nf",
  "title": "Personal mit Kenntnissen",
  "scenario": "Eine Firma speichert Mitarbeitende mit Abteilung und Kenntnissen.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "PersNr": "Personalnummer",
   "AbtNr": "Abteilungsnummer",
   "Skills": "Kenntnisse"
  },
  "relation": {
   "columns": [
    "PersNr",
    "Name",
    "AbtNr",
    "AbtName",
    "Skills"
   ],
   "pk": [
    "PersNr"
   ],
   "rows": [
    [
     "1",
     "Berg",
     "A1",
     "Entwicklung",
     "Java, SQL"
    ],
    [
     "2",
     "Roth",
     "A2",
     "Vertrieb",
     "Verhandeln"
    ],
    [
     "3",
     "Voss",
     "A1",
     "Entwicklung",
     "SQL, Python, Java"
    ],
    [
     "4",
     "Kaya",
     "A2",
     "Vertrieb",
     "Excel, SQL"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Skills",
     "type": "mehrwertig",
     "why": "Skills enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels."
    }
   ],
   "fixNote": "Jeder Wert aus Skills hat ein eigenes Tupel, Skills ist jetzt Teil des Primärschlüssels.",
   "fixed": {
    "columns": [
     "PersNr",
     "Name",
     "AbtNr",
     "AbtName",
     "Skills"
    ],
    "pk": [
     "PersNr",
     "Skills"
    ],
    "rows": [
     [
      "1",
      "Berg",
      "A1",
      "Entwicklung",
      "Java"
     ],
     [
      "1",
      "Berg",
      "A1",
      "Entwicklung",
      "SQL"
     ],
     [
      "2",
      "Roth",
      "A2",
      "Vertrieb",
      "Verhandeln"
     ],
     [
      "3",
      "Voss",
      "A1",
      "Entwicklung",
      "SQL"
     ],
     [
      "3",
      "Voss",
      "A1",
      "Entwicklung",
      "Python"
     ],
     [
      "3",
      "Voss",
      "A1",
      "Entwicklung",
      "Java"
     ],
     [
      "4",
      "Kaya",
      "A2",
      "Vertrieb",
      "Excel"
     ],
     [
      "4",
      "Kaya",
      "A2",
      "Vertrieb",
      "SQL"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "PersNr"
    ],
    "rhs": [
     "Name",
     "AbtNr"
    ],
    "kind": "partiell",
    "why": "Name, AbtNr hängt nur von PersNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "AbtNr"
    ],
    "rhs": [
     "AbtName"
    ],
    "kind": "transitiv",
    "why": "AbtName hängt von AbtNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Person",
      "columns": [
       {
        "name": "PersNr",
        "pk": true
       },
       {
        "name": "Name"
       },
       {
        "name": "AbtNr"
       },
       {
        "name": "AbtName"
       }
      ]
     },
     {
      "name": "Beherrscht",
      "columns": [
       {
        "name": "PersNr",
        "fk": "Person",
        "pk": true
       },
       {
        "name": "Skills",
        "pk": true
       }
      ]
     }
    ]
   },
   {
    "title": "Schritt 5: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Person",
      "columns": [
       {
        "name": "PersNr",
        "pk": true
       },
       {
        "name": "Name"
       },
       {
        "name": "AbtNr",
        "fk": "Abteilung"
       }
      ]
     },
     {
      "name": "Abteilung",
      "columns": [
       {
        "name": "AbtNr",
        "pk": true
       },
       {
        "name": "AbtName"
       }
      ]
     },
     {
      "name": "Beherrscht",
      "columns": [
       {
        "name": "PersNr",
        "fk": "Person",
        "pk": true
       },
       {
        "name": "Skills",
        "pk": true
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Person (PersNr, Name, AbtNr <fk>)",
   "Abteilung (AbtNr, AbtName)",
   "Beherrscht (PersNr <fk>, Skills)"
  ],
  "targetNote": "Die mehrwertigen Kenntnisse werden zu eigenen Tupeln und Teil des Schlüssels. Dadurch werden Name und Abteilung partiell abhängig (2NF) und der Abteilungsname transitiv (3NF).",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "lieferung-preis",
  "topicId": "05-3nf",
  "title": "Lieferungen mit Preis",
  "scenario": "Lieferanten liefern Teile zu einem Preis pro Lieferung.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "LiefNr": "Lieferantennummer",
   "TeilNr": "Teilenummer"
  },
  "relation": {
   "columns": [
    "LiefNr",
    "TeilNr",
    "Menge",
    "Preis",
    "LiefName",
    "TeilName"
   ],
   "pk": [
    "LiefNr",
    "TeilNr"
   ],
   "rows": [
    [
     "L1",
     "T1",
     "100",
     "3,50 €",
     "Müller",
     "Schraube"
    ],
    [
     "L1",
     "T2",
     "50",
     "1,20 €",
     "Müller",
     "Mutter"
    ],
    [
     "L2",
     "T1",
     "70",
     "3,80 €",
     "Schmidt",
     "Schraube"
    ],
    [
     "L3",
     "T3",
     "20",
     "0,90 $",
     "Kaya",
     "Dübel"
    ],
    [
     "L2",
     "T3",
     "30",
     "1,10 €",
     "Schmidt",
     "Dübel"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Preis",
     "type": "strukturiert",
     "why": "Preis enthält mehrere Angaben in einem Feld (Preis, Währung). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Preis ist in Preis und Währung aufgeteilt.",
   "fixed": {
    "columns": [
     "LiefNr",
     "TeilNr",
     "Menge",
     "Preis",
     "Währung",
     "LiefName",
     "TeilName"
    ],
    "pk": [
     "LiefNr",
     "TeilNr"
    ],
    "rows": [
     [
      "L1",
      "T1",
      "100",
      "3,50",
      "€",
      "Müller",
      "Schraube"
     ],
     [
      "L1",
      "T2",
      "50",
      "1,20",
      "€",
      "Müller",
      "Mutter"
     ],
     [
      "L2",
      "T1",
      "70",
      "3,80",
      "€",
      "Schmidt",
      "Schraube"
     ],
     [
      "L3",
      "T3",
      "20",
      "0,90",
      "$",
      "Kaya",
      "Dübel"
     ],
     [
      "L2",
      "T3",
      "30",
      "1,10",
      "€",
      "Schmidt",
      "Dübel"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "LiefNr"
    ],
    "rhs": [
     "LiefName"
    ],
    "kind": "partiell",
    "why": "LiefName hängt nur von LiefNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "TeilNr"
    ],
    "rhs": [
     "TeilName"
    ],
    "kind": "partiell",
    "why": "TeilName hängt nur von TeilNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "LiefNr",
     "TeilNr"
    ],
    "rhs": [
     "Menge",
     "Preis",
     "Währung"
    ],
    "kind": "voll",
    "why": "Menge, Preis, Währung hängt vom gesamten Schlüssel (LiefNr, TeilNr) ab."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Lieferant",
      "columns": [
       {
        "name": "LiefNr",
        "pk": true
       },
       {
        "name": "LiefName"
       }
      ]
     },
     {
      "name": "Teil",
      "columns": [
       {
        "name": "TeilNr",
        "pk": true
       },
       {
        "name": "TeilName"
       }
      ]
     },
     {
      "name": "Liefert",
      "columns": [
       {
        "name": "LiefNr",
        "fk": "Lieferant",
        "pk": true
       },
       {
        "name": "TeilNr",
        "fk": "Teil",
        "pk": true
       },
       {
        "name": "Menge"
       },
       {
        "name": "Preis"
       },
       {
        "name": "Währung"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Lieferant (LiefNr, LiefName)",
   "Teil (TeilNr, TeilName)",
   "Liefert (LiefNr <fk>, TeilNr <fk>, Menge, Preis, Währung)"
  ],
  "targetNote": "Achtung, Falle: Nach der 2NF ist Schluss. Es gibt keine transitive Abhängigkeit, das Ergebnis ist damit auch in 3NF. Der Preis hängt von Lieferant und Teil zusammen ab (er unterscheidet sich je Lieferung) und bleibt in Liefert.",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "mitarbeiter-name-abt",
  "topicId": "05-3nf",
  "title": "Mitarbeitende mit Abteilung",
  "scenario": "Mitarbeitende werden mit Name und Abteilung gespeichert.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "PersNr": "Personalnummer",
   "AbtNr": "Abteilungsnummer",
   "AbtName": "Name der Abteilung"
  },
  "relation": {
   "columns": [
    "PersNr",
    "Name",
    "AbtNr",
    "AbtName"
   ],
   "pk": [
    "PersNr"
   ],
   "rows": [
    [
     "1",
     "Anna Berg",
     "A1",
     "Entwicklung"
    ],
    [
     "2",
     "Ben Roth",
     "A2",
     "Vertrieb"
    ],
    [
     "3",
     "Clara Voss",
     "A1",
     "Entwicklung"
    ],
    [
     "4",
     "Dilan Kaya",
     "A3",
     "Einkauf"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Name",
     "type": "strukturiert",
     "why": "Name enthält mehrere Angaben in einem Feld (Vorname, Nachname). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Name ist in Vorname und Nachname aufgeteilt.",
   "fixed": {
    "columns": [
     "PersNr",
     "Vorname",
     "Nachname",
     "AbtNr",
     "AbtName"
    ],
    "pk": [
     "PersNr"
    ],
    "rows": [
     [
      "1",
      "Anna",
      "Berg",
      "A1",
      "Entwicklung"
     ],
     [
      "2",
      "Ben",
      "Roth",
      "A2",
      "Vertrieb"
     ],
     [
      "3",
      "Clara",
      "Voss",
      "A1",
      "Entwicklung"
     ],
     [
      "4",
      "Dilan",
      "Kaya",
      "A3",
      "Einkauf"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "PersNr"
    ],
    "rhs": [
     "Vorname",
     "Nachname",
     "AbtNr"
    ],
    "kind": "voll",
    "why": "Vorname, Nachname, AbtNr hängt vom gesamten Schlüssel (PersNr) ab."
   },
   {
    "lhs": [
     "AbtNr"
    ],
    "rhs": [
     "AbtName"
    ],
    "kind": "transitiv",
    "why": "AbtName hängt von AbtNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 2,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Mitarbeiter",
      "columns": [
       {
        "name": "PersNr",
        "pk": true
       },
       {
        "name": "Vorname"
       },
       {
        "name": "Nachname"
       },
       {
        "name": "AbtNr",
        "fk": "Abteilung"
       }
      ]
     },
     {
      "name": "Abteilung",
      "columns": [
       {
        "name": "AbtNr",
        "pk": true
       },
       {
        "name": "AbtName"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Mitarbeiter (PersNr, Vorname, Nachname, AbtNr <fk>)",
   "Abteilung (AbtNr, AbtName)"
  ],
  "targetNote": "Achtung, Falle: Der Schlüssel ist einfach, also gibt es keine partiellen Abhängigkeiten und die 2NF ist von selbst erfüllt. Erst die transitive Abhängigkeit AbtNr → AbtName verlangt die Zerlegung zur 3NF.",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "kino-vorstellung",
  "topicId": "05-3nf",
  "title": "Kinovorstellungen",
  "scenario": "Ein Kino speichert Vorstellungen mit Saal und Genres des Films.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "VorstNr": "Vorstellungsnummer",
   "Plaetze": "Sitzplätze des Saals",
   "Genres": "Genres des Films"
  },
  "relation": {
   "columns": [
    "VorstNr",
    "Film",
    "Saal",
    "Plaetze",
    "Genres"
   ],
   "pk": [
    "VorstNr"
   ],
   "rows": [
    [
     "V1",
     "Matrix",
     "S1",
     "200",
     "Action, SciFi"
    ],
    [
     "V2",
     "Shrek",
     "S2",
     "120",
     "Animation, Komödie"
    ],
    [
     "V3",
     "Matrix",
     "S1",
     "200",
     "Action, SciFi"
    ],
    [
     "V4",
     "Up",
     "S2",
     "120",
     "Animation"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Genres",
     "type": "mehrwertig",
     "why": "Genres enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels."
    }
   ],
   "fixNote": "Jeder Wert aus Genres hat ein eigenes Tupel, Genres ist jetzt Teil des Primärschlüssels.",
   "fixed": {
    "columns": [
     "VorstNr",
     "Film",
     "Saal",
     "Plaetze",
     "Genres"
    ],
    "pk": [
     "VorstNr",
     "Genres"
    ],
    "rows": [
     [
      "V1",
      "Matrix",
      "S1",
      "200",
      "Action"
     ],
     [
      "V1",
      "Matrix",
      "S1",
      "200",
      "SciFi"
     ],
     [
      "V2",
      "Shrek",
      "S2",
      "120",
      "Animation"
     ],
     [
      "V2",
      "Shrek",
      "S2",
      "120",
      "Komödie"
     ],
     [
      "V3",
      "Matrix",
      "S1",
      "200",
      "Action"
     ],
     [
      "V3",
      "Matrix",
      "S1",
      "200",
      "SciFi"
     ],
     [
      "V4",
      "Up",
      "S2",
      "120",
      "Animation"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "VorstNr"
    ],
    "rhs": [
     "Film",
     "Saal"
    ],
    "kind": "partiell",
    "why": "Film, Saal hängt nur von VorstNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "Saal"
    ],
    "rhs": [
     "Plaetze"
    ],
    "kind": "transitiv",
    "why": "Plaetze hängt von Saal ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Vorstellung",
      "columns": [
       {
        "name": "VorstNr",
        "pk": true
       },
       {
        "name": "Film"
       },
       {
        "name": "Saal"
       },
       {
        "name": "Plaetze"
       }
      ]
     },
     {
      "name": "Hat_Genre",
      "columns": [
       {
        "name": "VorstNr",
        "fk": "Vorstellung",
        "pk": true
       },
       {
        "name": "Genres",
        "pk": true
       }
      ]
     }
    ]
   },
   {
    "title": "Schritt 5: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Vorstellung",
      "columns": [
       {
        "name": "VorstNr",
        "pk": true
       },
       {
        "name": "Film"
       },
       {
        "name": "Saal",
        "fk": "Kinosaal"
       }
      ]
     },
     {
      "name": "Kinosaal",
      "columns": [
       {
        "name": "Saal",
        "pk": true
       },
       {
        "name": "Plaetze"
       }
      ]
     },
     {
      "name": "Hat_Genre",
      "columns": [
       {
        "name": "VorstNr",
        "fk": "Vorstellung",
        "pk": true
       },
       {
        "name": "Genres",
        "pk": true
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Vorstellung (VorstNr, Film, Saal <fk>)",
   "Kinosaal (Saal, Plaetze)",
   "Hat_Genre (VorstNr <fk>, Genres)"
  ],
  "targetNote": "Achtung, Falle: Derselbe Film läuft in mehreren Vorstellungen (Matrix zweimal). Der Film hängt trotzdem von VorstNr ab. Die Plätze hängen vom Saal ab und werden in der 3NF ausgelagert.",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "kunde-trap-3nf",
  "topicId": "05-3nf",
  "title": "Kunden mit Wohnort",
  "scenario": "Kundinnen und Kunden werden mit Name und Wohnort gespeichert.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "KdNr": "Kundennummer",
   "Ort": "Wohnort"
  },
  "relation": {
   "columns": [
    "KdNr",
    "Name",
    "Ort"
   ],
   "pk": [
    "KdNr"
   ],
   "rows": [
    [
     "1",
     "Anna Berg",
     "Köln"
    ],
    [
     "2",
     "Ben Roth",
     "Bonn"
    ],
    [
     "3",
     "Clara Voss",
     "Köln"
    ],
    [
     "4",
     "Dilan Kaya",
     "Gummersbach"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Name",
     "type": "strukturiert",
     "why": "Name enthält mehrere Angaben in einem Feld (Vorname, Nachname). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Name ist in Vorname und Nachname aufgeteilt.",
   "fixed": {
    "columns": [
     "KdNr",
     "Vorname",
     "Nachname",
     "Ort"
    ],
    "pk": [
     "KdNr"
    ],
    "rows": [
     [
      "1",
      "Anna",
      "Berg",
      "Köln"
     ],
     [
      "2",
      "Ben",
      "Roth",
      "Bonn"
     ],
     [
      "3",
      "Clara",
      "Voss",
      "Köln"
     ],
     [
      "4",
      "Dilan",
      "Kaya",
      "Gummersbach"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "KdNr"
    ],
    "rhs": [
     "Vorname",
     "Nachname",
     "Ort"
    ],
    "kind": "voll",
    "why": "Vorname, Nachname, Ort hängt vom gesamten Schlüssel (KdNr) ab."
   }
  ],
  "highestNF": 3,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Kunde",
      "columns": [
       {
        "name": "KdNr",
        "pk": true
       },
       {
        "name": "Vorname"
       },
       {
        "name": "Nachname"
       },
       {
        "name": "Ort"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Kunde (KdNr, Vorname, Nachname, Ort)"
  ],
  "targetNote": "Achtung, Falle: Nach dem Aufteilen des Namens ist die Relation bereits in 3NF. Dass sich der Ort wiederholt (Köln), ist keine Abhängigkeit von einem Nichtschlüsselattribut. Es gibt nichts weiter auszulagern.",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 },
 {
  "id": "rechnung-position",
  "topicId": "05-3nf",
  "title": "Rechnungspositionen",
  "scenario": "Rechnungen enthalten Positionen mit Artikeln und Mengen.",
  "hint": "Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.",
  "glossary": {
   "ReNr": "Rechnungsnummer",
   "PosNr": "Positionsnummer",
   "KdNr": "Kundennummer",
   "ArtNr": "Artikelnummer",
   "ArtBez": "Artikelbezeichnung"
  },
  "relation": {
   "columns": [
    "ReNr",
    "PosNr",
    "KdNr",
    "KdName",
    "ArtNr",
    "ArtBez",
    "Menge"
   ],
   "pk": [
    "ReNr",
    "PosNr"
   ],
   "rows": [
    [
     "R1",
     "1",
     "K1",
     "Berg",
     "A1",
     "Stift",
     "10 Stk"
    ],
    [
     "R1",
     "2",
     "K1",
     "Berg",
     "A2",
     "Block",
     "2 Stk"
    ],
    [
     "R2",
     "1",
     "K2",
     "Roth",
     "A1",
     "Stift",
     "50 Stk"
    ],
    [
     "R3",
     "1",
     "K1",
     "Berg",
     "A2",
     "Block",
     "5 Stk"
    ],
    [
     "R3",
     "2",
     "K1",
     "Berg",
     "A1",
     "Stift",
     "1 Stk"
    ]
   ]
  },
  "oneNF": {
   "ok": false,
   "issues": [
    {
     "column": "Menge",
     "type": "strukturiert",
     "why": "Menge enthält mehrere Angaben in einem Feld (Menge, Einheit). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten."
    }
   ],
   "fixNote": "Menge ist in Menge und Einheit aufgeteilt.",
   "fixed": {
    "columns": [
     "ReNr",
     "PosNr",
     "KdNr",
     "KdName",
     "ArtNr",
     "ArtBez",
     "Menge",
     "Einheit"
    ],
    "pk": [
     "ReNr",
     "PosNr"
    ],
    "rows": [
     [
      "R1",
      "1",
      "K1",
      "Berg",
      "A1",
      "Stift",
      "10",
      "Stk"
     ],
     [
      "R1",
      "2",
      "K1",
      "Berg",
      "A2",
      "Block",
      "2",
      "Stk"
     ],
     [
      "R2",
      "1",
      "K2",
      "Roth",
      "A1",
      "Stift",
      "50",
      "Stk"
     ],
     [
      "R3",
      "1",
      "K1",
      "Berg",
      "A2",
      "Block",
      "5",
      "Stk"
     ],
     [
      "R3",
      "2",
      "K1",
      "Berg",
      "A1",
      "Stift",
      "1",
      "Stk"
     ]
    ]
   }
  },
  "fds": [
   {
    "lhs": [
     "ReNr"
    ],
    "rhs": [
     "KdNr"
    ],
    "kind": "partiell",
    "why": "KdNr hängt nur von ReNr ab, einem Teil des Schlüssels."
   },
   {
    "lhs": [
     "KdNr"
    ],
    "rhs": [
     "KdName"
    ],
    "kind": "transitiv",
    "why": "KdName hängt von KdNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   },
   {
    "lhs": [
     "ReNr",
     "PosNr"
    ],
    "rhs": [
     "ArtNr",
     "Menge",
     "Einheit"
    ],
    "kind": "voll",
    "why": "ArtNr, Menge, Einheit hängt vom gesamten Schlüssel (ReNr, PosNr) ab."
   },
   {
    "lhs": [
     "ArtNr"
    ],
    "rhs": [
     "ArtBez"
    ],
    "kind": "transitiv",
    "why": "ArtBez hängt von ArtNr ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv)."
   }
  ],
  "highestNF": 1,
  "stages": [
   {
    "title": "Schritt 4: Tabellen der 2NF bilden",
    "hint": "Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.",
    "relations": [
     {
      "name": "Rechnung",
      "columns": [
       {
        "name": "ReNr",
        "pk": true
       },
       {
        "name": "KdNr"
       },
       {
        "name": "KdName"
       }
      ]
     },
     {
      "name": "Position",
      "columns": [
       {
        "name": "ReNr",
        "fk": "Rechnung",
        "pk": true
       },
       {
        "name": "PosNr",
        "pk": true
       },
       {
        "name": "ArtNr"
       },
       {
        "name": "ArtBez"
       },
       {
        "name": "Menge"
       },
       {
        "name": "Einheit"
       }
      ]
     }
    ]
   },
   {
    "title": "Schritt 5: Tabellen der 3NF bilden",
    "hint": "Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.",
    "relations": [
     {
      "name": "Rechnung",
      "columns": [
       {
        "name": "ReNr",
        "pk": true
       },
       {
        "name": "KdNr",
        "fk": "Kunde"
       }
      ]
     },
     {
      "name": "Kunde",
      "columns": [
       {
        "name": "KdNr",
        "pk": true
       },
       {
        "name": "KdName"
       }
      ]
     },
     {
      "name": "Artikel",
      "columns": [
       {
        "name": "ArtNr",
        "pk": true
       },
       {
        "name": "ArtBez"
       }
      ]
     },
     {
      "name": "Position",
      "columns": [
       {
        "name": "ReNr",
        "fk": "Rechnung",
        "pk": true
       },
       {
        "name": "PosNr",
        "pk": true
       },
       {
        "name": "ArtNr",
        "fk": "Artikel"
       },
       {
        "name": "Menge"
       },
       {
        "name": "Einheit"
       }
      ]
     }
    ]
   }
  ],
  "target": [
   "Rechnung (ReNr, KdNr <fk>)",
   "Kunde (KdNr, KdName)",
   "Artikel (ArtNr, ArtBez)",
   "Position (ReNr <fk>, PosNr, ArtNr <fk>, Menge, Einheit)"
  ],
  "targetNote": "Eine Aufgabe mit allen Stufen: Menge wird aufgespalten (1NF), der Kunde hängt nur von ReNr ab (2NF), und Kunde und Artikel hängen jeweils über eine Nummer transitiv an der Position (3NF).",
  "tags": [
   "1NF",
   "2NF",
   "3NF"
  ],
  "source": "Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)"
 }
];
