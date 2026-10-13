import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { ErrorBox, Loading, useApi } from '../components/ui';
import { navigate } from '../lib/router';

const money = (v) => '$' + Math.round(v / 1000) + 'k';
const LEVEL_LABEL = { Entry: 'Entry (0-2 yrs)', Mid: 'Mid (3-5 yrs)', Senior: 'Senior (6-9 yrs)', Lead: 'Lead (10+ yrs)' };

export default function Market() {
  const roles = useApi('/market/roles');
  const [role, setRole] = useState('All AI roles');
  const [level, setLevel] = useState('Entry');
  const ins = useApi(`/market/insights?role=${encodeURIComponent(role)}&level=${level}`);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  if (roles.loading || ins.loading) return <Loading />;
  if (roles.error || ins.error) return <ErrorBox error={roles.error || ins.error} retry={() => { roles.reload(); ins.reload(); }} />;
  const m = ins.data;
  const max = Math.max(1, ...m.series.map((p) => p.count));
  const W = 560, bw = Math.min(26, (W - 60) / m.series.length - 8), step = (W - 60) / m.series.length;
  const analyse = () => {
    sessionStorage.setItem('tcf_role', role === 'All AI roles' ? 'AI Engineer' : role);
    sessionStorage.setItem('tcf_ad', `${role} wanted. Required skills: ${m.skills.map((s) => s.skill).join(', ')}. You will work in a small team, solve real problems and keep learning.`);
    navigate('analyse');
  };
  return (<>
    <div className="head"><div><h1>Market insights</h1><div className="sub">What employers ask for in AI roles, compared with your profile.</div></div>
      <div className="selectwrap"><Icon n="Briefcase" s={17} c="var(--muted)" />
        <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.data.roles.map((r) => <option key={r.role} value={r.role}>{r.role} ({r.postings})</option>)}</select>
        <Icon n="ChevronDown" s={16} c="var(--muted)" /></div></div>

    <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div className="seg" style={{ minWidth: 300 }}>{m.levels.map((l) => <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>{l}</button>)}</div>
      <span className="sub" style={{ fontSize: 12.5 }}>Experience level used for the salary figures</span></div>

    <div className="grid g4" style={{ marginBottom: 18 }}>
      <div className="card stat"><div className="ic" style={{ background: 'var(--peach)', color: 'var(--o)' }}><Icon n="TrendingUp" s={19} /></div>
        <div className="v" style={{ fontSize: 22 }}>{m.demand}</div><div className="l">Demand score {m.demand_score}/100 · <span style={{ color: 'var(--green)', fontWeight: 600 }}>{m.growth}</span></div></div>
      <div className="card stat"><div className="ic" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><Icon n="DollarSign" s={19} /></div>
        <div className="v" style={{ fontSize: 22 }}>{money(m.salary.median)}<span className="sub" style={{ fontSize: 13, fontWeight: 500 }}> /year</span></div>
        <div className="l">Median, {m.salary.level === 'All levels' ? 'all levels' : LEVEL_LABEL[m.salary.level].toLowerCase()} · {money(m.salary.p25)}-{money(m.salary.p75)} (USD)</div></div>
      <div className="card stat"><div className="ic" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><Icon n="Globe" s={19} /></div>
        <div className="v" style={{ fontSize: 22 }}>{m.remote_share}%</div><div className="l">Remote or hybrid · {m.remote_split['Fully Remote'] || 0}% fully remote</div></div>
      <div className="card stat"><div className="ic" style={{ background: 'var(--violet-bg)', color: 'var(--violet)' }}><Icon n="MapPin" s={19} /></div>
        <div className="v" style={{ fontSize: 22 }}>{m.top_countries[0][0]}</div><div className="l">Top country · {m.top_countries.map(([c, p]) => `${c} ${p}%`).join(', ')}</div></div>
    </div>

    <div className="grid g21">
      <div className="card"><div className="ch"><h2>Postings per month</h2><span className="chip c-o">{m.postings} postings</span></div>
        <svg viewBox={`0 0 ${W} 210`} width="100%" height="210">
          {[40, 80, 120, 160].map((y) => <line key={y} x1="30" x2={W - 5} y1={y} y2={y} stroke="var(--track)" />)}
          {m.series.map((p, i) => {
            const h = (p.count / max) * 140, x = 40 + i * step;
            return (<g key={p.label + role}>
              <rect className="gb" style={{ animationDelay: i * 0.04 + 's' }} x={x} y={170 - h} width={bw} height={h} rx="5" fill={i === m.series.length - 1 ? '#FF5B1F' : 'var(--peach2)'}><title>{p.label}: {p.count} postings</title></rect>
              {i % 2 === 0 && <text x={x + bw / 2} y="190" textAnchor="middle" fontSize="10" fill="var(--muted)">{p.label}</text>}</g>);
          })}</svg>
        <p className="sub" style={{ fontSize: 12 }}>{m.series[0].label} to {m.series[m.series.length - 1].label}. Hover a bar for the exact count.</p></div>
      <div className="card"><div className="ch"><h2>Most requested skills</h2></div>
        {m.skills.map((k) => (
          <div key={k.skill} style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
              <span className="row" style={{ gap: 6, fontWeight: 600 }}><Icon n={k.have ? 'CheckCircle' : 'XCircle'} s={14} c={k.have ? 'var(--green)' : 'var(--red)'} />{k.skill}</span>
              <span className="muted">{k.share}% of postings</span></div>
            <div className="bar"><i style={{ width: k.share + '%', background: k.have ? 'var(--o)' : 'var(--red)' }} /></div></div>))}
        <div className="sub" style={{ fontSize: 11.5, marginTop: 6 }}>Red: not on your CVs or profile yet.</div>
        <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={analyse}><Icon n="Zap" s={14} />Analyse my CV for this role</button></div>
    </div>
    <div className="card row" style={{ marginTop: 18, gap: 12, background: 'var(--soft)', boxShadow: 'none' }}>
      <Icon n="Globe" s={20} c="var(--blue)" /><div style={{ fontSize: 12.5 }}><b>Source: {m.source}.</b> {m.note}</div></div>
  </>);
}
