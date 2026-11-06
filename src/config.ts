// Zentrale Konfiguration. Wer den Trainer an seiner Hochschule betreibt,
// aendert nur diese Datei (und ggf. ein Theme in index.css).
export const config = {
  appName: 'DB-Trainer',
  tagline: 'Datenbanksysteme interaktiv üben',
  // 'neutral' | 'institution-example' | 'dark'. Per URL ueberschreibbar: ?theme=dark
  theme: 'neutral',
  // Logo-Datei unter public/brand/ ablegen; leer = kein Logo.
  logo: '',
  institution: '',
  footerLinks: [
    { label: 'Aufgabe hinzufügen (für Lehrende)', href: '#/autor' },
    { label: 'Quellcode (MIT)', href: 'https://github.com/markusschuetze/db-trainer' },
  ],
  // Repository fuer den Aufgaben-Editor ("Auf GitHub speichern")
  repo: 'markusschuetze/db-trainer',
  branch: 'main',
  license: 'Software: MIT · Inhalte: CC BY-SA 4.0',
  // Pruefungsreife (Fortschrittsseite): so viele vollstaendige Probeklausuren in Folge bestanden ...
  readyStreak: 3,
  // ... und dieser Anteil der Wissensfragen "sicher" (zweimal in Folge richtig)
  readySureShare: 0.8,
} as const;
