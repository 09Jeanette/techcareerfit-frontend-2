import stairs from '../assets/stairs.png';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { ErrorBox, Loading, Num, Ring, Tile, useApi } from '../components/ui';
import { colorFor, fmtDate, initials, isClosed, isOverdue, daysFrom, statusChip, todayLong } from '../lib/format';
import { navigate } from '../lib/router';

export default function Home() {
  const { user } = useAuth();
  const reps = useApi('/reports');
  const apps = useApi('/applications');
  const road = useApi('/learning/roadmap');
  if (reps.loading || apps.loading || road.loading) return <Loading />;
  if (reps.error || apps.error) return <ErrorBox error={reps.error || apps.error} retry={() => { reps.reload(); apps.reload(); }} />;

  const reports = reps.data, applications = apps.data, items = road.data?.items || [];
  const r = reports[reports.length - 1];
  const first = user.name.split(' ')[0];
  const head = (
    <div className="head"><div><div className="sub">{todayLong()}</div><h1>Welcome back, {first}</h1></div>
      <div className="row hide-m"><button className="btn ghost" onClick={() => navigate('analyse')}><Icon n="Upload" s={16} />Upload CV</button><button className="btn" onClick={() => navigate('analyse')}><Icon n="Zap" s={16} />Run analysis</button></div></div>
  );
  if (!r) return (<>{head}
    <div className="card hero-card"><div className="blob b1" /><div className="blob b2" />
      <div style={{ position: 'relative', maxWidth: 520 }}><div style={{ fontSize: 13, opacity: 0.9 }}>Get started</div>
        <div style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 8px' }}>Analyse your first CV</div>
        <p style={{ opacity: 0.95, marginBottom: 16 }}>Upload your CV and paste a job ad. You will get a score, the skills you are missing and a plan to close the gap.</p>
        <button className="btn" style={{ background: '#fff', color: 'var(--o-deep)', boxShadow: 'none' }} onClick={() => navigate('analyse')}>Analyse my CV <Icon n="ArrowRight" s={15} /></button></div></div></>);

  const active = applications.filter((a) => !isClosed(a));
  const interviews = applications.filter((a) => a.status === 'Interview');
  const avg = Math.round(reports.reduce((s, x) => s + x.score, 0) / reports.length);
  const done = items.filter((i) => i.state === 'done').length;
  const nextRes = items.find((i) => i.state !== 'done');
  const gain = r.missing_skills.length ? Math.min(98, r.score + 13) : r.score;
  const steps = [];
  if (nextRes) steps.push(['PlayCircle', `Start "${nextRes.title}"`, `Roadmap · ${nextRes.skill}`, 'var(--o)', 'roadmap']);
  applications.filter(isOverdue).forEach((a) => steps.push(['Clock', `Follow up with ${a.company}`, `Overdue by ${-daysFrom(a.follow_up_on)} days`, 'var(--red)', 'app/' + a.id]));
  interviews.forEach((a) => steps.push(['Calendar', `Prepare for ${a.company} interview`, a.interview_on ? fmtDate(a.interview_on) : 'Date to be confirmed', 'var(--blue)', 'app/' + a.id]));
  steps.push(['Edit3', 'Write a reflection', 'Career journal', 'var(--violet)', 'journal']);
  if (!applications.length) steps.splice(1, 0, ['Briefcase', 'Track your first application', 'Applications', 'var(--green)', 'apply']);

  const pts = reports.slice(-5);
  const xs = (i) => 40 + i * (510 / Math.max(1, pts.length - 1));
  const ys = (v) => 170 - v * 1.6;
  const path = pts.map((p, i) => (i ? 'L' : 'M') + xs(i) + ' ' + ys(p.score)).join(' ');

  return (<>
    {head}
    <div className="grid g21" style={{ marginBottom: 18 }}>
      <div className="card hero-card"><div className="blob b1" /><div className="blob b2" />
        <div className="row" style={{ gap: 26, position: 'relative', alignItems: 'center', flexWrap: 'wrap' }}>
          <Ring pct={r.score / 100} size={132} stroke={13} big={r.score + '%'} small="ATS score" track="rgba(255,255,255,.28)" col="#fff" bc="#fff" sc="rgba(255,255,255,.85)" fs={32} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12.5, opacity: 0.9 }}>Latest analysis · {fmtDate(r.created_at)}</div>
            <div style={{ fontSize: 21, fontWeight: 700, margin: '2px 0 8px' }}>{r.job_title}</div>
            <div style={{ fontSize: 13, opacity: 0.95, maxWidth: 340 }}>{r.missing_skills.length
              ? <>You match {r.matched_skills.length} of {r.matched_skills.length + r.missing_skills.length} required skills. Adding <b>{r.missing_skills[0]}</b> could lift your score to about <b>{gain}%</b>.</>
              : 'You match every required skill. Time to apply.'}</div>
            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="btn" style={{ background: '#fff', color: 'var(--o-deep)', boxShadow: 'none' }} onClick={() => navigate('roadmap')}>Close the gap <Icon n="ArrowRight" s={15} /></button>
              <button className="btn hide-m" style={{ background: 'rgba(255,255,255,.18)', boxShadow: 'none' }} onClick={() => navigate('report/' + r.id)}>View report</button>
            </div>
          </div>
          <img src={stairs} alt="" className="hide-m" style={{ width: 118, borderRadius: 14, background: '#fff', padding: 6 }} />
        </div>
      </div>
      <div className="card"><div className="ch"><h2>Next steps</h2></div>
        <div className="list">{steps.slice(0, 4).map((k) => (
          <div key={k[1]} className="it click" onClick={() => navigate(k[4])}><Icon n={k[0]} s={20} c={k[3]} /><div className="t"><b>{k[1]}</b><span>{k[2]}</span></div><Icon n="ChevronRight" s={16} c="#B5AEA7" /></div>))}</div></div>
    </div>
    <div className="grid g4" style={{ marginBottom: 18 }}>
      {[['Briefcase', active.length, 'Active applications', 'var(--peach)', 'var(--o)', 'Open board', 'applications'],
        ['Calendar', interviews.length, 'Interviews', 'var(--blue-bg)', 'var(--blue)', interviews[0]?.interview_on ? fmtDate(interviews[0].interview_on) : 'Upcoming', 'applications'],
        ['Target', avg + '%', 'Average score', 'var(--green-bg)', 'var(--green)', reports.length + ' reports', 'report'],
        ['BookOpen', `${done}/${items.length}`, 'Roadmap done', 'var(--violet-bg)', 'var(--violet)', nextRes ? nextRes.skill + ' next' : 'All done', 'roadmap']].map((s) => (
        <div key={s[2]} className="card stat click" onClick={() => navigate(s[6])}>
          <div className="row" style={{ justifyContent: 'space-between' }}><div className="ic" style={{ background: s[3], color: s[4] }}><Icon n={s[0]} s={19} /></div><span className="trend up">{s[5]}</span></div>
          <div className="v"><Num v={String(s[1])} /></div><div className="l">{s[2]}</div></div>))}
    </div>
    <div className="grid g21">
      <div className="card"><div className="ch"><h2>Score trend</h2><span className="chip c-m">Last {pts.length} analyses</span></div>
        <svg viewBox="0 0 560 180" width="100%" height="180">
          <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FF5B1F" stopOpacity=".28" /><stop offset="1" stopColor="#FF5B1F" stopOpacity="0" /></linearGradient></defs>
          {[42, 74, 106, 138].map((y) => <line key={y} x1="30" x2="555" y1={y} y2={y} stroke="var(--track)" />)}
          {pts.length > 1 && <path d={`${path} L${xs(pts.length - 1)} 170 L40 170Z`} fill="url(#g)" className="fade" />}
          <path d={path} className="draw" fill="none" stroke="#FF5B1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={p.id} className="pt" onClick={() => navigate('report/' + p.id)}>
              <circle cx={xs(i)} cy={ys(p.score)} r={i === pts.length - 1 ? 7 : 5} fill="var(--card)" stroke="#FF5B1F" strokeWidth="3" />
              <text x={xs(i)} y={ys(p.score) - 14} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink2)">{p.score}%</text></g>))}
        </svg>
        <div className="row muted" style={{ justifyContent: 'space-between', fontSize: 11.5, padding: '0 6px 0 26px' }}>{pts.map((p) => <span key={p.id}>{fmtDate(p.created_at)}</span>)}</div></div>
      <div className="card"><div className="ch"><h2>Recent applications</h2><a className="link" onClick={() => navigate('applications')}>Open board</a></div>
        <div className="list">{applications.length ? applications.slice(-4).reverse().map((a) => (
          <div key={a.id} className="it click" onClick={() => navigate('app/' + a.id)}><Tile text={initials(a.company)} bg={colorFor(a.company)} /><div className="t"><b>{a.job_title}</b><span>{a.company}</span></div><span className={'chip ' + statusChip(a.status)}>{a.status}</span></div>))
          : <p className="sub">No applications yet. <a className="link" onClick={() => navigate('apply')}>Add one</a></p>}</div></div>
    </div>
  </>);
}
