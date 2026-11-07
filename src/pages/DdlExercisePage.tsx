import { EditorExercise } from '../components/EditorExercise';
import { SchemaView } from '../components/SchemaView';
import { ddlExercises } from '../content/ddlExercises';
import { runExercise } from '../sql/ddlGrading';
import { topicById } from '../content/topics';
import { useSql } from '../useSql';

export function DdlExercisePage({ id }: { id: string }) {
  const ex = ddlExercises.find((e) => e.id === id);
  const { SQL, error } = useSql();
  if (!ex)
    return (
      <p>
        Aufgabe nicht gefunden. <a href="#/ddl" className="underline">Zur Liste</a>
      </p>
    );
  const next = ddlExercises[ddlExercises.indexOf(ex) + 1];

  return (
    <EditorExercise
      progressId={`ddl:${ex.id}`}
      backHref="#/ddl"
      backLabel="Aufgaben"
      title={ex.title}
      topic={ex.topic}
      task={ex.task}
      hints={ex.hints}
      solution={ex.solution}
      starter={ex.starter}
      ready={!!SQL}
      loadError={error}
      nextHref={next && `#/ddl/${next.id}`}
      tracking={{ id: `ddl:${ex.id}`, topicId: ex.topicId, chapter: topicById(ex.topicId)?.chapter ?? '06', level: ex.level }}
      freshNote={`Jeder Lauf startet mit einer frischen Datenbank${ex.setup ? ' (inklusive der vorhandenen Tabellen)' : ''}.`}
      aside={
        ex.setup && (
          <details className="rounded-card border border-line bg-surface p-5">
            <summary className="cursor-pointer font-bold">Bereits vorhandene Tabellen</summary>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs leading-5">{ex.setup.trim()}</pre>
          </details>
        )
      }
      run={(code) => {
        const r = runExercise(SQL!, ex, code);
        return {
          ...r,
          details: (
            <>
              <h2 className="mb-2 mt-5 font-bold">Schema nach dem Lauf</h2>
              <SchemaView schema={r.schema} />
            </>
          ),
        };
      }}
    />
  );
}
