import { useMemo, useState } from 'react';
import { addItem, loadDraft, saveDraft } from '../content/draftPack';
import { ScenarioBrowser } from '../components/ScenarioBrowser';
import { ResultTable, StatementOutput } from '../components/SqlOutput';
import { LEVEL_NAME, scenarioById, scenarios } from '../content/scenarios';
import { SqlEditor } from '../components/SqlEditor';
import { config } from '../config';
import { CHAPTER_NAME, mcQuestions, type Chapter, type McQuestion } from '../content/mcQuestions';
import { sqlExercises } from '../content/sqlExercises';
import type { SqlExercise } from '../content/sqlTypes';
import { topics, topicsOf } from '../content/topics';
import { CHAPTERS } from '../progressCatalog';
import { runSqlExercise } from '../sql/sqlGrading';
import { useSql } from '../useSql';

// Aufgaben-Editor fuer Lehrende: Formular ausfuellen, Musterloesung sofort pruefen,
// als JSON-Datei auf GitHub speichern. Die Pipeline testet und veroeffentlicht danach.

type Kind = 'frage' | 'dql' | 'dml';

const input = 'mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2';
const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      {children}
    </label>
  );
}

export function AuthorPage() {
  const { SQL } = useSql();
  const [kind, setKind] = useState<Kind>('frage');
  const [chapter, setChapter] = useState<Chapter>('05');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [idOverride, setIdOverride] = useState('');
  // Frage
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState<number[]>([]);
  const [explanation, setExplanation] = useState('');
  // SQL
  const [task, setTask] = useState('');
  const [solution, setSolution] = useState('');
  const [hints, setHints] = useState('');
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const [scenario, setScenario] = useState('hochschule');
  const [ordered, setOrdered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState('');

  const effChapter: Chapter = kind === 'frage' ? chapter : 'SQL';
  const topicChoices = topicsOf(effChapter);
  const effTopic = topicChoices.some((t) => t.id === topicId) ? topicId : topicChoices[0]?.id ?? '';
  const id = idOverride || slug(title);

  const data: McQuestion | SqlExercise = useMemo(() => {
    if (kind === 'frage') {
      const opts = options.map((o) => o.trim()).filter(Boolean);
      const corr = correct.filter((i) => i < opts.length && options[i].trim());
      return {
        id,
        topicId: effTopic,
        chapter: effChapter,
        question: title.trim(),
        options: opts,
        correct: corr.map((i) => opts.indexOf(options[i].trim())),
        ...(corr.length > 1 ? { multi: true } : {}),
        explanation: explanation.trim(),
      };
    }
    const t = topics.find((x) => x.id === effTopic);
    return {
      id,
      topicId: effTopic,
      kind,
      scenario,
      level,
      title: title.trim(),
      topic: t?.title ?? '',
      task: task.trim(),
      hints: hints
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
      solution: solution.trim(),
      ...(kind === 'dql' && ordered ? { ordered: true } : {}),
      source: 'Ergänzt über den Aufgaben-Editor',
    };
  }, [kind, id, effTopic, effChapter, title, options, correct, explanation, level, scenario, task, hints, solution, ordered]);

  /* ---------- Pruefung der Aufgabe ---------- */
  const problems: string[] = [];
  const notes: string[] = [];
  if (!title.trim()) problems.push(kind === 'frage' ? 'Die Frage fehlt.' : 'Der Titel fehlt.');
  if (!/^[a-z0-9-]+$/.test(id)) problems.push('Die ID darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.');
  const taken = kind === 'frage' ? mcQuestions.some((q) => q.id === id) : sqlExercises.some((e) => e.id === id);
  if (id && taken) problems.push(`Die ID „${id}“ ist bereits vergeben.`);
  let preview: ReturnType<typeof runSqlExercise> | null = null;

  if (kind === 'frage') {
    const q = data as McQuestion;
    if (q.options.length < 2) problems.push('Es braucht mindestens zwei Antwortmöglichkeiten.');
    if (!q.correct.length) problems.push('Markiere mindestens eine richtige Antwort.');
    if (!q.explanation) problems.push('Die Erklärung fehlt (sie erscheint nach dem Beantworten).');
    if (new Set(q.options).size !== q.options.length) problems.push('Zwei Antwortmöglichkeiten sind identisch.');
  } else {
    const ex = data as SqlExercise;
    if (!ex.task) problems.push('Der Aufgabentext fehlt.');
    if (!ex.solution) problems.push('Die Musterlösung fehlt.');
    if (SQL && ex.solution) {
      preview = runSqlExercise(SQL, ex, ex.solution);
      const failed = preview.results.filter((r) => !r.ok);
      if (failed.length) problems.push(`Die Musterlösung läuft nicht fehlerfrei: ${failed[0].message}${failed[0].ora ? ` (${failed[0].ora})` : ''}`);
      else if (!preview.passed) problems.push(`Die Musterlösung besteht die eigene Prüfung nicht: ${preview.checks.find((c) => !c.ok)?.hint ?? ''}`);
      if (kind === 'dml' && !failed.length && !preview.changed?.length) problems.push('Die Musterlösung ändert keine Daten.');
      if (runSqlExercise(SQL, ex, '').passed) problems.push('Eine leere Abgabe würde bestehen. Die Aufgabe muss etwas verlangen.');
      if (kind === 'dql' && !failed.length && preview.expected && preview.expected.rows.length === 0)
        notes.push('Das Ergebnis ist auf den sichtbaren Daten leer. Das ist als Übung wenig aussagekräftig.');
      if (kind === 'dql' && ordered && !/ORDER\s+BY/i.test(ex.solution)) problems.push('„Reihenfolge prüfen“ ist an, aber die Musterlösung sortiert nicht (ORDER BY).');
    }
  }
  const ok = problems.length === 0;
  const json = JSON.stringify(data, null, 2) + '\n';
  const folder = kind === 'frage' ? 'fragen' : 'sql';
  const path = `src/content/aufgaben/${folder}/${id || 'neue-aufgabe'}.json`;
  const githubUrl = `https://github.com/${config.repo}/new/${config.branch}?filename=${encodeURIComponent(path)}&value=${encodeURIComponent(json)}`;

  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Aufgabe hinzufügen</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Für Lehrende. Die Aufgabe wird hier sofort geprüft. Mit „Auf GitHub speichern“ öffnet sich GitHub mit der fertigen
        Datei; dort genügt „Commit changes“. Danach prüft GitHub automatisch alle Aufgaben und veröffentlicht den Trainer neu
        (dauert etwa eine Minute). Dafür braucht es Schreibrechte im Repository <code>{config.repo}</code>.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Aufgabentyp">
        {(
          [
            ['frage', 'Wissensfrage'],
            ['dql', 'SQL-Abfrage (SELECT)'],
            ['dml', 'SQL-Änderung (INSERT/UPDATE/DELETE)'],
          ] as [Kind, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${kind === k ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-card border border-line bg-surface p-5">
          <div className={`grid gap-4 ${kind === 'frage' ? 'sm:grid-cols-2' : ''}`}>
            {kind === 'frage' && (
              <Field label="Kapitel">
                <select className={input} value={chapter} onChange={(e) => setChapter(e.target.value as Chapter)}>
                  {CHAPTERS.map((c) => (
                    <option key={c} value={c}>
                      {CHAPTER_NAME[c]}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Thema (nach Folien)">
              <select className={input} value={effTopic} onChange={(e) => setTopicId(e.target.value)}>
                {topicChoices.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={kind === 'frage' ? 'Frage' : 'Titel'}>
            {kind === 'frage' ? (
              <textarea className={input} rows={3} value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
            )}
          </Field>
          <Field label="ID" hint="Wird aus dem Text erzeugt; nur ändern, wenn nötig.">
            <input className={`${input} font-mono text-sm`} value={id} onChange={(e) => setIdOverride(slug(e.target.value))} />
          </Field>

          {kind === 'frage' ? (
            <>
              <fieldset>
                <legend className="font-semibold">Antwortmöglichkeiten</legend>
                <span className="block text-xs text-muted">Richtige ankreuzen. Mehrere richtige = Mehrfachauswahl. Leere Zeilen entfallen.</span>
                <div className="mt-2 space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        aria-label={`Antwort ${i + 1} ist richtig`}
                        checked={correct.includes(i)}
                        onChange={(e) => setCorrect(e.target.checked ? [...correct, i] : correct.filter((x) => x !== i))}
                      />
                      <input
                        className="block w-full rounded-lg border border-line bg-surface px-3 py-2"
                        value={o}
                        aria-label={`Antwort ${i + 1}`}
                        onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                      />
                    </div>
                  ))}
                </div>
                {options.length < 6 && (
                  <button className="mt-2 text-sm underline" onClick={() => setOptions([...options, ''])}>
                    + weitere Antwort
                  </button>
                )}
              </fieldset>
              <Field label="Erklärung" hint="Erscheint nach dem Beantworten, auch bei richtiger Antwort.">
                <textarea className={input} rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Fall-Datenbank">
                <select className={input} value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  {scenarios.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name} ({sc.tables.join(', ')})
                    </option>
                  ))}
                </select>
              </Field>
              <ScenarioBrowser SQL={SQL} scenario={scenario} key={scenario} />
              <Field label="Aufgabentext" hint={`Bezieht sich auf die Fall-Datenbank ${scenarioById(scenario).name}.`}>
                <textarea className={input} rows={4} value={task} onChange={(e) => setTask(e.target.value)} />
              </Field>
              <div>
                <span className="font-semibold">Musterlösung (Oracle-SQL)</span>
                <span className="block text-xs text-muted">
                  {kind === 'dql'
                    ? 'Eine SELECT-Abfrage. Studierende bestehen, wenn ihre Abfrage dieselben Zeilen liefert, auch auf einem verdeckten zweiten Datenbestand.'
                    : 'Eine oder mehrere Anweisungen. Studierende bestehen, wenn die Tabellen danach gleich aussehen.'}
                </span>
                <div className="mt-1">
                  <SqlEditor value={solution} onChange={setSolution} onRun={() => {}} label="Musterlösung" />
                </div>
              </div>
              <Field label="Tipps" hint="Ein Tipp pro Zeile, vom allgemeinen zum konkreten.">
                <textarea className={input} rows={3} value={hints} onChange={(e) => setHints(e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-6">
                <Field label="Schwierigkeit">
                  <select className={input} value={level} onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3)}>
                    <option value={1}>{LEVEL_NAME[1]}</option>
                    <option value={2}>{LEVEL_NAME[2]}</option>
                    <option value={3}>{LEVEL_NAME[3]}</option>
                  </select>
                </Field>
                {kind === 'dql' && (
                  <label className="mt-7 flex items-center gap-2">
                    <input type="checkbox" checked={ordered} onChange={(e) => setOrdered(e.target.checked)} />
                    Reihenfolge prüfen (ORDER BY ist Teil der Aufgabe)
                  </label>
                )}
              </div>
            </>
          )}
        </section>

        <section className="min-w-0 space-y-4">
          <div role="status" className={`rounded-card border p-4 ${ok ? 'border-ok bg-ok-bg' : 'border-bad bg-bad-bg'}`}>
            <p className={`font-bold ${ok ? 'text-ok' : 'text-bad'}`}>{ok ? 'Die Aufgabe ist gültig.' : 'Noch nicht fertig:'}</p>
            {!ok && (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {notes.map((n) => (
              <p key={n} className="mt-1 text-sm">
                Hinweis: {n}
              </p>
            ))}
            {kind !== 'frage' && !SQL && <p className="mt-1 text-sm text-muted">Datenbank wird geladen …</p>}
          </div>

          {preview && kind === 'dql' && preview.expected && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Ergebnis der Musterlösung (sichtbare Daten)</h2>
              <ResultTable columns={preview.expected.columns} rows={preview.expected.rows} />
              <p className="mt-2 text-xs text-muted">Zusätzlich wird auf einem verdeckten Datenbestand verglichen.</p>
            </div>
          )}
          {preview && kind === 'dml' && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Ausgabe der Musterlösung</h2>
              <StatementOutput results={preview.results} />
            </div>
          )}

          <div className="rounded-card border border-line bg-surface p-4">
            <h2 className="mb-1 font-bold">Speichern</h2>
            <p className="mb-3 font-mono text-xs text-muted">{path}</p>
            <div className="flex flex-wrap gap-3">
              {config.repo && (
              <a
                className={`${btn} ${ok ? '' : 'pointer-events-none opacity-50'}`}
                aria-disabled={!ok}
                href={ok ? githubUrl : undefined}
                target="_blank"
                rel="noreferrer"
              >
                Auf GitHub speichern
              </a>
              )}
              <button
                className={btn}
                disabled={!ok}
                onClick={() => {
                  saveDraft(addItem(loadDraft(), kind === 'frage' ? 'questions' : 'sql', data as { id: string }));
                  setAdded(`„${id}“ liegt jetzt im Entwurf. Im Dozentenmodus lädst du daraus die aufgaben.json herunter.`);
                }}
              >
                Zum Entwurf hinzufügen
              </button>
              <button
                className={btnGhost}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(json);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    /* ignorieren */
                  }
                }}
              >
                {copied ? 'Kopiert' : 'JSON kopieren'}
              </button>
            </div>
            {added && (
              <p role="status" className="mt-3 text-sm">
                {added} <a href="#/dozent/aufgaben" className="underline">Zum Dozentenmodus</a>
              </p>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold">Datei-Inhalt ansehen</summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-bg p-3 font-mono text-xs">{json}</pre>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
