// Szenario "Gastro": Bars, Cocktails und Zutaten.
// Nach dem durchgehenden Beispiel "Datenbank fuer Gastroueberblick" aus Skript 01/02:
// Bars werden durch einen Namen identifiziert, haben ein Eroeffnungsdatum und koennen
// keinen, einen oder mehrere Cocktails herstellen; Cocktails bestehen aus Zutaten, die
// suess sind oder nicht. Alle Bars und Werte sind frei erfunden.

export const GASTRO_SCHEMA = `
CREATE TABLE Bar (
  Bar_ID     NUMBER PRIMARY KEY,
  Name       VARCHAR2(40) NOT NULL UNIQUE,
  Ort        VARCHAR2(30),
  Eroeffnung DATE
);
CREATE TABLE Cocktail (
  Cocktail_ID NUMBER PRIMARY KEY,
  Name        VARCHAR2(40) NOT NULL UNIQUE,
  Typ         VARCHAR2(20),
  Alkoholfrei CHAR(1) DEFAULT 'N' CHECK (Alkoholfrei IN ('J', 'N'))
);
CREATE TABLE Zutat (
  Zutat_ID NUMBER PRIMARY KEY,
  Name     VARCHAR2(40) NOT NULL,
  Suess    CHAR(1) CHECK (Suess IN ('J', 'N'))
);
CREATE TABLE Rezept (
  Cocktail_ID NUMBER REFERENCES Cocktail (Cocktail_ID),
  Zutat_ID    NUMBER REFERENCES Zutat (Zutat_ID),
  Menge_cl    NUMBER(4,1),
  CONSTRAINT pk_rezept PRIMARY KEY (Cocktail_ID, Zutat_ID)
);
CREATE TABLE Karte (
  Bar_ID      NUMBER REFERENCES Bar (Bar_ID),
  Cocktail_ID NUMBER REFERENCES Cocktail (Cocktail_ID),
  Preis       NUMBER(5,2) NOT NULL,
  CONSTRAINT pk_karte PRIMARY KEY (Bar_ID, Cocktail_ID)
);`;

export const GASTRO_RELATIONS = [
  'Bar (Bar_ID, Name, Ort, Eroeffnung)',
  'Cocktail (Cocktail_ID, Name, Typ, Alkoholfrei)',
  'Zutat (Zutat_ID, Name, Suess)',
  'Rezept (Cocktail_ID <fk>, Zutat_ID <fk>, Menge_cl)',
  'Karte (Bar_ID <fk>, Cocktail_ID <fk>, Preis)',
];

export const GASTRO_A = `
INSERT INTO Bar VALUES (1, 'Blaue Stunde', 'Köln', DATE '2015-04-01');
INSERT INTO Bar VALUES (2, 'Rheinblick', 'Köln', DATE '2019-09-15');
INSERT INTO Bar VALUES (3, 'Oberberg Lounge', 'Gummersbach', DATE '2021-03-12');
INSERT INTO Bar VALUES (4, 'Kellerbar', 'Bonn', DATE '2010-11-20');
INSERT INTO Bar VALUES (5, 'Neue Mitte', 'Köln', DATE '2026-10-01');

INSERT INTO Cocktail VALUES (1, 'Mojito', 'Longdrink', 'N');
INSERT INTO Cocktail VALUES (2, 'Caipirinha', 'Shortdrink', 'N');
INSERT INTO Cocktail VALUES (3, 'Virgin Colada', 'Longdrink', 'J');
INSERT INTO Cocktail VALUES (4, 'Espresso Martini', 'Shortdrink', 'N');
INSERT INTO Cocktail VALUES (5, 'Ipanema', 'Longdrink', 'J');
INSERT INTO Cocktail VALUES (6, 'Gin Tonic', 'Longdrink', 'N');

INSERT INTO Zutat VALUES (1, 'Rum', 'N');
INSERT INTO Zutat VALUES (2, 'Limette', 'N');
INSERT INTO Zutat VALUES (3, 'Rohrzucker', 'J');
INSERT INTO Zutat VALUES (4, 'Minze', 'N');
INSERT INTO Zutat VALUES (5, 'Cachaça', 'N');
INSERT INTO Zutat VALUES (6, 'Ananassaft', 'J');
INSERT INTO Zutat VALUES (7, 'Kokoscreme', 'J');
INSERT INTO Zutat VALUES (8, 'Wodka', 'N');
INSERT INTO Zutat VALUES (9, 'Espresso', 'N');
INSERT INTO Zutat VALUES (10, 'Gin', 'N');
INSERT INTO Zutat VALUES (11, 'Tonic Water', 'N');
INSERT INTO Zutat VALUES (12, 'Maracujasaft', 'J');
INSERT INTO Zutat VALUES (13, 'Grenadine', 'J');

INSERT INTO Rezept VALUES (1, 1, 5);
INSERT INTO Rezept VALUES (1, 2, 3);
INSERT INTO Rezept VALUES (1, 3, 2);
INSERT INTO Rezept VALUES (1, 4, 1);
INSERT INTO Rezept VALUES (2, 5, 5);
INSERT INTO Rezept VALUES (2, 2, 4);
INSERT INTO Rezept VALUES (2, 3, 2);
INSERT INTO Rezept VALUES (3, 6, 12);
INSERT INTO Rezept VALUES (3, 7, 4);
INSERT INTO Rezept VALUES (4, 8, 4);
INSERT INTO Rezept VALUES (4, 9, 3);
INSERT INTO Rezept VALUES (4, 3, 1);
INSERT INTO Rezept VALUES (5, 2, 3);
INSERT INTO Rezept VALUES (5, 3, 2);
INSERT INTO Rezept VALUES (5, 12, 10);
INSERT INTO Rezept VALUES (6, 10, 4);
INSERT INTO Rezept VALUES (6, 11, 16);

INSERT INTO Karte VALUES (1, 1, 9.50);
INSERT INTO Karte VALUES (1, 2, 9.00);
INSERT INTO Karte VALUES (1, 3, 7.50);
INSERT INTO Karte VALUES (1, 6, 10.50);
INSERT INTO Karte VALUES (2, 1, 10.00);
INSERT INTO Karte VALUES (2, 4, 11.50);
INSERT INTO Karte VALUES (2, 5, 7.00);
INSERT INTO Karte VALUES (3, 2, 8.00);
INSERT INTO Karte VALUES (3, 6, 9.00);
INSERT INTO Karte VALUES (3, 3, 6.50);
INSERT INTO Karte VALUES (3, 1, 8.50);
INSERT INTO Karte VALUES (4, 4, 10.00);
`;

