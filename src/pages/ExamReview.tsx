import { CARD_LABEL, validMappings, fkNotNull, type Mapping } from '../content/erPhrases';
import { gradeFds, gradeHighest, gradeOneNf } from '../logic/nfGrading';
import { ARTIFICIAL, correctKey as ttKey, gradeEntities, gradeRelationships, relKey } from '../logic/textTaskLogic';
import type { Answer, ExamItem, ItemResult, NfAnswer, TtAnswer } from '../exam/exam';
import type { Card } from '../content/erPhrases';
import { Mark } from './MctItems';

/** Eine Zeile der Auswertung: Aufgabe, deine Antwort, daneben Haken oder Kreuz, bei Fehler die richtige Antwort */
function Row({ label, mine, ok, right }: { label: string; mine: string; ok: boolean; right?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-t border-line py-1.5 first:border-t-0">
      <span className="min-w-0 flex-1 text-muted">{label}</span>
      <span className="font-medium">{mine || '–'}</span>
      <span className="w-6 text-center">
        <Mark ok={ok} />
      </span>
      {!ok && right && <span className="basis-full pl-2 text-xs text-muted sm:basis-auto">richtig: {right}</span>}
    </div>
  );
}

const cardText = (c?: Card) => (c ? CARD_LABEL[c] : '');
const KIND: Record<string, string> = { voll: 'voll funktional abhängig', partiell: 'partiell abhängig', transitiv: 'transitiv abhängig' };

