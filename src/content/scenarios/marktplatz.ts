// Szenario "Marktplatz": Nutzerinnen als Kundinnen oder Herstellerinnen, Artikel aus Komponenten und Käufe.
// Nach Übung 5 (Aufgabe 3: Nutzer/Artikel/Komponente) und Übung 6 (DML) der Vorlesung; die Constraints
// stammen aus Übung 5 Aufgabe 4. Alle Personen, Adressen und Zahlen sind erfunden.

export const MARKTPLATZ_SCHEMA = `
CREATE TABLE Nutzerin (
  ID    NUMBER PRIMARY KEY,
  Name  VARCHAR2(30),
  Email VARCHAR2(30) UNIQUE NOT NULL
);
CREATE TABLE Kunde (
  ID            NUMBER PRIMARY KEY,
  Lieferadresse VARCHAR2(30)
);
CREATE TABLE Hersteller (
  ID                  NUMBER PRIMARY KEY,
  IBAN                CHAR(22),
  Anzahl_verk_Artikel NUMBER
);
CREATE TABLE Artikel (
  Artikel_ID NUMBER PRIMARY KEY,
  Titel      VARCHAR2(20),
  Kategorie  VARCHAR2(30),
  Hersteller NUMBER NOT NULL
);
CREATE TABLE Komponente (
  Komponenten_ID NUMBER PRIMARY KEY,
  Bezeichnung    VARCHAR2(50),
  Stueckkosten   NUMBER
);
CREATE TABLE besteht_aus (
  Komponenten_ID NUMBER,
  Artikel_ID     NUMBER,
  CONSTRAINT besteht_aus_pk PRIMARY KEY (Komponenten_ID, Artikel_ID)
);
CREATE TABLE kaufen (
  Artikel NUMBER,
  Kunde   NUMBER,
  Preis   NUMBER NOT NULL,
  CONSTRAINT pk_kauf PRIMARY KEY (Artikel, Kunde)
);
ALTER TABLE Kunde ADD CONSTRAINT fk_nutzer_kunde FOREIGN KEY (ID) REFERENCES Nutzerin (ID);
ALTER TABLE Hersteller ADD CONSTRAINT fk_nutzer_hersteller FOREIGN KEY (ID) REFERENCES Nutzerin (ID);
ALTER TABLE Artikel ADD CONSTRAINT fk_hersteller FOREIGN KEY (Hersteller) REFERENCES Hersteller (ID);
ALTER TABLE besteht_aus ADD CONSTRAINT fk_komponente FOREIGN KEY (Komponenten_ID) REFERENCES Komponente (Komponenten_ID);
ALTER TABLE besteht_aus ADD CONSTRAINT fk_artikel FOREIGN KEY (Artikel_ID) REFERENCES Artikel (Artikel_ID);
ALTER TABLE kaufen ADD CONSTRAINT fk_artikel_kauf FOREIGN KEY (Artikel) REFERENCES Artikel (Artikel_ID);
ALTER TABLE kaufen ADD CONSTRAINT fk_kunde_kauf FOREIGN KEY (Kunde) REFERENCES Kunde (ID);
ALTER TABLE kaufen ADD CONSTRAINT c_preis_check CHECK (Preis >= 0);
ALTER TABLE Komponente ADD CONSTRAINT c_stueckkosten_check CHECK (Stueckkosten BETWEEN 0 AND 100);
ALTER TABLE Artikel ADD CONSTRAINT c_kategorie_check CHECK (Kategorie IN ('Elektronik', 'Haushalt', 'Spielzeug'));
ALTER TABLE Hersteller ADD CONSTRAINT c_iban_check CHECK (IBAN LIKE '978%');
ALTER TABLE Nutzerin ADD CONSTRAINT c_email_check CHECK (Email LIKE '%@%.%');`;

export const MARKTPLATZ_RELATIONS = [
  'Nutzerin (ID, Name, Email)',
  'Kunde (ID <fk → Nutzerin>, Lieferadresse)',
  'Hersteller (ID <fk → Nutzerin>, IBAN, Anzahl_verk_Artikel)',
  'Artikel (Artikel_ID, Titel, Kategorie, Hersteller <fk>)',
  'Komponente (Komponenten_ID, Bezeichnung, Stueckkosten)',
  'besteht_aus (Komponenten_ID <fk>, Artikel_ID <fk>)',
  'kaufen (Artikel <fk>, Kunde <fk>, Preis)',
];

