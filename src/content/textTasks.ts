// Textaufgaben "Schema aus Text erkennen" (Klausurvorbereitung).
// Aus einem Anforderungstext sollen Entitaeten, Beziehungen, Kardinalitaeten und
// Schluessel erkannt und das Relationenschema abgeleitet werden. Die Beispiele
// sind den Hoersaaluebungen der Skripte 01 bis 03 nachempfunden.

import type { Card } from './erPhrases';

export interface TtEntity {
  name: string;
  /** Primaerschluessel; leer = kein natuerlicher Schluessel, ein kuenstlicher wird noetig */
  key: string;
  attrs: string[];
  /** Erklaerung zum Schluessel (nach der Pruefung) */
  keyNote?: string;
}

export interface TtRelationship {
  e1: string;
  e2: string;
  verb: string;
  /** Mit wie vielen e2 ist eine e1-Instanz verbunden? */
  c12: Card;
  /** Mit wie vielen e1 ist eine e2-Instanz verbunden? */
  c21: Card;
  /** Attribute der Beziehung (z. B. Rolle) */
  attrs?: string[];
  why: string;
}

export interface TtSpecialization {
  supertype: string;
  subtypes: string[];
  disjoint: boolean;
  total: boolean;
  why: string;
}

export interface TextTask {
  id: string;
  topicId: string;
  title: string;
  level: 1 | 2 | 3;
  text: string;
  entities: TtEntity[];
  /** plausible, aber falsche Begriffe, die der Text nahelegt */
  distractors: string[];
  relationships: TtRelationship[];
  /** plausible, aber falsche Beziehungen */
  wrongRelationships: { e1: string; e2: string; verb: string; why: string }[];
  specializations?: TtSpecialization[];
  source: string;
}

const SRC = 'Nach den Hörsaalübungen aus Skript 01–03 (Schaible/Bertelsmeier, TH Köln)';

