# DB-Trainer

Interaktiver, quelloffener Trainer für die Vorlesung **Datenbanksysteme**. Die Module folgen den
Vorlesungsskripten (TH Köln, Campus Gummersbach) und laufen komplett im Browser: ohne Server,
ohne Anmeldung, ohne Tracking.

| Modul | Skript | Inhalt |
|---|---|---|
| Modellierung | 02–03 | Kardinalitäten aus Anforderungstexten in Krähenfußnotation, Spezialisierungen (disjunkt/überlappend, vollständig/partiell) |
| Relationenmodell | 04 | ER → Relation: Fremdschlüssel-Seite, NOT NULL aus der Minimalkardinalität, Zuordnungsrelationen |
| Normalisierung | 05 | 1NF (mehrwertig/strukturiert), voll/partiell/transitiv, höchste NF, Zielschema |
| SQL-DDL | 06 | CREATE/ALTER/DROP, Constraints, referenzielle Integrität, Identity Columns |
| SQL-DML/DQL | Folgekapitel | 3 Fall-Datenbanken (Hochschule, Gastro, Projekte) nach Beispielen aus der Vorlesung, je Leicht/Mittel/Schwer; Schema-Diagramm mit Fremdschlüsseln; Zufallsaufgabe; Spielwiese |
| Prüfungsmodus | alle | Probeklausur mit Zeitlimit, ohne Hilfen, Auswertung nach Kapiteln und Themen |
| Fortschritt | alle | Prüfungsreife wie in Führerschein-Apps (3 vollständige Probeklausuren in Folge bestanden, 80 % der Fragen sicher; einstellbar in `src/config.ts`), Verlauf, Schwachstellen, Stand je Thema |
| Fragen lernen | alle | Wissensfragen nach Kapitel oder Thema; falsch beantwortete kommen zuerst wieder |

Jedes Kapitel ist in **Themen nach den Inhaltsfolien** der Skripte gegliedert (`src/content/topics.ts`,
z. B. „1NF: mehrwertige und strukturierte Attribute“). Jede Aufgabe und Frage gehört zu genau einem
Thema; Fortschritt, Lernmodus und Probeklausur arbeiten damit.

## Schnellstart

```bash
npm install
npm run dev        # Entwicklung auf http://localhost:5173
npm test           # Bewertungslogik und Konsistenz aller Aufgaben
npm run build      # statische Seite in dist/
npm run package    # ILIAS-/SCORM-Pakete in release/
```

## Bereitstellen und Einbinden

Die gebaute Seite ist rein statisch und funktioniert in jedem Unterverzeichnis.

- **Eigene Website / GitHub Pages:** `dist/` hochladen. Für GitHub Pages ist ein Workflow
  enthalten (`.github/workflows/pages.yml`): Repository-Einstellungen → Pages → Source „GitHub Actions“.
- **ILIAS (z. B. ILU), HTML-Lernmodul:** `release/db-trainer-html.zip` als HTML-Lernmodul hochladen,
  Startdatei `index.html`.
- **ILIAS/Moodle als SCORM 1.2:** `release/db-trainer-scorm12.zip`. Das Ergebnis der Probeklausur
  wird dann als Punktzahl (0–100) und bestanden/nicht bestanden (ab 50 %) an die Plattform gemeldet.
- **iFrame / Deep-Link:** `?embed=1` blendet Kopf- und Fußzeile aus. Einzelne Module oder Aufgaben
  lassen sich direkt verlinken, z. B. `index.html?embed=1#/sql/group-by` oder `#/pruefung`.

SQLite liegt eingebettet in einer JavaScript-Datei vor (keine `.wasm`-Datei), weil Lernplattformen
unbekannte Dateitypen beim Upload oft herausfiltern. Sie wird erst geladen, wenn eine SQL-Seite sie braucht.

## Branding

