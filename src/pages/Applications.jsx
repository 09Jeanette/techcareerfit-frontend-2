import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { ErrorBox, Loading, Num, Popover, Tile, toastError, useApi, useToast } from '../components/ui';
import { patch } from '../lib/api';
import { colorFor, fmtDate, initials, isClosed, isOverdue, STATUSES, statusChip } from '../lib/format';
import { navigate } from '../lib/router';
import { confetti } from './ApplicationDetail';

const DOT = { Applied: '#86807A', Interview: '#FF5B1F', Rejected: '#D9433A', Hired: '#1F9D5A' };

export function NextDate({ a }) {
  if (isClosed(a)) return <span className="sub" style={{ fontSize: 11.5 }}>{fmtDate(a.status_history?.at(-1)?.on)}</span>;
  if (isOverdue(a)) return <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--red)' }}>Follow-up overdue</span>;
  if (a.interview_on) return <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--o)' }}>Interview {fmtDate(a.interview_on)}</span>;
  if (a.follow_up_on) return <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Follow up {fmtDate(a.follow_up_on)}</span>;
  if (a.deadline_on) return <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>Deadline {fmtDate(a.deadline_on)}</span>;
  return null;
}

export function AppCard({ a, showStatus, onDragStart }) {
  return (
    <div className="acard" draggable={!!onDragStart} onDragStart={onDragStart} onClick={() => navigate('app/' + a.id)}>
      <div className="row" style={{ marginBottom: 10 }}><Tile text={initials(a.company)} bg={colorFor(a.company)} />
        <div style={{ minWidth: 0 }}><b style={{ fontSize: 13, display: 'block' }}>{a.job_title}</b><span className="sub" style={{ fontSize: 12 }}>{a.company}{a.location ? ' · ' + a.location : ''}</span></div></div>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}><span className="chip c-o"><Icon n="Target" s={12} />{a.ats_score}%</span>
        {showStatus && <span className={'chip ' + statusChip(a.status)}>{a.status}</span>}<NextDate a={a} /></div>
    </div>
  );
}