export const textTasks: TextTask[] = [
  {
    id: 'bars-cocktails',
    topicId: '02-elemente',
    title: 'Bars, Cocktails und Zutaten',
    level: 2,
    text: 'Erstellen Sie eine Datenbank für Bars. Bars haben einen Namen und ein Eröffnungsdatum und können keinen, einen oder mehrere Cocktails herstellen. Jeder Cocktail hat einen Namen und einen gewissen Typ und wird von mindestens einer Bar hergestellt. Jeder Cocktail besteht aus verschiedenen Zutaten und kann natürlich auch von anderen Bars zubereitet werden. Die Zutaten haben einen Namen und sind entweder süß oder nicht.',
    entities: [
      { name: 'Bar', key: 'Name', attrs: ['Eröffnungsdatum'], keyNote: 'Der Barname identifiziert die Bar (so steht es im Text: „Bars werden durch ihren Namen identifiziert“).' },
      { name: 'Cocktail', key: 'Name', attrs: ['Typ'] },
      { name: 'Zutat', key: 'Name', attrs: ['süß'] },
    ],
    distractors: ['Gast', 'Preis', 'Getränk', 'Rezept'],
    relationships: [
      { e1: 'Bar', e2: 'Cocktail', verb: 'stellt her', c12: '0N', c21: '1N', why: 'Eine Bar kann keinen, einen oder mehrere Cocktails herstellen (0,N). Jeder Cocktail wird von mindestens einer Bar hergestellt (1,N). Zusammen ergibt das M:N.' },
      { e1: 'Cocktail', e2: 'Zutat', verb: 'besteht aus', c12: '1N', c21: '0N', why: 'Ein Cocktail besteht aus verschiedenen Zutaten, mindestens einer (1,N). Eine Zutat muss nicht in einem Cocktail vorkommen (0,N). Wieder M:N.' },
    ],
    wrongRelationships: [
      { e1: 'Bar', e2: 'Zutat', verb: 'kauft ein', why: 'Der Text sagt nichts über Einkauf. Bars und Zutaten sind nur indirekt über den Cocktail verbunden.' },
    ],
    source: SRC,
  },
  {
    id: 'profs-raeume',
    topicId: '03-schwach',
    title: 'Büros und Büromaterial',
    level: 2,
    text: 'An der TH wollen wir abbilden, welche Professorinnen in welchen Räumen ihre Büros haben. Eine Professorin wird durch eine ID identifiziert. Sie hat ihr Büro in mindestens einem Raum, wobei in einem Raum keine, eine oder mehrere Professorinnen ihr Büro haben können. Ein Raum hat eine Raumnummer. In einem Raum befindet sich Büromaterial. In einem Raum können sich mehrere Büromaterialien befinden, ein Büromaterial befindet sich aber in genau einem Raum. Büromaterialien werden durch eine ID identifiziert.',
    entities: [
      { name: 'Professorin', key: 'ID', attrs: [] },
      { name: 'Raum', key: 'Raumnummer', attrs: [], keyNote: 'Die Raumnummer identifiziert den Raum.' },
      { name: 'Büromaterial', key: 'ID', attrs: [] },
    ],
    distractors: ['TH', 'Büro', 'Professur'],
    relationships: [
      { e1: 'Professorin', e2: 'Raum', verb: 'hat Büro in', c12: '1N', c21: '0N', why: 'Mindestens ein Raum je Professorin (1,N); in einem Raum keine, eine oder mehrere Professorinnen (0,N). M:N.' },
      { e1: 'Raum', e2: 'Büromaterial', verb: 'enthält', c12: '0N', c21: '11', why: 'Ein Raum kann mehrere Büromaterialien enthalten (0,N), ein Büromaterial befindet sich in genau einem Raum (1,1). 1:N, der Fremdschlüssel kommt später in Büromaterial.' },
    ],
    wrongRelationships: [{ e1: 'Professorin', e2: 'Büromaterial', verb: 'besitzt', why: 'Das Büromaterial gehört zum Raum, nicht direkt zur Professorin.' }],
    source: SRC,
  },
  {
    id: 'mitarbeiterin-projekt',
    topicId: '03-schwach',
    title: 'Mitarbeiterinnen und Projekte mit Rolle',
    level: 2,
    text: 'Jede Mitarbeiterin hat eine ID und einen Namen. Jede Mitarbeiterin arbeitet in keinem, einem oder mehreren Projekten mit. Jedes Projekt wird durch eine Projektnummer identifiziert und hat ein Projektkürzel sowie einen Projektnamen. Jedes Projekt beinhaltet keine, eine oder mehrere Mitarbeiterinnen. Für eine Mitarbeiterin ist in jedem Projekt, in dem sie mitarbeitet, eine Rolle spezifiziert.',
    entities: [
      { name: 'Mitarbeiterin', key: 'ID', attrs: ['Name'] },
      { name: 'Projekt', key: 'Projektnummer', attrs: ['Projektkürzel', 'Projektname'] },
    ],
    distractors: ['Rolle', 'Team', 'Abteilung'],
    relationships: [
      {
        e1: 'Mitarbeiterin',
        e2: 'Projekt',
        verb: 'arbeitet mit in',
        c12: '0N',
        c21: '0N',
        attrs: ['Rolle'],
        why: 'Keine, eine oder mehrere in beide Richtungen: M:N. Die Rolle gehört weder zur Mitarbeiterin noch zum Projekt, sondern zur Beziehung. Deshalb wird „Rolle“ keine Entität, sondern ein Attribut der Zuordnungsrelation.',
      },
    ],
    wrongRelationships: [{ e1: 'Mitarbeiterin', e2: 'Projekt', verb: 'leitet', why: 'Von Leitung ist im Text keine Rede, nur von einer Rolle.' }],
    source: SRC,
  },
  {
    id: 'produkte-spezialisierung',
    topicId: '03-spezialisierung',
    title: 'Produkte und Kunden mit Spezialisierung',
    level: 3,
    text: 'Es werden verschiedene Produkte an etwaige Kunden geliefert. Kunden haben eine Kundennummer und eine Kundenadresse. Ein Produkt ist eindeutig bestimmt durch eine Produkt-ID, hat eine Produktbeschreibung und ist unterteilt in Produkte technischer, biologischer und chemischer Natur. Weitere Produktarten gibt es nicht. Ein technisches Produkt kann aber auch ein biologisches oder chemisches Produkt sein. Technische Produkte haben eine Angabe zur nötigen Spannung, biologische Produkte ein Haltbarkeitsdatum. Chemische Produkte haben lediglich eine Angabe, ob sie explosiv sind oder nicht.',
    entities: [
      { name: 'Kunde', key: 'Kundennummer', attrs: ['Kundenadresse'] },
      { name: 'Produkt', key: 'Produkt-ID', attrs: ['Produktbeschreibung'] },
      { name: 'Technisches Produkt', key: 'Produkt-ID', attrs: ['Spannung'], keyNote: 'Subtypen erben den Primärschlüssel des Supertyps.' },
      { name: 'Biologisches Produkt', key: 'Produkt-ID', attrs: ['Haltbarkeitsdatum'] },
      { name: 'Chemisches Produkt', key: 'Produkt-ID', attrs: ['explosiv'] },
    ],
    distractors: ['Lieferung', 'Lieferant', 'Spannung', 'Natur'],
    relationships: [
      { e1: 'Produkt', e2: 'Kunde', verb: 'wird geliefert an', c12: '0N', c21: '0N', why: 'Produkte werden an „etwaige“ Kunden geliefert: Ein Produkt kann an keinen, einen oder mehrere Kunden gehen, ein Kunde kann mehrere Produkte erhalten. M:N.' },
    ],
    wrongRelationships: [{ e1: 'Kunde', e2: 'Technisches Produkt', verb: 'bestellt', why: 'Die Lieferbeziehung gilt für alle Produkte und hängt deshalb am Supertyp Produkt, nicht an einem Subtyp.' }],
    specializations: [
      {
        supertype: 'Produkt',
        subtypes: ['Technisches Produkt', 'Biologisches Produkt', 'Chemisches Produkt'],
        disjoint: false,
        total: true,
        why: 'Ein technisches Produkt kann auch biologisch oder chemisch sein: überlappend. Weitere Produktarten gibt es nicht: vollständig.',
      },
    ],
    source: SRC,
  },
  {
    id: 'schueler-schule',
    topicId: '03-schluessel',
    title: 'Schüler und Schulen: der fehlende Schlüssel',
    level: 2,
    text: 'Schüler besuchen genau eine Schule ab einem gewissen Zeitpunkt und werden durch ihren Namen, ihre Klasse und ihr Alter beschrieben. Eine Schule hat einen Namen und kann beliebig viele Schüler haben.',
    entities: [
      { name: 'Schüler', key: '', attrs: ['Name', 'Klasse', 'Alter'], keyNote: 'Name, Klasse und Alter ergeben keinen eindeutigen Schlüssel (zwei Schüler können gleich heißen und gleich alt sein). Hier wird ein künstlicher Schlüssel (Surrogatschlüssel, z. B. Schüler_ID) ergänzt.' },
      { name: 'Schule', key: 'Name', attrs: [] },
    ],
    distractors: ['Klasse', 'Alter', 'Zeitpunkt'],
    relationships: [
      { e1: 'Schüler', e2: 'Schule', verb: 'besucht', c12: '11', c21: '0N', attrs: ['seit'], why: 'Jeder Schüler besucht genau eine Schule (1,1). Eine Schule kann beliebig viele Schüler haben, auch keine (0,N). 1:N. „seit“ beschreibt die Beziehung und wird bei 1:N zum Attribut der N-Seite (Schüler).' },
    ],
    wrongRelationships: [{ e1: 'Schüler', e2: 'Schule', verb: 'besucht mehrere', why: 'Der Text sagt „genau eine Schule“.' }],
    source: SRC,
  },
  {
    id: 'student-kurs',
    topicId: '02-elemente',
    title: 'Studierende, Kurse und Semester',
    level: 1,
    text: 'Ein Student wird eindeutig durch seine Matrikelnummer identifiziert, hat einen Namen und belegt mindestens einen Kurs, und zwar in einem bestimmten Semester. Ein Kurs wird durch eine Kurs-ID identifiziert und kann von beliebig vielen Studenten belegt werden, auch von keinem.',
    entities: [
      { name: 'Student', key: 'Matrikelnummer', attrs: ['Name'] },
      { name: 'Kurs', key: 'Kurs-ID', attrs: [] },
    ],
    distractors: ['Semester', 'Dozent', 'Name'],
    relationships: [
      { e1: 'Student', e2: 'Kurs', verb: 'belegt', c12: '1N', c21: '0N', attrs: ['Semester'], why: 'Mindestens ein Kurs je Student (1,N), ein Kurs von beliebig vielen Studenten (0,N): M:N. Das Semester gehört zur Beziehung, nicht zum Studenten oder zum Kurs.' },
    ],
    wrongRelationships: [{ e1: 'Student', e2: 'Kurs', verb: 'unterrichtet', why: 'Studenten belegen Kurse, sie unterrichten sie nicht.' }],
    source: SRC,
  },
  {
    id: 'fahrer-autos',
    topicId: '02-kardinalitaet',
    title: 'Fahrer und Autos',
    level: 1,
    text: 'Ein Fahrer wird durch eine Fahrer-ID identifiziert und hat einen Namen. Ein Auto wird durch sein Kennzeichen identifiziert und hat ein Modell. Ein Fahrer besitzt null, ein oder mehrere Autos. Ein Auto gehört höchstens einem Fahrer.',
    entities: [
      { name: 'Fahrer', key: 'Fahrer-ID', attrs: ['Name'] },
      { name: 'Auto', key: 'Kennzeichen', attrs: ['Modell'], keyNote: 'Das Kennzeichen identifiziert das Auto (natürlicher Schlüssel).' },
    ],
    distractors: ['Name', 'Modell'],
    relationships: [
      { e1: 'Fahrer', e2: 'Auto', verb: 'besitzt', c12: '0N', c21: '01', why: 'Ein Fahrer besitzt keins, eins oder mehrere Autos (0,N). Ein Auto gehört höchstens einem Fahrer (0,1), es kann also auch herrenlos sein. Das ist 1:N, der Fremdschlüssel kommt in Auto und darf NULL sein.' },
    ],
    wrongRelationships: [{ e1: 'Fahrer', e2: 'Auto', verb: 'fährt gerade', why: 'Das nennt der Text nicht: Es geht um Besitz.' }],
    source: SRC,
  },
  {
    id: 'schauspiel-film',
    topicId: '03-schwach',
    title: 'Schauspielerinnen und Filme',
    level: 2,
    text: 'Eine Schauspielerin hat eine ID und einen Namen und spielt in einem oder mehreren Filmen mit, und zwar jeweils in einer bestimmten Rolle. Ein Film hat eine Film-ID und einen Titel. Ein Film wird nur gedreht, wenn mindestens eine Schauspielerin darin mitspielt.',
    entities: [
      { name: 'Schauspielerin', key: 'ID', attrs: ['Name'] },
      { name: 'Film', key: 'Film-ID', attrs: ['Titel'] },
    ],
    distractors: ['Rolle', 'Regisseur'],
    relationships: [
      { e1: 'Schauspielerin', e2: 'Film', verb: 'spielt in', c12: '1N', c21: '1N', attrs: ['Rolle'], why: 'Mindestens ein Film je Schauspielerin (1,N) und mindestens eine Schauspielerin je Film (1,N): M:N. Die Rolle gilt nur für die Kombination aus beiden und wird Attribut der Zuordnungsrelation.' },
    ],
    wrongRelationships: [{ e1: 'Schauspielerin', e2: 'Film', verb: 'dreht', why: 'Gedreht wird der Film, im Text geht es um das Mitspielen.' }],
    source: SRC,
  },
  {
    id: 'abteilung-manager',
    topicId: '04-11-rekursiv',
    title: 'Abteilungen, Manager und Mitarbeitende',
    level: 3,
    text: 'Eine Abteilung hat eine Abteilungsnummer und einen Namen. Jede Abteilung wird von genau einem Manager geleitet, und ein Manager leitet höchstens eine Abteilung. Ein Manager hat eine Manager-ID und einen Namen. In einer Abteilung arbeiten keine, eine oder mehrere Mitarbeitende, jede Mitarbeiterin gehört zu genau einer Abteilung. Mitarbeitende haben eine Mitarbeiter-ID und einen Namen.',
    entities: [
      { name: 'Abteilung', key: 'Abteilungsnummer', attrs: ['Name'] },
      { name: 'Manager', key: 'Manager-ID', attrs: ['Name'] },
      { name: 'Mitarbeiter', key: 'Mitarbeiter-ID', attrs: ['Name'] },
    ],
    distractors: ['Leitung', 'Chef'],
    relationships: [
      { e1: 'Abteilung', e2: 'Manager', verb: 'wird geleitet von', c12: '11', c21: '01', why: 'Jede Abteilung hat genau einen Manager (1,1), ein Manager leitet höchstens eine Abteilung (0,1). Das ist eine 1:1-Beziehung: Der Fremdschlüssel kommt in eine der beiden Relationen und ist UNIQUE.' },
      { e1: 'Abteilung', e2: 'Mitarbeiter', verb: 'beschäftigt', c12: '0N', c21: '11', why: 'Eine Abteilung beschäftigt keine, eine oder mehrere Mitarbeitende (0,N), jede Mitarbeiterin gehört zu genau einer Abteilung (1,1): 1:N, der Fremdschlüssel kommt in Mitarbeiter und ist NOT NULL.' },
    ],
    wrongRelationships: [{ e1: 'Manager', e2: 'Mitarbeiter', verb: 'führt', why: 'Der Text nennt nur die Zugehörigkeit zur Abteilung, keine direkte Führungsbeziehung.' }],
    source: SRC,
  },
  {
    id: 'kunde-bestellt-produkt',
    topicId: '02-kardinalitaet',
    title: 'Kunden bestellen Produkte',
    level: 2,
    text: 'Ein Kunde hat eine Kundennummer und einen Namen. Ein Produkt hat eine Produktnummer, eine Bezeichnung und einen Preis. Ein Kunde kann beliebig viele Produkte bestellen, auch noch gar keins. Ein Produkt kann von beliebig vielen Kunden bestellt werden. Bei jeder Bestellung werden die Menge und das Bestelldatum festgehalten.',
    entities: [
      { name: 'Kunde', key: 'Kundennummer', attrs: ['Name'] },
      { name: 'Produkt', key: 'Produktnummer', attrs: ['Bezeichnung', 'Preis'] },
    ],
    distractors: ['Menge', 'Bestelldatum', 'Rechnung'],
    relationships: [
      { e1: 'Kunde', e2: 'Produkt', verb: 'bestellt', c12: '0N', c21: '0N', attrs: ['Menge', 'Bestelldatum'], why: 'Beliebig viele in beide Richtungen: M:N. Menge und Bestelldatum gehören zur einzelnen Bestellung, also zur Zuordnungsrelation.' },
    ],
    wrongRelationships: [{ e1: 'Kunde', e2: 'Produkt', verb: 'produziert', why: 'Kunden bestellen Produkte, sie stellen sie nicht her.' }],
    source: SRC,
  },
  {
    id: 'verein-kurse',
    topicId: '02-kardinalitaet',
    title: 'Vereinskurse mit Trainern',
    level: 2,
    text: 'Ein Sportverein bietet Kurse an. Jeder Kurs hat eine Kursnummer und wird von genau einem Trainer geleitet. Ein Trainer hat eine Trainer-ID und leitet keinen, einen oder mehrere Kurse. Teilnehmer werden durch ihre Mitgliedsnummer identifiziert. Ein Kurs hat mindestens einen Teilnehmer, ein Teilnehmer kann mehrere Kurse besuchen, aber auch noch keinen.',
    entities: [
      { name: 'Trainer', key: 'Trainer_ID', attrs: [] },
      { name: 'Kurs', key: 'Kursnummer', attrs: [] },
      { name: 'Teilnehmer', key: 'Mitgliedsnummer', attrs: [] },
    ],
    distractors: ['Verein', 'Mitglied', 'Halle', 'Termin'],
    relationships: [
      { e1: 'Trainer', e2: 'Kurs', verb: 'leitet', c12: '0N', c21: '11', why: 'Ein Trainer leitet keinen, einen oder mehrere Kurse (0,N). Ein Kurs wird von genau einem Trainer geleitet (1,1). Das ist 1:N, der Fremdschlüssel kommt in Kurs.' },
      { e1: 'Kurs', e2: 'Teilnehmer', verb: 'hat', c12: '1N', c21: '0N', why: 'Ein Kurs hat mindestens einen Teilnehmer (1,N). Ein Teilnehmer kann mehrere Kurse besuchen, aber auch keinen (0,N). Das ist M:N.' },
    ],
    wrongRelationships: [{ e1: 'Trainer', e2: 'Teilnehmer', verb: 'betreut', why: 'Der Text nennt keine direkte Beziehung zwischen Trainer und Teilnehmer. Sie hängen nur über den Kurs zusammen.' }],
    source: SRC,
  },
  {
    id: 'buch-exemplare',
    topicId: '02-elemente',
    title: 'Bücher, Autoren und Exemplare',
    level: 2,
    text: 'Eine Bibliothek verwaltet Bücher. Ein Buch wird durch seine ISBN identifiziert. Jedes Buch hat mindestens einen Autor, ein Autor hat mindestens ein Buch in der Bibliothek. Autoren haben eine Autor-ID. Von jedem Buch gibt es ein oder mehrere Exemplare. Ein Exemplar hat eine Exemplarnummer und gehört zu genau einem Buch.',
    entities: [
      { name: 'Autor', key: 'Autor_ID', attrs: [] },
      { name: 'Buch', key: 'ISBN', attrs: [] },
      { name: 'Exemplar', key: 'Exemplarnummer', attrs: [] },
    ],
    distractors: ['Bibliothek', 'Leser', 'Verlag', 'Regal'],
    relationships: [
      { e1: 'Autor', e2: 'Buch', verb: 'schreibt', c12: '1N', c21: '1N', why: 'Ein Autor hat mindestens ein Buch (1,N), ein Buch hat mindestens einen Autor (1,N). Das ist M:N.' },
      { e1: 'Buch', e2: 'Exemplar', verb: 'hat', c12: '1N', c21: '11', why: 'Ein Buch hat ein oder mehrere Exemplare (1,N). Ein Exemplar gehört zu genau einem Buch (1,1). Das ist 1:N, der Fremdschlüssel kommt in Exemplar.' },
    ],
    wrongRelationships: [{ e1: 'Autor', e2: 'Exemplar', verb: 'besitzt', why: 'Ein Autor besitzt keine einzelnen Exemplare. Die Verbindung läuft über das Buch.' }],
    source: SRC,
  },
  {
    id: 'klinik-stationen',
    topicId: '02-kardinalitaet',
    title: 'Station, Patient und Arzt',
    level: 2,
    text: 'In einem Krankenhaus gibt es Stationen mit einer Stationsnummer. Jeder Patient liegt auf genau einer Station, auf einer Station können keine, einer oder mehrere Patienten liegen. Patienten haben eine Patienten-ID. Ärzte haben eine Arzt-ID. Ein Arzt behandelt keine, einen oder mehrere Patienten, und jeder Patient wird von mindestens einem Arzt behandelt.',
    entities: [
      { name: 'Station', key: 'Stationsnummer', attrs: [] },
      { name: 'Patient', key: 'Patienten_ID', attrs: [] },
      { name: 'Arzt', key: 'Arzt_ID', attrs: [] },
    ],
    distractors: ['Krankenhaus', 'Zimmer', 'Bett', 'Diagnose'],
    relationships: [
      { e1: 'Station', e2: 'Patient', verb: 'belegt', c12: '0N', c21: '11', why: 'Auf einer Station liegen keine, einer oder mehrere Patienten (0,N). Ein Patient liegt auf genau einer Station (1,1). Das ist 1:N, der Fremdschlüssel kommt in Patient.' },
      { e1: 'Arzt', e2: 'Patient', verb: 'behandelt', c12: '0N', c21: '1N', why: 'Ein Arzt behandelt keinen, einen oder mehrere Patienten (0,N). Ein Patient wird von mindestens einem Arzt behandelt (1,N). Das ist M:N.' },
    ],
    wrongRelationships: [{ e1: 'Station', e2: 'Arzt', verb: 'beschäftigt', why: 'Wer auf welcher Station arbeitet, steht nicht im Text.' }],
    source: SRC,
  },
  {
    id: 'dienstwagen',
    topicId: '02-kardinalitaet',
    title: 'Dienstwagen und Werkstatt',
    level: 2,
    text: 'Eine Firma verwaltet ihre Dienstwagen. Ein Mitarbeiter hat eine Personalnummer und bekommt höchstens einen Dienstwagen. Ein Dienstwagen wird durch sein Kennzeichen identifiziert und gehört zu genau einem Mitarbeiter. Jeder Dienstwagen wird in genau einer Stammwerkstatt gewartet. Eine Werkstatt hat eine Werkstatt-ID und wartet mindestens einen Dienstwagen.',
    entities: [
      { name: 'Mitarbeiter', key: 'Personalnummer', attrs: [] },
      { name: 'Dienstwagen', key: 'Kennzeichen', attrs: [] },
      { name: 'Werkstatt', key: 'Werkstatt_ID', attrs: [] },
    ],
    distractors: ['Firma', 'Fahrer', 'Tankkarte', 'Reparatur'],
    relationships: [
      { e1: 'Mitarbeiter', e2: 'Dienstwagen', verb: 'bekommt', c12: '01', c21: '11', why: 'Ein Mitarbeiter bekommt höchstens einen Dienstwagen (0,1). Ein Dienstwagen gehört zu genau einem Mitarbeiter (1,1). Das ist 1:1.' },
      { e1: 'Dienstwagen', e2: 'Werkstatt', verb: 'wird gewartet in', c12: '11', c21: '1N', why: 'Ein Dienstwagen hat genau eine Stammwerkstatt (1,1). Eine Werkstatt wartet mindestens einen Dienstwagen (1,N). Das ist 1:N, der Fremdschlüssel kommt in Dienstwagen.' },
    ],
    wrongRelationships: [{ e1: 'Mitarbeiter', e2: 'Werkstatt', verb: 'besucht', why: 'Der Text sagt nichts über Besuche des Mitarbeiters in der Werkstatt.' }],
    source: SRC,
  },
  {
    id: 'kino-vorstellungen',
    topicId: '03-schwach',
    title: 'Kino mit Sälen und Vorstellungen',
    level: 2,
    text: 'Ein Kino zeigt Filme. Ein Film hat eine Film-ID und läuft in keiner, einer oder mehreren Vorstellungen. Eine Vorstellung zeigt genau einen Film und findet in genau einem Saal statt. Eine Vorstellung hat eine Uhrzeit, aber keine eigene Nummer. Ein Saal hat eine Saalnummer und kann keine, eine oder mehrere Vorstellungen haben.',
    entities: [
      { name: 'Film', key: 'Film_ID', attrs: [] },
      { name: 'Vorstellung', key: '', attrs: ['Uhrzeit'], keyNote: 'Die Nummer gilt nur im Zusammenhang mit dem übergeordneten Objekt oder fehlt im Text, daher wird ein künstlicher Schlüssel gebraucht.' },
      { name: 'Saal', key: 'Saalnummer', attrs: [] },
    ],
    distractors: ['Kino', 'Ticket', 'Besucher', 'Sitzplatz'],
    relationships: [
      { e1: 'Film', e2: 'Vorstellung', verb: 'läuft in', c12: '0N', c21: '11', why: 'Ein Film läuft in keiner, einer oder mehreren Vorstellungen (0,N). Eine Vorstellung zeigt genau einen Film (1,1). Das ist 1:N, der Fremdschlüssel kommt in Vorstellung.' },
      { e1: 'Saal', e2: 'Vorstellung', verb: 'hat', c12: '0N', c21: '11', why: 'Ein Saal hat keine, eine oder mehrere Vorstellungen (0,N). Eine Vorstellung findet in genau einem Saal statt (1,1). Das ist 1:N, der Fremdschlüssel kommt in Vorstellung.' },
    ],
    wrongRelationships: [{ e1: 'Film', e2: 'Saal', verb: 'belegt', why: 'Film und Saal sind nur über die Vorstellung verbunden.' }],
    source: SRC,
  },
  {
    id: 'shop-bestellungen',
    topicId: '02-elemente',
    title: 'Onlineshop mit Bestellungen',
    level: 2,
    text: 'Ein Onlineshop speichert Kunden mit Kundennummer. Ein Kunde kann keine, eine oder mehrere Bestellungen aufgeben, jede Bestellung gehört zu genau einem Kunden. Eine Bestellung hat eine Bestellnummer. Sie enthält mindestens einen Artikel. Ein Artikel hat eine Artikelnummer und kann in keiner, einer oder mehreren Bestellungen vorkommen.',
    entities: [
      { name: 'Kunde', key: 'Kundennummer', attrs: [] },
      { name: 'Bestellung', key: 'Bestellnummer', attrs: [] },
      { name: 'Artikel', key: 'Artikelnummer', attrs: [] },
    ],
    distractors: ['Shop', 'Warenkorb', 'Lieferung', 'Rechnung'],
    relationships: [
      { e1: 'Kunde', e2: 'Bestellung', verb: 'gibt auf', c12: '0N', c21: '11', why: 'Ein Kunde gibt keine, eine oder mehrere Bestellungen auf (0,N). Jede Bestellung gehört zu genau einem Kunden (1,1). Das ist 1:N, der Fremdschlüssel kommt in Bestellung.' },
      { e1: 'Bestellung', e2: 'Artikel', verb: 'enthält', c12: '1N', c21: '0N', why: 'Eine Bestellung enthält mindestens einen Artikel (1,N). Ein Artikel kann in keiner, einer oder mehreren Bestellungen vorkommen (0,N). Das ist M:N.' },
    ],
    wrongRelationships: [{ e1: 'Kunde', e2: 'Artikel', verb: 'kauft', why: 'Der Kauf läuft hier über die Bestellung, eine direkte Beziehung gibt der Text nicht her.' }],
    source: SRC,
  },
  {
    id: 'modul-pruefungen',
    topicId: '02-kardinalitaet',
    title: 'Module, Dozenten und Prüfungen',
    level: 2,
    text: 'Eine Hochschule verwaltet Module mit Modulnummer. Jedes Modul wird von mindestens einem Dozenten gehalten. Ein Dozent hat eine Dozenten-ID und hält keine, ein oder mehrere Module. Zu einem Modul gibt es keine, eine oder mehrere Prüfungen. Eine Prüfung hat ein Datum, aber keine eigene Nummer, und gehört zu genau einem Modul.',
    entities: [
      { name: 'Dozent', key: 'Dozenten_ID', attrs: [] },
      { name: 'Modul', key: 'Modulnummer', attrs: [] },
      { name: 'Prüfung', key: '', attrs: ['Datum'], keyNote: 'Die Nummer gilt nur im Zusammenhang mit dem übergeordneten Objekt oder fehlt im Text, daher wird ein künstlicher Schlüssel gebraucht.' },
    ],
    distractors: ['Hochschule', 'Student', 'Note', 'Raum'],
    relationships: [
      { e1: 'Dozent', e2: 'Modul', verb: 'hält', c12: '0N', c21: '1N', why: 'Ein Dozent hält keine, ein oder mehrere Module (0,N). Ein Modul wird von mindestens einem Dozenten gehalten (1,N). Das ist M:N.' },
      { e1: 'Modul', e2: 'Prüfung', verb: 'hat', c12: '0N', c21: '11', why: 'Ein Modul hat keine, eine oder mehrere Prüfungen (0,N). Eine Prüfung gehört zu genau einem Modul (1,1). Das ist 1:N, der Fremdschlüssel kommt in Prüfung.' },
    ],
    wrongRelationships: [{ e1: 'Dozent', e2: 'Prüfung', verb: 'nimmt ab', why: 'Wer prüft, steht nicht im Text.' }],
    source: SRC,
  },
  {
    id: 'hotel-zimmer',
    topicId: '03-schwach',
    title: 'Hotel, Zimmer und Gäste',
    level: 2,
    text: 'Ein Hotel hat eine Hotel-ID. Jedes Hotel hat mindestens ein Zimmer, ein Zimmer gehört zu genau einem Hotel. Ein Zimmer hat eine Zimmernummer, die nur innerhalb des Hotels eindeutig ist. Gäste haben eine Gast-ID. Ein Gast kann keine, eine oder mehrere Zimmer buchen, und ein Zimmer kann im Lauf der Zeit von keinem, einem oder mehreren Gästen gebucht werden.',
    entities: [
      { name: 'Hotel', key: 'Hotel_ID', attrs: [] },
      { name: 'Zimmer', key: '', attrs: ['Zimmernummer'], keyNote: 'Die Nummer gilt nur im Zusammenhang mit dem übergeordneten Objekt oder fehlt im Text, daher wird ein künstlicher Schlüssel gebraucht.' },
      { name: 'Gast', key: 'Gast_ID', attrs: [] },
    ],
    distractors: ['Buchung', 'Rezeption', 'Stern', 'Preis'],
    relationships: [
      { e1: 'Hotel', e2: 'Zimmer', verb: 'hat', c12: '1N', c21: '11', why: 'Ein Hotel hat mindestens ein Zimmer (1,N). Ein Zimmer gehört zu genau einem Hotel (1,1). Das ist 1:N, der Fremdschlüssel kommt in Zimmer.' },
      { e1: 'Gast', e2: 'Zimmer', verb: 'bucht', c12: '0N', c21: '0N', why: 'Ein Gast bucht keine, eine oder mehrere Zimmer (0,N). Ein Zimmer wird von keinem, einem oder mehreren Gästen gebucht (0,N). Das ist M:N.' },
    ],
    wrongRelationships: [{ e1: 'Hotel', e2: 'Gast', verb: 'beherbergt', why: 'Das Hotel hängt nur über das Zimmer mit dem Gast zusammen.' }],
    source: SRC,
  },
];
