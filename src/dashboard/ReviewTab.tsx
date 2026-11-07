import { useMemo, useState } from 'react';
import { reviewCsv, reviewRows } from './reviewData';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';

/** Alle Inhalte zur fachlichen Durchsicht: filtern, als CSV exportieren, drucken. */
export function ReviewTab() {
  const rows = useMemo(() => reviewRows(), []);
  const [kind, setKind] = useState('');
  const [chapter, setChapter] = useState('');
  const [q, setQ] = useState('');
  const kinds = [...new Set(rows.map((r) => r.kind))];
  const chapters = [...new Set(rows.map((r) => r.chapter))];
  const shown = rows.filter(
    (r) => (!kind || r.kind === kind) && (!chapter || r.chapter === chapter) && (!q || `${r.text} ${r.answer} ${r.id}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-surface p-5 print:hidden">
        <h2 className="font-bold">Inhalte zur fachlichen Durchsicht</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Alle {rows.length} Aufgaben, Fragen und Lösungen an einem Ort, nach Kapitel und Thema geordnet. Zum Prüfen kannst du die Liste ausdrucken oder als
          CSV (Excel) mit den Spalten „Fachlich geprüft“ und „Anmerkung“ exportieren. Korrekturen schickst du als Anmerkung zurück oder legst im Aufgaben-Editor
          eine verbesserte Fassung mit gleicher ID an.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            Art
            <select className="mt-1 block rounded-lg border border-line bg-surface px-2 py-1.5" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="">alle</option>
              {kinds.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Kapitel
            <select className="mt-1 block rounded-lg border border-line bg-surface px-2 py-1.5" value={chapter} onChange={(e) => setChapter(e.target.value)}>
              <option value="">alle</option>
              {chapters.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Suche
            <input className="mt-1 block rounded-lg border border-line bg-surface px-3 py-1.5" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Text, Lösung oder ID" />
          </label>
          <span className="text-sm text-muted">{shown.length} von {rows.length}</span>
          <button
            className={`${btnGhost} ml-auto`}
            onClick={() => {
              const blob = new Blob(['﻿' + reviewCsv(shown)], { type: 'text/csv;charset=utf-8' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `db-trainer-inhalte-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Als CSV exportieren
          </button>
          <button className={btn} onClick={() => window.print()}>
            Drucken
          </button>
        </div>
      </section>

      <ol className="space-y-3">
        {shown.map((r) => (
          <li key={r.id} className="break-inside-avoid rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
              <span>
                {r.kind}
                {r.level ? ` · ${r.level}` : ''} · {r.chapter} · {r.topic}
              </span>
              <code>{r.id}</code>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm font-semibold">{r.text}</p>
            <div className="mt-2 rounded-lg bg-bg p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Lösung</p>
              <p className="mt-1 whitespace-pre-line font-mono text-xs leading-5">{r.answer}</p>
            </div>
            {r.explanation && <p className="mt-2 whitespace-pre-line text-sm text-muted">{r.explanation}</p>}
            <p className="mt-2 hidden text-sm print:block">☐ fachlich geprüft &nbsp;&nbsp; Anmerkung: ______________________________</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
