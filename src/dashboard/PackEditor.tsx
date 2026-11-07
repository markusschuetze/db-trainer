import { useRef, useState, type ReactNode } from 'react';
import { BUILTIN_CHAPTERS, CHAPTER_NAME } from '../content/mcQuestions';
import { addItem, countOf, KEYS, keyLabel, loadDraft, mergePacks, parseTasks, removeItem, saveDraft, slugify, toFile } from '../content/draftPack';
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
