// Erzeugt aus dist/ zwei Pakete in release/:
//   db-trainer-html.zip    -> ILIAS "HTML-Lernmodul", Moodle "Datei/Ordner", jeder Webserver
//   db-trainer-scorm12.zip -> SCORM 1.2 (ILIAS/Moodle), meldet das Ergebnis der Probeklausur
// Benoetigt das Kommandozeilenprogramm "zip".
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const out = join(root, 'release');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(dist, p));
  }
})(dist);

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

execFileSync('zip', ['-qr', join(out, 'db-trainer-html.zip'), '.'], { cwd: dist });
writeFileSync(join(dist, 'imsmanifest.xml'), manifest);
execFileSync('zip', ['-qr', join(out, 'db-trainer-scorm12.zip'), '.'], { cwd: dist });
rmSync(join(dist, 'imsmanifest.xml'));
console.log(`release/db-trainer-html.zip und release/db-trainer-scorm12.zip erstellt (${files.length} Dateien).`);
