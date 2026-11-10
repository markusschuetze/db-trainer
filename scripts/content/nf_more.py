#!/usr/bin/env python3
"""Erzeugt src/content/exercisesMore.ts: weitere Normalisierungsaufgaben (je Bereich bis 8).
Aufruf: python3 scripts/content/nf_more.py   (im Ordner trainer)
Die Daten werden vor dem Schreiben geprueft (FDs gelten in den Daten, jedes Nichtschluesselattribut hat genau eine FD)."""
import json, re, sys

SRC = 'Nach Skript 05 Normalisierung (Schaible/Bertelsmeier, TH Köln)'
H1 = 'Beginne mit der 1. Normalform: Sind alle Werte atomar?'
HM = 'Gehe die Normalformen der Reihe nach durch: erst atomare Werte, dann Abhängigkeiten vom Schlüssel.'
H2 = 'Partielle Abhängigkeiten werden mit dem Teilschlüssel, von dem sie abhängen, in eine eigene Relation ausgelagert. Die ursprüngliche Relation behält nur noch Attribute, die vom ganzen Schlüssel abhängen.'
H3 = 'Bei einer transitiven Abhängigkeit wird das bestimmende Attribut zum Schlüssel einer neuen Relation. Es bleibt in der alten Relation als Fremdschlüssel stehen.'
TOPIC = {'1': '05-1nf', '2': '05-2nf', '3': '05-3nf', 'M': '05-3nf'}
TAGS = {'1': ['1NF'], '2': ['2NF'], '3': ['3NF'], 'M': ['1NF', '2NF', '3NF']}

X = []  # Spezifikationen


def ex(**k):
    X.append(k)


# kurze Schreibweise fuer FDs: ('lhs1,lhs2', 'rhs1,rhs2', 'kind')
def fd(l, r, kind, why=None):
    return (l.split(','), r.split(','), kind, why)


def rel(s):
    """'Name(a*, b, c>Ref)' -> Relation"""
    m = re.match(r'(\w+)\((.*)\)$', s)
    cols = []
    for c in [x.strip() for x in m.group(2).split(',')]:
        o = {}
        if '>' in c:
            c, ref = c.split('>')
            o['fk'] = ref
        if c.endswith('*'):
            c = c[:-1]
            o['pk'] = True
        cols.append({'name': c, **o})
    return {'name': m.group(1), 'columns': cols}


# ------------------------------------------------------------------ 1NF
ex(id='kunden-telefon', area='1', title='Kunden und Telefonnummern',
   scenario='Zu Kundinnen und Kunden werden Name, Ort und Telefonnummern gespeichert.',
   glossary={'KdNr': 'Kundennummer', 'Ort': 'Wohnort'},
   cols=['KdNr', 'Name', 'Ort', 'Telefon'], pk=['KdNr'],
   rows=[['1', 'Berg', 'Köln', '0221 4711, 0171 9988'], ['2', 'Roth', 'Bonn', '0228 1234'], ['3', 'Voss', 'Köln', '0221 8080, 02261 55']],
   issues=[('Telefon', 'mehrwertig', ', ')],
   fds=[fd('KdNr', 'Name,Ort', 'partiell')])
ex(id='adressbuch', area='1', title='Adressbuch',
   scenario='Ein Adressbuch speichert zu jedem Kontakt Name und Anschrift.',
   glossary={'KtNr': 'Kontaktnummer', 'Anschrift': 'Straße und Ort'},
   cols=['KtNr', 'Name', 'Anschrift'], pk=['KtNr'],
   rows=[['1', 'Anna Berg', 'Hauptstr. 5, Gummersbach'], ['2', 'Ben Roth', 'Ring 7, Köln'], ['3', 'Clara Voss', 'Bahnhofstr. 2, Bonn']],
   issues=[('Name', 'strukturiert', ['Vorname', 'Nachname'], r'^(\S+) (.+)$'), ('Anschrift', 'strukturiert', ['Straße', 'Ort'], r'^(.*), (.*)$')],
   fds=[fd('KtNr', 'Vorname,Nachname,Straße,Ort', 'voll')])
ex(id='band-trap', area='1', title='Bands im Archiv',
   scenario='Ein Musikarchiv speichert Bands mit Genre und Gründungsjahr.',
   glossary={'BandNr': 'Bandnummer', 'Gegruendet': 'Gründungsjahr'},
   cols=['BandNr', 'Name', 'Genre', 'Gegruendet'], pk=['BandNr'],
   rows=[['1', 'Earth, Wind & Fire', 'Funk', '1971'], ['2', 'AC/DC', 'Rock', '1973'], ['3', 'Simon & Garfunkel', 'Folk', '1957'], ['4', 'Crosby, Stills, Nash & Young', 'Rock', '1968']],
   issues=[], ok_note='Achtung, Falle: Kommas und „&“ gehören hier zum Namen der Band („Earth, Wind & Fire“ ist ein einziger Wert). Mehrwertig wäre nur, wenn mehrere voneinander unabhängige Werte in einem Feld stünden.',
   fds=[fd('BandNr', 'Name,Genre,Gegruendet', 'voll')])
ex(id='buch-autoren', area='1', title='Bücher und Autoren',
   scenario='Eine Buchhandlung verwaltet Bücher mit Autoren, Verlag und Preis.',
   glossary={'ISBN': 'Internationale Standardbuchnummer', 'Autoren': 'Autorinnen und Autoren'},
   cols=['ISBN', 'Titel', 'Autoren', 'Verlag', 'Preis'], pk=['ISBN'],
   rows=[['978-1', 'Datenbanken', 'Meier; Schulz', 'Pearson', '29,90 €'], ['978-2', 'Netzwerke', 'Kaya', 'Springer', '34,00 €'], ['978-3', 'Statistik', 'Lang; Voss; Roth', 'Pearson', '24,50 $']],
   issues=[('Autoren', 'mehrwertig', '; '), ('Preis', 'strukturiert', ['Preis', 'Währung'], r'^(.*) (€|\$)$')],
   fds=[fd('ISBN', 'Titel,Verlag,Preis,Währung', 'partiell')])
