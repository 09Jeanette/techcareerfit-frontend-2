import { useMemo, useState } from 'react';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { ErrorBox, Field, Loading, Modal, Num, toastError, useApi, useToast } from '../components/ui';
import { del, patch, post } from '../lib/api';
import { downloadBlob, fmtDate, initials } from '../lib/format';
import { navigate } from '../lib/router';

const SKILLS = ['docker', 'unit testing', 'java', 'aws', 'azure', 'kubernetes', 'power bi', 'sql', 'sql window functions', 'python', 'react', 'git', 'linux', 'networking'];
const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const exportUsers = (users) => downloadBlob('techcareerfit-users.csv',
  'name,email,role,joined,status\n' + users.map((u) => [u.name, u.email, u.role, u.created_at?.slice(0, 10), u.is_active ? 'active' : 'inactive'].map(csvEscape).join(',')).join('\n'), 'text/csv');

function AddResource({ open, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', url: '', provider: '', skill: 'docker', level: 'Beginner', minutes: 45, reason: '' });
  const [err, setErr] = useState('');
  const save = async () => {
    if (!f.title.trim()) { setErr('Add a title'); return; }
    try { const r = await post('/admin/resources', { ...f, minutes: Number(f.minutes) || 45 }); onSaved(r); onClose(); toast('Resource added to the library'); setF({ ...f, title: '', url: '', provider: '', reason: '' }); }
    catch (e) { toastError(toast, e); }
  };
  return (
    <Modal open={open} onClose={onClose}>
      <h2 style={{ marginBottom: 14 }}>Add a learning resource</h2>
      <Field id="rt" label="Title" value={f.title} onChange={(v) => { setF({ ...f, title: v }); setErr(''); }} ph="e.g. Containerise a FastAPI app" error={err} />
      <Field id="ru" label="Link" icon="Globe" value={f.url} onChange={(v) => setF({ ...f, url: v })} ph="https://" />
      <div className="grid g2" style={{ gap: 12 }}>
        <Field id="rp" label="Provider" value={f.provider} onChange={(v) => setF({ ...f, provider: v })} ph="e.g. Docker docs" />
        <div className="fld"><label className="lab" htmlFor="rs">Skill tag</label><div className="selectwrap" style={{ width: '100%' }}>
          <select id="rs" value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value })}>{SKILLS.map((s) => <option key={s}>{s}</option>)}</select><Icon n="ChevronDown" s={16} c="var(--muted)" /></div></div></div>
      <div className="lab">Level</div>
      <div className="seg" style={{ marginBottom: 14 }}>{['Beginner', 'Intermediate', 'Advanced'].map((l) => <button key={l} className={f.level === l ? 'on' : ''} onClick={() => setF({ ...f, level: l })}>{l}</button>)}</div>
      <Field id="rr" label="Why it helps (shown to candidates)" area rows={2} value={f.reason} onChange={(v) => setF({ ...f, reason: v })} />
      <div className="row" style={{ gap: 10 }}><button className="btn" onClick={save}>Save resource</button><button className="btn ghost" onClick={onClose}>Cancel</button></div>
    </Modal>
  );
}

