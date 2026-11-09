# Prüfprotokoll v0.5.0 (erster Gesamtdurchgang)

Getestet im Chrome des Autors gegen die lokale Entwicklungsfassung, Desktop und 375 px Breite
(Messung per eingebettetem Rahmen, Sichtprüfung per Screenshot). Kein Test auf einem echten Handy,
kein Screenreader-Test.

## Durchgegangen
Start, Modellierung, Relationenmodell, Normalisierung, SQL-DDL, SQL-DML/DQL (Liste, Aufgabe, Ausführen),
Textaufgaben, Praktikum, Probeklausur (konfigurieren, bearbeiten, abgeben, Auswertung), Fortschritt,
Dozentenmodus, Konsole auf Fehler.

## Gefunden und behoben
| Nr | Ort | Fehler | Korrektur |
|----|-----|--------|-----------|
| F1 | alle Seiten nach Seitenwechsel | Heller Rahmen um den ganzen Inhalt (Fokus-Ring des programmatisch fokussierten Hauptbereichs) | `#main:focus { outline: none }` |
| F2 | alle Seiten, 375 px | Seite 12 px zu breit, seitliches Wischen (Kopfzeile mit Sprachumschalter) | Kopfzeile bricht um, kompakteres Padding |
| F3 | Kopfzeile, 375 px | Titel „DB-Trainer“ brach in drei Zeilen um | `whitespace-nowrap` |
| F4 | Probeklausur, 375 px | Auswahlfeld in der Kardinalitätsaufgabe 38 px zu breit | `min-w-0 max-w-full` |
| F5 | Legende Krähenfuß | Entitätsrand wirkte wie zusätzlicher Strich, andere Zeichnung als im Diagramm | Legende nutzt dieselbe Zeichenroutine, Entität als Kasten |
| F6 | Alle Seiten | Zu kleine Tipp-Flächen (Kopf-Links, Fußzeile, „← Übersicht“ 16 px hoch, Radio/Checkbox 13 px) | Größere Flächen, auf Touch-Geräten Auswahlfelder 22 px und Buttons mind. 44 px |
| F7 | Probeklausur | „1 Punkte“ | „1 Punkt“ |
| F8 | Textaufgaben-Liste | Vorschautext brach mitten im Wort ab | Kürzung an Wortgrenze |

## Offen
| Nr | Ort | Befund |
|----|-----|--------|
| O1 | Wissensfragen (Inhalt) | Erledigt: Antwortlängen angeglichen (144 → 32 von 198 Fragen mit eindeutig längster richtiger Antwort), Test ergänzt. Die Optionen sind redaktionell neu geschrieben und sollten vom Dozenten gegengelesen werden. |
| O2 | Praktikum, Handy | Der Editor steht unter Aufgabe, Tipps und Schemaansicht. Beim Tippen ist die Aufgabe nicht sichtbar. |
| O3 | Test | Echtes Handy, Querformat, Screenreader und ILU-Upload noch nicht getestet. |

## Ohne Befund
Konsole ohne Fehler, Ausführen und Fehlermeldung (ORA-00942) im SQL-Editor, Probeklausur bis Auswertung,
Kapitelauswertung, Fortschrittsseite, Dozentenmodus (Reiter, Datenquelle).

---

# Gesamttest 2 (Durchgang von 0 bis 100, mit typischen Studierendenfehlern)

Im Chrome gegen die Entwicklungsfassung, über die echte Oberfläche gesteuert (Eingabefeld füllen, „Prüfen“ klicken, Meldung lesen):

| Bereich | Umfang | Ergebnis |
|---|---|---|
| Wissensfragen | alle 272 über „Lernen“ mit richtiger Antwort, Datenprüfung aller Fragen | alle richtig gewertet, Optionen vollständig |
| SQL-Aufgaben | 79 Aufgaben × 11 Eingaben (Musterlösung, ohne Semikolon, Kleinschreibung, Kommentar, leer, Tippfehler im Befehl, fehlende Klammer, LIMIT, doppelte Anführungszeichen, nur erste Zeile, `SELECT *`) = 869 Läufe | Musterlösung bestand überall, Fehlerfälle siehe unten |
| DDL-Aufgaben | 8 Aufgaben × 13 Eingaben = 104 Läufe | siehe unten |
| Normalisierung | 3 Aufgaben komplett (falsch, dann richtig, alle 4 Schritte) | in Ordnung |
| Modellierung | 17 Phrasen, 6 Spezialisierungen, richtig und falsch | in Ordnung, Texte siehe unten |
| Textaufgaben | 10 Aufgaben, alle Schritte | in Ordnung |
| Praktikum | Skripte, Fehler, COMMIT/ROLLBACK, 37 typische Fehleingaben | siehe unten |
| Probeklausur | Start, Beantworten, Neuladen mitten drin, Zeitablauf, Auswertung | in Ordnung |
| Dozentenmodus | Demo-Auswertung, Aufgaben-Editor (Frage anlegen, Entwurf prüfen) | in Ordnung |
| Ungültige Adressen | 11 falsche Routen | freundliche Meldung, kein Absturz |

