// Optionale SCORM-Anbindung (1.2 und 2004). Laeuft der Trainer als SCORM-Paket in
// ILIAS/Moodle, meldet er Bearbeitung und das Ergebnis der Probeklausur an die
// Lernplattform. Ausserhalb einer Lernplattform passiert nichts.

type Api12 = {
  LMSInitialize(s: string): string;
  LMSSetValue(k: string, v: string): string;
  LMSGetValue(k: string): string;
  LMSCommit(s: string): string;
  LMSFinish(s: string): string;
};
type Api2004 = {
  Initialize(s: string): string;
  SetValue(k: string, v: string): string;
  GetValue(k: string): string;
  Commit(s: string): string;
  Terminate(s: string): string;
};

function findApi<T>(name: string): T | null {
  let w: Window | null = window;
  for (let i = 0; w && i < 10; i++) {
    try {
      const api = (w as unknown as Record<string, unknown>)[name];
      if (api) return api as T;
      if (w.parent === w) break;
      w = w.parent;
    } catch {
      break; // fremde Origin
    }
  }
  try {
    const op = window.opener as Record<string, unknown> | null;
    if (op?.[name]) return op[name] as T;
  } catch {
    /* ignorieren */
  }
  return null;
}

let api12: Api12 | null = null;
let api2004: Api2004 | null = null;

export function initScorm() {
  api2004 = findApi<Api2004>('API_1484_11');
  api12 = api2004 ? null : findApi<Api12>('API');
  try {
    if (api2004) {
      api2004.Initialize('');
      if (api2004.GetValue('cmi.completion_status') !== 'completed') api2004.SetValue('cmi.completion_status', 'incomplete');
      api2004.Commit('');
    } else if (api12) {
      api12.LMSInitialize('');
      const s = api12.LMSGetValue('cmi.core.lesson_status');
      if (s !== 'passed' && s !== 'completed') api12.LMSSetValue('cmi.core.lesson_status', 'incomplete');
      api12.LMSCommit('');
    }
    if (api12 || api2004) window.addEventListener('pagehide', finishScorm);
  } catch {
    api12 = api2004 = null;
  }
}

/** Ergebnis der Probeklausur melden (0–100 %). Bestanden ab 50 %. */
export function reportScore(percent: number) {
  const raw = String(Math.round(percent));
  const passed = percent >= 50;
  try {
    if (api2004) {
      api2004.SetValue('cmi.score.min', '0');
      api2004.SetValue('cmi.score.max', '100');
      api2004.SetValue('cmi.score.raw', raw);
      api2004.SetValue('cmi.score.scaled', String(Math.round(percent) / 100));
      api2004.SetValue('cmi.completion_status', 'completed');
      api2004.SetValue('cmi.success_status', passed ? 'passed' : 'failed');
      api2004.Commit('');
    } else if (api12) {
      api12.LMSSetValue('cmi.core.score.min', '0');
      api12.LMSSetValue('cmi.core.score.max', '100');
      api12.LMSSetValue('cmi.core.score.raw', raw);
      api12.LMSSetValue('cmi.core.lesson_status', passed ? 'passed' : 'failed');
      api12.LMSCommit('');
    }
  } catch {
    /* Lernplattform nicht erreichbar: ignorieren */
  }
}

export function scormActive() {
  return !!(api12 || api2004);
}

/** Maximale Laenge von suspend_data: SCORM 1.2 garantiert 4096 Zeichen, 2004 64000. */
export function suspendLimit() {
  return api2004 ? 64000 : 4096;
}

/** Gespeicherter Lernstand der angemeldeten Person (ILIAS/Moodle), sonst null. */
export function readSuspendData(): string | null {
  try {
    if (api2004) return api2004.GetValue('cmi.suspend_data') || null;
    if (api12) return api12.LMSGetValue('cmi.suspend_data') || null;
  } catch {
    /* ignorieren */
  }
  return null;
}

export function writeSuspendData(data: string) {
  try {
    if (api2004) {
      api2004.SetValue('cmi.suspend_data', data);
      api2004.Commit('');
    } else if (api12) {
      api12.LMSSetValue('cmi.suspend_data', data);
      api12.LMSCommit('');
    }
  } catch {
    /* ignorieren */
  }
}

function finishScorm() {
  try {
    api2004?.Terminate('');
    api12?.LMSFinish('');
  } catch {
    /* ignorieren */
  }
}