export function AdminOverview() {
  const stats = useApi('/admin/stats');
  const users = useApi('/admin/users');
  const [add, setAdd] = useState(false);
  if (stats.loading || users.loading) return <Loading />;
  if (stats.error) return <ErrorBox error={stats.error} retry={stats.reload} />;
  const s = stats.data;
  const max = Math.max(1, ...s.daily.map((d) => Math.max(d.analyses, d.signups)));
  return (<>
    <div className="head"><div><h1>Admin overview</h1><div className="sub">Monitor the platform from one place.</div></div>
      <button className="btn ghost" onClick={() => exportUsers(users.data || [])}><Icon n="Download" s={16} />Export users (CSV)</button></div>
    <div className="grid g4" style={{ marginBottom: 18 }}>
      {[['Users', s.users, 'Registered users', `+${s.users_week} this week`, 'var(--peach)', 'var(--o)', 'admin-users'], ['FileText', s.reports, 'ATS reports', `+${s.reports_week} this week`, 'var(--green-bg)', 'var(--green)', 'admin-reports'],
        ['Briefcase', s.applications, 'Applications', `+${s.applications_week} this week`, 'var(--blue-bg)', 'var(--blue)', 'admin-reports'],
        ['BookOpen', s.resources, 'Learning resources', s.resources ? 'Library active' : 'Needs attention', s.resources ? 'var(--green-bg)' : 'var(--red-bg)', s.resources ? 'var(--green)' : 'var(--red)', 'admin-resources']].map((k, i) => (
        <div key={k[2]} className="card stat click" onClick={() => navigate(k[6])}>
          <div className="row" style={{ justifyContent: 'space-between' }}><div className="ic" style={{ background: k[4], color: k[5] }}><Icon n={k[0]} s={19} /></div><span className={'trend ' + (i === 3 && !s.resources ? 'down' : 'up')}>{k[3]}</span></div>
          <div className="v"><Num v={String(k[1])} /></div><div className="l">{k[2]}</div></div>))}</div>
    {!s.resources && <div className="card row alertcard"><Icon n="AlertTriangle" s={24} c="#D9433A" /><div style={{ flex: 1 }}><b style={{ color: 'var(--red)' }}>The learning library is empty</b>
      <div style={{ fontSize: 12.5, color: '#9C4A44' }}>Roadmaps are using built-in defaults. Add resources tagged by skill so candidates get curated links.</div></div>
      <button className="btn sm" style={{ background: 'var(--red)', boxShadow: 'none' }} onClick={() => setAdd(true)}>Add resources</button></div>}
    <div className="grid g21">
      <div className="card"><div className="ch"><h2>Last 7 days</h2><div className="row" style={{ gap: 14, fontSize: 12 }}>
        <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: '#FF5B1F' }} />Analyses</span>
        <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--ink)' }} />Sign-ups</span></div></div>
        <svg viewBox="0 0 560 180" width="100%" height="180">
          {[40, 80, 120, 160].map((y) => <line key={y} x1="20" x2="555" y1={y} y2={y} stroke="var(--track)" />)}
          {s.daily.map((d, i) => {
            const h1 = (d.analyses / max) * 130, h2 = (d.signups / max) * 130;
            return (<g key={i}><rect className="gb" style={{ animationDelay: i * 0.06 + 's' }} x={50 + i * 74} y={160 - h1} width="20" height={h1} rx="6" fill="#FF5B1F" />
              <rect className="gb" style={{ animationDelay: i * 0.06 + 0.03 + 's' }} x={74 + i * 74} y={160 - h2} width="20" height={h2} rx="6" fill="var(--ink)" />
              <text x={72 + i * 74} y="177" textAnchor="middle" fontSize="11" fill="var(--muted)">{d.day}</text></g>);
          })}</svg></div>
      <div className="card"><div className="ch"><h2>New users</h2><a className="link" onClick={() => navigate('admin-users')}>Manage</a></div>
        <div className="list">{(users.data || []).slice(0, 5).map((u) => (
          <div key={u.id} className="it"><div className="av sm">{initials(u.name)}</div><div className="t"><b>{u.name}</b><span>{u.role} · {fmtDate(u.created_at)}</span></div>
            <span className={'chip ' + (u.is_active ? 'c-g' : 'c-m')}>{u.is_active ? 'Active' : 'Inactive'}</span></div>))}</div></div></div>
    <AddResource open={add} onClose={() => setAdd(false)} onSaved={() => stats.reload()} />
  </>);
}

