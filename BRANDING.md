# Selbst hosten und branden – ohne Programmierung

## 1. Paket herunterladen

Unter **Releases** im Repository liegen fertige Pakete:

| Datei | Wofür |
|---|---|
| `db-trainer-html.zip` | jeder Webserver (Apache, nginx, Hochschul-Webspace), ILIAS „HTML-Lernmodul“, Moodle „Datei/Ordner“ |
| `db-trainer-scorm12.zip` | ILIAS/Moodle als SCORM-Lernmodul: Fortschritt wird unter dem Login gespeichert, das Ergebnis der Probeklausur geht an die Plattform |

Das Paket ist rein statisch: kein Server, keine Datenbank, keine Installation.
Es funktioniert auch in einem Unterordner, z. B. `https://www.example.org/lehre/db-trainer/`.

## 2. Branding anpassen

ZIP entpacken, dann im Ordner:

1. **Logo** nach `brand/` kopieren, z. B. `brand/logo.svg`.
2. **`config.json`** mit einem Texteditor öffnen und anpassen.
3. Ordner wieder zippen (für ILIAS/Moodle) oder direkt hochladen (Webserver).

Änderungen an `config.json` wirken beim nächsten Laden der Seite, ohne neuen Build.
Fehlerhafte oder unbekannte Felder werden ignoriert (Hinweis in der Browser-Konsole),
die Seite funktioniert trotzdem.

### Alle Felder

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `appName` | Name in Kopfzeile und Startseite | `"SQL-Labor"` |
| `tagline` | Untertitel auf der Startseite | `"Datenbanken · Hochschule X"` |
| `title` | Titel im Browser-Tab (leer = `appName`) | `"SQL-Labor · Hochschule X"` |
| `favicon` | Symbol im Browser-Tab, Pfad relativ zum Ordner | `"brand/favicon.png"` |
| `logo` | Logo-Datei im Ordner `brand/` | `"logo.svg"` |
| `institution` | Name der Einrichtung (Alternativtext des Logos) | `"Hochschule X"` |
| `theme` | `"auto"` (hell/dunkel nach Gerät), `"neutral"`, `"dark"`, `"th-koeln"` | `"auto"` |
| `header` | `"farbig"` (Markenfarbe) oder `"hell"` (weiß, für farbige Logos) | `"hell"` |
| `colors` | eigene Farben: `brand`, `brandContrast`, `accent`, `bg` | `{ "brand": "#003366" }` |
| `font` | Schriftart (CSS) | `"'Source Sans 3', Arial, sans-serif"` |
| `fontUrl` | Stylesheet der Schrift (optional) | `"brand/fonts.css"` |
| `themeSwitcher` | Design-Auswahl in der Kopfzeile anzeigen | `false` |
| `footerLinks` | Links in der Fußzeile (z. B. Impressum, Datenschutz) | `[{ "label": "Impressum", "href": "https://…" }]` |
| `license` | Lizenzhinweis in der Fußzeile | `"Software: MIT · Inhalte: CC BY-SA 4.0"` |
| `repo`, `branch` | Repository für den Aufgaben-Editor (leer = Knopf ausblenden) | `"hochschule-x/db-trainer"` |
| `readyStreak` | Prüfungsreife: so viele vollständige Probeklausuren in Folge bestanden | `3` |
| `readySureShare` | … und dieser Anteil der Wissensfragen „sicher“ (0 bis 1) | `0.8` |

Felder, die mit `_` beginnen (z. B. `"_hinweis"`), sind Kommentare.

### Beispiel

```json
{
  "appName": "DB-Trainer",
  "tagline": "Datenbanksysteme · Hochschule X",
  "title": "DB-Trainer · Hochschule X",
  "logo": "logo.svg",
  "favicon": "brand/favicon.png",
  "institution": "Hochschule X",
  "header": "hell",
  "colors": { "brand": "#003366", "accent": "#e07b00" },
  "footerLinks": [
    { "label": "Impressum", "href": "https://www.hochschule-x.de/impressum" },
    { "label": "Datenschutz", "href": "https://www.hochschule-x.de/datenschutz" }
  ]
}
```

## 3. Hinweise

- **Logos sind Marken.** Sie gehören nicht in das öffentliche Repository, sondern nur in das
  eigene Paket (Ordner `brand/`). Das Repository ignoriert den Inhalt von `public/brand/`.
- **Farben:** Die Status- und Diagrammfarben (richtig/falsch, Fragenstatus) sind bewusst
  unabhängig vom Branding, damit Rückmeldungen in jedem Design gleich lesbar bleiben.
  Auf ausreichenden Kontrast zwischen `brand` und `brandContrast` achten (mindestens 4,5:1).
- **Impressum und Datenschutz:** Wer öffentlich hostet, sollte beides über `footerLinks` verlinken.
  Der Trainer selbst speichert nichts auf einem Server (nur im Browser bzw. in der Lernplattform).

## Für Entwicklerinnen und Entwickler

Mit eigenem Branding-Ordner (enthält `config.json` und `brand/`) direkt ein Paket bauen:

```bash
npm run package -- ../branding-meine-hochschule
```

Ein neues Release mit fertigen Paketen entsteht automatisch, sobald ein Versions-Tag gepusht wird:

```bash
git tag v0.3.0 && git push origin v0.3.0
```
