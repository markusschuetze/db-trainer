# Barrierefreiheit

Ziel: **WCAG 2.1 Stufe AA** (entspricht den Anforderungen der BITV 2.0 für Hochschulen).
Stand der Selbstprüfung: November 2026. Das ist eine Selbstbewertung, kein Gutachten und keine
offizielle Konformitätserklärung.

## Was geprüft wurde

**Automatisch (axe-core 4, Regeln WCAG 2.0/2.1 A und AA):** alle Seiten (Start, Fortschritt, Modellierung,
Relationenmodell, Normalisierung, DDL, SQL, Praktikum, Textaufgaben, Fragen lernen, Probeklausur,
Dozentenmodus mit allen Reitern, Aufgaben-Editor), in den Farbvarianten „TH Köln“ und „dunkel“, zusätzlich
in Zuständen mit Rückmeldungen, geöffneten Dialogen, geöffneten Formularen, laufender und ausgewerteter
Klausur. Ergebnis zuletzt: **keine Verstöße**. Dabei gefundene und behobene Mängel:

- Sprunglink „Zum Inhalt springen“ wirkte nicht (Konflikt mit dem Routing)
- SQL-Editor fing die Tab-Taste ein (Tastaturfalle, WCAG 2.1.2); jetzt verlässt man ihn mit Esc, dann Tab
- Seitentitel wechselte nicht je Seite (2.4.2); Fokus blieb beim Seitenwechsel stehen (2.4.3)
- Scrollbare Codeblöcke und Tabellen waren per Tastatur nicht erreichbar (2.1.1)
- fehlende Beschriftung von Auswahlfeldern im Prüfungsmodus (1.3.1 / 4.1.2), fehlende Rolle bei einer Statusanzeige
- Probeklausur ohne Zeitlimit-Option (2.2.1): jetzt wählbar („Ohne Zeitlimit“)

**Von Hand:** Tastaturbedienung der Hauptabläufe, Fokussichtbarkeit, Reflow bei 320 px Breite ohne
waagerechtes Scrollen (1.4.10), Kontrast der Markenfarben (der Design-Editor warnt unter 4,5 : 1),
Status nicht nur über Farbe (Symbole ✓/✗ und Text), Tabellenansicht zu jedem Diagramm.

## Was NICHT geprüft wurde

Automatische Werkzeuge erkennen nur einen Teil der Probleme. Offen sind:

- **Test mit Screenreadern** (NVDA, JAWS, VoiceOver) und Sprachsteuerung
- Test mit Vergrößerungssoftware und Windows-Kontrastmodus
- Verständlichkeit der Texte (leichte Sprache ist nicht Ziel)
- ER- und Schema-Diagramme sind als Bild mit Textbeschreibung und ergänzender Textliste (Fremdschlüssel
  als Sätze) umgesetzt; ob das für blinde Nutzende ausreicht, sollte ein Test mit Betroffenen klären

Vor dem offiziellen Einsatz an der Hochschule empfiehlt sich ein Test mit Screenreader durch die
Digital-Barrierefreiheits-Stelle der TH und eine Barrierefreiheitserklärung (BITV, Pflicht für öffentliche
Stellen).

## Erneut prüfen

Im Entwicklungsmodus (`npm run dev`) die Seite öffnen und in der Browser-Konsole axe laden:

```js
const s = document.createElement('script'); s.src = '/node_modules/axe-core/axe.min.js';
s.onload = async () => console.table((await axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] })).violations.map(v => [v.id, v.nodes.length, v.help]));
document.head.appendChild(s);
```

## Einstellungen für Nutzende

- Hell/Dunkel folgt der Geräteeinstellung (Design „auto“, wenn in `config.json` so gewählt)
- Probeklausur ohne Zeitlimit wählbar (zählt dann nicht für die Prüfungsreife)
- Alle Funktionen sind per Tastatur bedienbar, Sprunglink am Seitenanfang
