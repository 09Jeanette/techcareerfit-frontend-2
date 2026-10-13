import { useState } from 'react';
import stairs from '../assets/stairs.png';
import Icon from '../components/Icon';
import { ErrorBox, Loading, Popover, Ring, toastError, useApi, useToast } from '../components/ui';
import { put } from '../lib/api';
import { navigate } from '../lib/router';

const PLATFORM = { Coursera: ['C', '#2A73CC'], edX: ['eX', '#B7193F'], Curated: [null, '#FF5B1F'], Docs: [null, '#1F9D5A'], Search: [null, '#86807A'] };
const meta = (it) => [it.provider, it.duration || (it.minutes ? it.minutes + ' min' : ''), it.level].filter(Boolean).join(' · ');

export default function Roadmap({ param }) {
  const toast = useToast();
  const reps = useApi('/reports');
  const road = useApi('/learning/roadmap' + (param ? '?report_id=' + param : ''));
  const [pick, setPick] = useState(false);
  if (road.loading || reps.loading) return <Loading />;
  if (road.error) return <ErrorBox error={road.error} retry={road.reload} />;
  const { report: r, items } = road.data;
  if (!r) return (
    <div className="card" style={{ textAlign: 'center', padding: 50 }}><div className="mic" style={{ background: 'var(--peach)' }}><Icon n="BookOpen" s={26} c="var(--o)" /></div>
      <h2>Your roadmap starts with a report</h2><p className="sub" style={{ margin: '6px 0 16px' }}>Analyse your CV and we will build a plan from the skills you are missing.</p>
      <button className="btn" onClick={() => navigate('analyse')}><Icon n="Zap" s={16} />Analyse a CV</button></div>);

  const done = items.filter((i) => i.state === 'done').length;
  const groups = [...new Set(items.map((i) => i.skill))];
  const gain = items.length ? Math.min(98, r.score + 13) : r.score;
  const left = items.length - done;

  const setState = async (it, state) => {
    road.setData((d) => ({ ...d, items: d.items.map((x) => (x.key === it.key ? { ...x, state } : x)) }));
    try {
      await put('/learning/progress', { key: it.key, state });
      toast(state === 'done' ? 'Nice work. Resource marked as done' : state === 'progress' ? 'Started. Mark it done when you finish' : 'Marked as not done', state === 'done' ? 'Award' : 'PlayCircle');
    } catch (e) { toastError(toast, e); road.reload(); }
  };

  return (<>
    <div className="head"><div><h1>Learning roadmap</h1><div className="sub">Built from the missing skills in your report.</div></div>
      <div style={{ position: 'relative' }}>
        <button className="btn ghost" data-pop-anchor onClick={() => setPick(!pick)}><Icon n="Filter" s={16} />{r.job_title}<Icon n="ChevronDown" s={15} /></button>
        <Popover open={pick} onClose={() => setPick(false)} width={320}>
          <div className="pop-h">Show roadmap for</div>
          {(reps.data || []).slice().reverse().map((x) => (
            <div key={x.id} className={'pop-it' + (x.id === r.id ? ' unread' : '')} onClick={() => { setPick(false); navigate('roadmap/' + x.id); }}>
              <Icon n="BarChart2" s={17} c="var(--o)" /><div><b>{x.job_title}</b><span>{x.score}% · {x.missing_skills.length} missing skill{x.missing_skills.length === 1 ? '' : 's'}</span></div></div>))}
        </Popover></div></div>
    <div className="card rm-banner">
      <Ring pct={items.length ? done / items.length : 1} size={116} stroke={12} big={`${done}/${items.length}`} small="done" track="var(--card)" fs={26} />
      <div style={{ flex: 1, minWidth: 220 }}><div className="sub">From: {r.job_title} · {r.score}%</div>
        <div style={{ fontSize: 21, fontWeight: 700, margin: '2px 0 10px' }}>{items.length ? `Close ${groups.length} skill gap${groups.length > 1 ? 's' : ''} to reach about ${gain}%` : 'No gaps in this report'}</div>
        <div className="row" style={{ gap: 24, flexWrap: 'wrap' }}>{[['Clock', `${left} to go`], ['Layers', `${groups.length} skill${groups.length === 1 ? '' : 's'}`], ['TrendingUp', `+${gain - r.score}% potential`]].map((m) =>
          <span key={m[1]} className="row" style={{ gap: 8, fontSize: 13, fontWeight: 500 }}><Icon n={m[0]} s={17} c="#E04A10" />{m[1]}</span>)}</div></div>
      <img src={stairs} alt="" className="hide-m" style={{ width: 130, borderRadius: 16 }} /></div>
    <div className="grid g2">
      {groups.length ? groups.map((g, gi) => {
        const its = items.filter((i) => i.skill === g);
        const d = its.filter((i) => i.state === 'done').length;
        return (<div key={g} className="card">
          <div className="ch"><div className="row"><span className={'chip ' + (gi === 0 ? 'c-r' : 'c-a')}>{gi === 0 ? 'Required' : 'Also missing'}</span><h2 style={{ textTransform: 'capitalize' }}>{g}</h2></div>
            <span className="sub" style={{ fontSize: 12 }}>{d} of {its.length} done</span></div>
          <div className="bar" style={{ marginBottom: 14 }}><i style={{ width: Math.max(3, (d / its.length) * 100) + '%' }} /></div>
          <p className="sub" style={{ fontSize: 12.5, marginBottom: 12 }}>{its[0].reason}</p>
          <div className="list">{its.map((it, i) => (
            <div key={it.key} className="it">
              <div className="logo" style={{ background: (PLATFORM[it.platform] || PLATFORM.Docs)[1], fontSize: 13 }}>
                {(PLATFORM[it.platform] || [])[0] || <Icon n={it.curated ? 'Star' : 'Layers'} s={19} c="#fff" />}</div>
              <div className="t"><b style={it.state === 'done' ? { color: 'var(--muted)', textDecoration: 'line-through' } : undefined}>{it.title}</b>
                <span>{meta(it)}{it.rating ? <> · <b style={{ color: 'var(--amber)', display: 'inline' }}>★ {it.rating}</b></> : null}
                  {it.state === 'progress' && <b style={{ color: 'var(--o)', display: 'inline' }}> · In progress</b>}</span>
                <span className="row" style={{ gap: 6, marginTop: 4 }}>
                  <span className={'chip ' + (it.curated ? 'c-o' : 'c-b')} style={{ padding: '1px 8px', fontSize: 10.5 }}>{it.curated ? 'Curated' : it.platform}</span>
                  {it.link_type === 'search' && <span className="chip c-m" style={{ padding: '1px 8px', fontSize: 10.5 }}>Opens a search</span>}</span></div>
              {it.url && <a className="iconmini" href={it.url} target="_blank" rel="noreferrer" aria-label="Open resource"><Icon n="ExternalLink" s={14} /></a>}
              {it.state === 'done' ? <button className="chip c-g" onClick={() => setState(it, 'todo')} title="Undo"><Icon n="Check" s={12} w={3} />Done</button>
                : it.state === 'progress' ? <button className="btn sm" onClick={() => setState(it, 'done')}>Mark done</button>
                  : <button className="btn sm ghost" onClick={() => { setState(it, 'progress'); if (it.url) window.open(it.url, '_blank', 'noopener'); }}><Icon n="PlayCircle" s={14} />Start</button>}
            </div>))}</div></div>);
      }) : <div className="card"><h2>Nothing to learn for this report</h2><p className="sub">Every required skill was found. Pick another report above.</p></div>}
    </div>
    <p className="sub" style={{ fontSize: 12, marginTop: 14 }}>Courses come from the Coursera and edX course datasets (Kaggle). Resources marked Curated were added by an administrator.</p>
  </>);
}
