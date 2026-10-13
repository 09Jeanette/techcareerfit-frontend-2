import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { ErrorBox, Loading, useApi } from '../components/ui';
import { navigate } from '../lib/router';

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function Market() {
  const roles = useApi('/market/roles');
  const [role, setRole] = useState(null);
  useEffect(() => { if (roles.data && !role) setRole(roles.data.roles[0]); }, [roles.data, role]);
  const ins = useApi(role ? '/market/insights?role=' + encodeURIComponent(role) : null);
  if (roles.loading || !role || ins.loading) return <Loading />;
  if (roles.error || ins.error) return <ErrorBox error={roles.error || ins.error} retry={ins.reload} />;
  const m = ins.data;
  const lx = (i) => 40 + i * 45, ly = (v) => 170 - v * 1.5;
  const analyse = () => {
    sessionStorage.setItem('tcf_role', role);
    sessionStorage.setItem('tcf_ad', `${role} wanted. Skills: ${m.skills.map((s) => s.skill).join(', ')}. You will work in a small team, solve real problems and keep learning.`);
    navigate('analyse');
  };
  return (<>
    <div className="head"><div><h1>Market insights</h1><div className="sub">What employers are asking for, compared with your profile.</div></div>
      <div className="selectwrap"><Icon n="Briefcase" s={17} c="var(--muted)" />
        <select aria-label="Target role" value={role} onChange={(e) => setRole(e.target.value)}>{roles.data.roles.map((r) => <option key={r}>{r}</option>)}</select>
        <Icon n="ChevronDown" s={16} c="var(--muted)" /></div></div>
    <div className="grid g4" style={{ marginBottom: 18 }}>
      {[['TrendingUp', m.demand, 'Demand', m.growth, 'var(--peach)', 'var(--o)'], ['DollarSign', m.salary, 'Monthly salary', 'Entry level', 'var(--green-bg)', 'var(--green)'],
        ['Globe', m.remote, 'Remote or hybrid', 'of postings', 'var(--blue-bg)', 'var(--blue)'], ['MapPin', m.region, 'Top region', 'most postings', 'var(--violet-bg)', 'var(--violet)']].map((s) => (
        <div key={s[2]} className="card stat"><div className="ic" style={{ background: s[4], color: s[5] }}><Icon n={s[0]} s={19} /></div>
          <div className="v" style={{ fontSize: 22 }}>{s[1]}</div><div className="l">{s[2]} · <span style={{ color: 'var(--green)', fontWeight: 600 }}>{s[3]}</span></div></div>))}</div>
    <div className="grid g21">
      <div className="card"><div className="ch"><h2>Job postings over time</h2><span className="chip c-o">Last 12 months</span></div>
        <svg viewBox="0 0 560 200" width="100%" height="200">
          {[40, 80, 120, 160].map((y) => <line key={y} x1="30" x2="555" y1={y} y2={y} stroke="var(--track)" />)}
          {m.series.map((v, i) => <rect key={i + role} className="gb" style={{ animationDelay: i * 0.05 + 's' }} x={lx(i) - 9} y={ly(v)} width="18" height={170 - ly(v)} rx="5" fill={i === 11 ? '#FF5B1F' : 'var(--peach2)'}><title>{v} (index)</title></rect>)}
          {MONTHS.map((x, i) => <text key={i} x={lx(i)} y="190" textAnchor="middle" fontSize="11" fill="var(--muted)">{x}</text>)}
        </svg></div>
      <div className="card"><div className="ch"><h2>Most requested skills</h2></div>
        {m.skills.map((k) => (
          <div key={k.skill} style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
              <span className="row" style={{ gap: 6, fontWeight: 600, textTransform: 'capitalize' }}><Icon n={k.have ? 'CheckCircle' : 'XCircle'} s={14} c={k.have ? 'var(--green)' : 'var(--red)'} />{k.skill}</span>
              <span className="muted">{k.share}%</span></div>
            <div className="bar"><i style={{ width: k.share + '%', background: k.have ? 'var(--o)' : 'var(--red)' }} /></div></div>))}
        <div className="sub" style={{ fontSize: 11.5, marginTop: 6 }}>Red: skills not on your CV or profile yet. Source: {m.source}.</div>
        <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={analyse}><Icon n="Zap" s={14} />Analyse my CV for this role</button></div>
    </div>
  </>);
}