export const MARKTPLATZ_TABLES = ['Nutzerin', 'Kunde', 'Hersteller', 'Artikel', 'Komponente', 'besteht_aus', 'kaufen'];

/** Datenbestand aus Übung_6_DML_Daten.xlsx (IBAN ergänzt, "-" als NULL) */
export const MARKTPLATZ_A = `
INSERT INTO Nutzerin VALUES (1, 'Lara Jung', 'ljung@web.de');
INSERT INTO Nutzerin VALUES (2, 'Carolin Franke', 'cfranke@ulrich.de');
INSERT INTO Nutzerin VALUES (3, 'Johannes Graf', 'johgraf@becker.de');
INSERT INTO Kunde VALUES (1, 'Aletshausen,Paderborner Str.6');
INSERT INTO Kunde VALUES (3, 'Beckingen,Stresemannstr. 72');
INSERT INTO Hersteller VALUES (2, '9780010517393770123456', NULL);
INSERT INTO Artikel VALUES (1, 'Kleiner Schrank', 'Haushalt', 2);
INSERT INTO Artikel VALUES (2, 'Schrauben 50er Pack', 'Haushalt', 2);
INSERT INTO Komponente VALUES (1, 'Schraube', 0.21);
INSERT INTO Komponente VALUES (2, 'Holzplatte 800x200x18', 10.8);
INSERT INTO Komponente VALUES (3, 'Winkelverbinder', 0.75);
INSERT INTO besteht_aus VALUES (2, 1);
INSERT INTO besteht_aus VALUES (3, 1);
INSERT INTO besteht_aus VALUES (1, 2);
INSERT INTO kaufen VALUES (1, 1, 57.99);
INSERT INTO kaufen VALUES (1, 3, 57.99);
INSERT INTO kaufen VALUES (2, 1, 10.5);`;

/** Verdeckter Datenbestand: gleiche Namen, andere Nummern und Werte */
export const MARKTPLATZ_B = `
INSERT INTO Nutzerin VALUES (30, 'Lara Jung', 'lara@mail.de');
INSERT INTO Nutzerin VALUES (31, 'Carolin Franke', 'franke@holz.de');
INSERT INTO Nutzerin VALUES (32, 'Johannes Graf', 'graf@shop.de');
INSERT INTO Nutzerin VALUES (33, 'Ali Kaya', 'ali@web.de');
INSERT INTO Kunde VALUES (30, 'Köln,Ring 1');
INSERT INTO Kunde VALUES (32, 'Bonn,Weg 2');
INSERT INTO Kunde VALUES (33, 'Siegburg,Allee 9');
INSERT INTO Hersteller VALUES (31, '9781234567890123456789', 15);
INSERT INTO Artikel VALUES (20, 'Kleiner Schrank', 'Haushalt', 31);
INSERT INTO Artikel VALUES (21, 'Schrauben 50er Pack', 'Haushalt', 31);
INSERT INTO Artikel VALUES (22, 'Regal', 'Haushalt', 31);
INSERT INTO Komponente VALUES (10, 'Schraube', 0.3);
INSERT INTO Komponente VALUES (11, 'Holzplatte 800x200x18', 12.5);
INSERT INTO Komponente VALUES (12, 'Winkelverbinder', 0.9);
INSERT INTO Komponente VALUES (13, 'Dübel', 0.1);
INSERT INTO besteht_aus VALUES (11, 20);
INSERT INTO besteht_aus VALUES (12, 20);
INSERT INTO besteht_aus VALUES (10, 21);
INSERT INTO besteht_aus VALUES (13, 22);
INSERT INTO besteht_aus VALUES (12, 22);
INSERT INTO kaufen VALUES (20, 30, 59.9);
INSERT INTO kaufen VALUES (20, 32, 59.9);
INSERT INTO kaufen VALUES (21, 30, 11);
INSERT INTO kaufen VALUES (22, 33, 89);`;