export function AdminUsers() {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data, loading, error, reload, setData } = useApi('/admin/users');
  const [q, setQ] = useState('');
  const rows = useMemo(() => (data || []).filter((u) => (u.name + ' ' + u.email).toLowerCase().includes(q.toLowerCase())), [data, q]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const toggle = async (u) => {
    try { const n = await patch('/admin/users/' + u.id, { is_active: !u.is_active }); setData((d) => d.map((x) => (x.id === u.id ? n : x))); toast(`${u.name} ${n.is_active ? 'activated' : 'deactivated'}`); }
    catch (e) { toastError(toast, e); }
  };
  return (<>
    <div className="head"><div><h1>Users</h1><div className="sub">{data.length} accounts</div></div><button className="btn ghost" onClick={() => exportUsers(data)}><Icon n="Download" s={16} />Export CSV</button></div>
    <div className="card"><div className="inp" style={{ marginBottom: 14, padding: '0 13px' }}><Icon n="Search" s={16} c="var(--muted)" /><input style={{ padding: '11px 0' }} placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="tbl"><div className="tr th"><span>Name</span><span>Role</span><span>Joined</span><span>Status</span><span /></div>
        {rows.map((u) => (
          <div key={u.id} className="tr"><span className="row" style={{ gap: 10, minWidth: 0 }}><span className="av sm">{initials(u.name)}</span><span style={{ minWidth: 0 }}><b style={{ display: 'block' }}>{u.name}</b><span className="sub" style={{ fontSize: 11.5 }}>{u.email}</span></span></span>
            <span>{u.role}</span><span>{fmtDate(u.created_at)}</span><span><span className={'chip ' + (u.is_active ? 'c-g' : 'c-m')}>{u.is_active ? 'Active' : 'Inactive'}</span></span>
            <span>{u.id !== me.id && <button className="btn sm ghost" onClick={() => toggle(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>}</span></div>))}</div></div>
  </>);
}

export function AdminResources() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi('/admin/resources');
  const [add, setAdd] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const remove = async (id) => { try { await del('/admin/resources/' + id); setData((d) => d.filter((r) => r.id !== id)); toast('Resource removed', 'Trash2', '#FF9A72'); } catch (e) { toastError(toast, e); } };
  return (<>
    <div className="head"><div><h1>Learning resources</h1><div className="sub">Resources are matched to missing skills by their skill tag.</div></div><button className="btn" onClick={() => setAdd(true)}><Icon n="Plus" s={16} />Add resource</button></div>
    <div className="card">{data.length ? <div className="list">{data.map((r) => (
      <div key={r.id} className="it"><div className="logo" style={{ background: 'var(--o)' }}><Icon n="Star" s={18} c="#fff" /></div>
        <div className="t"><b>{r.title}</b><span>{r.provider || 'Curated'} · {r.level} · tag: {r.skill}</span></div>
        {r.url && <a className="iconmini" href={r.url} target="_blank" rel="noreferrer" aria-label="Open"><Icon n="ExternalLink" s={14} /></a>}
        <button className="iconmini" onClick={() => remove(r.id)} aria-label="Remove"><Icon n="Trash2" s={14} /></button></div>))}</div>
      : <div className="kempty" style={{ padding: 40 }}><Icon n="BookOpen" s={30} c="var(--muted)" /><div style={{ margin: '10px 0 14px' }}>No curated resources yet. Built-in defaults are used.</div>
        <button className="btn sm" onClick={() => setAdd(true)}>Add the first resource</button></div>}</div>
    <AddResource open={add} onClose={() => setAdd(false)} onSaved={(r) => setData((d) => [r, ...d])} />
  </>);
}

export function AdminReports() {
  const { data, loading, error, reload } = useApi('/admin/stats');
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const b = data.score_buckets, max = Math.max(1, ...Object.values(b));
  return (<>
    <div className="head"><div><h1>Reports</h1><div className="sub">How candidates are scoring across the platform.</div></div></div>
    <div className="grid g2">
      <div className="card"><div className="ch"><h2>Score distribution</h2></div>{Object.entries(b).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 14 }}><div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}><b>{k}%</b><span className="muted">{v} reports</span></div>
          <div className="bar" style={{ height: 12 }}><i style={{ width: (v / max) * 100 + '%' }} /></div></div>))}</div>
      <div className="card"><div className="ch"><h2>Most common missing skills</h2></div>
        {data.top_missing.length ? data.top_missing.map(([k, v]) => <div key={k} className="row" style={{ justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid var(--line)' }}><span className="chip c-r">{k}</span><b>{v}</b></div>)
          : <p className="sub">No reports yet.</p>}
        <p className="sub" style={{ fontSize: 12, marginTop: 10 }}>Add resources for these skills first.</p></div></div>
  </>);
}
