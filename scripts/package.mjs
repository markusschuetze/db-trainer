// Erzeugt aus dist/ zwei Pakete in release/:
//   db-trainer-html.zip    -> ILIAS "HTML-Lernmodul", Moodle "Datei/Ordner", jeder Webserver
//   db-trainer-scorm12.zip -> SCORM 1.2 (ILIAS/Moodle), speichert Fortschritt am Login und
//                             meldet das Ergebnis der Probeklausur
//
// Optional mit Branding-Ordner (enthaelt config.json und brand/ mit Logo usw.):
//   npm run package -- ../branding-meine-hochschule
// Benoetigt das Kommandozeilenprogramm "zip".
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'release');
const stage = join(out, '.stage');
const branding = process.argv[2] ? resolve(process.argv[2]) : null;

rmSync(out, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(dist, stage, { recursive: true });

if (branding) {
  if (!existsSync(branding)) throw new Error(`Branding-Ordner nicht gefunden: ${branding}`);
  if (existsSync(join(branding, 'config.json'))) cpSync(join(branding, 'config.json'), join(stage, 'config.json'));
  if (existsSync(join(branding, 'brand'))) cpSync(join(branding, 'brand'), join(stage, 'brand'), { recursive: true });
  console.log(`Branding übernommen aus ${branding}`);
}

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(stage, p));
  }
})(stage);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="db-trainer" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>DB-Trainer</title>
      <item identifier="item1" identifierref="res1"><title>DB-Trainer</title></item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${files.map((f) => `      <file href="${esc(f)}"/>`).join('\n')}
    </resource>
  </resources>
</manifest>
`;

execFileSync('zip', ['-qr', join(out, 'db-trainer-html.zip'), '.'], { cwd: stage });
writeFileSync(join(stage, 'imsmanifest.xml'), manifest);
execFileSync('zip', ['-qr', join(out, 'db-trainer-scorm12.zip'), '.'], { cwd: stage });
rmSync(stage, { recursive: true, force: true });
console.log(`release/db-trainer-html.zip und release/db-trainer-scorm12.zip erstellt (${files.length} Dateien).`);
