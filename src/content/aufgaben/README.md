# Aufgaben als Dateien

Jede Datei hier ist eine Aufgabe und wird automatisch in den Trainer übernommen.
Am einfachsten entstehen sie mit dem **Aufgaben-Editor** im Trainer (`#/autor`, Link
„Aufgabe hinzufügen“ in der Fußzeile): Formular ausfüllen, Musterlösung prüfen lassen,
„Auf GitHub speichern“ klicken und auf GitHub „Commit changes“ bestätigen.

| Ordner | Inhalt |
|---|---|
| `fragen/` | Wissensfragen (Multiple Choice) |
| `sql/` | SQL-Abfragen (`"kind": "dql"`) und Datenänderungen (`"kind": "dml"`); `"scenario"` wählt die Fall-Datenbank (`hochschule`, `gastro`, `projekte`) |

Nach jedem Speichern prüft GitHub automatisch alle Aufgaben (z. B. ob die Musterlösung
funktioniert und das Thema existiert). Nur wenn alles stimmt, wird die Seite neu
veröffentlicht. Eine fehlerhafte Aufgabe kann den Trainer also nicht kaputt machen.

Gültige Themen (`topicId`) stehen in `src/content/topics.ts`.
