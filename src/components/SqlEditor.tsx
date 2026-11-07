import { useId, useRef, type KeyboardEvent } from 'react';

/** Schlanker SQL-Editor: Tab rueckt ein, Strg/Cmd+Enter fuehrt aus. */
export function SqlEditor({
  value,
  onChange,
  onRun,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Strg/Cmd+Enter; bekommt die markierte Auswahl (leer, wenn nichts markiert ist) */
  onRun: (selection: string) => void;
  label: string;
}) {
  const hintId = useId();
  // Nach Escape verlaesst Tab den Editor (sonst Tastaturfalle, WCAG 2.1.2)
  const leave = useRef(false);
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      leave.current = true;
      return;
    }
    if (e.key === 'Tab' && leave.current) {
      leave.current = false;
      return; // Standardverhalten: Fokus wandert weiter
    }
    if (e.key !== 'Tab' && e.key !== 'Shift') leave.current = false;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun(e.currentTarget.value.slice(e.currentTarget.selectionStart, e.currentTarget.selectionEnd));
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = el;
      onChange(value.slice(0, s) + '  ' + value.slice(end));
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
    }
  };
  const lines = value.split('\n').length;
  return (
    <div>
    <div className="flex overflow-hidden rounded-card border border-line bg-surface focus-within:border-brand">
      <div aria-hidden className="select-none bg-bg px-2 py-3 text-right font-mono text-sm leading-6 text-muted">
        {Array.from({ length: Math.max(lines, 12) }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        aria-label={label}
        aria-describedby={hintId}
        className="min-h-72 flex-1 resize-y overflow-x-auto whitespace-pre bg-transparent p-3 font-mono text-sm leading-6 outline-none"
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        value={value}
        rows={Math.max(lines, 12)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
      />
    </div>
    <p id={hintId} className="mt-1 text-xs text-muted">
      Tab rückt ein. Mit Esc und danach Tab verlässt du den Editor. Strg/Cmd+Enter führt aus.
    </p>
    </div>
  );
}
