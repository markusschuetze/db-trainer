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
    text: 'An der TH wollen wir abbilden, welche Professorinnen in welchen Räumen ihre Büros haben. Eine Professorin wird durch eine ID identifiziert und hat einen Namen sowie eine E-Mail-Adresse. Sie hat ihr Büro in mindestens einem Raum, wobei in einem Raum keine, eine oder mehrere Professorinnen ihr Büro haben können. Ein Raum hat eine Raumnummer und Angaben zur Kapazität. In einem Raum befindet sich Büromaterial (z. B. Tisch, Stuhl). In einem Raum können sich mehrere Büromaterialien befinden, ein Büromaterial befindet sich aber in genau einem Raum. Büromaterialien werden durch eine ID identifiziert und haben eine Bezeichnung und einen Typ.',
    entities: [
      { name: 'Professorin', key: 'ID', attrs: ['Name', 'E-Mail'] },
      { name: 'Raum', key: 'Raumnummer', attrs: ['Kapazität'], keyNote: 'Die Raumnummer identifiziert den Raum.' },
      { name: 'Büromaterial', key: 'ID', attrs: ['Bezeichnung', 'Typ'] },
    ],
    distractors: ['TH', 'Tisch', 'Stuhl', 'E-Mail'],
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
];
