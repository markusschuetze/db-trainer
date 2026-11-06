import { useEffect, useState } from 'react';
import type { SqlJsStatic } from 'sql.js';
import { loadSql } from './sql/loader';

/** Laedt SQLite (WebAssembly) einmalig. */
export function useSql() {
  const [SQL, setSQL] = useState<SqlJsStatic | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    loadSql().then(setSQL, (e) => setError(String(e)));
  }, []);
  return { SQL, error };
}
