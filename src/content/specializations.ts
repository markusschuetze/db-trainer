// Spezialisierung / Generalisierung (Skript 03): disjunkt vs. ueberlappend, vollstaendig vs. partiell.

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
}

export const specializations: Specialization[] = [
  {
    id: 'produkte',
    text: 'Produkte sind technischer, biologischer oder chemischer Natur. Weitere Produktarten gibt es nicht. Ein technisches Produkt kann aber auch biologisch oder chemisch sein.',
    supertype: 'Produkt',
    subtypes: ['Technisch', 'Biologisch', 'Chemisch'],
    disjoint: false,
    total: true,
    why: 'Ein Produkt kann mehreren Subtypen angehören (überlappend). Es gibt keine weiteren Produktarten, also gehört jedes Produkt zu mindestens einem Subtyp (vollständig).',
  },
  {
    id: 'tiere',
    text: 'Ein Tier im Register ist entweder ein Wildtier oder ein Haustier. Daneben werden auch Nutztiere erfasst, die weder das eine noch das andere sind und keinen eigenen Subtyp bekommen.',
    supertype: 'Tier',
    subtypes: ['Wildtier', 'Haustier'],
    disjoint: true,
    total: false,
    why: 'Kein Tier ist gleichzeitig Wild- und Haustier (disjunkt). Es gibt Tiere, die zu keinem Subtyp gehören (partiell).',
  },
  {
    id: 'personal',
    text: 'Das Personal eines Supermarkts besteht aus Kassierern, Lagermitarbeitern und Security. Manche Mitarbeitende werden sowohl an der Kasse als auch im Lager eingesetzt. Außerdem gibt es eine Filialleitung, die in keine dieser Gruppen fällt.',
    supertype: 'Personal',
    subtypes: ['Kassierer', 'Lagermitarbeiter', 'Security'],
    disjoint: false,
    total: false,
    why: 'Eine Person kann in mehreren Tätigkeiten arbeiten (überlappend). Die Filialleitung gehört zu keinem Subtyp (partiell).',
  },
  {
    id: 'hochschulpersonal',
    text: 'Mitarbeitende einer Hochschule sind entweder Professorinnen und Professoren oder technische Mitarbeitende. Andere Mitarbeitende gibt es in diesem Modell nicht.',
    supertype: 'Mitarbeiter',
    subtypes: ['Prof', 'TechMit'],
    disjoint: true,
    total: true,
    why: 'Jede Person gehört genau einem Subtyp an: nicht beides (disjunkt) und nichts anderes (vollständig).',
  },
  {
    id: 'fahrzeuge',
    text: 'Ein Fahrzeug im Fuhrpark ist ein PKW oder ein LKW, nie beides. Fahrräder werden ebenfalls als Fahrzeug erfasst, aber nicht weiter spezialisiert.',
    supertype: 'Fahrzeug',
    subtypes: ['PKW', 'LKW'],
    disjoint: true,
    total: false,
    why: 'PKW und LKW schließen sich aus (disjunkt). Fahrräder sind Fahrzeuge ohne Subtyp (partiell).',
  },
  {
    id: 'konten',
    text: 'Ein Bankkunde ist Privatkunde, Geschäftskunde oder beides (z. B. Selbstständige mit privatem und geschäftlichem Konto). Andere Kundenarten gibt es nicht.',
    supertype: 'Kunde',
    subtypes: ['Privatkunde', 'Geschaeftskunde'],
    disjoint: false,
    total: true,
    why: 'Ein Kunde kann beides sein (überlappend), aber jeder Kunde ist mindestens eins davon (vollständig).',
  },
];
