import { useState } from 'react';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { ErrorBox, Loading, Ring, toastError, useApi, useToast } from '../components/ui';
import { get } from '../lib/api';
import { downloadBlob, fmtDate, matchLabel } from '../lib/format';
import { buildReportPdf } from '../lib/pdf';
import { navigate } from '../lib/router';

export default function Report({ param }) {
  const { user } = useAuth();
  const toast = useToast();
  const reps = useApi('/reports');
  const cvs = useApi('/cvs');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  if (reps.loading) return <Loading />;
  if (reps.error) return <ErrorBox error={reps.error} retry={reps.reload} />;
  const list = reps.data;
  if (!list.length) return (
    <div className="card" style={{ textAlign: 'center', padding: 50 }}><div className="mic" style={{ background: 'var(--peach)' }}><Icon n="BarChart2" s={26} c="var(--o)" /></div>
      <h2>No reports yet</h2><p className="sub" style={{ margin: '6px 0 16px' }}>Analyse your CV against a job ad to get your first report.</p>
      <button className="btn" onClick={() => navigate('analyse')}><Icon n="Zap" s={16} />Analyse a CV</button></div>);
  const r = list.find((x) => x.id === param) || list[list.length - 1];
  const cvName = cvs.data?.find((c) => c.id === r.cv_id)?.filename || 'CV';
  const [label, color] = matchLabel(r.score);
  const gain = r.missing_skills.length ? Math.min(98, r.score + 13) : r.score;
  const d = r.details || {};

  const pdf = async () => {
    setBusy(true);
    try {
      const road = await get('/learning/roadmap?report_id=' + r.id);
      const blob = buildReportPdf({ report: r, user, cvName, items: road.items, history: list });
      downloadBlob(`TechCareerFit_${r.job_title.replace(/\W+/g, '_')}_report.pdf`, blob, 'application/pdf');
      toast('PDF report downloaded');
    } catch (e) { toastError(toast, e); } finally { setBusy(false); }
  };
  const toApply = () => { sessionStorage.setItem('tcf_prefill', JSON.stringify({ job_title: r.job_title, cv_id: r.cv_id, report_id: r.id })); navigate('apply'); };

  const evidence = [
    ['Keyword match', d.keyword_match?.explanation, r.matched_skills.join(', ') || 'none', 'c-g', `Required: ${[...r.matched_skills, ...r.missing_skills].join(', ') || 'none'}. Found ${r.matched_skills.length}, missing ${r.missing_skills.length}.`],
    ['Experience match', d.experience_match?.explanation, (d.experience_match?.signals || []).join(', ') || 'none', 'c-b', 'Add dates, outcomes and project results to raise this part.'],
    ['Certifications', d.certifications?.explanation, (d.certifications?.signals || []).join(', ') || 'none matched', 'c-a', 'A short, relevant certificate would lift this part.'],
  ];
  return (<>
    <div className="head"><div><div className="sub">ATS report · {fmtDate(r.created_at)} · {cvName}</div><h1>{r.job_title}</h1></div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={pdf} disabled={busy}><Icon n={busy ? 'RefreshCw' : 'Download'} s={16} />{busy ? 'Preparing PDF…' : 'Download PDF'}</button>
        <button className="btn" onClick={toApply}><Icon n="Plus" s={16} />Add to applications</button></div></div>
    <div className="row" style={{ gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
      {list.slice().reverse().map((x) => <button key={x.id} className={'rtab' + (x.id === r.id ? ' on' : '')} onClick={() => navigate('report/' + x.id)}><b>{x.score}%</b>{x.job_title}</button>)}</div>
    <div className="grid g12" style={{ marginBottom: 18 }}>
      <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Ring pct={r.score / 100} size={190} stroke={18} big={r.score + '%'} small={label} fs={46} ss={14} sc={color} />
        <div className="calc">{d.calculation || `(${r.keywords} × 50%) + (${r.experience} × 30%) + (${r.certifications} × 20%) = ${r.score}%`}</div>
        <div className="sub" style={{ fontSize: 12 }}>Guidance only. This is not a hiring decision.</div></div>
      <div className="grid" style={{ gridTemplateRows: 'auto 1fr' }}>
        <div className="grid g3">{[['Keywords', r.keywords, '50%'], ['Experience', r.experience, '30%'], ['Certifications', r.certifications, '20%']].map((k) => (
          <div key={k[0]} className="card row" style={{ gap: 14 }}><Ring pct={k[1] / 100} size={70} stroke={8} big={k[1] + '%'} fs={16} /><div><b>{k[0]}</b><div className="sub" style={{ fontSize: 12 }}>Weight {k[2]}</div></div></div>))}</div>
        <div className="card"><div className="ch"><h2>Skills</h2><span className="sub" style={{ fontSize: 12 }}>{r.matched_skills.length} of {r.matched_skills.length + r.missing_skills.length} required skills found</span></div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {r.matched_skills.map((k) => <span key={k} className="chip c-g"><Icon n="Check" s={13} w={3} />{k}</span>)}
            {r.missing_skills.map((k) => <span key={k} className="chip c-r"><Icon n="X" s={13} w={3} />{k}</span>)}</div>
          {r.missing_skills.length
            ? <div className="gapcard"><div className="gi"><Icon n="TrendingUp" s={22} c="#fff" /></div><div style={{ flex: 1 }}><b style={{ fontSize: 14.5 }}>Learn {r.missing_skills[0]} to reach about {gain}%</b>
              <div style={{ fontSize: 12.5, color: '#BDB8B2' }}>{r.missing_skills.length} missing skill{r.missing_skills.length > 1 ? 's' : ''}. Resources are ready in your roadmap.</div></div>
              <button className="btn sm" onClick={() => navigate('roadmap/' + r.id)}>Open roadmap</button></div>
            : <div className="gapcard"><div className="gi"><Icon n="Award" s={22} c="#fff" /></div><div style={{ flex: 1 }}><b>Every required skill matched</b><div style={{ fontSize: 12.5, color: '#BDB8B2' }}>Add this job to your applications.</div></div></div>}
        </div></div></div>
    <div className="card"><div className="ch"><h2>How this score was reached</h2><a className="link" onClick={() => setOpen(!open)}>{open ? 'Collapse all' : 'Expand all'}</a></div>
      <div className="grid g3">{evidence.map((e) => (
        <details key={e[0] + open} className="ev" open={open}><summary><b>{e[0]}</b><Icon n="ChevronDown" s={16} /></summary>
          <p className="sub" style={{ fontSize: 12.5, margin: '6px 0 10px' }}>{e[1]}</p><span className={'chip ' + e[3]}>Evidence: {e[2]}</span>
          <p style={{ fontSize: 12.5, marginTop: 10, color: 'var(--ink2)' }}>{e[4]}</p></details>))}</div></div>
  </>);
}
