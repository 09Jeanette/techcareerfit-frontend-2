import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { ConfirmModal, ErrorBox, Field, Loading, toastError, useApi, useToast } from '../components/ui';
import { del, patch } from '../lib/api';
import { daysFrom, fmtDate, STATUSES } from '../lib/format';
import { navigate } from '../lib/router';

export default function ApplicationDetail({ param }) {
  const toast = useToast();
  const { data: a, loading, error, reload, setData } = useApi('/applications/' + param);
  const [notes, setNotes] = useState('');
  const [dates, setDates] = useState({});
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { if (a) { setNotes(a.notes || ''); setDates({ follow_up_on: a.follow_up_on || '', interview_on: a.interview_on || '', deadline_on: a.deadline_on || '' }); } }, [a]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;

  const update = async (body, msg) => {
    try { const u = await patch('/applications/' + a.id, body); setData(u); toast(msg); if (body.status === 'Hired') confetti(); }
    catch (e) { toastError(toast, e); }
  };
  const remove = async () => { try { await del('/applications/' + a.id); navigate('applications'); toast('Application deleted', 'Trash2', '#FF9A72'); } catch (e) { toastError(toast, e); } };
  return (<>
    <div className="head"><div><div className="sub row" style={{ gap: 6 }}><a className="link" onClick={() => navigate('applications')}>Applications</a><Icon n="ChevronRight" s={14} />{a.company}</div>
      <h1>{a.job_title}</h1><div className="sub">{a.company}{a.location ? ' · ' + a.location : ''}{a.application_source ? ' · via ' + a.application_source : ''}</div></div>
      <div className="row"><button className="btn ghost" onClick={() => setConfirm(true)}><Icon n="Trash2" s={16} />Delete</button>
        <button className="btn" onClick={() => { sessionStorage.setItem('tcf_reflect', JSON.stringify({ application_id: a.id })); navigate('journal'); }}><Icon n="Edit3" s={16} />Write reflection</button></div></div>
    <div className="grid g21">
      <div className="grid" style={{ gap: 18, alignContent: 'start' }}>
        <div className="card"><div className="ch"><h2>Status</h2><span className="sub" style={{ fontSize: 12 }}>Changing it adds a step to the timeline</span></div>
          <div className="seg">{STATUSES.map((s) => <button key={s} className={a.status === s ? 'on' : ''} onClick={() => a.status !== s && update({ status: s }, `${a.company}: moved to ${s}`)}>{s}</button>)}</div></div>
        <div className="grid g3">{[['ATS score', a.ats_score + '%', 'var(--o)'], ['Interview', a.interview_on ? fmtDate(a.interview_on) : 'Not set', 'var(--ink)'],
          ['Follow-up', a.follow_up_on ? fmtDate(a.follow_up_on) : 'Not set', a.follow_up_on && daysFrom(a.follow_up_on) < 0 ? 'var(--red)' : 'var(--ink)']].map((k) => (
          <div key={k[0]} className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700, color: k[2] }}>{k[1]}</div><div className="sub" style={{ fontSize: 12 }}>{k[0]}</div></div>))}</div>
        <div className="card"><div className="ch"><h2>Dates</h2><button className="link" onClick={() => update(dates, 'Dates saved')}>Save dates</button></div>
          <div className="grid g3" style={{ gap: 12 }}>
            {[['follow_up_on', 'Follow-up', 'Clock'], ['interview_on', 'Interview', 'Calendar'], ['deadline_on', 'Deadline', 'Calendar']].map(([k, l, ic]) =>
              <Field key={k} id={k} label={l} icon={ic} type="date" value={dates[k] || ''} onChange={(v) => setDates((d) => ({ ...d, [k]: v }))} opt />)}</div></div>
        <div className="card"><div className="ch"><h2>Notes</h2><button className="link" onClick={() => update({ notes }, 'Notes saved')}>Save notes</button></div>
          <Field id="notes" area rows={4} value={notes} onChange={setNotes} ph="Add notes" /></div>
      </div>
      <div className="card" style={{ alignSelf: 'start' }}><div className="ch"><h2>Timeline</h2></div>
        {(a.status_history || []).slice().reverse().map((h, i) => (
          <div key={i} className="tl"><span className={'tdot' + (i === 0 ? ' on' : '')} /><div><b>{h.status}</b><div className="sub" style={{ fontSize: 12 }}>{fmtDate(h.on)}</div></div></div>))}
        <div className="tl"><span className="tdot" /><div><b>CV analysed: {a.ats_score}%</b><div className="sub" style={{ fontSize: 12 }}>Score attached when you saved</div></div></div>
        {a.job_link && <a className="link" href={a.job_link} target="_blank" rel="noreferrer"><Icon n="ExternalLink" s={14} />Open the job ad</a>}
      </div>
    </div>
    <ConfirmModal open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} title="Delete this application?" body={`${a.job_title} at ${a.company} will be removed from your board.`} />
  </>);
}

export function confetti() {
  const c = document.createElement('div');
  c.className = 'confetti';
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = ['#FF5B1F', '#FFB48F', '#1F9D5A', '#3E6BE0', '#F2C14E'][i % 5];
    s.style.animationDelay = Math.random() * 0.4 + 's';
    c.appendChild(s);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 2600);
}
