// Spezialisierung / Generalisierung (Skript 03): disjunkt vs. ueberlappend, vollstaendig vs. partiell.
// 4 Varianten x 8 Aufgaben. Notation wie in den Folien: Dreieck unter dem Supertyp mit
// X (disjunkt, partiell), XV (disjunkt, vollstaendig), leer (ueberlappend, partiell), V (ueberlappend, vollstaendig).

export interface Specialization {
  id: string;
  text: string;
  supertype: string;
  subtypes: string[];
  /** disjunkt (XOR) = true, ueberlappend (OR) = false */
  disjoint: boolean;
  /** vollstaendig = true, partiell = false */
  total: boolean;
  why: string;
  /** Attribute fuer das Diagramm: Supertyp (inkl. Schluessel) und je ein Attribut pro Subtyp */
  superAttrs: string[];
  subAttrs: string[];
}

/** Beschriftung im Dreieck laut Skript */
export function specMarker(s: { disjoint: boolean; total: boolean }): 'X' | 'XV' | '' | 'V' {
  return s.disjoint ? (s.total ? 'XV' : 'X') : s.total ? 'V' : '';
}

export const SPEC_VARIANTS = [
  { disjoint: true, total: true, name: 'disjunkt und vollständig' },
  { disjoint: true, total: false, name: 'disjunkt und partiell' },
  { disjoint: false, total: true, name: 'überlappend und vollständig' },
  { disjoint: false, total: false, name: 'überlappend und partiell' },
] as const;

type Row = [id: string, text: string, sup: string, subs: string[], d: 0 | 1, t: 0 | 1, why: string, sa: string[], ua: string[]];