- `src/config.ts`: Name, Logo, Institution, Fußzeilen-Links, Standard-Theme.
- `src/index.css`: Farben als Design-Tokens. Ein Theme ist ein Block `[data-theme="…"]`.
  `institution-example` ist ein **Platzhalter**: Werte aus dem offiziellen Corporate Design einsetzen.
- Logos gehören nach `public/brand/` und werden nicht eingecheckt (nicht Teil der offenen Lizenz).
- Per URL wählbar: `?theme=dark`.

## Neue Aufgaben hinzufügen (für Lehrende)

**Ohne Programmierkenntnisse über den Aufgaben-Editor** (Link „Aufgabe hinzufügen“ in der Fußzeile, `#/autor`):

1. Typ wählen (Wissensfrage, SQL-Abfrage oder SQL-Änderung), Thema und Texte ausfüllen.
2. Der Editor prüft sofort: Läuft die Musterlösung in Oracle-Syntax? Würde eine leere Abgabe bestehen?
   Ist die ID frei? Bei Abfragen wird das Ergebnis direkt angezeigt.
3. „Auf GitHub speichern“ öffnet GitHub mit der fertigen Datei, dort „Commit changes“ klicken.
4. GitHub testet automatisch **alle** Aufgaben und veröffentlicht den Trainer neu (etwa eine Minute).
   Schlägt ein Test fehl, bleibt die bisherige Version online.

Voraussetzung: Schreibrechte im Repository (in `src/config.ts` unter `repo` eingetragen).

Neue Aufgaben landen als einzelne Dateien in `src/content/aufgaben/` (siehe README dort). Alternativ
lässt sich so eine Datei auch direkt auf GitHub anlegen oder bearbeiten.

## Inhalte pflegen (Entwicklung)

Alle Aufgaben sind reine Daten, neue Aufgaben brauchen keinen Code:

| Datei | Inhalt |
|---|---|
| `src/content/erPhrases.ts` | Beziehungs-Phrasen (Modellierung und Relationenmodell) |
| `src/content/specializations.ts` | Spezialisierungs-Beispiele |
| `src/content/exercises.ts` | Normalisierung |
| `src/content/ddlExercises.ts` | SQL-DDL (Prüfungen: Struktur und Verhalten) |
| `src/content/scenarios.ts`, `src/content/scenarios/` | Fall-Datenbanken für DML/DQL (je sichtbarer Datenbestand A und verdeckter B) und ihre Aufgaben |
| `src/content/hochschule.ts` | Fall-Datenbank Hochschule |
| `src/content/sqlExercises.ts` | DQL- und DML-Aufgaben (Prüfung gegen Musterlösung auf A und B) |
| `src/content/mcQuestions.ts` | Wissensfragen pro Kapitel (Prüfungsmodus, Fragen lernen) |
| `src/content/topics.ts` | Themen je Kapitel nach den Inhaltsfolien |
| `src/content/aufgaben/` | Zusätzliche Aufgaben als einzelne JSON-Dateien (aus dem Aufgaben-Editor) |

`npm test` prüft automatisch, dass jede Musterlösung alle Prüfungen besteht, eine leere Abgabe
keine, die Daten der Normalisierungsaufgaben zu den angegebenen Abhängigkeiten passen, jede
Probeklausur mit Musterantworten die volle Punktzahl ergibt, jedes Thema mindestens zwei Aufgaben
und eine Wissensfrage hat, jede Aufgabe auf ein existierendes Thema verweist, jede Fall-Datenbank
je Schwierigkeitsgrad mindestens zwei Aufgaben hat und jede Abfrage auf dem verdeckten Datenbestand
ein anderes Ergebnis liefert (sonst wäre die Prüfung gegen fest eingetragene Werte wirkungslos).

## Wie bewertet wird

- **DDL:** Struktur (Schlüssel, NOT NULL, Fremdschlüssel, Löschverhalten, Namen) und Verhalten
  (Testdaten einfügen/löschen). Jede korrekte Schreibweise wird akzeptiert.
