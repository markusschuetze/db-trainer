// Feedbackbogen: baut aus den Eingaben einen Text. Es wird nichts automatisch gesendet.

export const RATINGS = [
  ['verstaendlich', 'Die Aufgaben sind verständlich gestellt'],
  ['rueckmeldung', 'Die Rückmeldungen nach dem Prüfen helfen mir weiter'],
  ['bedienung', 'Die Bedienung ist übersichtlich'],
  ['nutzen', 'Der Trainer hilft mir beim Lernen für DBS'],
] as const;

export const AREAS = [
  'Startseite / Allgemein',
  'Modellierung (ER)',
  'Relationenmodell',
  'Normalisierung',
  'SQL-DDL',
  'SQL-DML',
  'Textaufgaben',
  'Praktikum',
  'Prüfungsmodus',
  'Fortschritt',
] as const;

export interface FeedbackInput {
  ratings: Partial<Record<(typeof RATINGS)[number][0], number>>;
  area: string;
  problem: string;
  wish: string;
  liked: string;
  device: string;
  version: string;
}

export function feedbackText(f: FeedbackInput): string {
  const lines: string[] = ['Feedback zum DB-Trainer', ''];
  const rated = RATINGS.filter(([k]) => f.ratings[k]);
  if (rated.length) {
    lines.push('Bewertung (1 = trifft nicht zu, 5 = trifft voll zu):');
    for (const [k, label] of rated) lines.push(`- ${label}: ${f.ratings[k]}/5`);
    lines.push('');
  }
  if (f.area) lines.push(`Bereich: ${f.area}`, '');
  if (f.problem.trim()) lines.push('Was hat nicht funktioniert oder war unklar?', f.problem.trim(), '');
  if (f.wish.trim()) lines.push('Was fehlt oder sollte besser werden?', f.wish.trim(), '');
  if (f.liked.trim()) lines.push('Was gefällt mir?', f.liked.trim(), '');
  lines.push(`Gerät: ${f.device || 'keine Angabe'} · Version ${f.version}`);
  return lines.join('\n');
}

export const hasContent = (f: FeedbackInput) =>
  Object.keys(f.ratings).length > 0 || !!(f.problem.trim() || f.wish.trim() || f.liked.trim());

export function issueUrl(repo: string, f: FeedbackInput): string {
  const title = f.area ? `Feedback: ${f.area}` : 'Feedback';
  return `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(feedbackText(f))}`;
}

export const mailUrl = (to: string, f: FeedbackInput) =>
  `mailto:${to}?subject=${encodeURIComponent('Feedback DB-Trainer')}&body=${encodeURIComponent(feedbackText(f))}`;

/** Schickt den Bogen an den Sammelserver (config.analyticsUrl). Wirft bei Fehlern. */
export async function sendFeedback(baseUrl: string, f: FeedbackInput): Promise<void> {
  const { ratings, area, problem, wish, liked, device, version } = f;
  // text/plain vermeidet eine CORS-Vorabanfrage; der Server liest den Text als JSON
  const res = await fetch(`${baseUrl}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ ratings, area, problem, wish, liked, device, version }),
  });
  if (!res.ok) throw new Error(String(res.status));
}
