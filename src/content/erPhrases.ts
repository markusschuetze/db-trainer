// Beziehungs-Phrasen fuer ER- und Relationenmodell-Trainer.
// Kardinalitaeten in Krähenfußnotation, gelesen wie in Skript 02:
// "von der Mitte zur Entitaet": c12 = mit wie vielen E2 ist EINE Instanz von E1 verbunden.
// Beispiele nach den Hoersaaluebungen aus Skript 02/03, Formulierungen eigenstaendig.

export type Card = '01' | '11' | '0N' | '1N';

export const CARD_LABEL: Record<Card, string> = {
  '01': 'keins oder eins (0,1)',
  '11': 'genau eins (1,1)',
  '0N': 'keins, eins oder mehrere (0,N)',
  '1N': 'eins oder mehrere (1,N)',
};
export const CARDS: Card[] = ['11', '01', '1N', '0N'];

export interface Entity {
  name: string;
  /** Primaerschluessel */
  key: string;
  /** weiteres Attribut fuer das Relationenschema */
  attr: string;
  /** Pluralform fuer Fragen ("wie viele Autos") */
  plural: string;
}

export interface Phrase {
  id: string;
  text: string;
  e1: Entity;
  verb: string;
  e2: Entity;
  /** Mit wie vielen E2 ist eine E1-Instanz verbunden? */
  c12: Card;
  /** Mit wie vielen E1 ist eine E2-Instanz verbunden? */
  c21: Card;
  /** Rekursive Beziehung (beide Rollen sind dieselbe Entitaet) – nur im ER-Trainer */
  recursive?: boolean;
}

const E = (name: string, key: string, attr: string, plural: string): Entity => ({ name, key, attr, plural });