ex(id='raum-trap', area='1', title='Räume der Hochschule',
   scenario='Die Raumverwaltung speichert Räume mit Bezeichnung, Standort und Plätzen.',
   glossary={'RaumNr': 'Raumnummer', 'Plaetze': 'Anzahl Sitzplätze'},
   cols=['RaumNr', 'Bezeichnung', 'Gebaeude', 'Plaetze'], pk=['RaumNr'],
   rows=[['R1', 'A 1.04', 'Campus Gummersbach', '48'], ['R2', 'B 2.11', 'Campus Gummersbach', '120'], ['R3', 'Hörsaal 3', 'Campus Deutz', '300'], ['R4', 'Labor C 0.02', 'Campus Gummersbach', '24']],
   issues=[], ok_note='Achtung, Falle: „A 1.04“ oder „Campus Gummersbach“ sehen zusammengesetzt aus, sind aber je ein einzelner, nicht weiter sinnvoll teilbarer Wert. Atomar heißt nicht „ein Wort“.',
   fds=[fd('RaumNr', 'Bezeichnung,Gebaeude,Plaetze', 'voll')])
ex(id='rezept-zutaten', area='1', title='Rezeptsammlung',
   scenario='Eine Rezeptsammlung speichert Rezepte mit Zutaten und Zubereitungsdauer.',
   glossary={'RezNr': 'Rezeptnummer', 'Dauer': 'Zubereitungsdauer'},
   cols=['RezNr', 'Name', 'Zutaten', 'Dauer'], pk=['RezNr'],
   rows=[['1', 'Pfannkuchen', 'Mehl, Eier, Milch', '20 min'], ['2', 'Salat', 'Tomaten, Gurke', '10 min'], ['3', 'Rührei', 'Eier, Butter', '5 min']],
   issues=[('Zutaten', 'mehrwertig', ', '), ('Dauer', 'strukturiert', ['Dauer', 'Einheit'], r'^(\d+) (\w+)$')],
   fds=[fd('RezNr', 'Name,Dauer,Einheit', 'partiell')])
ex(id='kurs-termine', area='1', title='Kurse und Termine',
   scenario='Eine Weiterbildung verwaltet Kurse mit Raum und wöchentlichen Terminen.',
   glossary={'KursNr': 'Kursnummer', 'Termine': 'Wochentag und Uhrzeit'},
   cols=['KursNr', 'Titel', 'Raum', 'Termine'], pk=['KursNr'],
   rows=[['K1', 'Datenbanken', 'A1', 'Mo 10:00, Mi 14:00'], ['K2', 'Netzwerke', 'B2', 'Di 08:00'], ['K3', 'Statistik', 'A1', 'Do 12:00, Fr 10:00, Fr 14:00']],
   issues=[('Termine', 'mehrwertig', ', ')],
   fds=[fd('KursNr', 'Titel,Raum', 'partiell')])