/** Deine Antworten wie angekreuzt, jeweils mit Haken oder Kreuz daneben (Probeklausur-Auswertung) */
export function YourAnswer({ item, answer, result }: { item: ExamItem; answer?: Answer; result?: ItemResult }) {
  let body: React.ReactNode = null;
  switch (item.kind) {
    case 'mc': {
      const a = (answer as number[] | undefined) ?? [];
      body = (
        <div className="space-y-1">
          {item.q.options.map((o, i) => {
            const ticked = a.includes(i);
            const right = item.q.correct.includes(i);
            return (
              <div key={i} className={`flex items-start gap-3 rounded-lg border p-2 ${right ? 'border-ok bg-ok-bg' : ticked ? 'border-bad bg-bad-bg' : 'border-line'}`}>
                <input type={item.q.multi ? 'checkbox' : 'radio'} disabled readOnly checked={ticked} className="mt-1" aria-label={`${o}${ticked ? ', deine Auswahl' : ''}`} />
                <span className="min-w-0 flex-1">{o}</span>
                <span className="w-20 shrink-0 text-right">
                  {ticked && <Mark ok={right} />}
                  {!ticked && right && <span className="text-xs font-semibold text-bad">fehlt</span>}
                </span>
              </div>
            );
          })}
          {!a.length && <p className="text-bad">Keine Antwort gegeben.</p>}
        </div>
      );
      break;
    }
    case 'er': {
      const a = (answer as { a12?: Card; a21?: Card } | undefined) ?? {};
      body = (
        <>
          <Row label={`${item.p.e1.name} → ${item.p.e2.plural}`} mine={cardText(a.a12)} ok={a.a12 === item.p.c12} right={cardText(item.p.c12)} />
          <Row label={`${item.p.e2.name} → ${item.p.e1.plural}`} mine={cardText(a.a21)} ok={a.a21 === item.p.c21} right={cardText(item.p.c21)} />
        </>
      );
      break;
    }
    case 'spez': {
      const a = (answer as { disjoint?: boolean; total?: boolean } | undefined) ?? {};
      const dj = (v?: boolean) => (v === undefined ? '' : v ? 'disjunkt' : 'überlappend');
      const tt = (v?: boolean) => (v === undefined ? '' : v ? 'vollständig' : 'partiell');
      body = (
        <>
          <Row label="Überschneidung" mine={dj(a.disjoint)} ok={a.disjoint === item.s.disjoint} right={dj(item.s.disjoint)} />
          <Row label="Abdeckung" mine={tt(a.total)} ok={a.total === item.s.total} right={tt(item.s.total)} />
        </>
      );
      break;
    }
    case 'rel': {
      const a = (answer as { mapping?: Mapping; nullable?: boolean; pk?: string } | undefined) ?? {};
      const p = item.p;
      const valid = validMappings(p);
      const mapName = (m?: Mapping) => (m === 'fk-e1' ? `Fremdschlüssel in ${p.e1.name}` : m === 'fk-e2' ? `Fremdschlüssel in ${p.e2.name}` : m === 'zuordnung' ? 'Eigene Zuordnungsrelation' : '');
      const mapOk = !!a.mapping && valid.includes(a.mapping);
      let second: React.ReactNode = null;
      if (a.mapping === 'zuordnung' && mapOk) second = <Row label="Primärschlüssel" mine={a.pk === 'beide' ? 'beide Schlüssel zusammen' : a.pk ? 'nur ein Schlüssel' : ''} ok={a.pk === 'beide'} right="beide Schlüssel zusammen" />;
      else if (a.mapping && mapOk && a.mapping !== 'zuordnung') {
        const needNull = !fkNotNull(p, a.mapping);
        second = <Row label="Fremdschlüssel" mine={a.nullable === undefined ? '' : a.nullable ? 'NULL erlaubt' : 'NOT NULL'} ok={a.nullable === needNull} right={needNull ? 'NULL erlaubt' : 'NOT NULL'} />;
      }
      body = (
        <>
          <Row label="Abbildung" mine={mapName(a.mapping)} ok={mapOk} right={mapName(valid[0])} />
          {second}
        </>
      );
      break;
    }
    case 'nf': {
      const a = (answer as NfAnswer | undefined) ?? {};
      const fdAns = a.fds ?? item.ex.fds.map(() => '' as const);
      const fdOk = gradeFds(item.ex, fdAns);
      body = (
        <>
          <Row
            label="In 1. Normalform?"
            mine={a.says1NF === undefined ? '' : a.says1NF ? 'ja' : `nein${a.cols?.length ? ` (${a.cols.join(', ')})` : ''}`}
            ok={a.says1NF !== undefined && gradeOneNf(item.ex, a.says1NF, a.cols ?? [])}
            right={item.ex.oneNF.ok ? 'ja' : `nein (${item.ex.oneNF.issues.map((i) => i.column).join(', ')})`}
          />
          {item.ex.fds.map((f, i) => (
            <Row key={i} label={`${f.lhs.join(', ')} → ${f.rhs.join(', ')}`} mine={fdAns[i] ? KIND[fdAns[i]] ?? fdAns[i] : ''} ok={fdOk[i]} right={KIND[f.kind]} />
          ))}
          <Row label="Höchste Normalform" mine={a.highest === undefined ? '' : `${a.highest}NF`} ok={a.highest !== undefined && gradeHighest(item.ex, a.highest)} right={`${item.ex.highestNF}NF`} />
        </>
      );
      break;
    }
    case 'tt': {
      const a = (answer as TtAnswer | undefined) ?? {};
      const t = item.t;
      const pretty = (k: string) => k.replace(/\|/g, ' ');
      const keyName = (k?: string) => (!k ? '' : k === ARTIFICIAL ? 'künstlicher Schlüssel' : k);
      body = (
        <>
          <Row label="Entitäten" mine={(a.ents ?? []).join(', ')} ok={gradeEntities(t, a.ents ?? [])} right={t.entities.map((e) => e.name).join(', ')} />
          <Row label="Beziehungen" mine={(a.rels ?? []).map(pretty).join('; ')} ok={gradeRelationships(t, a.rels ?? [])} right={t.relationships.map((r) => pretty(relKey(r))).join('; ')} />
          {t.relationships.map((r) => {
            const m = a.cards?.[relKey(r)] ?? {};
            return (
              <Row
                key={relKey(r)}
                label={`${r.e1} – ${r.e2}`}
                mine={m.c12 || m.c21 ? `${r.e1} → ${r.e2}: ${m.c12 ?? '?'}, ${r.e2} → ${r.e1}: ${m.c21 ?? '?'}` : ''}
                ok={m.c12 === r.c12 && m.c21 === r.c21}
                right={`${r.c12} und ${r.c21}`}
              />
            );
          })}
          {t.entities.map((e) => (
            <Row key={e.name} label={`Schlüssel von ${e.name}`} mine={keyName(a.keys?.[e.name])} ok={a.keys?.[e.name] === ttKey(t, e.name)} right={keyName(ttKey(t, e.name))} />
          ))}
          {t.specializations?.map((s, i) => {
            const m = a.spec?.[i];
            const txt = (x?: { disjoint?: boolean; total?: boolean }) => (x?.disjoint === undefined || x?.total === undefined ? '' : `${x.disjoint ? 'disjunkt' : 'überlappend'}, ${x.total ? 'vollständig' : 'partiell'}`);
            return <Row key={i} label={`Spezialisierung ${s.supertype}`} mine={txt(m)} ok={m?.disjoint === s.disjoint && m?.total === s.total} right={txt(s)} />;
          })}
        </>
      );
      break;
    }
    case 'ddl':
    case 'sql': {
      const code = typeof answer === 'string' ? answer : '';
      body = (
        <div>
          <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-bg p-2 font-mono text-xs">{code || '(keine Eingabe)'}</pre>
          {result && (
            <p className="mt-1">
              <Mark ok={result.points === result.max} /> <span className="text-muted">{result.points.toLocaleString('de-DE')} von {result.max} Punkten</span>
            </p>
          )}
        </div>
      );
      break;
    }
    default:
      return null;
  }
  return (
    <section aria-label="Deine Antwort" className="rounded-lg border border-line p-3">
      <h4 className="mb-1 text-sm font-semibold">Deine Antwort</h4>
      {body}
    </section>
  );
}
