import { useMemo, useState } from 'react';
import { CHAPTER_NAME, mcQuestions, type Chapter, type McQuestion } from '../content/mcQuestions';
import { mastery, recordItem, useProgress, type Mastery, type ProgressData } from '../progress';
import { CHAPTERS } from '../progressCatalog';
import { topicById, topicsOf } from '../content/topics';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';

// Reihenfolge wie in Fuehrerschein-Apps: zuerst falsch beantwortete, dann neue,
// dann einmal richtige; sichere Fragen nur, wenn sonst nichts mehr offen ist.
const PRIORITY: Mastery[] = ['falsch', 'neu', 'gelernt', 'sicher'];

function nextQuestion(pool: McQuestion[], d: ProgressData, skip?: string): McQuestion | null {
  for (const m of PRIORITY) {
    const cands = pool.filter((q) => mastery(d.items[`mc:${q.id}`]) === m && q.id !== skip);
    if (cands.length) return cands[Math.floor(Math.random() * cands.length)];
  }
  return pool.find((q) => q.id !== skip) ?? pool[0] ?? null;
}

export function LearnPage({ topicId }: { topicId?: string }) {
  const d = useProgress();
  const topic = topicId ? topicById(topicId) : undefined;
  const [chapter, setChapter] = useState<Chapter | 'alle'>('alle');
  const pool = useMemo(
    () => mcQuestions.filter((q) => (topic ? q.topicId === topic.id : chapter === 'alle' || q.chapter === chapter)),
    [chapter, topic],
  );
  const [current, setCurrent] = useState<McQuestion | null>(() => nextQuestion(pool, d));
  const [answer, setAnswer] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const q = current && pool.includes(current) ? current : nextQuestion(pool, d);
  const right = !!q && answer.length === q.correct.length && answer.every((a) => q.correct.includes(a));
  const sure = pool.filter((x) => mastery(d.items[`mc:${x.id}`]) === 'sicher').length;

  const next = () => {
    setCurrent(nextQuestion(pool, d, q?.id));
    setAnswer([]);
    setChecked(false);
  };

  return (
    <>
      <a href="#/fortschritt" className="text-sm underline">
        ← Fortschritt
      </a>
      <h1 className="mt-2 text-3xl font-bold">Wissensfragen lernen</h1>
      {topic && (
        <p className="mt-1 text-lg">
          Thema: <strong>{topic.title}</strong> <span className="text-muted">({CHAPTER_NAME[topic.chapter]})</span>{' '}
          <a href="#/lernen" className="text-sm underline">
            alle Themen
          </a>
        </p>
      )}
      <p className="mt-2 max-w-2xl text-muted">
        Wie in einer Führerschein-App: Falsch beantwortete Fragen kommen zuerst wieder. Eine Frage ist „sicher“, wenn du sie
        zweimal in Folge richtig beantwortest.
      </p>

      {!topic && (
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Kapitel">
        {(['alle', ...CHAPTERS] as const).map((c) => (
          <button
            key={c}
            onClick={() => {
              setChapter(c);
              setCurrent(null);
              setAnswer([]);
              setChecked(false);
            }}
            aria-pressed={chapter === c}
            className={`rounded-full border px-3 py-1 text-sm ${chapter === c ? 'border-brand bg-brand text-brand-contrast' : 'border-line bg-surface'}`}
          >
            {c === 'alle' ? 'Alle Kapitel' : CHAPTER_NAME[c]}
          </button>
        ))}
      </div>
      )}
      {!topic && chapter !== 'alle' && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Themen">
          <span className="text-muted">Themen:</span>
          {topicsOf(chapter).map((t) => (
            <a key={t.id} href={`#/lernen/${t.id}`} className="underline">
              {t.title}
            </a>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm text-muted">
        {sure} von {pool.length} Fragen sicher
      </p>

      {q && (
        <section className="mt-4 rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {topicById(q.topicId)?.title ?? CHAPTER_NAME[q.chapter]} · {
              { neu: 'neue Frage', falsch: 'zuletzt falsch', gelernt: 'zuletzt richtig', sicher: 'sicher' }[mastery(d.items[`mc:${q.id}`])]
            }
          </p>
          <fieldset className="mt-2" disabled={checked}>
            <legend className="text-lg">
              {q.question}
              {q.multi && <span className="ml-2 text-sm text-muted">(Mehrfachauswahl)</span>}
            </legend>
            <div className="mt-3 space-y-2">
              {q.options.map((o, i) => {
                const isRight = q.correct.includes(i);
                const chosen = answer.includes(i);
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-2 rounded-lg border p-2 ${
                      checked && isRight ? 'border-ok bg-ok-bg' : checked && chosen ? 'border-bad bg-bad-bg' : 'border-line'
                    }`}
                  >
                    <input
                      className="mt-1"
                      type={q.multi ? 'checkbox' : 'radio'}
                      name="lernen"
                      checked={chosen}
                      onChange={(e) => setAnswer(q.multi ? (e.target.checked ? [...answer, i] : answer.filter((x) => x !== i)) : [i])}
                    />
                    <span>
                      {o}
                      {checked && isRight && <span className="sr-only"> (richtig)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {checked && (
            <p role="status" className={`mt-3 text-sm ${right ? 'text-ok' : 'text-bad'}`}>
              <strong>{right ? 'Richtig.' : 'Leider falsch.'}</strong> <span className="text-ink">{q.explanation}</span>
            </p>
          )}
          <div className="mt-4">
            {!checked ? (
              <button
                className={btn}
                disabled={!answer.length}
                onClick={() => {
                  setChecked(true);
                  recordItem(`mc:${q.id}`, right);
                }}
              >
                Antworten
              </button>
            ) : (
              <button className={btn} onClick={next}>
                Nächste Frage
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
