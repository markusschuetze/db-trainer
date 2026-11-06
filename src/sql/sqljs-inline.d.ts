declare module 'sql.js/dist/sql-wasm-inline.js' {
  import type { SqlJsStatic } from 'sql.js';
  const init: (config?: object) => Promise<SqlJsStatic>;
  export default init;
}
