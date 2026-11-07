import { analyticsAvailable } from '../analytics';
import { config } from '../config';
import { Dashboard } from '../dashboard/Dashboard';
import { DesignEditor } from '../dashboard/DesignEditor';
import { PackEditor } from '../dashboard/PackEditor';

const TABS = [
  ['auswertung', 'Auswertung'],
  ['aufgaben', 'Aufgaben und Übungsblätter'],
  ['design', 'Design und Einstellungen'],
  ['hilfe', 'Anleitung'],
] as const;

function Help() {
  const code = 'rounded bg-bg px-1 font-mono text-sm';
  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Was dieser Bereich kann</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li><strong>Auswertung:</strong> Wo haben Studierende die meisten Probleme, wo sind sie gut, wie schnell lösen sie Aufgaben, welche falschen Antworten werden häufig gewählt. Anonym und nur in Gruppen ab {config.analyticsMinGroup} Personen.</li>
          <li><strong>Aufgaben und Übungsblätter:</strong> Neue Wissensfragen, SQL-Aufgaben, Fall-Datenbanken, Themen, Kapitel, Textaufgaben und Übungsblätter für das Praktikum. Ergebnis ist eine Datei <code className={code}>aufgaben.json</code>.</li>
          <li><strong>Design und Einstellungen:</strong> Name, Logo, Farben, Schrift, Fußzeilen-Links, Schwellen für die Prüfungsreife. Ergebnis ist eine Datei <code className={code}>config.json</code>.</li>
        </ul>
        <p className="mt-3 text-sm text-muted">Der Dozentenmodus ist keine Anmeldung: Jeder kann diese Seite öffnen und eigene Dateien erzeugen, aber nur du kannst sie auf den Server legen. Geschützt sind die Auswertungsdaten durch das Token des Sammelservers.</p>
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Neue Inhalte für alle Studierenden bereitstellen</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>Im Reiter „Aufgaben und Übungsblätter“ Inhalte anlegen, „Entwurf prüfen“, dann <code className={code}>aufgaben.json</code> herunterladen.</li>
          <li>Die Datei neben <code className={code}>index.html</code> auf den Server legen (bzw. in ILU im Lernmodul ersetzen und neu hochladen).</li>
          <li>Seite neu laden: Die Inhalte erscheinen sofort. Fehlerhafte Einträge werden übersprungen und im Reiter „Aufgaben“ gemeldet, der Rest funktioniert trotzdem.</li>
        </ol>
        <p className="mt-2 text-sm text-muted">Das Praktikum bietet Übungsblätter auch als Datei zum Laden an: Studierende können eine <code className={code}>.json</code>- oder <code className={code}>.sql</code>-Datei direkt unter „Praktikum“ öffnen, ohne dass du das Paket ändern musst.</p>
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Anonyme Lernstatistik einrichten</h2>
        <p className="mt-1 text-sm">Status: {analyticsAvailable() ? <strong>Sammelserver eingetragen ({config.analyticsUrl}).</strong> : <strong>noch kein Sammelserver eingetragen.</strong>}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          <li>Den Sammelserver starten (eine Datei, Node.js 18 oder neuer, keine Installation von Paketen): <code className={code}>TOKEN=dein-passwort DATA_FILE=events.jsonl node server/collector.mjs</code>. Betrieb hinter HTTPS (z. B. nginx oder Caddy).</li>
          <li>Im Reiter „Design und Einstellungen“ die Adresse des Servers eintragen und die <code className={code}>config.json</code> bereitstellen.</li>
          <li>Studierende werden einmalig gefragt, ob sie anonym teilen möchten. Ohne Zustimmung wird nichts gesendet.</li>
          <li>Hier im Reiter „Auswertung“ das Token eingeben und „Vom Server laden“ klicken.</li>
        </ol>
        <p className="mt-3 text-sm"><strong>Datenschutz:</strong> Gespeichert werden Aufgaben-ID, Thema, richtig/falsch, Sekunden, Versuche, Tipp-Nutzung, bei Wissensfragen die gewählte Antwortnummer, bei Probeklausuren die Punkte je Kapitel, dazu eine zufällige Gerätekennung zum Zählen. Keine Namen, kein Login, keine eingegebenen Texte oder SQL-Anweisungen, keine IP-Adressen. Die Gerätekennung ist keiner Person zugeordnet, gilt aber rechtlich als pseudonym. Bitte vor dem Einsatz mit dem Datenschutz der Hochschule abstimmen und in der Datenschutzerklärung nennen.</p>
        <p className="mt-2 text-sm text-muted">Für die Forschung: „Auswertung als CSV“ exportiert aggregierte Werte je Aufgabe. Die Rohdatei <code className={code}>events.jsonl</code> kann hier ebenfalls geladen werden.</p>
      </section>
    </div>
  );
}

export function TeacherPage({ tab }: { tab?: string }) {
  const cur = TABS.some(([id]) => id === tab) ? tab! : 'auswertung';
  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Zum Trainer
      </a>
      <h1 className="mt-2 text-3xl font-bold">Dozentenmodus</h1>
      <p className="mt-1 max-w-2xl text-muted">Auswertung der Lehre, neue Inhalte und Branding an einem Ort.</p>
      <nav className="mt-5 flex flex-wrap gap-2 border-b border-line pb-3" aria-label="Dozentenmodus">
        {TABS.map(([id, label]) => (
          <a
            key={id}
            href={`#/dozent/${id}`}
            aria-current={cur === id ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold no-underline ${cur === id ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-6">
        {cur === 'auswertung' && <Dashboard />}
        {cur === 'aufgaben' && <PackEditor />}
        {cur === 'design' && <DesignEditor />}
        {cur === 'hilfe' && <Help />}
      </div>
    </>
  );
}
