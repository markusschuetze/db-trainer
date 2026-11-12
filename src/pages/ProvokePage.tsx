import { EditorExercise } from '../components/EditorExercise';
import { ScenarioBrowser } from '../components/ScenarioBrowser';
import { provokeTasks } from '../content/dmlProvoke';
import { LEVEL_NAME } from '../content/scenarios';
import { isDone } from '../progress';
import { runProvoke } from '../sql/provokeGrading';
import { useSql } from '../useSql';

/** Constraints prüfen: ohne Id die erste noch offene Aufgabe, sonst die gewählte; "Nächste Aufgabe" führt durch die Reihe. */
export function ProvokePage({ id }: { id?: string }) {
  const { SQL, error } = useSql();
  const start = provokeTasks.find((t) => !isDone(`prov:${t.id}`)) ?? provokeTasks[0];
  const task = provokeTasks.find((t) => t.id === id) ?? start;
  const i = provokeTasks.indexOf(task);
  const next = provokeTasks[(i + 1) % provokeTasks.length];
  const done = provokeTasks.filter((t) => isDone(`prov:${t.id}`)).length;

  return (
    <EditorExercise
      key={task.id}
      progressId={`prov:${task.id}`}
      backHref="#/dml"
      backLabel="SQL-DML"
      title={task.title}
      topic={`Constraints prüfen · Aufgabe ${i + 1} von ${provokeTasks.length} · ${done} erledigt · ${LEVEL_NAME[task.level]}`}
      task={`${task.task}\n\nDie Datenbank ist der Marktplatz aus Übung 5 mit allen Constraints. Führe deine Anweisung mit „Ausführen“ aus, lies die Meldung und prüfe dann.`}
      hints={task.hints}
      solution={task.solution}
      starter=""
      ready={!!SQL}
      loadError={error}
      nextHref={`#/dml/constraints/${next.id}`}
      tracking={{ id: `prov:${task.id}`, topicId: 'sql-dml', chapter: 'SQL', level: task.level }}
      freshNote="Jeder Lauf startet mit dem ursprünglichen Datenbestand, Änderungen bleiben nicht erhalten."
      aside={<ScenarioBrowser SQL={SQL} scenario="marktplatz" />}
      run={(code) => runProvoke(SQL!, task, code)}
    />
  );
}
