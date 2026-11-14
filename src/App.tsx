import { useEffect, useState, type ReactNode } from 'react';
import { config } from './config';
import { Layout } from './components/Layout';
import { AuthorPage } from './pages/AuthorPage';
import { DdlExercisePage } from './pages/DdlExercisePage';
import { DdlList } from './pages/DdlList';
import { ErPage } from './pages/ErPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { SharePage } from './pages/SharePage';
import { ExamPage } from './pages/ExamPage';
import { RelPage } from './pages/RelPage';
import { Home } from './pages/Home';
import { LearnPage } from './pages/LearnPage';
import { ProgressPage } from './pages/ProgressPage';
import { NfExercisePage } from './pages/NfExercisePage';
import { NfOverview, NfTrainerPage, NF_AREA_SLUG } from './pages/NfTrainerPage';
import { Playground } from './pages/Playground';
import { PraktikumPage } from './pages/PraktikumPage';
import { SqlExercisePage } from './pages/SqlExercisePage';
import { TeacherPage } from './pages/TeacherPage';
import { TextTaskList, TextTaskPage } from './pages/TextTaskPage';
import { SqlList } from './pages/SqlList';
import { RandomPage } from './pages/RandomPage';
import { DmlErrorPage } from './pages/DmlErrorPage';
import { DmlMixPage } from './pages/DmlMixPage';
import { DmlOverview } from './pages/DmlOverview';
import { ProvokePage } from './pages/ProvokePage';

// Hash-Routing: funktioniert statisch ueberall, auch in iFrame und ILIAS-Lernmodul.
function useRoute() {
  const [hash, setHash] = useState(location.hash || '#/');
  useEffect(() => {
    const on = () => {
      setHash(location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash.replace(/^#/, '').split('/').filter(Boolean);
}

function route(page?: string, id?: string, id2?: string): ReactNode {
  switch (page) {
    case 'normalisierung':
      if (!id) return <NfOverview />;
      return NF_AREA_SLUG[id] ? <NfTrainerPage key={id} initialArea={NF_AREA_SLUG[id]} /> : <NfExercisePage key={id} id={id} />;
    case 'ddl':
      return id ? <DdlExercisePage key={id} id={id} /> : <DdlList />;
    case 'sql':
      return id === 'spielwiese' ? <Playground /> : id ? <SqlExercisePage key={id} id={id} /> : <SqlList />;
    case 'modellierung':
      return <ErPage key={id ?? 'kard'} initialTab={id === 'spezialisierung' ? 'spez' : 'kard'} />;
    case 'relationen':
      return <RelPage />;
    case 'pruefung':
      return <ExamPage />;
    case 'dml':
      if (id === 'fehler') return <DmlErrorPage />;
      if (id === 'gemischt') return <DmlMixPage />;
      if (id === 'constraints') return <ProvokePage id={id2} key={id2 ?? 'start'} />;
      return <DmlOverview />;
    case 'zufall':
      return <RandomPage />;
    case 'textaufgaben':
      return id ? <TextTaskPage key={id} id={id} /> : <TextTaskList />;
    case 'praktikum':
      return <PraktikumPage key={id ?? 'liste'} id={id} />;
    case 'dozent':
      return <TeacherPage tab={id} />;
    case 'autor':
      return <AuthorPage />;
    case 'feedback':
      return <FeedbackPage />;
    case 'teilen':
      return <SharePage />;
    case 'fortschritt':
      return <ProgressPage />;
    case 'lernen':
      return <LearnPage key={id ?? 'alle'} topicId={id} />;
    default:
      return <Home />;
  }
}

const PAGE_TITLE: Record<string, string> = {
  normalisierung: 'Normalisierung',
  ddl: 'SQL-DDL',
  sql: 'SQL-DML: Daten ändern',
  dml: 'SQL-DML',
  modellierung: 'Modellierung',
  relationen: 'Relationenmodell',
  pruefung: 'Prüfungsmodus',
  fortschritt: 'Fortschritt',
  lernen: 'Wissensfragen lernen',
  praktikum: 'Praktikum',
  textaufgaben: 'Textaufgaben',
  dozent: 'Dozentenmodus',
  autor: 'Aufgabe hinzufügen',
  feedback: 'Feedback',
  teilen: 'QR-Code zum Teilen',
};

export function App() {
  const [page, id, id2] = useRoute();
  // Barrierefreiheit: Seitentitel je Seite (WCAG 2.4.2) und Fokus auf den Inhalt nach Seitenwechsel (2.4.3)
  useEffect(() => {
    const base = config.title || config.appName;
    document.title = page && PAGE_TITLE[page] ? `${PAGE_TITLE[page]} · ${base}` : base;
    const main = document.getElementById('main');
    const first = [...document.querySelectorAll<HTMLElement>('#main')][0];
    if (main && first) {
      main.setAttribute('tabindex', '-1');
      if (id !== undefined || page) main.focus({ preventScroll: true });
    }
  }, [page, id]);
  return <Layout>{route(page, id, id2)}</Layout>;
}
