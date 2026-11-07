import { useRef, useState, type ReactNode } from 'react';
import { BUILTIN_CHAPTERS, CHAPTER_NAME } from '../content/mcQuestions';
import { addItem, countOf, highestNfOf, KEYS, keyLabel, loadDraft, mergePacks, parseFds, parseIssues, parseTable, parseTasks, removeItem, saveDraft, slugify, toFile } from '../content/draftPack';
import { CARD_LABEL, CARDS, type Card } from '../content/erPhrases';
import type { DdlExercise } from '../content/ddlTypes';
import type { NfExercise } from '../content/types';
import { runExercise } from '../sql/ddlGrading';
import { deriveChecks } from '../sql/deriveChecks';
import { packReport, validatePack, type Pack, type PackReport } from '../content/pack';
import { topics } from '../content/topics';
import { useSql } from '../useSql';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold disabled:opacity-50';
const input = 'mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
      {children}
    </label>
  );
}

function Form({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="rounded-card border border-line bg-surface p-5">
      <summary className="cursor-pointer font-bold">{title}</summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}

/** Textfeld, das auch eine Datei einlesen kann (.sql) */
function SqlField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  const f = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Field label={label} hint={hint}>
        <textarea className={`${input} font-mono text-sm`} rows={6} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      </Field>
      <input
        ref={f}
        type="file"
        accept=".sql,.txt"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onChange(await file.text());
          e.target.value = '';
        }}
      />
      <button type="button" className="mt-1 text-sm underline" onClick={() => f.current?.click()}>
        aus .sql-Datei laden
      </button>
    </div>
  );
}

const TEXT_TASK_TEMPLATE = `{
  "id": "kino-text",
  "topicId": "02-elemente",
  "title": "Kinoverwaltung",
  "level": 2,
  "text": "Ein Kino zeigt Filme in Sälen. …",
  "entities": [
    { "name": "Film", "key": "Film-ID", "attrs": ["Titel"] },
    { "name": "Saal", "key": "Saalnummer", "attrs": ["Platzzahl"] }
  ],
  "distractors": ["Kunde"],
  "relationships": [
    { "e1": "Film", "e2": "Saal", "verb": "läuft in", "c12": "0N", "c21": "0N", "attrs": ["Beginn"], "why": "Begründung für die Lösung." }
  ],
  "wrongRelationships": [{ "e1": "Film", "e2": "Saal", "verb": "gehört", "why": "Warum das falsch ist." }]
}`;

