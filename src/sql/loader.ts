import type { SqlJsStatic } from 'sql.js';

// SQLite als WebAssembly, eingebettet in eine JS-Datei (keine separate .wasm-Datei).
// Grund: Lernplattformen wie ILIAS filtern beim ZIP-Upload oft unbekannte Dateitypen
// wie .wasm heraus. Geladen wird erst, wenn eine SQL-Seite es braucht (eigener Chunk).
let promise: Promise<SqlJsStatic> | null = null;

export function loadSql(): Promise<SqlJsStatic> {
  promise ??= import('sql.js/dist/sql-wasm-inline.js').then((m) => {
    const init = (m.default ?? m) as unknown as (cfg?: object) => Promise<SqlJsStatic>;
    return init();
  });
  return promise;
}
