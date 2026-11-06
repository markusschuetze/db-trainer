import { useState } from 'react';
import { ScenarioBrowser } from '../components/ScenarioBrowser';
import { SqlEditor } from '../components/SqlEditor';
import { StatementOutput } from '../components/SqlOutput';
import { scenarioById, scenarios } from '../content/scenarios';
import { loadDraft, saveDraft } from '../progress';
import type { StatementResult } from '../sql/oracle';
import { runPlayground } from '../sql/sqlGrading';
import { useSql } from '../useSql';

const START: Record<string, string> = {
  hochschule: `-- Freie Spielwiese. Mehrere Anweisungen mit ; trennen, Strg/Cmd+Enter führt aus.
SELECT k.Bezeichnung, COUNT(a.Matrikelnummer) AS Anmeldungen
FROM Kurs k
LEFT OUTER JOIN Anmelden a ON k.Kurs_ID = a.Kurs_ID
GROUP BY k.Bezeichnung
ORDER BY Anmeldungen DESC;`,
  gastro: `-- Freie Spielwiese. Mehrere Anweisungen mit ; trennen, Strg/Cmd+Enter führt aus.
SELECT b.Name AS Bar, c.Name AS Cocktail, k.Preis
FROM Karte k
JOIN Bar b ON b.Bar_ID = k.Bar_ID
JOIN Cocktail c ON c.Cocktail_ID = k.Cocktail_ID
ORDER BY b.Name, k.Preis DESC;`,
  projekte: `-- Freie Spielwiese. Mehrere Anweisungen mit ; trennen, Strg/Cmd+Enter führt aus.
SELECT m.Name, v.Name AS Vorgesetzt, a.Abt_Name
FROM Mitarbeiter m
LEFT OUTER JOIN Mitarbeiter v ON m.Vorgesetzter_ID = v.MA_ID
JOIN Abteilung a ON a.Abt_Nr = m.Abt_Nr;`,
};

export function Playground() {
  const { SQL, error } = useSql();
  const [scenario, setScenario] = useState(() => loadDraft('spielwiese-szenario', 'hochschule'));
  const [code, setCode] = useState(() => loadDraft(`spielwiese:${scenario}`, START[scenario] ?? ''));
  const [results, setResults] = useState<StatementResult[] | null>(null);
  const run = () => SQL && setResults(runPlayground(SQL, code, scenario));

  return (
    <>
      <a href="#/sql" className="text-sm underline">
        ← Aufgaben
      </a>
      <h1 className="mt-2 text-2xl font-bold">Spielwiese</h1>
      <p className="mt-1 text-sm text-muted">
        Beliebige Abfragen und Änderungen ausprobieren. Jeder Lauf startet mit dem ursprünglichen Datenbestand.
      </p>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Fall-Datenbank">
        {scenarios.map((s) => (
          <button
            key={s.id}
            aria-pressed={scenario === s.id}
            onClick={() => {
              setScenario(s.id);
              saveDraft('spielwiese-szenario', s.id);
              setCode(loadDraft(`spielwiese:${s.id}`, START[s.id] ?? ''));
              setResults(null);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${scenario === s.id ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="min-w-0">
          <ScenarioBrowser key={scenario} SQL={SQL} scenario={scenario} open />
        </section>
        <section className="min-w-0 space-y-4">
          <SqlEditor
            value={code}
            onChange={(v) => {
              setCode(v);
              saveDraft(`spielwiese:${scenario}`, v);
            }}
            onRun={run}
            label={`SQL-Editor (${scenarioById(scenario).name})`}
          />
          <button
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50"
            onClick={run}
            disabled={!SQL}
          >
            Ausführen
          </button>
          {error && <p className="text-sm text-bad">{error}</p>}
          {results && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Ausgabe</h2>
              <StatementOutput results={results} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
