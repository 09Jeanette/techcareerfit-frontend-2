import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { ErrorBox, Field, Loading, Ring, Toggle, toastError, useApi, useToast } from '../components/ui';
import { post } from '../lib/api';
import { fmtDate, STATUSES } from '../lib/format';
import { navigate } from '../lib/router';
import { AppCard } from './Applications';

const SOURCES = ['LinkedIn', 'PNet', 'Careers24', 'Company site', 'Referral'];

export default function ApplyForm() {
  const toast = useToast();
  const cvs = useApi('/cvs');
  const [f, setF] = useState(() => {
    const pre = JSON.parse(sessionStorage.getItem('tcf_prefill') || '{}');
    return { job_title: '', company: '', location: '', job_link: '', application_source: 'LinkedIn', status: 'Applied', cv_id: null, report_id: null,
      follow_up_on: '', interview_on: '', deadline_on: '', notes: '', remind: true, ...pre };
  });
  const [checks, setChecks] = useState([false, false, false]);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { sessionStorage.removeItem('tcf_prefill'); }, []);
  useEffect(() => { if (cvs.data?.length && !f.cv_id) setF((s) => ({ ...s, cv_id: cvs.data[0].id })); }, [cvs.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (cvs.loading) return <Loading />;
  if (cvs.error) return <ErrorBox error={cvs.error} retry={cvs.reload} />;

  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); if (err[k]) setErr((e) => ({ ...e, [k]: '' })); };
  const cv = cvs.data.find((c) => c.id === f.cv_id);
  const score = cv?.best_score || 0;
  const save = async () => {
    const e = {};
    if (!f.job_title.trim()) e.job_title = 'Add the job title';
    if (!f.company.trim()) e.company = 'Add the company';
    setErr(e);
    if (Object.keys(e).length) { toast('Check the highlighted fields', 'AlertTriangle', '#FF9A72'); return; }
    setBusy(true);
    try { await post('/applications', { ...f, ats_score: null }); navigate('applications'); toast('Application saved to your board'); }
    catch (ex) { toastError(toast, ex); } finally { setBusy(false); }
  };
  const preview = { ...f, id: 'preview', job_title: f.job_title || 'Job title', company: f.company || 'Company', ats_score: score, status_history: [] };

  const actions = (<><button className="btn ghost" onClick={() => navigate('applications')}>Cancel</button>
    <button className="btn" onClick={save} disabled={busy}><Icon n="Check" s={16} />{busy ? 'Saving…' : 'Save application'}</button></>);
  return (<>
    <div className="head"><div><div className="sub row" style={{ gap: 6 }}><a className="link" onClick={() => navigate('applications')}>Applications</a><Icon n="ChevronRight" s={14} />New</div>
      <h1>Add an application</h1><div className="sub">Link it to the CV you used so its score and reminders stay with it.</div></div>
      <div className="row hide-m">{actions}</div></div>
    <div className="grid" style={{ gridTemplateColumns: '1.55fr 1fr', alignItems: 'start' }} id="applyGrid">
      <div className="grid" style={{ gap: 18 }}>
        <div className="card"><div className="fsec"><span className="n">1</span><div><h2>Job details</h2><div className="sub" style={{ fontSize: 12 }}>The role and where you found it</div></div></div>
          <div className="grid g2" style={{ gap: 14 }}>
            <Field id="t" label="Job title" icon="Briefcase" value={f.job_title} onChange={set('job_title')} ph="e.g. Software Engineer" error={err.job_title} />
            <Field id="c" label="Company" icon="Layers" value={f.company} onChange={set('company')} ph="e.g. TUT" error={err.company} />
            <Field id="l" label="Location" icon="MapPin" value={f.location} onChange={set('location')} ph="City · remote or hybrid" opt />
            <Field id="u" label="Job link" icon="Globe" value={f.job_link} onChange={set('job_link')} ph="Paste the ad link" opt /></div>
          <div className="lab" style={{ marginTop: 6 }}>Where did you find it?</div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{SOURCES.map((s) => (
            <button key={s} className={'fchip' + (f.application_source === s ? ' on' : '')} onClick={() => set('application_source')(s)}>{f.application_source === s && <Icon n="Check" s={12} c="#fff" w={3} />}{s}</button>))}</div></div>
        <div className="card"><div className="fsec"><span className="n">2</span><div><h2>CV and score</h2><div className="sub" style={{ fontSize: 12 }}>Pick the CV you sent. We attach its latest ATS score.</div></div></div>
          {cvs.data.length ? <div className="grid g2" style={{ gap: 12 }}>{cvs.data.map((c) => (
            <div key={c.id} role="button" tabIndex={0} className={'pick' + (c.id === f.cv_id ? ' on' : '')} style={{ cursor: 'pointer' }} onClick={() => set('cv_id')(c.id)}>
              <Ring pct={(c.best_score || 0) / 100} size={54} stroke={6} big={String(c.best_score || 0)} fs={15} col={c.id === f.cv_id ? '#FF5B1F' : '#C9C1B9'} />
              <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.filename}</b><div className="sub" style={{ fontSize: 12 }}>Added {fmtDate(c.created_at)}</div></div>
              {c.id === f.cv_id && <span className="okdot"><Icon n="Check" s={13} c="#fff" w={3} /></span>}</div>))}</div>
            : <p className="sub">No CVs yet. <a className="link" onClick={() => navigate('analyse')}>Upload one</a> to attach a score.</p>}
          {cv && <div className={'tipbox ' + (score >= 60 ? 'good' : 'warn')}><Icon n={score >= 60 ? 'TrendingUp' : 'AlertTriangle'} s={17} />{score >= 60 ? 'Strong match. Mention your strongest project in the cover letter.' : 'Low score. Consider tailoring this CV before you apply.'}</div>}</div>
        <div className="card"><div className="fsec"><span className="n">3</span><div><h2>Status and dates</h2><div className="sub" style={{ fontSize: 12 }}>Dates are optional. Leave them empty if you do not know yet.</div></div></div>
          <div className="lab">Status</div>
          <div className="seg" style={{ marginBottom: 16 }}>{STATUSES.map((s) => <button key={s} className={f.status === s ? 'on' : ''} onClick={() => set('status')(s)}>{s}</button>)}</div>
          <div className="grid g3" style={{ gap: 12 }}>
            <Field id="fu" label="Follow-up" icon="Clock" type="date" value={f.follow_up_on} onChange={set('follow_up_on')} opt />
            <Field id="iv" label="Interview" icon="Calendar" type="date" value={f.interview_on} onChange={set('interview_on')} opt />
            <Field id="dl" label="Deadline" icon="Calendar" type="date" value={f.deadline_on} onChange={set('deadline_on')} opt /></div></div>
        <div className="card"><div className="fsec"><span className="n">4</span><div><h2>Notes</h2></div></div>
          <Field id="n" area rows={3} value={f.notes} onChange={set('notes')} ph="Recruiter name, what they asked for, next steps…" /></div>
      </div>
      <div className="grid stickycol" style={{ gap: 18, position: 'sticky', top: 20 }}>
        <div className="card"><div className="ch"><h2>Preview</h2><span className="chip c-m">On your board</span></div>
          <div style={{ background: 'var(--soft)', borderRadius: 16, padding: 14, pointerEvents: 'none' }}><AppCard a={preview} showStatus /></div></div>
        <div className="card"><div className="row" style={{ justifyContent: 'space-between' }}><div className="row"><Icon n="Bell" s={19} c="#FF5B1F" />
          <div><b style={{ fontSize: 13.5 }}>Remind me to follow up</b><div className="sub" style={{ fontSize: 12 }}>{f.follow_up_on ? 'Email two days before ' + fmtDate(f.follow_up_on) : 'Set a follow-up date to get an email'}</div></div></div>
          <Toggle on={f.remind} onChange={set('remind')} label="Follow-up reminder" /></div></div>
        <div className="card"><h2 style={{ marginBottom: 12 }}>Before you send it</h2>
          {['Tailor your CV to this ad', "Use the ad's own skill words", 'Save the job link'].map((c, i) => (
            <button key={c} className={'row chk' + (checks[i] ? ' on' : '')} onClick={() => setChecks(checks.map((x, j) => (j === i ? !x : x)))}><span className="ck"><Icon n="Check" s={12} c="#fff" w={3} /></span>{c}</button>))}</div>
        <button className="btn lg hide-m" style={{ width: '100%' }} onClick={save} disabled={busy}><Icon n="Check" s={17} />{busy ? 'Saving…' : 'Save application'}</button>
      </div></div>
    <div className="savebar">{actions}</div>
  </>);
}