## Gefunden und behoben (SQL-Engine, wichtigste Gruppe)

Studierende machen Fehler, die SQLite verzeiht, Oracle aber ablehnt. Der Trainer hat sie vorher durchgewinkt und damit falsches Oracle-Verhalten beigebracht.

| Nr | Fehler | Vorher | Jetzt |
|---|---|---|---|
| E1 | Doppelte Anführungszeichen statt Hochkommas (`"Informatik"`) | 32 von 79 Aufgaben bestanden damit | ORA-00904 mit Erklärung (AS "Alias" bleibt erlaubt) |
| E2 | `FROM` vergessen (`SELECT COUNT(*) Student`) | lief als Alias bzw. ORA-00904 | ORA-00923 |
| E3 | `VARCHAR2` ohne Länge | akzeptiert | ORA-00906 |
| E4 | `VALUES (…), (…)` (MySQL-Stil) | akzeptiert | ORA-00933 |
| E5 | `AUTO_INCREMENT` | je nach Position akzeptiert | immer ORA-00907 |
| E6 | MySQL-Funktionen (`IFNULL`, `NOW`, `SUBSTRING`, `LEN`, …) | akzeptiert oder englische Meldung | ORA-00904 mit Oracle-Alternative |
| E7 | `==` | akzeptiert | ORA-00936 |
| E8 | Text in Zahlenspalte, zu langer Text in `VARCHAR2(n)` | akzeptiert | ORA-01722, ORA-12899 |
| E9 | `= (SELECT …)` mit mehreren Zeilen | stillschweigend erste Zeile | ORA-01427 |
| E10 | Rohe englische SQLite-Meldungen (Spaltenzahl, doppelter Spaltenname, Funktionsargumente, ORDER BY-Nummer, Unterabfrage, Aggregat in WHERE, nicht geschlossenes Hochkomma u. a.) | englisch, ohne Code | deutsch mit ORA-Code |
| E11 | Meldung „ORA-00900-Familie (z. B. …)“ | nichtssagend | ORA-00900 (Befehl falsch geschrieben) bzw. ORA-00933 |
| E12 | Fremdschlüssel-Verstoß | „02291 oder 02292“ | je nach Anweisung ORA-02291 bzw. ORA-02292 |
| E13 | Unbekannter Datentyp (`TEXT`, `BOOLEAN`, …) in CREATE TABLE | „Tabelle erstellt“ | ORA-00902 |
| E14 | `ALTER TABLE … MODIFY` | „nicht unterstützt“, obwohl in den Wissensfragen gelehrt | funktioniert (Typ, NOT NULL) |

Abgesichert durch `src/sql/studentMistakes.test.ts` (42 Tests, auch: gültiges SQL bleibt gültig).

## Gefunden und behoben (Inhalte)

| Nr | Ort | Fehler | Korrektur |
|---|---|---|---|
| C1 | Kardinalitätsfragen (Modellierung, Probeklausur, Textaufgaben) | „Ein(e) Produkt ist verbunden mit wie vielen Produkte?“ (Grammatik) | „Eine Instanz von „Kunde“ ist verbunden mit wie vielen „Produkt“-Instanzen?“ |
| C2 | Modellierung | Entitätsnamen „Schueler“, „Bueromaterial“ | „Schüler“, „Büromaterial“ |
| C3 | Übungsblatt Übung 05, Aufgabe 4 | verschachtelter, schwer lesbarer Satz | neu formuliert |
| C4 | Wissensfrage fu-length | Erklärung nur „Datenbank hat 9 Zeichen.“ | ausführlicher |

## Bekannt und bewusst offen

- `'abc' + 1` und `AVG(Textspalte)` rechnen weiter ohne Fehler (Oracle: ORA-01722). Selten.
- Ein Textwert in einer DATE-Spalte wird nicht auf Gültigkeit geprüft (Oracle: ORA-01861 u. a.).
- Doppelt angeführte Namen wie `"Name"` für eine Spalte werden abgelehnt, auch wenn Oracle sie bei exakter Schreibweise zuließe. Im Unterricht kommen sie nicht vor.
- Die Seite „Entwurf leeren“ im Dozentenmodus nutzt ein Browser-Bestätigungsfenster.
- Weiterhin ungetestet: echtes Handy, Screenreader, ILU-Upload.