- **DQL:** Ergebnismenge im Vergleich zur Musterlösung, auf dem sichtbaren und einem verdeckten
  Datenbestand (fest eingetragene Werte fallen auf). Reihenfolge nur, wenn die Aufgabe sortiert.
- **DML:** Tabelleninhalte nach dem Skript im Vergleich zur Musterlösung, ebenfalls auf beiden Beständen.

## Oracle im Browser

Die Vorlesung nutzt Oracle, der Trainer läuft auf SQLite (sql.js). `src/sql/oracle.ts` und
`src/sql/dialect.ts` gleichen die für die Vorlesung wichtigen Unterschiede an:

- `ALTER TABLE … ADD/DROP CONSTRAINT`, Fremdschlüssel nur auf existierende Tabellen und PK/UNIQUE
  (ORA-00942, ORA-02270), `DROP TABLE` mit ORA-02449 bzw. `CASCADE CONSTRAINTS`, Identity Columns
- `NVL`, `TO_DATE`, `TO_CHAR`, `TO_NUMBER`, `LPAD`/`RPAD`, `SYSDATE`, `DUAL`, `DATE '…'`, `MINUS`,
  `FETCH FIRST n ROWS ONLY`
- GROUP-BY-Regeln wie Oracle (ORA-00979, ORA-00937), `LIKE` unterscheidet Groß-/Kleinschreibung
- Ablehnung von Nicht-Oracle-Syntax: `LIMIT`, `AS` bei Tabellenaliasen, `ON UPDATE`,
  `ON DELETE RESTRICT`, `AUTOINCREMENT`, Typ `TEXT`
- Deutsche Fehlermeldungen mit dem in Oracle zu erwartenden ORA-Code

**Bekannte Grenzen:** keine Sequenzen, kein `ALTER TABLE … MODIFY`; Längen wie `VARCHAR2(20)`
werden nicht erzwungen; NULL in nicht-ganzzahligen PK-Spalten wird beim Einfügen nicht abgelehnt
(die Strukturprüfung behandelt PKs aber als NOT NULL); Division zweier Ganzzahlen rundet ab
(Oracle rechnet mit Nachkommastellen); Datumswerte erscheinen als `JJJJ-MM-TT`, Datumsarithmetik
(`SYSDATE - datum`) fehlt; NULL-Sortierung bei `ORDER BY` weicht ab. Die GROUP-BY-Prüfung gilt
für die oberste Abfrageebene. Echte Oracle-Übung bleibt die Schulungsdatenbank mit SQL Developer.

## Fortschritt, ILU und Datenschutz

- **Im SCORM-Paket (z. B. in ILU):** Der Fortschritt (gelöste Übungen, Fragenstatus, Probeklausuren)
  wird über SCORM (`cmi.suspend_data`) unter dem ILU-Login der Studierenden gespeichert und ist auf
  jedem Gerät verfügbar. Das Ergebnis der Probeklausur geht zusätzlich als Punktzahl an ILU.
  SCORM 1.2 erlaubt 4096 Zeichen; bei Bedarf werden die ältesten Klausuren zuerst gekürzt.
- **Auf der Website:** nur im `localStorage` des Browsers, mit Export/Import als Datei.
- Es werden keine Daten an Dritte übertragen, es gibt keinen eigenen Server.

## Barrierefreiheit
 Die Oberfläche nutzt semantisches HTML, Tastaturfokus,
Skip-Link und Statusmeldungen für Screenreader; ein formaler BITV-/WCAG-Test steht noch aus.

## Lizenz

Software: MIT (`LICENSE`). Inhalte: CC BY-SA 4.0 (`LICENSE-CONTENT.md`). Logos ausgenommen.
Inspiriert von den OER-Trainern des Projekts EILD.nrw; der Code ist eine Neuentwicklung.