export default function Applications() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi('/applications');
  const [filter, setFilter] = useState([]);
  const [sort, setSort] = useState('recent');
  const [draft, setDraft] = useState(null);
  const [over, setOver] = useState(null);
  const list = useMemo(() => {
    if (!data) return [];
    let l = data.slice();
    if (filter.length) l = l.filter((a) => filter.includes(a.status));
    return sort === 'score' ? l.sort((a, b) => b.ats_score - a.ats_score) : l.reverse();
  }, [data, filter, sort]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;

  const move = async (id, status) => {
    const a = data.find((x) => x.id === id);
    if (!a || a.status === status) return;
    setData((d) => d.map((x) => (x.id === id ? { ...x, status } : x)));
    try { const u = await patch('/applications/' + id, { status }); setData((d) => d.map((x) => (x.id === id ? u : x))); toast(`${a.company}: moved to ${status}`); if (status === 'Hired') confetti(); }
    catch (e) { toastError(toast, e); reload(); }
  };
  const active = data.filter((a) => !isClosed(a)).length;
  const avg = data.length ? Math.round(data.reduce((s, a) => s + a.ats_score, 0) / data.length) : 0;
  const cols = STATUSES.filter((s) => !filter.length || filter.includes(s));

  return (<>
    <div className="head"><div><h1>Applications</h1><div className="sub">Every job you applied for, linked to the CV and score you used.</div></div>
      <div className="row">
        <div style={{ position: 'relative' }}>
          <button className="btn ghost" data-pop-anchor onClick={() => setDraft(draft ? null : { f: filter.length ? filter : STATUSES, s: sort })}><Icon n="Filter" s={16} />Filter{filter.length > 0 && <span className="pill-n">{filter.length}</span>}</button>
          <Popover open={!!draft} onClose={() => setDraft(null)} width={280}>
            {draft && <>
              <div className="pop-h">Show statuses</div>
              {STATUSES.map((s) => <label key={s} className="pop-it" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="cbx" checked={draft.f.includes(s)} onChange={(e) => setDraft({ ...draft, f: e.target.checked ? [...draft.f, s] : draft.f.filter((x) => x !== s) })} />
                <div><b>{s}</b><span>{data.filter((a) => a.status === s).length} applications</span></div></label>)}
              <div className="pop-h" style={{ borderTop: '1px solid var(--line)' }}>Sort by</div>
              <div className="seg" style={{ margin: '0 12px 12px' }}>{[['recent', 'Most recent'], ['score', 'Highest score']].map(([k, l]) =>
                <button key={k} className={draft.s === k ? 'on' : ''} onClick={() => setDraft({ ...draft, s: k })}>{l}</button>)}</div>
              <div className="row" style={{ padding: '0 12px 12px', gap: 8 }}>
                <button className="btn sm" style={{ flex: 1 }} onClick={() => { setFilter(draft.f.length === 4 ? [] : draft.f); setSort(draft.s); setDraft(null); }}>Apply</button>
                <button className="btn sm ghost" onClick={() => { setFilter([]); setSort('recent'); setDraft(null); }}>Clear</button></div></>}
          </Popover></div>
        <button className="btn" onClick={() => navigate('apply')}><Icon n="Plus" s={16} />Add application</button></div></div>
    <div className="grid g4" style={{ marginBottom: 18 }}>
      {[['Briefcase', active, 'Active', 'var(--peach)', 'var(--o)'], ['Calendar', data.filter((a) => a.status === 'Interview').length, 'Interviews', 'var(--blue-bg)', 'var(--blue)'],
        ['Clock', data.filter(isOverdue).length, 'Overdue follow-up', 'var(--red-bg)', 'var(--red)'], ['Target', avg + '%', 'Average score', 'var(--green-bg)', 'var(--green)']].map((s) => (
        <div key={s[2]} className="card row stat" style={{ gap: 14, padding: '16px 18px', flexDirection: 'row', alignItems: 'center' }}>
          <div className="ic" style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: s[3], color: s[4] }}><Icon n={s[0]} s={20} /></div>
          <div><div className="v" style={{ fontSize: 22 }}><Num v={String(s[1])} /></div><div className="sub" style={{ fontSize: 12 }}>{s[2]}</div></div></div>))}</div>
    {!data.length ? (
      <div className="card" style={{ textAlign: 'center', padding: 50 }}><div className="mic" style={{ background: 'var(--peach)' }}><Icon n="Briefcase" s={26} c="var(--o)" /></div>
        <h2>No applications yet</h2><p className="sub" style={{ margin: '6px 0 16px' }}>Add the first job you applied for. Link it to a CV to see its score here.</p>
        <button className="btn" onClick={() => navigate('apply')}><Icon n="Plus" s={16} />Add application</button></div>
    ) : (<>
      <div className="board hide-m" style={{ gridTemplateColumns: `repeat(${cols.length},1fr)` }}>
        {cols.map((s) => {
          const items = list.filter((a) => a.status === s);
          return (<div key={s} className={'kcolumn' + (over === s ? ' over' : '')}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); move(e.dataTransfer.getData('text/plain'), s); }}>
            <div className="row" style={{ justifyContent: 'space-between', margin: '2px 4px 12px' }}><span className="row" style={{ gap: 8, fontWeight: 600 }}><i className="sdot" style={{ background: DOT[s] }} />{s}</span><span className="chip c-m" style={{ background: 'var(--card)' }}>{items.length}</span></div>
            {items.length ? items.map((a) => <AppCard key={a.id} a={a} onDragStart={(e) => e.dataTransfer.setData('text/plain', a.id)} />)
              : <div className="kempty"><Icon n={s === 'Hired' ? 'Award' : 'Inbox'} s={24} c="var(--muted)" /><div style={{ marginTop: 8 }}>{s === 'Hired' ? 'Drag a card here when you get an offer' : 'Drag cards here'}</div></div>}
          </div>);
        })}</div>
      <div className="hide-d">
        <div className="row" style={{ gap: 8, marginBottom: 12, overflowX: 'auto' }}>{['All', ...STATUSES].map((n) => {
          const on = n === 'All' ? !filter.length : filter.length === 1 && filter[0] === n;
          return <button key={n} className={'fchip' + (on ? ' on' : '')} onClick={() => setFilter(n === 'All' ? [] : [n])}>{n}</button>;
        })}</div>
        {list.length ? list.map((a) => <AppCard key={a.id} a={a} showStatus />) : <p className="sub">No applications match this filter.</p>}
      </div></>)}
  </>);
}