export const GASTRO_B = `
INSERT INTO Bar VALUES (1, 'Blaue Stunde', 'Köln', DATE '2016-02-01');
INSERT INTO Bar VALUES (4, 'Kellerbar', 'Bonn', DATE '2012-05-05');
INSERT INTO Bar VALUES (6, 'Domblick', 'Köln', DATE '2018-07-07');
INSERT INTO Bar VALUES (7, 'Altstadtbar', 'Düsseldorf', DATE '2020-01-15');
INSERT INTO Bar VALUES (8, 'Kölsche Ecke', 'Köln', DATE '2011-08-08');

INSERT INTO Cocktail VALUES (1, 'Mojito', 'Longdrink', 'N');
INSERT INTO Cocktail VALUES (3, 'Virgin Colada', 'Longdrink', 'J');
INSERT INTO Cocktail VALUES (6, 'Gin Tonic', 'Longdrink', 'N');
INSERT INTO Cocktail VALUES (7, 'Hugo', 'Longdrink', 'N');
INSERT INTO Cocktail VALUES (8, 'Virgin Mojito', 'Longdrink', 'J');
INSERT INTO Cocktail VALUES (9, 'Margarita', 'Shortdrink', 'N');
INSERT INTO Cocktail VALUES (10, 'Tequila Shot', 'Shortdrink', 'N');

INSERT INTO Zutat VALUES (1, 'Rum', 'N');
INSERT INTO Zutat VALUES (2, 'Limette', 'N');
INSERT INTO Zutat VALUES (3, 'Rohrzucker', 'J');
INSERT INTO Zutat VALUES (4, 'Minze', 'N');
INSERT INTO Zutat VALUES (6, 'Ananassaft', 'J');
INSERT INTO Zutat VALUES (7, 'Kokoscreme', 'J');
INSERT INTO Zutat VALUES (10, 'Gin', 'N');
INSERT INTO Zutat VALUES (11, 'Tonic Water', 'N');
INSERT INTO Zutat VALUES (14, 'Prosecco', 'N');
INSERT INTO Zutat VALUES (15, 'Holundersirup', 'J');
INSERT INTO Zutat VALUES (16, 'Tequila', 'N');
INSERT INTO Zutat VALUES (17, 'Triple Sec', 'J');
INSERT INTO Zutat VALUES (18, 'Soda', 'N');
INSERT INTO Zutat VALUES (19, 'Salz', 'N');
INSERT INTO Zutat VALUES (21, 'Zimt', 'N');

INSERT INTO Rezept VALUES (1, 1, 4);
INSERT INTO Rezept VALUES (1, 2, 3);
INSERT INTO Rezept VALUES (1, 3, 2);
INSERT INTO Rezept VALUES (1, 4, 1);
INSERT INTO Rezept VALUES (1, 18, 6);
INSERT INTO Rezept VALUES (3, 6, 10);
INSERT INTO Rezept VALUES (3, 7, 5);
INSERT INTO Rezept VALUES (6, 10, 5);
INSERT INTO Rezept VALUES (6, 11, 15);
INSERT INTO Rezept VALUES (7, 14, 10);
INSERT INTO Rezept VALUES (7, 15, 2);
INSERT INTO Rezept VALUES (7, 4, 1);
INSERT INTO Rezept VALUES (7, 18, 5);
INSERT INTO Rezept VALUES (8, 2, 3);
INSERT INTO Rezept VALUES (8, 3, 2);
INSERT INTO Rezept VALUES (8, 4, 1);
INSERT INTO Rezept VALUES (8, 18, 10);
INSERT INTO Rezept VALUES (9, 16, 5);
INSERT INTO Rezept VALUES (9, 17, 2);
INSERT INTO Rezept VALUES (9, 2, 3);
INSERT INTO Rezept VALUES (10, 16, 4);
INSERT INTO Rezept VALUES (10, 19, 1);
INSERT INTO Rezept VALUES (10, 2, 1);

INSERT INTO Karte VALUES (1, 1, 9.00);
INSERT INTO Karte VALUES (1, 7, 8.50);
INSERT INTO Karte VALUES (1, 9, 10.00);
INSERT INTO Karte VALUES (4, 6, 9.50);
INSERT INTO Karte VALUES (4, 8, 6.00);
INSERT INTO Karte VALUES (6, 1, 11.00);
INSERT INTO Karte VALUES (6, 3, 7.00);
INSERT INTO Karte VALUES (6, 6, 10.00);
INSERT INTO Karte VALUES (6, 7, 9.00);
INSERT INTO Karte VALUES (7, 9, 9.50);
INSERT INTO Karte VALUES (7, 8, 6.50);
`;
