import { EditorExercise } from '../components/EditorExercise';
import { ScenarioBrowser } from '../components/ScenarioBrowser';
import { ResultTable } from '../components/SqlOutput';
import { LEVEL_NAME, scenarioById } from '../content/scenarios';
import { sqlExercises } from '../content/sqlExercises';
import { runSqlExercise, type SqlRun } from '../sql/sqlGrading';
import { topicById } from '../content/topics';
import { useSql } from '../useSql';

function Comparison({ run }: { run: SqlRun }) {
  if (run.expected && run.actual)
    return (
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-1 text-sm font-bold">Dein Ergebnis ({run.actual.rows.length} Zeilen)</h3>
          <ResultTable columns={run.actual.columns} rows={run.actual.rows} />
        </div>
        <div className="min-w-0">
          <h3 className="mb-1 text-sm font-bold">Erwartet ({run.expected.rows.length} Zeilen)</h3>
          <ResultTable columns={run.expected.columns} rows={run.expected.rows} />
        </div>
      </div>
    );
  if (run.diffs?.length)
    return (
      <div className="mt-5 space-y-4">
        <h3 className="text-sm font-bold">Unterschiede zum erwarteten Datenbestand</h3>
        {run.diffs.map((d) => (
          <div key={d.table} className="min-w-0 space-y-2">
            <p className="font-mono text-sm font-bold">{d.table}</p>
            {d.missing.length > 0 && (
              <>
                <p className="text-xs text-muted">Diese Zeilen fehlen bei dir (bzw. sollten so aussehen):</p>
                <ResultTable columns={d.columns} rows={d.missing} tone="ok" />
              </>
            )}
            {d.extra.length > 0 && (
              <>
                <p className="text-xs text-muted">Diese Zeilen sind bei dir anders oder zu viel:</p>
                <ResultTable columns={d.columns} rows={d.extra} tone="bad" />
              </>
            )}
          </div>
        ))}
      </div>
    );
  return null;
}

export function SqlExercisePage({ id }: { id: string }) {
  const ex = sqlExercises.find((e) => e.id === id);
  const { SQL, error } = useSql();
  if (!ex)
    return (
      <p>
        Aufgabe nicht gefunden. <a href="#/sql" className="underline">Zur Liste</a>
      </p>
    );
  const same = sqlExercises.filter((e) => e.kind === ex.kind && (e.scenario ?? 'hochschule') === (ex.scenario ?? 'hochschule'));
  const next = same[same.indexOf(ex) + 1];

  return (
    <EditorExercise
      progressId={`sql:${ex.id}`}
      backHref="#/sql"
      backLabel="Aufgaben"
      title={ex.title}
      topic={`${scenarioById(ex.scenario).name} · ${LEVEL_NAME[ex.level]} · ${ex.kind === 'dql' ? 'Abfrage (DQL)' : 'Datenänderung (DML)'} · ${ex.topic}`}
      task={ex.task}
      hints={ex.hints}
      solution={ex.solution}
      starter={ex.starter ?? (ex.kind === 'dql' ? 'SELECT ' : '')}
      ready={!!SQL}
      loadError={error}
      nextHref={next && `#/sql/${next.id}`}
      tracking={{ id: `sql:${ex.id}`, topicId: ex.topicId, chapter: topicById(ex.topicId)?.chapter ?? 'SQL', level: ex.level }}
      freshNote="Jeder Lauf startet mit dem ursprünglichen Datenbestand, Änderungen bleiben nicht erhalten."
      aside={<ScenarioBrowser SQL={SQL} scenario={ex.scenario} />}
      run={(code, grade) => {
        const r = runSqlExercise(SQL!, ex, code);
        return { ...r, details: grade ? <Comparison run={r} /> : undefined };
      }}
    />
  );
}