export const phrases: Phrase[] = [
  {
    id: 'kunde-produkt',
    text: 'Ein Kunde kann beliebig viele Produkte bestellen, auch noch gar keins. Ein Produkt kann von beliebig vielen Kunden bestellt werden, auch von keinem.',
    e1: E('Kunde', 'Kunden_Nr', 'Name', 'Kunden'),
    verb: 'bestellt',
    e2: E('Produkt', 'Produkt_ID', 'Bezeichnung', 'Produkte'),
    c12: '0N',
    c21: '0N',
  },
  {
    id: 'schauspielerin-film',
    text: 'Eine Schauspielerin spielt in einem oder mehreren Filmen mit. Ein Film wird nur gedreht, wenn mindestens eine Schauspielerin darin mitspielt.',
    e1: E('Schauspielerin', 'S_ID', 'Name', 'Schauspielerinnen'),
    verb: 'spielt in',
    e2: E('Film', 'Film_ID', 'Titel', 'Filme'),
    c12: '1N',
    c21: '1N',
  },
  {
    id: 'fahrer-auto',
    text: 'Ein Fahrer besitzt null, ein oder mehrere Autos. Ein Auto gehört höchstens einem Fahrer.',
    e1: E('Fahrer', 'Fahrer_ID', 'Name', 'Fahrer'),
    verb: 'besitzt',
    e2: E('Auto', 'Kennzeichen', 'Modell', 'Autos'),
    c12: '0N',
    c21: '01',
  },
  {
    id: 'schueler-stuhl',
    text: 'Ein Schüler muss auf genau einem Stuhl sitzen. Ein Stuhl kann höchstens einen Schüler aufnehmen.',
    e1: E('Schueler', 'Schueler_ID', 'Name', 'Schüler'),
    verb: 'sitzt auf',
    e2: E('Stuhl', 'Stuhl_Nr', 'Modell', 'Stühle'),
    c12: '11',
    c21: '01',
  },
  {
    id: 'person-hund',
    text: 'Eine Person kann keinen, einen oder mehrere Hunde besitzen. Ein Hund wird von keiner oder einer Person besessen.',
    e1: E('Person', 'Person_ID', 'Name', 'Personen'),
    verb: 'besitzt',
    e2: E('Hund', 'Hund_ID', 'Rufname', 'Hunde'),
    c12: '0N',
    c21: '01',
  },
  {
    id: 'prof-raum',
    text: 'Eine Professorin hat ihr Büro in mindestens einem Raum. In einem Raum können keine, eine oder mehrere Professorinnen ihr Büro haben.',
    e1: E('Professorin', 'Prof_ID', 'Name', 'Professorinnen'),
    verb: 'hat Büro in',
    e2: E('Raum', 'Raum_Nr', 'Kapazitaet', 'Räume'),
    c12: '1N',
    c21: '0N',
  },
  {
    id: 'raum-material',
    text: 'In einem Raum können sich beliebig viele Büromaterialien befinden, auch keine. Ein Büromaterial befindet sich in genau einem Raum.',
    e1: E('Raum', 'Raum_Nr', 'Kapazitaet', 'Räume'),
    verb: 'enthält',
    e2: E('Bueromaterial', 'Material_ID', 'Bezeichnung', 'Büromaterialien'),
    c12: '0N',
    c21: '11',
  },
  {
    id: 'land-hauptstadt',
    text: 'Jedes Land hat genau eine Hauptstadt. Jede Hauptstadt gehört zu genau einem Land.',
    e1: E('Land', 'Land_ID', 'Name', 'Länder'),
    verb: 'hat',
    e2: E('Hauptstadt', 'Stadt_ID', 'Name', 'Hauptstädte'),
    c12: '11',
    c21: '11',
  },
  {
    id: 'abteilung-manager',
    text: 'Jede Abteilung wird von genau einem Manager geleitet. Ein Manager leitet höchstens eine Abteilung.',
    e1: E('Abteilung', 'Abt_Nr', 'Name', 'Abteilungen'),
    verb: 'wird geleitet von',
    e2: E('Manager', 'Manager_ID', 'Name', 'Manager'),
    c12: '11',
    c21: '01',
  },
  {
    id: 'mitarbeiterin-projekt',
    text: 'Eine Mitarbeiterin arbeitet in keinem, einem oder mehreren Projekten mit. Ein Projekt hat keine, eine oder mehrere Mitarbeiterinnen.',
    e1: E('Mitarbeiterin', 'MA_ID', 'Name', 'Mitarbeiterinnen'),
    verb: 'arbeitet in',
    e2: E('Projekt', 'Projekt_Nr', 'Projektname', 'Projekte'),
    c12: '0N',
    c21: '0N',
  },
  {
    id: 'bar-cocktail',
    text: 'Eine Bar kann keinen, einen oder mehrere Cocktails herstellen. Jeder Cocktail wird von mindestens einer Bar hergestellt.',
    e1: E('Bar', 'Bar_Name', 'Eroeffnungsdatum', 'Bars'),
    verb: 'stellt her',
    e2: E('Cocktail', 'Cocktail_Name', 'Preis', 'Cocktails'),
    c12: '0N',
    c21: '1N',
  },
  {
    id: 'patient-test',
    text: 'Ein Patient kann beliebig viele Tests machen, auch keinen. Jeder Test gehört zu genau einem Patienten.',
    e1: E('Patient', 'Patient_ID', 'Name', 'Patienten'),
    verb: 'macht',
    e2: E('Test', 'Test_ID', 'Datum', 'Tests'),
    c12: '0N',
    c21: '11',
  },
  {
    id: 'person-reisepass',
    text: 'Eine Person besitzt höchstens einen gültigen Reisepass. Jeder Reisepass gehört zu genau einer Person.',
    e1: E('Person', 'Person_ID', 'Name', 'Personen'),
    verb: 'besitzt',
    e2: E('Reisepass', 'Pass_Nr', 'Ablaufdatum', 'Reisepässe'),
    c12: '01',
    c21: '11',
  },
  {
    id: 'firma-spiel',
    text: 'Eine Firma entwickelt mindestens ein Videospiel. Jedes Videospiel wird von genau einer Firma entwickelt.',
    e1: E('Firma', 'Firma_ID', 'Name', 'Firmen'),
    verb: 'entwickelt',
    e2: E('Videospiel', 'Spiel_ID', 'Titel', 'Videospiele'),
    c12: '1N',
    c21: '11',
  },
  {
    id: 'passagier-flug',
    text: 'Ein Passagier ist nur gespeichert, wenn er mindestens einen Flug gebucht hat. Ein Flug kann von beliebig vielen Passagieren gebucht werden, auch von keinem.',
    e1: E('Passagier', 'Passagier_ID', 'Name', 'Passagiere'),
    verb: 'bucht',
    e2: E('Flug', 'Flug_Nr', 'Datum', 'Flüge'),
    c12: '1N',
    c21: '0N',
  },
  {
    id: 'student-kurs',
    text: 'Ein Student belegt mindestens einen Kurs. Ein Kurs findet nur statt, wenn mindestens ein Student ihn belegt.',
    e1: E('Student', 'Matrikelnummer', 'Name', 'Studierende'),
    verb: 'belegt',
    e2: E('Kurs', 'Kurs_ID', 'Bezeichnung', 'Kurse'),
    c12: '1N',
    c21: '1N',
  },
  {
    id: 'mitarbeiter-vorgesetzter',
    text: 'Ein Mitarbeiter hat höchstens einen Vorgesetzten, der selbst Mitarbeiter ist. Ein Mitarbeiter kann für keinen, einen oder mehrere andere Mitarbeiter Vorgesetzter sein.',
    e1: E('Vorgesetzter', 'MA_ID', 'Name', 'Vorgesetzte'),
    verb: 'führt',
    e2: E('Mitarbeiter', 'MA_ID', 'Name', 'Mitarbeiter'),
    c12: '0N',
    c21: '01',
    recursive: true,
  },
];

