import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { ErrorBox, Field, Loading, toastError, useApi, useToast } from '../components/ui';
import { del, post } from '../lib/api';
import { fmtDate } from '../lib/format';

const MOODS = { unsure: ['Frown', 'Unsure', 'c-m'], okay: ['Meh', 'Okay', 'c-o'], confident: ['Smile', 'Confident', 'c-g'] };

export default function Journal() {
  const toast = useToast();
  const entries = useApi('/journal');
  const reps = useApi('/reports');
  const apps = useApi('/applications');
  const pre = JSON.parse(sessionStorage.getItem('tcf_reflect') || 'null');
  const [about, setAbout] = useState(pre?.application_id ? 'app:' + pre.application_id : '');
  const [f, setF] = useState({ went_well: '', needs_improvement: '', next_action: '', mood: 'confident' });
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(false);
  const formRef = useRef(null);
  const wellRef = useRef(null);
  useEffect(() => { sessionStorage.removeItem('tcf_reflect'); }, []);
  useEffect(() => { if (!about && reps.data?.length) setAbout('rep:' + reps.data[reps.data.length - 1].id); }, [reps.data, about]);
  if (entries.loading || reps.loading || apps.loading) return <Loading />;
  if (entries.error) return <ErrorBox error={entries.error} retry={entries.reload} />;
  const list = entries.data;
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); setErr(''); };

  const save = async () => {
    if (!f.went_well.trim() && !f.needs_improvement.trim() && !f.next_action.trim()) { setErr('Write at least one line'); return; }
    const body = { ...f };
    if (about.startsWith('rep:')) body.report_id = about.slice(4);
    if (about.startsWith('app:')) body.application_id = about.slice(4);
    try { const j = await post('/journal', body); entries.setData((d) => [j, ...d]); setF({ went_well: '', needs_improvement: '', next_action: '', mood: 'confident' }); toast('Reflection saved'); }
    catch (e) { toastError(toast, e); }
  };
  const remove = async (id) => { try { await del('/journal/' + id); entries.setData((d) => d.filter((x) => x.id !== id)); toast('Entry deleted', 'Trash2', '#FF9A72'); } catch (e) { toastError(toast, e); } };
  const focusForm = () => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => wellRef.current?.focus(), 400); setPulse(true); setTimeout(() => setPulse(false), 1200); };
  const counts = Object.keys(MOODS).map((k) => list.filter((j) => j.mood === k).length);

  return (<>
    <div className="head"><div><h1>Career journal</h1><div className="sub">Reflect after each step so the next one goes better.</div></div>
      <button className="btn" onClick={focusForm}><Icon n="Plus" s={16} />New reflection</button></div>
    <div className="grid g12">
      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card streak"><div className="row" style={{ justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 12.5, color: '#BDB8B2' }}>Reflections saved</div><div style={{ fontSize: 30, fontWeight: 700 }}>{list.length}</div></div>
          <span className="flame"><Icon n="Zap" s={26} c="#fff" /></span></div>
          <div className="row" style={{ gap: 6, marginTop: 12 }}>{[0, 1, 2, 3, 4, 5, 6].map((d) => <span key={d} style={{ flex: 1, height: 8, borderRadius: 8, background: d < list.length ? 'var(--o)' : '#3A3836' }} />)}</div>
          <div style={{ fontSize: 12.5, color: '#BDB8B2', marginTop: 12 }}>Latest next action: <b style={{ color: '#fff' }}>{list.find((j) => j.next_action)?.next_action || 'Write your first reflection'}</b></div>
          <div className="row" style={{ gap: 14, marginTop: 12, flexWrap: 'wrap' }}>{Object.keys(MOODS).map((k, i) =>
            <span key={k} className="row" style={{ gap: 6, fontSize: 12, color: '#D9D4CF' }}><Icon n={MOODS[k][0]} s={15} c="#FF8A55" />{counts[i]} {MOODS[k][1].toLowerCase()}</span>)}</div></div>
        <div className={'card' + (pulse ? ' pulse' : '')} ref={formRef}><div className="ch"><h2>New reflection</h2></div>
          <div className="fld"><label className="lab" htmlFor="about">About</label>
            <div className="selectwrap" style={{ width: '100%' }}><Icon n="FileText" s={16} c="var(--muted)" />
              <select id="about" value={about} onChange={(e) => setAbout(e.target.value)}>
                <option value="">General reflection</option>
                {reps.data.slice().reverse().map((r) => <option key={r.id} value={'rep:' + r.id}>{r.job_title} · {r.score}%</option>)}
                {apps.data.map((a) => <option key={a.id} value={'app:' + a.id}>{a.job_title} at {a.company}</option>)}
              </select><Icon n="ChevronDown" s={16} c="var(--muted)" /></div></div>
          <Field id="well" label="What went well?" area rows={2} value={f.went_well} onChange={set('went_well')} ph="e.g. Explained my project clearly" error={err} inputRef={wellRef} />
          <Field id="work" label="What needs work?" area rows={2} value={f.needs_improvement} onChange={set('needs_improvement')} ph="e.g. Docker questions" />
          <Field id="next" label="Next action" value={f.next_action} onChange={set('next_action')} ph="e.g. Finish the Docker roadmap item" />
          <div className="lab">How do you feel?</div>
          <div className="row moods" style={{ gap: 8, marginBottom: 14 }}>{Object.entries(MOODS).map(([k, v]) => (
            <button key={k} className={'mood' + (f.mood === k ? ' on' : '')} onClick={() => set('mood')(k)}><Icon n={v[0]} s={24} c={f.mood === k ? 'var(--o)' : 'var(--muted)'} /><span>{v[1]}</span></button>))}</div>
          <button className="btn" style={{ width: '100%' }} onClick={save}>Save reflection</button></div>
      </div>
      <div className="card" style={{ alignSelf: 'start' }}><div className="ch"><h2>Your entries</h2><span className="sub" style={{ fontSize: 12 }}>{list.length} saved</span></div>
        {list.length ? list.map((e, i) => (
          <div key={e.id} className="jentry"><div className="jl"><span className="jic"><Icon n={MOODS[e.mood][0]} s={22} c="var(--o)" /></span>{i < list.length - 1 && <span className="jline" />}</div>
            <div className="jcard"><div className="row" style={{ justifyContent: 'space-between', gap: 8 }}><b>{e.title}</b>
              <div className="row" style={{ gap: 6 }}><span className={'chip ' + MOODS[e.mood][2]}>{MOODS[e.mood][1]}</span><button className="iconmini" onClick={() => remove(e.id)} aria-label="Delete entry"><Icon n="Trash2" s={14} /></button></div></div>
              <div className="sub" style={{ fontSize: 11.5, marginBottom: 6 }}>{fmtDate(e.created_at)}</div>
              {e.went_well && <p style={{ fontSize: 13, color: 'var(--ink2)' }}><b style={{ color: 'var(--green)' }}>Went well:</b> {e.went_well}</p>}
              {e.needs_improvement && <p style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4 }}><b style={{ color: 'var(--red)' }}>Needs work:</b> {e.needs_improvement}</p>}
              {e.next_action && <div className="row" style={{ gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--o-deep)' }}><Icon n="ArrowRight" s={14} />{e.next_action}</div>}
              {e.guidance && <p className="sub" style={{ fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>{e.guidance}</p>}</div></div>))
          : <p className="sub">No reflections yet. Write one after your next analysis or interview.</p>}
      </div>
    </div>
  </>);
}
