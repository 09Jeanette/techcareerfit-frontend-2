import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { get } from '../lib/api';
import { fmtDate, initials } from '../lib/format';
import { navigate } from '../lib/router';
import Icon from './Icon';
import { Modal, Popover, useToast } from './ui';

const CAND = [['Home', 'Home', 'home'], ['FileText', 'My CV', 'analyse'], ['BarChart2', 'ATS Reports', 'report'], ['BookOpen', 'Learning Roadmap', 'roadmap'],
  ['Briefcase', 'Applications', 'applications'], ['TrendingUp', 'Market Insights', 'market'], ['Edit3', 'Career Journal', 'journal'], ['User', 'Profile', 'profile']];
const ADM = [['Grid', 'Overview', 'admin'], ['Users', 'Users', 'admin-users'], ['BookOpen', 'Resources', 'admin-resources'], ['BarChart2', 'Reports', 'admin-reports']];
const NOTE_ICON = { overdue: ['Clock', 't-r'], interview: ['Calendar', 't-o'], report: ['CheckCircle', 't-g'] };
const READ_KEY = 'tcf_read_notes';
const readSet = () => { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); } };

export default function AppShell({ route, admin, children }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [read, setRead] = useState(readSet);
  const [pop, setPop] = useState(null);
  const [more, setMore] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(null);

  useEffect(() => { get('/notifications').then(setNotes).catch(() => {}); }, [route]);
  useEffect(() => { document.body.classList.toggle('no-tabbar', route === 'apply'); setPop(null); setMore(false); }, [route]);

  const saveRead = (s) => { setRead(new Set(s)); try { localStorage.setItem(READ_KEY, JSON.stringify([...s])); } catch { /* ignore */ } };
  const unread = notes.filter((n) => !read.has(n.id)).length;
  const go = (to) => { setPop(null); setMore(false); navigate(to); };
  const doLogout = () => { logout(); navigate('landing'); toast('You have been logged out', 'LogOut', '#FFB48F'); };

  const loadIndex = () => {
    if (index) return;
    Promise.all([get('/applications'), get('/reports')]).then(([apps, reps]) => setIndex({ apps, reps })).catch(() => {});
  };
  const results = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v || !index) return [];
    const out = [];
    index.apps.forEach((a) => (a.job_title + ' ' + a.company).toLowerCase().includes(v) && out.push(['Briefcase', a.job_title, a.company, 'app/' + a.id]));
    index.reps.forEach((r) => (r.job_title + ' ' + r.missing_skills.join(' ') + ' ' + r.matched_skills.join(' ')).toLowerCase().includes(v) && out.push(['BarChart2', r.job_title, r.score + '% report', 'report/' + r.id]));
    return out.slice(0, 7);
  }, [q, index]);

  const nav = admin ? ADM : CAND;
  const navKey = { apply: 'applications', app: 'applications' }[route] || route;
  const tabKey = { home: 'home', report: 'report', applications: 'applications', apply: 'applications', app: 'applications', analyse: 'analyse' }[route] || 'more';

  return (
    <div className="app">
      <aside className="side">
        <div className="brand" onClick={() => go(admin ? 'admin' : 'home')} style={{ cursor: 'pointer' }}>
          <span className="mark">{admin ? <Icon n="Shield" c="#fff" /> : 'tc'}</span><span>TechCareer<b>Fit</b></span>
        </div>
        <nav className="nav">
          {nav.map(([ic, label, key]) => <a key={key} className={key === navKey ? 'on' : ''} onClick={() => go(key)}><Icon n={ic} />{label}</a>)}
        </nav>
        <div className="upsell">
          {admin
            ? <><b>Admin workspace</b>Manage users and the learning library.<div style={{ marginTop: 10 }}><a className="link" onClick={() => go('home')}>Back to candidate view</a></div></>
            : <><b>Keep improving</b>Re-analyse after each CV change to see your score move.<div style={{ marginTop: 10 }}><a className="link" onClick={() => go('analyse')}>Analyse a CV</a></div></>}
        </div>
        <a onClick={doLogout} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', color: '#BDB8B2', fontSize: 14, cursor: 'pointer' }}><Icon n="LogOut" />Log out</a>
      </aside>

      <main className="main">
        <section className="screen">
          <div className="top">
            <div className="mtop" style={{ alignItems: 'center', gap: 10 }}>
              <span className="brand" onClick={() => go('home')} style={{ margin: 0, color: 'var(--ink)', fontSize: 16 }}><span className="mark" style={{ width: 30, height: 30, fontSize: 13 }}>tc</span></span>
            </div>
            <div className="search" style={{ position: 'relative' }}>
              <Icon n="Search" s={17} />
              <input placeholder="Search applications, skills or reports" value={q} onFocus={loadIndex}
                onChange={(e) => { setQ(e.target.value); setPop(e.target.value ? 'search' : null); }} />
              <Popover open={pop === 'search'} onClose={() => setPop(null)} width={420} align="left">
                <div className="pop-h">Results for “{q}”</div>
                {results.length ? results.map((r) => (
                  <div key={r[3]} className="pop-it" onClick={() => { setQ(''); go(r[3]); }}><Icon n={r[0]} s={17} c="var(--o)" /><div><b>{r[1]}</b><span>{r[2]}</span></div></div>
                )) : <div className="pop-empty">{index ? 'No matches.' : 'Searching…'}</div>}
              </Popover>
            </div>
            <div className="sp" />
            <div style={{ position: 'relative' }}>
              <button className="iconbtn" data-pop-anchor onClick={() => setPop(pop === 'bell' ? null : 'bell')} aria-label="Notifications">
                <Icon n="Bell" s={19} />{unread > 0 && <span className="badge">{unread}</span>}
              </button>
              <Popover open={pop === 'bell'} onClose={() => setPop(null)} width={360}>
                <div className="pop-h row" style={{ justifyContent: 'space-between' }}><b>Notifications</b>
                  {notes.length > 0 && <a className="link" onClick={() => saveRead(new Set([...read, ...notes.map((n) => n.id)]))}>Mark all as read</a>}</div>
                {notes.length ? notes.map((n) => (
                  <div key={n.id} className={'pop-it' + (read.has(n.id) ? '' : ' unread')} onClick={() => { saveRead(new Set([...read, n.id])); go(n.link); }}>
                    <span className={'nic ' + NOTE_ICON[n.kind][1]}><Icon n={NOTE_ICON[n.kind][0]} s={16} /></span><div><b>{n.title}</b><span>{n.body} · {fmtDate(n.date)}</span></div>
                  </div>
                )) : <div className="pop-empty">You're all caught up.</div>}
              </Popover>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="me" data-pop-anchor onClick={() => setPop(pop === 'menu' ? null : 'menu')}>
                <div className="av">{initials(user.name)}</div><span><b>{user.name}</b><small>{user.role === 'admin' ? 'Administrator' : 'Job seeker'}</small></span><Icon n="ChevronDown" s={15} c="var(--muted)" />
              </button>
              <Popover open={pop === 'menu'} onClose={() => setPop(null)} width={240}>
                <div className="pop-it" onClick={() => go('profile')}><Icon n="User" s={17} c="var(--o)" /><div><b>Profile and settings</b></div></div>
                {user.role === 'admin' && <div className="pop-it" onClick={() => go(admin ? 'home' : 'admin')}><Icon n="Shield" s={17} c="var(--o)" /><div><b>{admin ? 'Candidate view' : 'Admin workspace'}</b></div></div>}
                <div className="pop-it" onClick={doLogout}><Icon n="LogOut" s={17} c="var(--red)" /><div><b>Log out</b></div></div>
              </Popover>
            </div>
          </div>
          {children}
        </section>
      </main>

      <nav className="tabbar">
        {[['home', 'Home', 'Home'], ['report', 'BarChart2', 'Reports']].map(([k, ic, l]) => <a key={k} className={tabKey === k ? 'on' : ''} onClick={() => go(k)}><Icon n={ic} s={21} />{l}</a>)}
        <a className={tabKey === 'analyse' ? 'on' : ''} onClick={() => go('analyse')}><span className="fab"><Icon n="Plus" s={24} c="#fff" w={2.5} /></span>Analyse</a>
        <a className={tabKey === 'applications' ? 'on' : ''} onClick={() => go('applications')}><Icon n="Briefcase" s={21} />Jobs</a>
        <a className={tabKey === 'more' ? 'on' : ''} onClick={() => setMore(true)}><Icon n="Grid" s={21} />More</a>
      </nav>

      <Modal open={more} onClose={() => setMore(false)}>
        <h2 style={{ marginBottom: 12 }}>More</h2>
        <div className="list">
          {[['BookOpen', 'Learning roadmap', 'roadmap'], ['TrendingUp', 'Market insights', 'market'], ['Edit3', 'Career journal', 'journal'], ['User', 'Profile and settings', 'profile'],
            ...(user.role === 'admin' ? [['Shield', 'Admin workspace', 'admin']] : [])].map(([ic, l, k]) => (
            <div key={k} className="it click" onClick={() => go(k)}><Icon n={ic} s={19} c="var(--o)" /><div className="t"><b>{l}</b></div><Icon n="ChevronRight" s={16} c="#B5AEA7" /></div>
          ))}
          <div className="it click" onClick={doLogout}><Icon n="LogOut" s={19} c="var(--red)" /><div className="t"><b style={{ color: 'var(--red)' }}>Log out</b></div></div>
        </div>
      </Modal>
    </div>
  );
}
