import type { KeyboardEvent } from 'react';

/** Schlanker SQL-Editor: Tab rueckt ein, Strg/Cmd+Enter fuehrt aus. */
export function SqlEditor({
  value,
  onChange,
  onRun,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  label: string;
}) {
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
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
    <div className="flex overflow-hidden rounded-card border border-line bg-surface focus-within:border-brand">
      <div aria-hidden className="select-none bg-bg px-2 py-3 text-right font-mono text-sm leading-6 text-muted">
        {Array.from({ length: Math.max(lines, 12) }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        aria-label={label}
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
  );
}