# ------------------------------------------------------------------ 2NF
ex(id='lieferung-teile', area='2', title='Lieferungen von Teilen',
   scenario='Lieferanten liefern Teile in bestimmten Mengen.',
   glossary={'LiefNr': 'Lieferantennummer', 'TeilNr': 'Teilenummer', 'LiefName': 'Name des Lieferanten', 'TeilName': 'Bezeichnung des Teils'},
   cols=['LiefNr', 'TeilNr', 'Menge', 'LiefName', 'TeilName'], pk=['LiefNr', 'TeilNr'],
   rows=[['L1', 'T1', '100', 'Müller', 'Schraube'], ['L1', 'T2', '50', 'Müller', 'Mutter'], ['L2', 'T1', '70', 'Schmidt', 'Schraube'], ['L3', 'T3', '20', 'Kaya', 'Dübel'], ['L2', 'T3', '30', 'Schmidt', 'Dübel']],
   fds=[fd('LiefNr', 'LiefName', 'partiell'), fd('TeilNr', 'TeilName', 'partiell'), fd('LiefNr,TeilNr', 'Menge', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Lieferant(LiefNr*, LiefName)', 'Teil(TeilNr*, TeilName)', 'Liefert(LiefNr*>Lieferant, TeilNr*>Teil, Menge)'])],
   note='Name des Lieferanten und Bezeichnung des Teils werden mit ihren Teilschlüsseln ausgelagert. Liefert behält die Menge, die nur durch beide Schlüsselteile bestimmt ist.')
ex(id='pruefung-ergebnis', area='2', title='Prüfungsergebnisse',
   scenario='Studierende legen Prüfungen in Fächern ab und erhalten Noten.',
   glossary={'MatrNr': 'Matrikelnummer', 'FachNr': 'Fachnummer', 'StudName': 'Name der Studentin bzw. des Studenten', 'Credits': 'Leistungspunkte des Fachs'},
   cols=['MatrNr', 'FachNr', 'Note', 'StudName', 'FachName', 'Credits'], pk=['MatrNr', 'FachNr'],
   rows=[['1001', 'F1', '1,7', 'Berg', 'Datenbanken', '6'], ['1001', 'F2', '2,3', 'Berg', 'Netzwerke', '5'], ['1002', 'F1', '3,0', 'Roth', 'Datenbanken', '6'], ['1003', 'F2', '1,3', 'Voss', 'Netzwerke', '5'], ['1003', 'F1', '2,0', 'Voss', 'Datenbanken', '6']],
   fds=[fd('MatrNr', 'StudName', 'partiell'), fd('FachNr', 'FachName,Credits', 'partiell'), fd('MatrNr,FachNr', 'Note', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Student(MatrNr*, StudName)', 'Fach(FachNr*, FachName, Credits)', 'Prueft(MatrNr*>Student, FachNr*>Fach, Note)'])],
   note='Die Credits gehören zum Fach und nicht zur einzelnen Prüfung. Nur die Note hängt von Studierendem und Fach zugleich ab.')
ex(id='auftragsposition', area='2', title='Aufträge und Positionen',
   scenario='Aufträge enthalten Positionen mit Artikel, Menge und Rabatt.',
   glossary={'AuftrNr': 'Auftragsnummer', 'ArtNr': 'Artikelnummer', 'ArtBez': 'Artikelbezeichnung', 'ArtPreis': 'Listenpreis des Artikels'},
   cols=['AuftrNr', 'ArtNr', 'Menge', 'Rabatt', 'ArtBez', 'ArtPreis', 'Auftragsdatum'], pk=['AuftrNr', 'ArtNr'],
   rows=[['A1', 'P1', '10', '0', 'Stift', '1,20', '03.11.'], ['A1', 'P2', '2', '5', 'Block', '3,50', '03.11.'], ['A2', 'P1', '100', '10', 'Stift', '1,20', '04.11.'], ['A3', 'P2', '5', '0', 'Block', '3,50', '05.11.'], ['A3', 'P1', '20', '5', 'Stift', '1,20', '05.11.']],
   fds=[fd('AuftrNr', 'Auftragsdatum', 'partiell'), fd('ArtNr', 'ArtBez,ArtPreis', 'partiell'), fd('AuftrNr,ArtNr', 'Menge,Rabatt', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Auftrag(AuftrNr*, Auftragsdatum)', 'Artikel(ArtNr*, ArtBez, ArtPreis)', 'Position(AuftrNr*>Auftrag, ArtNr*>Artikel, Menge, Rabatt)'])],
   note='Achtung, Falle: Der Rabatt sieht artikelbezogen aus, unterscheidet sich aber je Auftrag (Stift: 0, 10 und 5 Prozent). Er hängt deshalb von Auftrag und Artikel zusammen ab und bleibt in der Position.')
ex(id='zimmerbelegung', area='2', title='Zimmerbelegung im Hotel',
   scenario='Ein Hotel speichert, wer an welchem Tag welches Zimmer belegt.',
   glossary={'ZimmerNr': 'Zimmernummer', 'Preis': 'Preis pro Nacht'},
   cols=['ZimmerNr', 'Datum', 'Gast', 'Zimmerart', 'Preis'], pk=['ZimmerNr', 'Datum'],
   rows=[['101', '03.11.', 'Berg', 'Einzel', '80'], ['101', '04.11.', 'Roth', 'Einzel', '80'], ['102', '03.11.', 'Voss', 'Doppel', '120'], ['102', '05.11.', 'Berg', 'Doppel', '120'], ['103', '03.11.', 'Kaya', 'Suite', '250']],
   fds=[fd('ZimmerNr', 'Zimmerart,Preis', 'partiell'), fd('ZimmerNr,Datum', 'Gast', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Zimmer(ZimmerNr*, Zimmerart, Preis)', 'Belegung(ZimmerNr*>Zimmer, Datum*, Gast)'])],
   note='Achtung, Falle: Datum gehört zum Schlüssel von Belegung, ist aber kein Fremdschlüssel, denn es gibt keine eigene Datumsrelation.')
ex(id='schulung-trap', area='2', title='Schulungsteilnahme',
   scenario='Beschäftigte nehmen an Schulungen teil und erhalten Zertifikate.',
   glossary={'PersNr': 'Personalnummer', 'KursNr': 'Schulungsnummer', 'ZertNr': 'Zertifikatsnummer'},
   cols=['PersNr', 'KursNr', 'Teilnahmedatum', 'Bestanden', 'ZertNr'], pk=['PersNr', 'KursNr'],
   rows=[['P1', 'K1', '03.11.', 'ja', 'Z100'], ['P1', 'K2', '10.11.', 'nein', 'Z101'], ['P2', 'K1', '03.11.', 'ja', 'Z102'], ['P3', 'K2', '10.11.', 'ja', 'Z103']],
   fds=[fd('PersNr,KursNr', 'Teilnahmedatum,Bestanden,ZertNr', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Teilnahme(PersNr*, KursNr*, Teilnahmedatum, Bestanden, ZertNr)'])],
   note='Achtung, Falle: Hier ist nichts auszulagern. Der Schlüssel ist zusammengesetzt, aber jedes Attribut hängt von beiden Teilen ab (jede Teilnahme hat ihr eigenes Datum, Ergebnis und Zertifikat). Die Relation ist bereits in 2NF.')
ex(id='produkt-trap', area='2', title='Produktkatalog',
   scenario='Ein Katalog führt Produkte mit Name, Preis und Kategorie.',
   glossary={'ProdNr': 'Produktnummer'},
   cols=['ProdNr', 'Name', 'Preis', 'Kategorie'], pk=['ProdNr'],
   rows=[['1', 'Stift', '1,20', 'Büro'], ['2', 'Block', '3,50', 'Büro'], ['3', 'Gießkanne', '12,00', 'Garten'], ['4', 'Spaten', '19,90', 'Garten']],
   fds=[fd('ProdNr', 'Name,Preis,Kategorie', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Produkt(ProdNr*, Name, Preis, Kategorie)'])],
   note='Achtung, Falle: Bei einem einfachen Primärschlüssel kann es keine partielle Abhängigkeit geben. Auch die Kategorie wiederholt sich zwar, hängt aber nicht von einem anderen Attribut ab, sondern direkt vom Produkt.')
ex(id='projekt-stunden', area='2', title='Stundenerfassung',
   scenario='Beschäftigte erfassen Stunden auf Projekten.',
   glossary={'PersNr': 'Personalnummer', 'ProjNr': 'Projektnummer', 'Stundensatz': 'Verrechnungssatz pro Stunde'},
   cols=['PersNr', 'ProjNr', 'Stunden', 'PersName', 'Stundensatz', 'ProjName'], pk=['PersNr', 'ProjNr'],
   rows=[['P1', 'J1', '40', 'Berg', '50', 'Web'], ['P1', 'J2', '20', 'Berg', '50', 'App'], ['P2', 'J1', '35', 'Roth', '60', 'Web'], ['P3', 'J2', '10', 'Voss', '55', 'App'], ['P2', 'J2', '25', 'Roth', '60', 'App']],
   fds=[fd('PersNr', 'PersName,Stundensatz', 'partiell'), fd('ProjNr', 'ProjName', 'partiell'), fd('PersNr,ProjNr', 'Stunden', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Person(PersNr*, PersName, Stundensatz)', 'Projekt(ProjNr*, ProjName)', 'Arbeitet(PersNr*>Person, ProjNr*>Projekt, Stunden)'])],
   note='Der Stundensatz gehört zur Person, nicht zur einzelnen Buchung. Nur die Stunden hängen von Person und Projekt zugleich ab.')

# ------------------------------------------------------------------ 3NF
ex(id='mitarbeiter-abteilung', area='3', title='Mitarbeitende und Abteilungen',
   scenario='Mitarbeitende gehören zu Abteilungen mit Leitung.',
   glossary={'PersNr': 'Personalnummer', 'AbtNr': 'Abteilungsnummer', 'AbtName': 'Name der Abteilung', 'AbtLeiter': 'Leitung der Abteilung'},
   cols=['PersNr', 'Name', 'AbtNr', 'AbtName', 'AbtLeiter'], pk=['PersNr'],
   rows=[['1', 'Berg', 'A1', 'Entwicklung', 'Lorenz'], ['2', 'Roth', 'A2', 'Vertrieb', 'Sommer'], ['3', 'Voss', 'A1', 'Entwicklung', 'Lorenz'], ['4', 'Kaya', 'A3', 'Einkauf', 'Meier'], ['5', 'Lang', 'A2', 'Vertrieb', 'Sommer']],
   fds=[fd('PersNr', 'Name,AbtNr', 'voll'), fd('AbtNr', 'AbtName,AbtLeiter', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Mitarbeiter(PersNr*, Name, AbtNr>Abteilung)', 'Abteilung(AbtNr*, AbtName, AbtLeiter)'])],
   note='Name und Leitung der Abteilung hängen von AbtNr ab und nur dadurch von PersNr. Sie werden mit AbtNr als Schlüssel ausgelagert.')
ex(id='kunde-plz', area='3', title='Kunden und Orte',
   scenario='Kundinnen und Kunden werden mit Postleitzahl und Ort gespeichert.',
   glossary={'KdNr': 'Kundennummer', 'PLZ': 'Postleitzahl'},
   cols=['KdNr', 'Name', 'PLZ', 'Ort'], pk=['KdNr'],
   rows=[['1', 'Berg', '51643', 'Gummersbach'], ['2', 'Roth', '50667', 'Köln'], ['3', 'Voss', '51643', 'Gummersbach'], ['4', 'Kaya', '53111', 'Bonn'], ['5', 'Lang', '50667', 'Köln']],
   fds=[fd('KdNr', 'Name,PLZ', 'voll'), fd('PLZ', 'Ort', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Kunde(KdNr*, Name, PLZ>Postleitzahl)', 'Postleitzahl(PLZ*, Ort)'])],
   note='Der Ort ist durch die Postleitzahl bestimmt und hängt damit nur indirekt von KdNr ab. Mit PLZ als Schlüssel wird er ausgelagert.')
ex(id='buch-verlag', area='3', title='Bücher und Verlage',
   scenario='Bücher erscheinen bei Verlagen.',
   glossary={'ISBN': 'Buchnummer', 'VerlagNr': 'Verlagsnummer', 'VerlagOrt': 'Sitz des Verlags'},
   cols=['ISBN', 'Titel', 'VerlagNr', 'VerlagName', 'VerlagOrt'], pk=['ISBN'],
   rows=[['978-1', 'Datenbanken', 'V1', 'Pearson', 'München'], ['978-2', 'Netzwerke', 'V2', 'Springer', 'Berlin'], ['978-3', 'Statistik', 'V1', 'Pearson', 'München'], ['978-4', 'Algorithmen', 'V3', 'Hanser', 'München'], ['978-5', 'Logik', 'V2', 'Springer', 'Berlin']],
   fds=[fd('ISBN', 'Titel,VerlagNr', 'voll'), fd('VerlagNr', 'VerlagName,VerlagOrt', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Buch(ISBN*, Titel, VerlagNr>Verlag)', 'Verlag(VerlagNr*, VerlagName, VerlagOrt)'])],
   note='Achtung, Falle: Mehrere Verlage haben denselben Sitz (München), trotzdem bestimmt der Ort nicht den Verlag. Maßgeblich ist VerlagNr.')
ex(id='student-studiengang', area='3', title='Studierende und Studiengänge',
   scenario='Studierende sind in Studiengängen eingeschrieben.',
   glossary={'MatrNr': 'Matrikelnummer', 'StgNr': 'Studiengangsnummer', 'StgName': 'Name des Studiengangs'},
   cols=['MatrNr', 'Name', 'StgNr', 'StgName', 'Fachbereich'], pk=['MatrNr'],
   rows=[['1001', 'Berg', 'S1', 'Informatik', 'FB10'], ['1002', 'Roth', 'S2', 'Wirtschaftsinformatik', 'FB10'], ['1003', 'Voss', 'S1', 'Informatik', 'FB10'], ['1004', 'Kaya', 'S3', 'Maschinenbau', 'FB11'], ['1005', 'Lang', 'S2', 'Wirtschaftsinformatik', 'FB10']],
   fds=[fd('MatrNr', 'Name,StgNr', 'voll'), fd('StgNr', 'StgName,Fachbereich', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Student(MatrNr*, Name, StgNr>Studiengang)', 'Studiengang(StgNr*, StgName, Fachbereich)'])],
   note='Studiengangsname und Fachbereich hängen von StgNr ab. Sie werden mit StgNr als Schlüssel ausgelagert.')
ex(id='fahrzeug-modell', area='3', title='Fahrzeuge und Modelle',
   scenario='Ein Fuhrpark verwaltet Fahrzeuge mit Modell und Hersteller.',
   glossary={'FzgNr': 'Fahrzeugnummer', 'ModellNr': 'Modellnummer'},
   cols=['FzgNr', 'Kennzeichen', 'ModellNr', 'ModellName', 'Hersteller'], pk=['FzgNr'],
   rows=[['1', 'GM-AB 12', 'M1', 'Golf', 'VW'], ['2', 'GM-CD 34', 'M2', 'Corsa', 'Opel'], ['3', 'K-EF 56', 'M1', 'Golf', 'VW'], ['4', 'GM-GH 78', 'M3', 'Polo', 'VW'], ['5', 'K-IJ 90', 'M2', 'Corsa', 'Opel']],
   fds=[fd('FzgNr', 'Kennzeichen,ModellNr', 'voll'), fd('ModellNr', 'ModellName,Hersteller', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Fahrzeug(FzgNr*, Kennzeichen, ModellNr>Modell)', 'Modell(ModellNr*, ModellName, Hersteller)'])],
   note='Modellname und Hersteller gehören zum Modell, nicht zum einzelnen Fahrzeug.')
ex(id='bestellung-trap', area='3', title='Bestellungen mit Lieferadresse',
   scenario='Kundinnen und Kunden bestellen und geben eine Lieferadresse an.',
   glossary={'BNr': 'Bestellnummer', 'KdNr': 'Kundennummer'},
   cols=['BNr', 'Datum', 'KdNr', 'Lieferadresse'], pk=['BNr'],
   rows=[['B1', '03.11.', 'K1', 'Hauptstr. 5, Köln'], ['B2', '04.11.', 'K1', 'Büro, Bonn'], ['B3', '04.11.', 'K2', 'Ring 7, Köln'], ['B4', '05.11.', 'K1', 'Hauptstr. 5, Köln']],
   fds=[fd('BNr', 'Datum,KdNr,Lieferadresse', 'voll')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Bestellung(BNr*, Datum, KdNr, Lieferadresse)'])],
   note='Achtung, Falle: Die Lieferadresse sieht kundenabhängig aus. Kunde K1 hat aber je Bestellung eine andere (Köln und Bonn), also hängt sie von der Bestellung ab und nicht von KdNr. Es gibt keine transitive Abhängigkeit, die Relation ist bereits in 3NF.')
ex(id='rechnung-zwei-ketten', area='3', title='Rechnungen mit Kunde und Zahlungsart',
   scenario='Rechnungen gehören zu Kunden und werden auf eine bestimmte Art bezahlt.',
   glossary={'ReNr': 'Rechnungsnummer', 'KdNr': 'Kundennummer', 'ZahlNr': 'Nummer der Zahlungsart'},
   cols=['ReNr', 'Datum', 'KdNr', 'KdName', 'ZahlNr', 'ZahlArt'], pk=['ReNr'],
   rows=[['R1', '03.11.', 'K1', 'Berg', 'Z1', 'Überweisung'], ['R2', '04.11.', 'K2', 'Roth', 'Z2', 'Lastschrift'], ['R3', '04.11.', 'K1', 'Berg', 'Z2', 'Lastschrift'], ['R4', '05.11.', 'K3', 'Voss', 'Z1', 'Überweisung'], ['R5', '06.11.', 'K2', 'Roth', 'Z3', 'Karte']],
   fds=[fd('ReNr', 'Datum,KdNr,ZahlNr', 'voll'), fd('KdNr', 'KdName', 'transitiv'), fd('ZahlNr', 'ZahlArt', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Rechnung(ReNr*, Datum, KdNr>Kunde, ZahlNr>Zahlungsart)', 'Kunde(KdNr*, KdName)', 'Zahlungsart(ZahlNr*, ZahlArt)'])],
   note='Achtung, Falle: Es gibt zwei getrennte transitive Abhängigkeiten (Kunde und Zahlungsart). Jede wird in eine eigene Relation ausgelagert.')

# ------------------------------------------------------------------ Mix
ex(id='bibliothek-ausleihe', area='M', title='Ausleihen in der Bibliothek',
   scenario='Leserinnen und Leser leihen Medien aus, die bei Verlagen erscheinen.',
   hint=HM,
   glossary={'MedNr': 'Mediennummer', 'LeserNr': 'Lesernummer', 'VerlagNr': 'Verlagsnummer'},
   cols=['MedNr', 'LeserNr', 'Titel', 'VerlagNr', 'VerlagName', 'Leser', 'Datum'], pk=['MedNr', 'LeserNr'],
   rows=[['M1', 'L1', 'Datenbanken', 'V1', 'Pearson', 'Anna Berg', '03.11.'], ['M2', 'L1', 'Netzwerke', 'V2', 'Springer', 'Anna Berg', '05.11.'], ['M1', 'L2', 'Datenbanken', 'V1', 'Pearson', 'Ben Roth', '06.11.'], ['M3', 'L3', 'Statistik', 'V2', 'Springer', 'Clara Voss', '07.11.'], ['M2', 'L2', 'Netzwerke', 'V2', 'Springer', 'Ben Roth', '08.11.']],
   issues=[('Leser', 'strukturiert', ['Vorname', 'Nachname'], r'^(\S+) (.+)$')],
   fds=[fd('LeserNr', 'Vorname,Nachname', 'partiell'), fd('MedNr', 'Titel,VerlagNr', 'partiell'), fd('VerlagNr', 'VerlagName', 'transitiv'), fd('MedNr,LeserNr', 'Datum', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Leser(LeserNr*, Vorname, Nachname)', 'Medium(MedNr*, Titel, VerlagNr, VerlagName)', 'Ausleihe(MedNr*>Medium, LeserNr*>Leser, Datum)']),
           ('Schritt 5: Tabellen der 3NF bilden', H3, ['Leser(LeserNr*, Vorname, Nachname)', 'Verlag(VerlagNr*, VerlagName)', 'Medium(MedNr*, Titel, VerlagNr>Verlag)', 'Ausleihe(MedNr*>Medium, LeserNr*>Leser, Datum)'])],
   note='Erst wird der Name aufgespalten (1NF), dann werden Leser und Medium ausgelagert (2NF) und zuletzt der Verlag (3NF).')
ex(id='personal-skills', area='M', title='Personal mit Kenntnissen',
   scenario='Eine Firma speichert Mitarbeitende mit Abteilung und Kenntnissen.',
   hint=HM,
   glossary={'PersNr': 'Personalnummer', 'AbtNr': 'Abteilungsnummer', 'Skills': 'Kenntnisse'},
   cols=['PersNr', 'Name', 'AbtNr', 'AbtName', 'Skills'], pk=['PersNr'],
   rows=[['1', 'Berg', 'A1', 'Entwicklung', 'Java, SQL'], ['2', 'Roth', 'A2', 'Vertrieb', 'Verhandeln'], ['3', 'Voss', 'A1', 'Entwicklung', 'SQL, Python, Java'], ['4', 'Kaya', 'A2', 'Vertrieb', 'Excel, SQL']],
   issues=[('Skills', 'mehrwertig', ', ')],
   fds=[fd('PersNr', 'Name,AbtNr', 'partiell'), fd('AbtNr', 'AbtName', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Person(PersNr*, Name, AbtNr, AbtName)', 'Beherrscht(PersNr*>Person, Skills*)']),
           ('Schritt 5: Tabellen der 3NF bilden', H3, ['Person(PersNr*, Name, AbtNr>Abteilung)', 'Abteilung(AbtNr*, AbtName)', 'Beherrscht(PersNr*>Person, Skills*)'])],
   note='Die mehrwertigen Kenntnisse werden zu eigenen Tupeln und Teil des Schlüssels. Dadurch werden Name und Abteilung partiell abhängig (2NF) und der Abteilungsname transitiv (3NF).')
ex(id='lieferung-preis', area='M', title='Lieferungen mit Preis',
   scenario='Lieferanten liefern Teile zu einem Preis pro Lieferung.',
   hint=HM,
   glossary={'LiefNr': 'Lieferantennummer', 'TeilNr': 'Teilenummer'},
   cols=['LiefNr', 'TeilNr', 'Menge', 'Preis', 'LiefName', 'TeilName'], pk=['LiefNr', 'TeilNr'],
   rows=[['L1', 'T1', '100', '3,50 €', 'Müller', 'Schraube'], ['L1', 'T2', '50', '1,20 €', 'Müller', 'Mutter'], ['L2', 'T1', '70', '3,80 €', 'Schmidt', 'Schraube'], ['L3', 'T3', '20', '0,90 $', 'Kaya', 'Dübel'], ['L2', 'T3', '30', '1,10 €', 'Schmidt', 'Dübel']],
   issues=[('Preis', 'strukturiert', ['Preis', 'Währung'], r'^(.*) (€|\$)$')],
   fds=[fd('LiefNr', 'LiefName', 'partiell'), fd('TeilNr', 'TeilName', 'partiell'), fd('LiefNr,TeilNr', 'Menge,Preis,Währung', 'voll')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Lieferant(LiefNr*, LiefName)', 'Teil(TeilNr*, TeilName)', 'Liefert(LiefNr*>Lieferant, TeilNr*>Teil, Menge, Preis, Währung)'])],
   note='Achtung, Falle: Nach der 2NF ist Schluss. Es gibt keine transitive Abhängigkeit, das Ergebnis ist damit auch in 3NF. Der Preis hängt von Lieferant und Teil zusammen ab (er unterscheidet sich je Lieferung) und bleibt in Liefert.')
ex(id='mitarbeiter-name-abt', area='M', title='Mitarbeitende mit Abteilung',
   scenario='Mitarbeitende werden mit Name und Abteilung gespeichert.',
   hint=HM,
   glossary={'PersNr': 'Personalnummer', 'AbtNr': 'Abteilungsnummer', 'AbtName': 'Name der Abteilung'},
   cols=['PersNr', 'Name', 'AbtNr', 'AbtName'], pk=['PersNr'],
   rows=[['1', 'Anna Berg', 'A1', 'Entwicklung'], ['2', 'Ben Roth', 'A2', 'Vertrieb'], ['3', 'Clara Voss', 'A1', 'Entwicklung'], ['4', 'Dilan Kaya', 'A3', 'Einkauf']],
   issues=[('Name', 'strukturiert', ['Vorname', 'Nachname'], r'^(\S+) (.+)$')],
   fds=[fd('PersNr', 'Vorname,Nachname,AbtNr', 'voll'), fd('AbtNr', 'AbtName', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Mitarbeiter(PersNr*, Vorname, Nachname, AbtNr>Abteilung)', 'Abteilung(AbtNr*, AbtName)'])],
   note='Achtung, Falle: Der Schlüssel ist einfach, also gibt es keine partiellen Abhängigkeiten und die 2NF ist von selbst erfüllt. Erst die transitive Abhängigkeit AbtNr → AbtName verlangt die Zerlegung zur 3NF.')
ex(id='kino-vorstellung', area='M', title='Kinovorstellungen',
   scenario='Ein Kino speichert Vorstellungen mit Saal und Genres des Films.',
   hint=HM,
   glossary={'VorstNr': 'Vorstellungsnummer', 'Plaetze': 'Sitzplätze des Saals', 'Genres': 'Genres des Films'},
   cols=['VorstNr', 'Film', 'Saal', 'Plaetze', 'Genres'], pk=['VorstNr'],
   rows=[['V1', 'Matrix', 'S1', '200', 'Action, SciFi'], ['V2', 'Shrek', 'S2', '120', 'Animation, Komödie'], ['V3', 'Matrix', 'S1', '200', 'Action, SciFi'], ['V4', 'Up', 'S2', '120', 'Animation']],
   issues=[('Genres', 'mehrwertig', ', ')],
   fds=[fd('VorstNr', 'Film,Saal', 'partiell'), fd('Saal', 'Plaetze', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Vorstellung(VorstNr*, Film, Saal, Plaetze)', 'Hat_Genre(VorstNr*>Vorstellung, Genres*)']),
           ('Schritt 5: Tabellen der 3NF bilden', H3, ['Vorstellung(VorstNr*, Film, Saal>Kinosaal)', 'Kinosaal(Saal*, Plaetze)', 'Hat_Genre(VorstNr*>Vorstellung, Genres*)'])],
   note='Achtung, Falle: Derselbe Film läuft in mehreren Vorstellungen (Matrix zweimal). Der Film hängt trotzdem von VorstNr ab. Die Plätze hängen vom Saal ab und werden in der 3NF ausgelagert.')
ex(id='kunde-trap-3nf', area='M', title='Kunden mit Wohnort',
   scenario='Kundinnen und Kunden werden mit Name und Wohnort gespeichert.',
   hint=HM,
   glossary={'KdNr': 'Kundennummer', 'Ort': 'Wohnort'},
   cols=['KdNr', 'Name', 'Ort'], pk=['KdNr'],
   rows=[['1', 'Anna Berg', 'Köln'], ['2', 'Ben Roth', 'Bonn'], ['3', 'Clara Voss', 'Köln'], ['4', 'Dilan Kaya', 'Gummersbach']],
   issues=[('Name', 'strukturiert', ['Vorname', 'Nachname'], r'^(\S+) (.+)$')],
   fds=[fd('KdNr', 'Vorname,Nachname,Ort', 'voll')],
   stages=[('Schritt 4: Tabellen der 3NF bilden', H3, ['Kunde(KdNr*, Vorname, Nachname, Ort)'])],
   note='Achtung, Falle: Nach dem Aufteilen des Namens ist die Relation bereits in 3NF. Dass sich der Ort wiederholt (Köln), ist keine Abhängigkeit von einem Nichtschlüsselattribut. Es gibt nichts weiter auszulagern.')
ex(id='rechnung-position', area='M', title='Rechnungspositionen',
   scenario='Rechnungen enthalten Positionen mit Artikeln und Mengen.',
   hint=HM,
   glossary={'ReNr': 'Rechnungsnummer', 'PosNr': 'Positionsnummer', 'KdNr': 'Kundennummer', 'ArtNr': 'Artikelnummer', 'ArtBez': 'Artikelbezeichnung'},
   cols=['ReNr', 'PosNr', 'KdNr', 'KdName', 'ArtNr', 'ArtBez', 'Menge'], pk=['ReNr', 'PosNr'],
   rows=[['R1', '1', 'K1', 'Berg', 'A1', 'Stift', '10 Stk'], ['R1', '2', 'K1', 'Berg', 'A2', 'Block', '2 Stk'], ['R2', '1', 'K2', 'Roth', 'A1', 'Stift', '50 Stk'], ['R3', '1', 'K1', 'Berg', 'A2', 'Block', '5 Stk'], ['R3', '2', 'K1', 'Berg', 'A1', 'Stift', '1 Stk']],
   issues=[('Menge', 'strukturiert', ['Menge', 'Einheit'], r'^(\d+) (\w+)$')],
   fds=[fd('ReNr', 'KdNr', 'partiell'), fd('KdNr', 'KdName', 'transitiv'), fd('ReNr,PosNr', 'ArtNr,Menge,Einheit', 'voll'), fd('ArtNr', 'ArtBez', 'transitiv')],
   stages=[('Schritt 4: Tabellen der 2NF bilden', H2, ['Rechnung(ReNr*, KdNr, KdName)', 'Position(ReNr*>Rechnung, PosNr*, ArtNr, ArtBez, Menge, Einheit)']),
           ('Schritt 5: Tabellen der 3NF bilden', H3, ['Rechnung(ReNr*, KdNr>Kunde)', 'Kunde(KdNr*, KdName)', 'Artikel(ArtNr*, ArtBez)', 'Position(ReNr*>Rechnung, PosNr*, ArtNr>Artikel, Menge, Einheit)'])],
   note='Eine Aufgabe mit allen Stufen: Menge wird aufgespalten (1NF), der Kunde hängt nur von ReNr ab (2NF), und Kunde und Artikel hängen jeweils über eine Nummer transitiv an der Position (3NF).')


def explode(spec):
    cols, pk, rows = list(spec['cols']), list(spec['pk']), [list(r) for r in spec['rows']]
    fixnotes = []
    for it in spec.get('issues', []):
        col, typ = it[0], it[1]
        i = cols.index(col)
        if typ == 'strukturiert':
            new, rx = it[2], re.compile(it[3])
            out = []
            for r in rows:
                m = rx.match(r[i])
                assert m, (spec['id'], r[i])
                out.append(r[:i] + list(m.groups()) + r[i + 1:])
            rows = out
            cols = cols[:i] + new + cols[i + 1:]
            fixnotes.append(f'{col} ist in {" und ".join(new)} aufgeteilt.')
        else:
            sep, out = it[2], []
            for r in rows:
                for v in r[i].split(sep):
                    out.append(r[:i] + [v] + r[i + 1:])
            rows = out
            pk = pk + [col]
            fixnotes.append(f'Jeder Wert aus {col} hat ein eigenes Tupel, {col} ist jetzt Teil des Primärschlüssels.')
    return cols, pk, rows, fixnotes


def build(spec):
    cols, pk, rows, fixnotes = explode(spec)
    issues = []
    for it in spec.get('issues', []):
        if it[1] == 'strukturiert':
            why = f'{it[0]} enthält mehrere Angaben in einem Feld ({", ".join(it[2])}). Ein strukturiertes Attribut wird in je ein Attribut pro Domäne aufgespalten.'
        else:
            why = f'{it[0]} enthält mehrere Werte in einem Feld. Ein mehrwertiges Attribut wird auf einzelne Tupel aufgeteilt und wird Teil des Primärschlüssels.'
        issues.append({'column': it[0], 'type': it[1], 'why': why})
    fds, seen = [], set()
    for l, r, kind, why in spec['fds']:
        for c in l + r:
            assert c in cols, (spec['id'], 'FD-Spalte', c)
        for c in r:
            assert c not in seen, (spec['id'], 'rhs doppelt', c)
            seen.add(c)
        # FD muss in den Daten gelten
        idx = lambda names: [cols.index(n) for n in names]
        m = {}
        for row in rows:
            k = tuple(row[i] for i in idx(l))
            v = tuple(row[i] for i in idx(r))
            assert m.setdefault(k, v) == v, (spec['id'], 'FD verletzt', l, r)
        if not why:
            lh, rh = ', '.join(l), ', '.join(r)
            why = {'partiell': f'{rh} hängt nur von {lh} ab, einem Teil des Schlüssels.',
                   'transitiv': f'{rh} hängt von {lh} ab, einem Nichtschlüsselattribut, und damit nur indirekt vom Schlüssel (transitiv).',
                   'voll': f'{rh} hängt vom gesamten Schlüssel ({lh}) ab.'}[kind]
        fds.append({'lhs': l, 'rhs': r, 'kind': kind, 'why': why})
    nonkey = [c for c in cols if c not in pk]
    assert set(nonkey) <= seen, (spec['id'], 'Attribute ohne FD', set(nonkey) - seen)
    kinds = {f['kind'] for f in fds}
    highest = 1 if 'partiell' in kinds else 2 if 'transitiv' in kinds else 3
    stages = [{'title': t, 'hint': h, 'relations': [rel(x) for x in rs]} for t, h, rs in spec['stages']] if 'stages' in spec else None
    if stages:
        for st in stages:
            for r in st['relations']:
                assert any(c.get('pk') for c in r['columns']), (spec['id'], r['name'])
                for c in r['columns']:
                    assert c['name'] in cols, (spec['id'], 'Stage-Spalte', c['name'])
            for c in cols:
                assert any(x['name'] == c for r in st['relations'] for x in r['columns']), (spec['id'], 'fehlt', c)
    last = stages[-1]['relations'] if stages else None
    target = []
    if last:
        for r in last:
            target.append(r['name'] + ' (' + ', '.join(c['name'] + (' <fk>' if c.get('fk') else '') for c in r['columns']) + ')')
    else:
        target.append('Relation in 1NF (' + ', '.join(cols) + ')')
    o = {'id': spec['id'], 'topicId': TOPIC[spec['area']], 'title': spec['title'], 'scenario': spec['scenario']}
    if spec.get('hint') or spec['area'] == '2':
        o['hint'] = spec.get('hint') or H1
    if spec.get('glossary'):
        o['glossary'] = spec['glossary']
    o['relation'] = {'columns': spec['cols'], 'pk': spec['pk'], 'rows': spec['rows']}
    one = {'ok': not issues, 'issues': issues}
    if issues:
        one['fixNote'] = ' '.join(fixnotes) + (' ' if False else '')
        one['fixed'] = {'columns': cols, 'pk': pk, 'rows': rows}
    elif spec.get('ok_note'):
        one['fixNote'] = spec['ok_note']
    o['oneNF'] = one
    o['fds'] = fds
    o['highestNF'] = highest
    if stages:
        o['stages'] = stages
    o['target'] = target
    if spec.get('note'):
        o['targetNote'] = spec['note']
    o['tags'] = TAGS[spec['area']]
    o['source'] = SRC
    return o


out = [build(s) for s in X]
ids = [o['id'] for o in out]
assert len(set(ids)) == len(ids)
from collections import Counter
print(Counter(s['area'] for s in X))
hdr = '// GENERIERT von scripts/content/nf_more.py, nicht von Hand bearbeiten.\n// Weitere Normalisierungsaufgaben: je Bereich (1NF, 2NF, 3NF, ganzheitlich) zusammen mit exercises.ts mindestens 8.\nimport type { NfExercise } from \'./types\';\n\nexport const moreNfExercises: NfExercise[] = '
open('src/content/exercisesMore.ts', 'w').write(hdr + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print('geschrieben:', len(out))
