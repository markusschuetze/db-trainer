import type { SqlJsStatic } from 'sql.js';
import type { ProvokeTask } from '../content/dmlProvoke';
import { scenarioById } from '../content/scenarios';
import type { CheckResult } from './ddlGrading';
import { Session } from './session';

/** Constraints pruefen: Skript auf dem Marktplatz ausfuehren und beurteilen, ob der erwartete Fehler (oder eine korrekte Aenderung) entsteht. */
export function runProvoke(SQL: SqlJsStatic, task: ProvokeTask, script: string) {
  const sc = scenarioById('marktplatz');
  const s = new Session(SQL, sc.schema + sc.dataA);
  try {
    const count = (t: string) => Number(s.db.exec(`SELECT COUNT(*) FROM "${t}"`)[0].values[0][0]);
    const before = 'table' in task.expect ? count(task.expect.table) : 0;
    const results = s.run(script);
    const checks: CheckResult[] = [];
    if (!results.length) {
      checks.push({ label: 'Mindestens eine Anweisung', ok: false, hint: 'Der Editor enthält keine Anweisung.' });
      return { results, checks, passed: false };
    }
    const failed = results.filter((r) => !r.ok);
    if ('error' in task.expect) {
      const want = task.expect.error;
      const hit = failed.find((r) => r.ora === want);
      checks.push({
        label: `Dein Skript löst den Fehler ${want} aus`,
        ok: !!hit,
        hint: hit
          ? undefined
          : failed.length
            ? `Es entsteht ein anderer Fehler: ${failed.map((r) => r.ora ?? r.message).join(', ')}. Welche Bedingung willst du verletzen?`
            : 'Dein Skript läuft fehlerfrei durch. Verletze die Bedingung absichtlich.',
      });
      if (task.expect.constraint) {
        const name = task.expect.constraint;
        const ok = !!hit && hit.message.toUpperCase().includes(name);
        checks.push({
          label: `Die richtige Bedingung wird verletzt (${name.toLowerCase()})`,
          ok,
          hint: ok ? undefined : 'Es wird eine andere Bedingung verletzt, als in der Aufgabe gemeint ist. Lies die Fehlermeldung.',
        });
      }
    } else {
      checks.push({
        label: 'Alle Anweisungen laufen fehlerfrei',
        ok: failed.length === 0,
        hint: failed.length ? failed.map((r) => `${r.ora ? r.ora + ': ' : ''}${r.message}`).join(' | ') : undefined,
      });
      const grew = count(task.expect.table) > before;
      checks.push({
        label: `In ${task.expect.table} ist eine neue Zeile entstanden`,
        ok: grew,
        hint: grew ? undefined : 'Es wurde keine Zeile eingefügt.',
      });
    }
    return { results, checks, passed: checks.every((c) => c.ok) };
  } finally {
    s.close();
  }
}
