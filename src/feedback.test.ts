import { describe, expect, it } from 'vitest';
import { feedbackText, hasContent, issueUrl, mailUrl, type FeedbackInput } from './feedback';

const empty: FeedbackInput = { ratings: {}, area: '', problem: '', wish: '', liked: '', device: '', version: '1' };

describe('Feedbackbogen', () => {
  it('leere Eingabe zaehlt nicht', () => {
    expect(hasContent(empty)).toBe(false);
    expect(hasContent({ ...empty, ratings: { nutzen: 4 } })).toBe(true);
    expect(hasContent({ ...empty, problem: '  ' })).toBe(false);
  });
  it('Text enthaelt nur ausgefuellte Teile', () => {
    const t = feedbackText({ ...empty, ratings: { nutzen: 5 }, area: 'SQL-DML', problem: 'Fehler beim Prüfen' });
    expect(t).toContain('Der Trainer hilft mir beim Lernen für DBS: 5/5');
    expect(t).toContain('Bereich: SQL-DML');
    expect(t).toContain('Fehler beim Prüfen');
    expect(t).not.toContain('Was fehlt');
    expect(t).not.toContain('Bedienung');
  });
  it('Links sind kodiert und zeigen auf das Repository bzw. die Adresse', () => {
    const f = { ...empty, area: 'SQL-DML', problem: 'a & b' };
    expect(issueUrl('o/r', f)).toMatch(/^https:\/\/github\.com\/o\/r\/issues\/new\?title=Feedback%3A%20SQL-DML&body=/);
    expect(issueUrl('o/r', f)).toContain('a%20%26%20b');
    expect(mailUrl('x@y.de', f)).toMatch(/^mailto:x@y\.de\?subject=/);
  });
});
