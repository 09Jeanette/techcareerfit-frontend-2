import { useEffect } from 'react';
import { useAuth } from './auth';
import { Loading } from './components/ui';
import AppShell from './components/AppShell';
import { navigate, useRoute } from './lib/router';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import Analyse from './pages/Analyse';
import Report from './pages/Report';
import Roadmap from './pages/Roadmap';
import Applications from './pages/Applications';
import ApplyForm from './pages/ApplyForm';
import ApplicationDetail from './pages/ApplicationDetail';
import Market from './pages/Market';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import { AdminOverview, AdminReports, AdminResources, AdminUsers } from './pages/Admin';

const PUBLIC = ['landing', 'login', 'register', 'forgot', 'sent'];
const PAGES = {
  home: Home, analyse: Analyse, report: Report, roadmap: Roadmap, applications: Applications, apply: ApplyForm,
  app: ApplicationDetail, market: Market, journal: Journal, profile: Profile,
  admin: AdminOverview, 'admin-users': AdminUsers, 'admin-resources': AdminResources, 'admin-reports': AdminReports,
};

export default function App() {
  const { user, ready } = useAuth();
  const { name, param } = useRoute();
  const isPublic = PUBLIC.includes(name) || !PAGES[name];
  const needsLogin = !isPublic && ready && !user;
  const notAdmin = name.startsWith('admin') && user && user.role !== 'admin';

  useEffect(() => {
    if (needsLogin) navigate('login');
    else if (notAdmin) navigate('home');
    else if (ready && user && ['login', 'register'].includes(name)) navigate('home');
  }, [needsLogin, notAdmin, ready, user, name]);

  if (!ready) return <Loading text="Starting TechCareerFit…" />;
  if (name === 'landing' || (isPublic && !PUBLIC.includes(name))) return <Landing />;
  if (isPublic) return <AuthPage view={name} />;
  if (!user || notAdmin) return <Loading />;
  const Page = PAGES[name];
  return <AppShell route={name} admin={name.startsWith('admin')}><Page key={name + (param || '')} param={param} /></AppShell>;
}