const rows: Row[] = [
  ['hochschulpersonal', 'Mitarbeitende einer Hochschule sind entweder Professorinnen und Professoren oder technische Mitarbeitende. Andere Mitarbeitende gibt es in diesem Modell nicht.', 'Mitarbeiter', ['Prof', 'TechMit'], 1, 1, 'Jede Person gehört genau einem Subtyp an: nicht beides (disjunkt) und nichts anderes (vollständig).', ['+ m_id <pk>', 'name'], ['lehrgebiet', 'werkstatt']],
  ['zahlung', 'Eine Zahlung im Onlineshop erfolgt per Überweisung, Lastschrift oder Kartenzahlung. Jede Zahlung nutzt genau eine dieser Arten, weitere Zahlungsarten werden nicht angeboten.', 'Zahlung', ['Überweisung', 'Lastschrift', 'Kartenzahlung'], 1, 1, 'Eine Zahlung hat genau eine Art (disjunkt) und es gibt keine weitere Art (vollständig).', ['+ z_id <pk>', 'betrag'], ['absender_iban', 'mandatsnummer', 'kartennummer']],
  ['studium', 'Studierende sind entweder in Vollzeit oder in Teilzeit eingeschrieben. Niemand ist gleichzeitig in beiden Modellen eingeschrieben, und weitere Studienformen gibt es nicht.', 'Studierende', ['Vollzeit', 'Teilzeit'], 1, 1, 'Niemand gehört zu beiden Subtypen (disjunkt) und jede Person gehört zu einem davon (vollständig).', ['+ matrikel_nr <pk>', 'name'], ['regelstudienzeit', 'wochenstunden']],
  ['bestellung', 'Jede Bestellung wird entweder online oder in einer Filiale aufgegeben, nie auf beiden Wegen zugleich. Andere Bestellwege existieren nicht.', 'Bestellung', ['Online', 'Filiale'], 1, 1, 'Eine Bestellung hat genau einen Weg: nicht beide (disjunkt), kein dritter (vollständig).', ['+ b_id <pk>', 'datum'], ['ip_adresse', 'filial_nr']],
  ['beschaeftigte', 'Das Personal einer Behörde besteht aus Beamten und Angestellten. Niemand ist beides, und weitere Beschäftigungsarten kommen nicht vor.', 'Beschäftigter', ['Beamter', 'Angestellter'], 1, 1, 'Beamte und Angestellte schließen sich aus (disjunkt), und alle Beschäftigten gehören zu einer der beiden Gruppen (vollständig).', ['+ pers_nr <pk>', 'name'], ['besoldungsgruppe', 'tarifgruppe']],
  ['lehrveranstaltung', 'Eine Lehrveranstaltung ist eine Vorlesung, eine Übung oder ein Praktikum. Jede Veranstaltung hat genau eine dieser Formen, eine vierte Form gibt es nicht.', 'Lehrveranstaltung', ['Vorlesung', 'Übung', 'Praktikum'], 1, 1, 'Genau eine Form pro Veranstaltung (disjunkt), und keine weitere Form (vollständig).', ['+ lv_id <pk>', 'titel'], ['hoersaal', 'tutor', 'labor']],
  ['hotelbuchung', 'Eine Hotelbuchung betrifft ein Einzelzimmer, ein Doppelzimmer oder eine Suite. Pro Buchung wird genau eine Zimmerart gebucht, andere Zimmerarten hat das Hotel nicht.', 'Hotelbuchung', ['Einzelzimmer', 'Doppelzimmer', 'Suite'], 1, 1, 'Eine Buchung hat genau eine Zimmerart (disjunkt), und andere Zimmerarten gibt es nicht (vollständig).', ['+ buchungs_id <pk>', 'von_bis'], ['ausstattung', 'bettenzahl', 'butler']],
  ['medium', 'Die Stadtbibliothek verleiht ausschließlich Bücher und DVDs. Ein Medium ist entweder ein Buch oder eine DVD, niemals beides.', 'Medium', ['Buch', 'DVD'], 1, 1, 'Kein Medium ist Buch und DVD zugleich (disjunkt), und andere Medien gibt es nicht (vollständig).', ['+ medien_nr <pk>', 'titel'], ['isbn', 'laufzeit']],
  ['tiere', 'Ein Tier im Register ist entweder ein Wildtier oder ein Haustier. Daneben werden auch Nutztiere erfasst, die weder das eine noch das andere sind und keinen eigenen Subtyp bekommen.', 'Tier', ['Wildtier', 'Haustier'], 1, 0, 'Kein Tier ist gleichzeitig Wild- und Haustier (disjunkt). Es gibt Tiere, die zu keinem Subtyp gehören (partiell).', ['+ tier_id <pk>', 'art'], ['revier', 'besitzer']],
  ['fahrzeuge', 'Ein Fahrzeug im Fuhrpark ist ein PKW oder ein LKW, nie beides. Fahrräder werden ebenfalls als Fahrzeug erfasst, aber nicht weiter spezialisiert.', 'Fahrzeug', ['PKW', 'LKW'], 1, 0, 'PKW und LKW schließen sich aus (disjunkt). Fahrräder sind Fahrzeuge ohne Subtyp (partiell).', ['+ fz_id <pk>', 'kennzeichen'], ['sitzplaetze', 'nutzlast']],
  ['klinik', 'In einer Klinik arbeiten Ärzte und Pflegekräfte. Niemand ist beides. Daneben gibt es Verwaltungspersonal, das keinem der beiden Subtypen zugeordnet wird.', 'Klinikpersonal', ['Arzt', 'Pflegekraft'], 1, 0, 'Ärzte und Pflegekräfte schließen sich aus (disjunkt). Das Verwaltungspersonal gehört zu keinem Subtyp (partiell).', ['+ pers_nr <pk>', 'name'], ['fachrichtung', 'station']],
  ['immobilie', 'Ein Immobilienportal erfasst Wohnungen und Häuser. Eine Immobilie ist nie beides. Garagen und Grundstücke stehen ebenfalls im Portal, haben aber keinen eigenen Subtyp.', 'Immobilie', ['Wohnung', 'Haus'], 1, 0, 'Wohnung und Haus schließen sich aus (disjunkt). Garagen und Grundstücke haben keinen Subtyp (partiell).', ['+ obj_id <pk>', 'preis'], ['etage', 'grundstuecksflaeche']],
  ['lebensmittel', 'Ein Lebensmittel im Sortiment ist Obst oder Gemüse, nie beides. Milchprodukte, Backwaren und andere Lebensmittel werden nicht weiter unterteilt.', 'Lebensmittel', ['Obst', 'Gemüse'], 1, 0, 'Obst und Gemüse schließen sich aus (disjunkt). Alle übrigen Lebensmittel haben keinen Subtyp (partiell).', ['+ artikel_nr <pk>', 'bezeichnung'], ['sorte', 'erntezeit']],
  ['konto', 'Eine Bank führt Sparkonten und Girokonten. Ein Konto ist immer nur eines von beiden. Depot- und Kreditkonten gibt es auch, sie werden im Modell aber nicht als Subtyp geführt.', 'Konto', ['Sparkonto', 'Girokonto'], 1, 0, 'Ein Konto ist nie Spar- und Girokonto zugleich (disjunkt). Depot- und Kreditkonten bleiben ohne Subtyp (partiell).', ['+ iban <pk>', 'saldo'], ['zinssatz', 'dispo']],
  ['produkte', 'Produkte sind technischer, biologischer oder chemischer Natur. Weitere Produktarten gibt es nicht. Ein technisches Produkt kann aber auch biologisch oder chemisch sein.', 'Produkt', ['Technisch', 'Biologisch', 'Chemisch'], 0, 1, 'Ein Produkt kann mehreren Subtypen angehören (überlappend). Es gibt keine weiteren Produktarten, also gehört jedes Produkt zu mindestens einem Subtyp (vollständig).', ['+ p_id <pk>', 'p_beschreibung'], ['spannung', 'haltbarkeit', 'explosiv']],
  ['konten', 'Ein Bankkunde ist Privatkunde, Geschäftskunde oder beides (z. B. Selbstständige mit privatem und geschäftlichem Konto). Andere Kundenarten gibt es nicht.', 'Kunde', ['Privatkunde', 'Geschaeftskunde'], 0, 1, 'Ein Kunde kann beides sein (überlappend), aber jeder Kunde ist mindestens eins davon (vollständig).', ['+ k_id <pk>', 'name'], ['geburtsdatum', 'handelsregister']],
  ['film', 'Jeder Film in der Mediathek gehört zu den Genres Komödie, Drama oder Action. Ein Film kann in mehreren Genres liegen, zum Beispiel Action und Komödie. Weitere Genres führt die Mediathek nicht.', 'Film', ['Komödie', 'Drama', 'Action'], 0, 1, 'Ein Film kann in mehreren Genres liegen (überlappend), und jeder Film hat mindestens eines (vollständig).', ['+ film_id <pk>', 'titel'], ['pointen', 'tragik', 'stunts']],
  ['geschaeftspartner', 'Ein Geschäftspartner ist Kunde, Lieferant oder beides zugleich. Andere Arten von Geschäftspartnern kommen nicht vor.', 'Geschäftspartner', ['Kunde', 'Lieferant'], 0, 1, 'Ein Partner kann beides sein (überlappend), und jeder ist mindestens eines von beiden (vollständig).', ['+ gp_id <pk>', 'name'], ['kundennummer', 'lieferantennummer']],
  ['sportverein', 'Ein Sportverein hat die Abteilungen Fußball, Tennis und Schwimmen. Mitglieder können mehreren Abteilungen angehören. Wer im Verein ist, gehört mindestens einer Abteilung an.', 'Mitglied', ['Fußball', 'Tennis', 'Schwimmen'], 0, 1, 'Mitglieder können in mehreren Abteilungen sein (überlappend), und jedes Mitglied hat mindestens eine (vollständig).', ['+ mitglieds_nr <pk>', 'name'], ['position', 'spielstaerke', 'bahn']],
  ['antrieb', 'Ein Fahrzeug im Leihpool hat einen Verbrennungsmotor, einen Elektroantrieb oder beides (Hybrid). Andere Antriebsarten gibt es im Pool nicht.', 'Leihfahrzeug', ['Verbrenner', 'Elektro'], 0, 1, 'Hybride gehören zu beiden Subtypen (überlappend), und jedes Fahrzeug hat mindestens einen der beiden Antriebe (vollständig).', ['+ fz_id <pk>', 'kennzeichen'], ['hubraum', 'akkukapazitaet']],
  ['personal', 'Das Personal eines Supermarkts besteht aus Kassierern, Lagermitarbeitern und Security. Manche Mitarbeitende werden sowohl an der Kasse als auch im Lager eingesetzt. Außerdem gibt es eine Filialleitung, die in keine dieser Gruppen fällt.', 'Personal', ['Kassierer', 'Lagermitarbeiter', 'Security'], 0, 0, 'Eine Person kann in mehreren Tätigkeiten arbeiten (überlappend). Die Filialleitung gehört zu keinem Subtyp (partiell).', ['+ pers_nr <pk>', 'name'], ['kasse_nr', 'lagerbereich', 'schein']],
  ['bibliothek', 'Die Hochschulbibliothek hat Nutzer, die Studierende oder Mitarbeitende der Hochschule sind. Werkstudierende sind beides. Externe Nutzer gehören zu keiner dieser Gruppen.', 'Nutzer', ['Studierender', 'Mitarbeitender'], 0, 0, 'Werkstudierende gehören zu beiden Subtypen (überlappend), externe Nutzer zu keinem (partiell).', ['+ nutzer_id <pk>', 'name'], ['matrikel_nr', 'dienststelle']],
  ['hotelgast', 'Ein Hotel unterscheidet Gäste mit Frühstück, mit Spa-Zugang und Tagungsgäste. Ein Gast kann mehrere dieser Leistungen buchen. Viele Gäste übernachten nur und gehören zu keiner dieser Gruppen.', 'Gast', ['Frühstücksgast', 'Spagast', 'Tagungsgast'], 0, 0, 'Mehrere Leistungen pro Gast sind möglich (überlappend), und manche Gäste haben keine davon (partiell).', ['+ gast_id <pk>', 'name'], ['fruehstueckszeit', 'behandlung', 'tagungsraum']],
  ['artikel', 'Im Onlineshop können Artikel als Sale-Artikel, Neuheit oder Bestseller gekennzeichnet sein. Ein Artikel kann mehrere Kennzeichen tragen, zum Beispiel Neuheit und Bestseller. Die meisten Artikel haben gar kein Kennzeichen.', 'Artikel', ['Sale', 'Neuheit', 'Bestseller'], 0, 0, 'Kennzeichen lassen sich kombinieren (überlappend), und normale Artikel haben keines (partiell).', ['+ artikel_nr <pk>', 'preis'], ['rabatt', 'einfuehrungsdatum', 'verkaufsrang']],
  ['vereinsrollen', 'In einem Verein können Mitglieder zusätzlich Trainer oder Schiedsrichter sein. Manche sind beides. Die meisten Mitglieder üben keine dieser Rollen aus.', 'Mitglied', ['Trainer', 'Schiedsrichter'], 0, 0, 'Beide Rollen können zusammenfallen (überlappend), und viele Mitglieder haben keine (partiell).', ['+ mitglieds_nr <pk>', 'name'], ['lizenz', 'pfeiflizenz']],
  ['onlinekunde', 'Kunden eines Onlineshops können Newsletter-Abonnent, Premiumkunde oder Gutscheininhaber sein, auch mehrere dieser Status zugleich. Viele Kunden haben keinen dieser Status.', 'Kunde', ['Abonnent', 'Premiumkunde', 'Gutscheininhaber'], 0, 0, 'Die Status sind kombinierbar (überlappend), und es gibt Kunden ohne Status (partiell).', ['+ k_id <pk>', 'name'], ['abo_seit', 'beitrag', 'gutscheincode']],
  ['gebaeude', 'Eine Stadt erfasst Gebäude. Manche sind denkmalgeschützt, manche barrierefrei, manche beides. Viele Gebäude sind weder das eine noch das andere.', 'Gebäude', ['Denkmal', 'Barrierefrei'], 0, 0, 'Ein Gebäude kann beide Eigenschaften haben (überlappend), und manche haben keine (partiell).', ['+ geb_id <pk>', 'adresse'], ['schutzstufe', 'aufzug']],
  ['veranstaltung', 'Eine Eventagentur plant Konzerte und Lesungen. Eine Veranstaltung ist nie beides zugleich. Messen und Firmenfeiern werden ebenfalls erfasst, haben aber keinen eigenen Subtyp.', 'Veranstaltung', ['Konzert', 'Lesung'], 1, 0, 'Konzert und Lesung schließen sich aus (disjunkt). Messen und Feiern haben keinen Subtyp (partiell).', ['+ v_id <pk>', 'datum'], ['buehne', 'autor']],
  ['dokument', 'Ein Dokumentenarchiv enthält Rechnungen und Angebote. Ein Dokument ist entweder das eine oder das andere. Briefe, Verträge und sonstige Dokumente stehen ohne Subtyp im Archiv.', 'Dokument', ['Rechnung', 'Angebot'], 1, 0, 'Rechnung und Angebot schließen sich aus (disjunkt). Alle sonstigen Dokumente gehören zu keinem Subtyp (partiell).', ['+ dok_id <pk>', 'erstellt_am'], ['rechnungsbetrag', 'gueltig_bis']],
  ['rolle-it', 'In einem IT-Projekt arbeiten Personen als Entwickler, Tester oder Projektleiter. Jede Person hat mindestens eine dieser Rollen, kann aber auch mehrere gleichzeitig übernehmen. Weitere Rollen gibt es nicht.', 'Projektmitglied', ['Entwickler', 'Tester', 'Projektleiter'], 0, 1, 'Mehrere Rollen pro Person sind möglich (überlappend), und jede Person hat mindestens eine Rolle (vollständig).', ['+ pm_id <pk>', 'name'], ['sprache', 'testtool', 'budget']],
  ['reisebuchung', 'Eine Reisebuchung enthält einen Flug, ein Hotel, einen Mietwagen oder eine Kombination daraus. Eine Buchung ohne mindestens eine dieser Leistungen gibt es nicht. Andere Leistungen werden nicht angeboten.', 'Reisebuchung', ['Flugbuchung', 'Hotelbuchung', 'Mietwagenbuchung'], 0, 1, 'Leistungen lassen sich kombinieren (überlappend), und jede Buchung enthält mindestens eine (vollständig).', ['+ buchungs_id <pk>', 'reisedatum'], ['flugnummer', 'hotelname', 'fahrzeugklasse']],
  ['ersthelfer', 'In einem Betrieb übernehmen manche Beschäftigte zusätzlich die Rolle Ersthelfer oder Brandschutzhelfer, einige sogar beide. Die meisten Beschäftigten haben keine dieser Zusatzrollen.', 'Beschäftigter', ['Ersthelfer', 'Brandschutzhelfer'], 0, 0, 'Beide Zusatzrollen sind kombinierbar (überlappend), und viele Beschäftigte haben keine (partiell).', ['+ pers_nr <pk>', 'name'], ['kurs_datum', 'unterweisung']],
];

export const specializations: Specialization[] = rows.map(([id, text, supertype, subtypes, d, t, why, superAttrs, subAttrs]) => ({
  id,
  text,
  supertype,
  subtypes,
  disjoint: d === 1,
  total: t === 1,
  why,
  superAttrs,
  subAttrs,
}));