export function PackEditor() {
  const { SQL } = useSql();
  const [draft, setDraftState] = useState<Pack>(loadDraft);
  const [report, setReport] = useState<PackReport | null>(null);
  const [msg, setMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const setDraft = (p: Pack) => {
    setDraftState(p);
    saveDraft(p);
    setReport(null);
  };

  // Formularzustand
  const [ch, setCh] = useState({ id: '', name: '' });
  const [tp, setTp] = useState({ chapter: 'SQL', id: '', title: '', slides: '' });
  const [ws, setWs] = useState({ title: '', description: '', schema: '', tasks: '' });
  const [db, setDb] = useState({ name: '', description: '', schema: '', dataA: '', dataB: '' });
  const [tt, setTt] = useState('');
  const [dd, setDd] = useState({ title: '', topicId: '06-create', level: 2, task: '', setup: '', solution: '', hints: '', names: false });
  const [ddInfo, setDdInfo] = useState<{ labels: string[]; errors: string[]; ok: boolean } | null>(null);
  const [nf, setNf] = useState({ title: '', topicId: '05-2nf', scenario: '', table: '', pk: '', issues: '', fixedTable: '', fixedPk: '', fixNote: '', fds: '', target: '', targetNote: '' });
  const [ph, setPh] = useState({ text: '', e1: '', k1: '', a1: '', p1: '', verb: '', e2: '', k2: '', a2: '', p2: '', c12: '0N' as Card, c21: '0N' as Card });

  const chapters = [...BUILTIN_CHAPTERS, ...(draft.chapters ?? []).map((c) => c.id)];
  const chapterName = (id: string) => CHAPTER_NAME[id] ?? draft.chapters?.find((c) => c.id === id)?.name ?? id;
  const add = (key: Parameters<typeof addItem>[1], item: { id: string }, done: string) => {
    setDraft(addItem(draft, key, item));
    setMsg(done);
  };

  const check = () => {
    setReport(validatePack(draft, SQL));
  };
  const download = () => {
    const blob = new Blob([toFile(draft)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aufgaben.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* Aktuell geladenes Paket */}
      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Aktuell geladenes Aufgabenpaket (aufgaben.json)</h2>
        {!packReport.loaded ? (
          <p className="mt-1 text-sm text-muted">Neben dieser Seite liegt keine <code>aufgaben.json</code>. Es werden nur die eingebauten Inhalte genutzt.</p>
        ) : (
          <>
            <p className="mt-1 text-sm">
              Übernommen: {Object.entries(packReport.counts).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${keyLabel(k as never)}`).join(', ') || 'nichts'}.
            </p>
            {packReport.problems.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-bad">
                {packReport.problems.map((p, i) => (
                  <li key={i}>
                    {p.kind} „{p.id}“: {p.message}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Entwurf */}
      <section className="rounded-card border-2 border-brand bg-surface p-5">
        <h2 className="font-bold">Dein Entwurf</h2>
        <p className="mt-1 text-sm text-muted">
          Hier sammelst du neue Inhalte. Sie bleiben in diesem Browser gespeichert. Mit „Als aufgaben.json herunterladen“ entsteht die Datei, die du neben{' '}
          <code>index.html</code> legst (oder in ILU ins Lernmodul). Danach sehen alle Studierenden die neuen Inhalte, ohne neuen Build.
        </p>
        {countOf(draft) === 0 ? (
          <p className="mt-3 text-sm">Der Entwurf ist leer. Lege unten Inhalte an oder lade eine vorhandene <code>aufgaben.json</code>.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {KEYS.filter((k) => (draft[k] as unknown[] | undefined)?.length).map((k) => (
              <details key={k}>
                <summary className="cursor-pointer font-semibold">
                  {keyLabel(k)} ({(draft[k] as unknown[]).length})
                </summary>
                <ul className="mt-1 space-y-1 pl-4 text-sm">
                  {(draft[k] as { id: string; title?: string; name?: string; question?: string }[]).map((x) => (
                    <li key={x.id} className="flex items-center justify-between gap-3">
                      <span>
                        <code>{x.id}</code> {x.title ?? x.name ?? x.question?.slice(0, 60)}
                      </span>
                      <button className="text-bad underline" onClick={() => setDraft(removeItem(draft, k, x.id))}>
                        entfernen
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button className={btnGhost} onClick={check} disabled={!SQL || countOf(draft) === 0}>
            Entwurf prüfen
          </button>
          <button className={btn} onClick={download} disabled={countOf(draft) === 0}>
            Als aufgaben.json herunterladen
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const p = JSON.parse(await f.text()) as Pack;
                setDraft(mergePacks(draft, p));
                setMsg(`„${f.name}“ in den Entwurf übernommen.`);
              } catch {
                setMsg('Die Datei ist kein gültiges JSON.');
              }
              e.target.value = '';
            }}
          />
          <button className={btnGhost} onClick={() => importRef.current?.click()}>
            aufgaben.json laden
          </button>
          <a href="aufgaben.beispiel.json" download className={`${btnGhost} no-underline`}>
            Beispielpaket ansehen
          </a>
          <button className="ml-auto text-sm text-muted underline" onClick={() => window.confirm('Entwurf komplett löschen?') && setDraft({ version: 1 })}>
            Entwurf leeren
          </button>
        </div>
        {msg && (
          <p role="status" className="mt-2 text-sm">
            {msg}
          </p>
        )}
        {report && (
          <div role="status" className={`mt-3 rounded-lg p-3 text-sm ${report.problems.some((p) => !p.message.startsWith('Hinweis')) ? 'bg-bad-bg' : 'bg-ok-bg'}`}>
            <strong>
              {report.problems.some((p) => !p.message.startsWith('Hinweis'))
                ? 'Einige Einträge werden beim Laden übersprungen:'
                : `Alles gültig (${Object.entries(report.counts).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${keyLabel(k as never)}`).join(', ')}).`}
            </strong>
            <ul className="mt-1 list-disc pl-5">
              {report.problems.map((p, i) => (
                <li key={i}>
                  {p.kind} „{p.id}“: {p.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-sm">
          Fragen und SQL-Aufgaben erstellst du im <a href="#/autor" className="underline">Aufgaben-Editor</a> (Knopf „Zum Entwurf hinzufügen“).
        </p>
      </section>

      <Form title="Neues Kapitel oder Thema">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Neues Kapitel: Name" hint="z. B. „Transaktionen“">
            <input className={input} value={ch.name} onChange={(e) => setCh({ name: e.target.value, id: slugify(e.target.value) })} />
          </Field>
          <div className="flex items-end">
            <button className={btn} disabled={!ch.name.trim()} onClick={() => { add('chapters', { id: ch.id, name: ch.name.trim() } as never, `Kapitel „${ch.name}“ hinzugefügt.`); setCh({ id: '', name: '' }); }}>
              Kapitel hinzufügen
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Thema gehört zu Kapitel">
            <select className={input} value={tp.chapter} onChange={(e) => setTp({ ...tp, chapter: e.target.value })}>
              {chapters.map((c) => (
                <option key={c} value={c}>
                  {chapterName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Thema: Titel" hint="so wie auf der Folie, z. B. „COMMIT und ROLLBACK“">
            <input className={input} value={tp.title} onChange={(e) => setTp({ ...tp, title: e.target.value, id: slugify(e.target.value) })} />
          </Field>
          <Field label="Folienbezug" hint="optional, z. B. „Skript 08, Folien 12–20“">
            <input className={input} value={tp.slides} onChange={(e) => setTp({ ...tp, slides: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <button className={btn} disabled={!tp.title.trim()} onClick={() => { add('topics', { id: tp.id, chapter: tp.chapter, title: tp.title.trim(), slides: tp.slides.trim() } as never, `Thema „${tp.title}“ hinzugefügt.`); setTp({ ...tp, id: '', title: '', slides: '' }); }}>
              Thema hinzufügen
            </button>
          </div>
        </div>
        <p className="text-xs text-muted">Vorhandene Themen: {topics.length} eingebaut{(draft.topics?.length ?? 0) > 0 ? `, ${draft.topics!.length} im Entwurf` : ''}.</p>
      </Form>

      <Form title="Neues Übungsblatt für das Praktikum">
        <Field label="Titel" hint="z. B. „Übungsblatt 7: Kino“">
          <input className={input} value={ws.title} onChange={(e) => setWs({ ...ws, title: e.target.value })} />
        </Field>
        <Field label="Kurzbeschreibung">
          <input className={input} value={ws.description} onChange={(e) => setWs({ ...ws, description: e.target.value })} />
        </Field>
        <SqlField label="Datenbank (SQL-Skript)" hint="CREATE TABLE und INSERT in Oracle-Syntax. Darf leer sein, dann beginnen die Studierenden mit einer leeren Datenbank." value={ws.schema} onChange={(v) => setWs({ ...ws, schema: v })} />
        <Field label="Aufgaben" hint="Aufgaben durch eine Zeile „===“ trennen. Optional: eine Zeile „Tipp: …“ und ab „Lösung:“ die Musterlösung.">
          <textarea className={`${input} font-mono text-sm`} rows={8} value={ws.tasks} onChange={(e) => setWs({ ...ws, tasks: e.target.value })} placeholder={'Lege die Tabelle Kunde an.\nTipp: CREATE TABLE\nLösung:\nCREATE TABLE Kunde (id NUMBER PRIMARY KEY);\n===\nFüge drei Kunden ein.'} />
        </Field>
        <button
          className={btn}
          disabled={!ws.title.trim() || !parseTasks(ws.tasks).length}
          onClick={() => {
            add('worksheets', { id: slugify(ws.title), title: ws.title.trim(), description: ws.description.trim(), schema: ws.schema, tasks: parseTasks(ws.tasks) } as never, `Übungsblatt „${ws.title}“ hinzugefügt. Mit „Entwurf prüfen“ testest du das Schema.`);
            setWs({ title: '', description: '', schema: '', tasks: '' });
          }}
        >
          Übungsblatt hinzufügen
        </button>
      </Form>

      <Form title="Neue Fall-Datenbank für SQL-Aufgaben">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" hint="z. B. „Kino“">
            <input className={input} value={db.name} onChange={(e) => setDb({ ...db, name: e.target.value })} />
          </Field>
          <Field label="Beschreibung">
            <input className={input} value={db.description} onChange={(e) => setDb({ ...db, description: e.target.value })} />
          </Field>
        </div>
        <SqlField label="Schema (CREATE TABLE …)" value={db.schema} onChange={(v) => setDb({ ...db, schema: v })} />
        <SqlField label="Daten, sichtbar (INSERT …)" hint="Diese Daten sehen die Studierenden." value={db.dataA} onChange={(v) => setDb({ ...db, dataA: v })} />
        <SqlField label="Daten, verdeckt (INSERT …)" hint="Gleiche Struktur, andere Werte. Dagegen wird zusätzlich geprüft, damit fest eingetragene Werte auffallen. Wichtig für gute SQL-Aufgaben." value={db.dataB} onChange={(v) => setDb({ ...db, dataB: v })} />
        <button
          className={btn}
          disabled={!db.name.trim() || !db.schema.trim() || !db.dataA.trim()}
          onClick={() => {
            add('scenarios', { id: slugify(db.name), name: db.name.trim(), description: db.description.trim(), schema: db.schema, dataA: db.dataA, ...(db.dataB.trim() ? { dataB: db.dataB } : {}) } as never, `Fall-Datenbank „${db.name}“ hinzugefügt. Mit „Entwurf prüfen“ testest du Schema und Daten.`);
            setDb({ name: '', description: '', schema: '', dataA: '', dataB: '' });
          }}
        >
          Fall-Datenbank hinzufügen
        </button>
      </Form>


      <Form title="Neue DDL-Aufgabe (CREATE, ALTER, DROP): Prüfungen entstehen aus der Musterlösung">
        <p className="text-sm text-muted">
          Du schreibst nur die Musterlösung. Der Trainer leitet daraus automatisch ab, was geprüft wird (Tabellen, Spalten mit Datentyp, Schlüssel, NOT NULL, UNIQUE,
          Fremdschlüssel mit Löschverhalten, DEFAULT). Jede gleichwertige Schreibweise der Studierenden wird akzeptiert.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Titel"><input className={input} value={dd.title} onChange={(e) => setDd({ ...dd, title: e.target.value })} /></Field>
          <Field label="Thema">
            <select className={input} value={dd.topicId} onChange={(e) => setDd({ ...dd, topicId: e.target.value })}>
              {topics.filter((t) => t.chapter === '06' || (draft.topics ?? []).some((x) => x.id === t.id)).concat((draft.topics ?? []) as never).map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Schwierigkeit">
            <select className={input} value={dd.level} onChange={(e) => setDd({ ...dd, level: Number(e.target.value) })}>
              <option value={1}>Leicht</option><option value={2}>Mittel</option><option value={3}>Schwer</option>
            </select>
          </Field>
        </div>
        <Field label="Aufgabentext"><textarea className={input} rows={4} value={dd.task} onChange={(e) => setDd({ ...dd, task: e.target.value })} /></Field>
        <SqlField label="Vorhandene Tabellen (optional)" hint="Wird vor der Abgabe der Studierenden ausgeführt, z. B. für ALTER-Aufgaben." value={dd.setup} onChange={(v) => setDd({ ...dd, setup: v })} />
        <SqlField label="Musterlösung" value={dd.solution} onChange={(v) => setDd({ ...dd, solution: v })} />
        <Field label="Tipps" hint="Ein Tipp pro Zeile"><textarea className={input} rows={2} value={dd.hints} onChange={(e) => setDd({ ...dd, hints: e.target.value })} /></Field>
        <label className="flex items-center gap-2"><input type="checkbox" checked={dd.names} onChange={(e) => setDd({ ...dd, names: e.target.checked })} /> Constraint-Namen aus der Musterlösung verlangen</label>
        <div className="flex flex-wrap gap-3">
          <button className={btnGhost} disabled={!SQL || !dd.solution.trim()} onClick={() => {
            const d = deriveChecks(SQL!, dd.setup, dd.solution, { requireNames: dd.names });
            const ex = { id: 'x', topicId: dd.topicId, level: 1, title: 'x', task: 'x', hints: [], solution: dd.solution, setup: dd.setup, checks: d.checks, topic: 'x', source: 'x' } as unknown as DdlExercise;
            const run = d.checks.length ? runExercise(SQL!, ex, dd.solution) : null;
            setDdInfo({ labels: run?.checks.map((c) => c.label) ?? [], errors: d.errors, ok: !!run?.passed && !d.errors.length });
          }}>Prüfungen ableiten und ansehen</button>
          <button className={btn} disabled={!SQL || !dd.title.trim() || !dd.task.trim() || !dd.solution.trim()} onClick={() => {
            const d = deriveChecks(SQL!, dd.setup, dd.solution, { requireNames: dd.names });
            if (d.errors.length || !d.checks.length) return setDdInfo({ labels: [], errors: d.errors.length ? d.errors : ['Die Musterlösung ändert nichts am Ausgangszustand, es gibt nichts zu prüfen.'], ok: false });
            const ex = { id: slugify(dd.title), topicId: dd.topicId, level: dd.level as 1 | 2 | 3, title: dd.title.trim(), task: dd.task.trim(), hints: dd.hints.split('\n').map((h) => h.trim()).filter(Boolean), solution: dd.solution.trim(), ...(dd.setup.trim() ? { setup: dd.setup } : {}), checks: d.checks, topic: topics.find((t) => t.id === dd.topicId)?.title ?? '', source: 'Ergänzt im Dozentenmodus' } as DdlExercise;
            add('ddl', ex, `DDL-Aufgabe „${dd.title}“ hinzugefügt (${d.checks.length} Prüfungen abgeleitet).`);
            setDd({ ...dd, title: '', task: '', setup: '', solution: '', hints: '' });
            setDdInfo(null);
          }}>DDL-Aufgabe hinzufügen</button>
        </div>
        {ddInfo && (
          <div role="status" className={`rounded-lg p-3 text-sm ${ddInfo.ok ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
            {ddInfo.errors.length > 0 && <ul className="list-disc pl-5">{ddInfo.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
            {ddInfo.labels.length > 0 && (<><strong>Das wird geprüft ({ddInfo.labels.length}):</strong><ul className="mt-1 list-disc pl-5">{ddInfo.labels.map((l) => <li key={l}>{l}</li>)}</ul></>)}
          </div>
        )}
      </Form>

      <Form title="Neue Normalisierungsaufgabe">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titel"><input className={input} value={nf.title} onChange={(e) => setNf({ ...nf, title: e.target.value })} /></Field>
          <Field label="Thema">
            <select className={input} value={nf.topicId} onChange={(e) => setNf({ ...nf, topicId: e.target.value })}>
              {topics.filter((t) => t.chapter === '05').map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Ausgangslage (Text)"><textarea className={input} rows={2} value={nf.scenario} onChange={(e) => setNf({ ...nf, scenario: e.target.value })} /></Field>
        <Field label="Relation" hint="Aus Excel einfügen oder mit ; trennen. Erste Zeile = Spaltennamen.">
          <textarea className={`${input} font-mono text-sm`} rows={6} value={nf.table} onChange={(e) => setNf({ ...nf, table: e.target.value })} placeholder={'MA_ID;Projekt_ID;Rolle;Projektname\n1;A35;Leitung;SocioHub\n4;A35;IT;SocioHub'} />
        </Field>
        <Field label="Primärschlüssel" hint="Spaltennamen, durch Komma getrennt"><input className={input} value={nf.pk} onChange={(e) => setNf({ ...nf, pk: e.target.value })} placeholder="MA_ID, Projekt_ID" /></Field>
        <Field label="Verletzungen der 1NF" hint="Leer lassen, wenn die Relation in 1NF ist. Eine Zeile je Verletzung: Spalte | mehrwertig | Begründung (oder strukturiert)">
          <textarea className={`${input} font-mono text-sm`} rows={2} value={nf.issues} onChange={(e) => setNf({ ...nf, issues: e.target.value })} />
        </Field>
        {nf.issues.trim() && (
          <>
            <Field label="Relation nach Herstellung der 1NF" hint="Dieselbe Eingabe wie oben, nach der Auflösung"><textarea className={`${input} font-mono text-sm`} rows={5} value={nf.fixedTable} onChange={(e) => setNf({ ...nf, fixedTable: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primärschlüssel danach"><input className={input} value={nf.fixedPk} onChange={(e) => setNf({ ...nf, fixedPk: e.target.value })} /></Field>
              <Field label="Erklärung der Auflösung"><input className={input} value={nf.fixNote} onChange={(e) => setNf({ ...nf, fixNote: e.target.value })} /></Field>
            </div>
          </>
        )}
        <Field label="Funktionale Abhängigkeiten" hint="Eine Zeile je Abhängigkeit: A, B -> C, D | voll (oder partiell, transitiv) | Begründung. Ob sie in den Daten gelten, wird geprüft.">
          <textarea className={`${input} font-mono text-sm`} rows={4} value={nf.fds} onChange={(e) => setNf({ ...nf, fds: e.target.value })} placeholder={'MA_ID -> Name | partiell | Der Name hängt nur an MA_ID.'} />
        </Field>
        <Field label="Zielschema in Vorlesungsnotation" hint="Eine Relation je Zeile, z. B. Arbeitet_in (MA_ID <fk>, Projekt_ID <fk>, Rolle)">
          <textarea className={`${input} font-mono text-sm`} rows={3} value={nf.target} onChange={(e) => setNf({ ...nf, target: e.target.value })} />
        </Field>
        <Field label="Hinweis zum Ergebnis (optional)"><input className={input} value={nf.targetNote} onChange={(e) => setNf({ ...nf, targetNote: e.target.value })} /></Field>
        <button className={btn} disabled={!nf.title.trim() || !nf.table.trim() || !nf.pk.trim() || !nf.fds.trim() || !nf.target.trim()} onClick={() => {
          const pk = nf.pk.split(',').map((x) => x.trim()).filter(Boolean);
          const t = parseTable(nf.table, pk);
          const fds = parseFds(nf.fds);
          const iss = parseIssues(nf.issues);
          const fixed = iss.issues.length ? parseTable(nf.fixedTable, nf.fixedPk.split(',').map((x) => x.trim()).filter(Boolean)) : null;
          const err = t.error ?? fds.error ?? iss.error ?? fixed?.error ?? (iss.issues.length && !fixed ? 'Relation nach der 1NF fehlt.' : '');
          if (err) return setMsg(`Normalisierungsaufgabe: ${err}`);
          const tags = highestNfOf(fds.fds) === 3 ? ['3NF'] : highestNfOf(fds.fds) === 2 ? ['3NF'] : ['2NF'];
          const ex: NfExercise = {
            id: slugify(nf.title), topicId: nf.topicId, title: nf.title.trim(), scenario: nf.scenario.trim(), relation: t.table,
            oneNF: { ok: !iss.issues.length, issues: iss.issues, ...(fixed ? { fixed: fixed.table, fixNote: nf.fixNote } : {}) },
            fds: fds.fds, highestNF: highestNfOf(fds.fds), target: nf.target.split('\n').map((l) => l.trim()).filter(Boolean), ...(nf.targetNote ? { targetNote: nf.targetNote } : {}),
            tags: (iss.issues.length ? ['1NF', ...tags] : tags) as NfExercise['tags'], source: 'Ergänzt im Dozentenmodus',
          };
          add('nf', ex, `Normalisierungsaufgabe „${nf.title}“ hinzugefügt. Mit „Entwurf prüfen“ testest du, ob die Abhängigkeiten in den Daten gelten.`);
          setNf({ ...nf, title: '', scenario: '', table: '', issues: '', fixedTable: '', fds: '', target: '', targetNote: '' });
        }}>Normalisierungsaufgabe hinzufügen</button>
      </Form>

      <Form title="Neue ER-Phrase (Kardinalitäten und Relationenmodell)">
        <Field label="Text" hint="z. B. „Ein Kunde kann beliebig viele Produkte bestellen, ein Produkt von beliebig vielen Kunden.“">
          <textarea className={input} rows={2} value={ph.text} onChange={(e) => setPh({ ...ph, text: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['1', '2'] as const).map((n) => (
            <fieldset key={n} className="space-y-2 rounded-lg border border-line p-3">
              <legend className="px-1 font-semibold">Entität {n}</legend>
              {([['Name', `e${n}`], ['Primärschlüssel', `k${n}`], ['Weiteres Attribut', `a${n}`], ['Plural', `p${n}`]] as const).map(([label, key]) => (
                <Field key={key} label={label}><input className={input} value={ph[key as keyof typeof ph] as string} onChange={(e) => setPh({ ...ph, [key]: e.target.value })} /></Field>
              ))}
            </fieldset>
          ))}
        </div>
        <Field label="Verb der Beziehung"><input className={input} value={ph.verb} onChange={(e) => setPh({ ...ph, verb: e.target.value })} placeholder="bestellt" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {([['c12', `Eine Instanz von ${ph.e1 || 'Entität 1'} ist verbunden mit … ${ph.p2 || 'Entität 2'}`], ['c21', `Eine Instanz von ${ph.e2 || 'Entität 2'} ist verbunden mit … ${ph.p1 || 'Entität 1'}`]] as const).map(([k, label]) => (
            <Field key={k} label={label}>
              <select className={input} value={ph[k]} onChange={(e) => setPh({ ...ph, [k]: e.target.value as Card })}>
                {CARDS.map((c) => <option key={c} value={c}>{CARD_LABEL[c]}</option>)}
              </select>
            </Field>
          ))}
        </div>
        <button className={btn} disabled={!ph.text.trim() || !ph.verb.trim() || !ph.e1.trim() || !ph.k1.trim() || !ph.a1.trim() || !ph.p1.trim() || !ph.e2.trim() || !ph.k2.trim() || !ph.a2.trim() || !ph.p2.trim()} onClick={() => {
          add('phrases', { id: slugify(`${ph.e1}-${ph.verb}-${ph.e2}`), text: ph.text.trim(), e1: { name: ph.e1.trim(), key: ph.k1.trim(), attr: ph.a1.trim(), plural: ph.p1.trim() }, verb: ph.verb.trim(), e2: { name: ph.e2.trim(), key: ph.k2.trim(), attr: ph.a2.trim(), plural: ph.p2.trim() }, c12: ph.c12, c21: ph.c21 } as never, 'ER-Phrase hinzugefügt.');
          setPh({ ...ph, text: '', verb: '' });
        }}>ER-Phrase hinzufügen</button>
      </Form>

      <Form title="Neue Textaufgabe (Schema aus Text erkennen), für Fortgeschrittene">
        <p className="text-sm text-muted">
          Textaufgaben haben viele Teile (Entitäten, Beziehungen, Kardinalitäten, Begründungen). Sie werden als JSON eingefügt. Die Vorlage zeigt den Aufbau, „Entwurf
          prüfen“ meldet Fehler.
        </p>
        <textarea className={`${input} font-mono text-sm`} rows={14} value={tt} onChange={(e) => setTt(e.target.value)} placeholder={TEXT_TASK_TEMPLATE} spellCheck={false} />
        <div className="flex flex-wrap gap-3">
          <button className={btnGhost} onClick={() => setTt(TEXT_TASK_TEMPLATE)}>
            Vorlage einfügen
          </button>
          <button
            className={btn}
            disabled={!tt.trim()}
            onClick={() => {
              try {
                const t = JSON.parse(tt) as { id: string; title: string };
                if (!t.id) throw new Error('id fehlt');
                add('textTasks', t, `Textaufgabe „${t.title}“ hinzugefügt. Mit „Entwurf prüfen“ testest du sie.`);
                setTt('');
              } catch (e) {
                setMsg(`Die Textaufgabe ist kein gültiges JSON: ${e instanceof Error ? e.message : e}`);
              }
            }}
          >
            Textaufgabe hinzufügen
          </button>
        </div>
      </Form>
    </div>
  );
}