/** Phrasen fuer den Relationenmodell-Trainer (rekursive Beziehung dort als Sonderfall erklaert) */
export const relPhrases = phrases.filter((p) => !p.recursive);

/* ---------------- Abgeleitete Begriffe ---------------- */

export const maxOf = (c: Card) => c[1] as '1' | 'N';
export const minOf = (c: Card) => c[0] as '0' | '1';

export function relType(p: Pick<Phrase, 'c12' | 'c21'>): '1:1' | '1:N' | 'M:N' {
  const a = maxOf(p.c12),
    b = maxOf(p.c21);
  if (a === 'N' && b === 'N') return 'M:N';
  if (a === '1' && b === '1') return '1:1';
  return '1:N';
}

/* ---------------- Transformation ins Relationenmodell (Skript 04) ---------------- */

export type Mapping = 'fk-e1' | 'fk-e2' | 'zuordnung';

export interface RelColumn {
  name: string;
  pk?: boolean;
  fk?: string;
  notNull?: boolean;
  unique?: boolean;
}
export interface Relation {
  name: string;
  columns: RelColumn[];
}

/** Welche Abbildungen sind korrekt? (1:1: beide FK-Varianten) */
export function validMappings(p: Phrase): Mapping[] {
  const t = relType(p);
  if (t === 'M:N') return ['zuordnung'];
  if (t === '1:1') return ['fk-e1', 'fk-e2'];
  // FK kommt auf die N-Seite: E2 ist N-Seite, wenn eine E1 mit mehreren E2 verbunden ist
  return maxOf(p.c12) === 'N' ? ['fk-e2'] : ['fk-e1'];
}

/** NOT NULL am FK, wenn die Tabelle mit dem FK zwingend einen Partner hat (Minimum 1). */
export function fkNotNull(p: Phrase, m: Exclude<Mapping, 'zuordnung'>): boolean {
  return m === 'fk-e2' ? minOf(p.c21) === '1' : minOf(p.c12) === '1';
}

export function toRelations(p: Phrase, m: Mapping): Relation[] {
  const base = (e: Entity): Relation => ({
    name: e.name,
    columns: [{ name: e.key, pk: true }, { name: e.attr }],
  });
  const r1 = base(p.e1),
    r2 = base(p.e2);
  if (m === 'zuordnung') {
    const name = p.verb.replace(/\s+/g, '_').replace(/^./, (c) => c.toUpperCase());
    return [
      r1,
      r2,
      {
        name,
        columns: [
          { name: p.e1.key, pk: true, fk: p.e1.name },
          { name: p.e2.key, pk: true, fk: p.e2.name },
        ],
      },
    ];
  }
  const [holder, target] = m === 'fk-e2' ? [r2, p.e1] : [r1, p.e2];
  holder.columns.push({ name: target.key, fk: target.name, notNull: fkNotNull(p, m), unique: relType(p) === '1:1' });
  return [r1, r2];
}

export function relationText(r: Relation): string {
  return `${r.name} (${r.columns
    .map((c) => `${c.pk ? '_' : ''}${c.name}${c.pk ? '_' : ''}${c.fk ? ' <fk>' : ''}${c.notNull && !c.pk ? ' NOT NULL' : ''}${c.unique ? ' UNIQUE' : ''}`)
    .join(', ')})`;
}
