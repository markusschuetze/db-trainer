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
