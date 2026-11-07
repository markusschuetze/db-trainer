import { useEffect, useState, type ReactNode } from 'react';
import { Layout } from './components/Layout';
import { AuthorPage } from './pages/AuthorPage';
import { DdlExercisePage } from './pages/DdlExercisePage';
import { DdlList } from './pages/DdlList';
import { ErPage } from './pages/ErPage';
import { ExamPage } from './pages/ExamPage';
import { RelPage } from './pages/RelPage';
import { Home } from './pages/Home';
import { LearnPage } from './pages/LearnPage';
import { ProgressPage } from './pages/ProgressPage';
import { NfExercisePage } from './pages/NfExercisePage';
import { NfList } from './pages/NfList';
import { Playground } from './pages/Playground';
import { PraktikumPage } from './pages/PraktikumPage';
import { SqlExercisePage } from './pages/SqlExercisePage';
import { TeacherPage } from './pages/TeacherPage';
import { TextTaskList, TextTaskPage } from './pages/TextTaskPage';
import { SqlList } from './pages/SqlList';

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

function route(page?: string, id?: string): ReactNode {
  switch (page) {
    case 'normalisierung':
      return id ? <NfExercisePage key={id} id={id} /> : <NfList />;
    case 'ddl':
      return id ? <DdlExercisePage key={id} id={id} /> : <DdlList />;
    case 'sql':
      return id === 'spielwiese' ? <Playground /> : id ? <SqlExercisePage key={id} id={id} /> : <SqlList />;
    case 'modellierung':
      return <ErPage />;
    case 'relationen':
      return <RelPage />;
    case 'pruefung':
      return <ExamPage />;
    case 'textaufgaben':
      return id ? <TextTaskPage key={id} id={id} /> : <TextTaskList />;
    case 'praktikum':
      return <PraktikumPage key={id ?? 'liste'} id={id} />;
    case 'dozent':
      return <TeacherPage tab={id} />;
    case 'autor':
      return <AuthorPage />;
    case 'fortschritt':
      return <ProgressPage />;
    case 'lernen':
      return <LearnPage key={id ?? 'alle'} topicId={id} />;
    default:
      return <Home />;
  }
}

export function App() {
  const [page, id] = useRoute();
  return <Layout>{route(page, id)}</Layout>;
}
