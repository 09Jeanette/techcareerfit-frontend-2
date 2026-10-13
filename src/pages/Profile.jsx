import { useState } from 'react';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { ConfirmModal, Field, Modal, PasswordField, Toggle, toastError, useApi, useToast } from '../components/ui';
import { del, get, patch, post } from '../lib/api';
import { downloadBlob, initials } from '../lib/format';
import { navigate } from '../lib/router';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const cvs = useApi('/cvs');
  const [edit, setEdit] = useState(null);
  const [pw, setPw] = useState(null);
  const [delOpen, setDelOpen] = useState(false);
  const [skill, setSkill] = useState('');

  const save = async (body, msg) => { try { setUser(await patch('/me', body)); if (msg) toast(msg); return true; } catch (e) { toastError(toast, e); return false; } };
  const addSkill = (e) => { if (e.key === 'Enter' && skill.trim()) { e.preventDefault(); save({ skills: [...user.skills, skill.trim()] }, 'Skill added'); setSkill(''); } };
  const exportData = async () => { try { downloadBlob('techcareerfit-my-data.json', JSON.stringify(await get('/me/export'), null, 2), 'application/json'); toast('Your data was downloaded'); } catch (e) { toastError(toast, e); } };
  const deleteAccount = async () => { try { await del('/me'); logout(); navigate('landing'); toast('Account deleted. Your data was removed.', 'Trash2', '#FF9A72'); } catch (e) { toastError(toast, e); } };
  const changePw = async () => {
    if (!pw.current) { setPw({ ...pw, err: { current: 'Enter your current password' } }); return; }
    if (pw.next.length < 8) { setPw({ ...pw, err: { next: 'Use at least 8 characters' } }); return; }
    try { await post('/me/password', { current_password: pw.current, new_password: pw.next }); setPw(null); toast('Password updated'); }
    catch (e) { setPw({ ...pw, err: { current: e.message } }); }
  };
  const removeCv = async (id) => { try { await del('/cvs/' + id); cvs.setData((d) => d.filter((c) => c.id !== id)); toast('CV removed', 'Trash2', '#FF9A72'); } catch (e) { toastError(toast, e); } };
  const s = user.settings || {};

  return (<>
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18 }}><div className="cover" />
      <div className="row" style={{ padding: '0 26px 22px', marginTop: -40, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="av" style={{ width: 96, height: 96, fontSize: 30, border: '5px solid var(--card)' }}>{initials(user.name)}</div>
        <div style={{ flex: 1, minWidth: 200 }}><h1 style={{ fontSize: 24 }}>{user.name}</h1><div className="sub">{[user.headline, user.city, user.experience && user.experience + ' experience'].filter(Boolean).join(' · ')}</div></div>
        <button className="btn ghost" onClick={() => setEdit({ name: user.name, headline: user.headline, city: user.city, experience: user.experience })}><Icon n="Edit3" s={15} />Edit profile</button></div></div>
    <div className="grid g3">
      <div className="card"><div className="ch"><h2>Skills</h2></div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>{user.skills.map((k, i) => (
          <span key={k + i} className="chip c-o">{k}<button className="xbtn" aria-label={'Remove ' + k} onClick={() => save({ skills: user.skills.filter((_, j) => j !== i) })}><Icon n="X" s={11} w={3} /></button></span>))}
          {!user.skills.length && <span className="sub" style={{ fontSize: 12.5 }}>Add the skills you have so market insights can compare them.</span>}</div>
        <div className="inp" style={{ marginTop: 12, padding: '0 13px' }}><Icon n="Plus" s={16} c="var(--muted)" /><input style={{ padding: '11px 0' }} placeholder="Add a skill and press Enter" value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={addSkill} /></div>
        <h2 style={{ margin: '20px 0 12px' }}>My CVs</h2>
        <div className="list">{(cvs.data || []).map((c) => (
          <div key={c.id} className="it"><div className="logo" style={{ background: 'var(--peach)', color: 'var(--o)' }}><Icon n="FileText" s={18} /></div>
            <div className="t"><b>{c.filename}</b><span>{c.best_score != null ? c.best_score + '% best score' : 'Not analysed yet'}</span></div>
            <button className="iconmini" onClick={() => removeCv(c.id)} aria-label="Remove CV"><Icon n="Trash2" s={14} /></button></div>))}
          {cvs.data && !cvs.data.length && <p className="sub" style={{ fontSize: 12.5 }}>No CVs yet. <a className="link" onClick={() => navigate('analyse')}>Upload one</a></p>}</div></div>
      <div className="card"><div className="ch"><h2>Reminders</h2></div>
        <div className="list">{[['Bell', 'Follow-up emails', 'Two days before each follow-up', 'follow_up'], ['Calendar', 'Interview reminders', 'The day before', 'interview'], ['Zap', 'Weekly tips', 'One email on Mondays', 'tips']].map((r) => (
          <div key={r[3]} className="it"><Icon n={r[0]} s={19} c="var(--ink2)" /><div className="t"><b>{r[1]}</b><span>{r[2]}</span></div>
            <Toggle on={!!s[r[3]]} label={r[1]} onChange={(v) => save({ settings: { [r[3]]: v } }, v ? 'Reminder on' : 'Reminder off')} /></div>))}</div>
        <h2 style={{ margin: '20px 0 12px' }}>Account</h2>
        <div className="list">
          <div className="it"><Icon n="Mail" s={19} c="var(--ink2)" /><div className="t"><b>{user.email}</b><span>Email address</span></div></div>
          <div className="it click" onClick={() => setPw({ current: '', next: '', err: {} })}><Icon n="Lock" s={19} c="var(--ink2)" /><div className="t"><b>Change password</b></div><Icon n="ChevronRight" s={16} c="#B5AEA7" /></div>
          {user.role === 'admin' && <div className="it click" onClick={() => navigate('admin')}><Icon n="Shield" s={19} c="var(--ink2)" /><div className="t"><b>Admin workspace</b></div><Icon n="ChevronRight" s={16} c="#B5AEA7" /></div>}
        </div></div>
      <div className="card"><div className="ch"><h2>Your data</h2><span className="chip c-b"><Icon n="Shield" s={12} />POPIA</span></div>
        <p className="sub" style={{ fontSize: 12.5, marginBottom: 14 }}>Your CV is only used to analyse your job matches. You can take a copy or remove everything at any time.</p>
        <button className="databtn" onClick={exportData}><Icon n="Download" s={20} c="var(--ink2)" /><div style={{ flex: 1, textAlign: 'left' }}><b style={{ fontSize: 13 }}>Download my data</b><div className="sub" style={{ fontSize: 12 }}>CVs, reports, applications, journal (JSON)</div></div><Icon n="ChevronRight" s={16} c="#B5AEA7" /></button>
        <button className="databtn danger" onClick={() => setDelOpen(true)}><Icon n="Trash2" s={20} c="#D9433A" /><div style={{ flex: 1, textAlign: 'left' }}><b style={{ fontSize: 13, color: 'var(--red)' }}>Delete my account</b><div style={{ fontSize: 12, color: '#9C4A44' }}>Removes everything permanently</div></div><Icon n="ChevronRight" s={16} c="#D9433A" /></button></div>
    </div>

    <Modal open={!!edit} onClose={() => setEdit(null)}>{edit && <>
      <h2 style={{ marginBottom: 14 }}>Edit profile</h2>
      <Field id="pn" label="Full name" icon="User" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} error={!edit.name.trim() ? 'Name is required' : ''} />
      <Field id="ph" label="Headline" icon="Briefcase" value={edit.headline} onChange={(v) => setEdit({ ...edit, headline: v })} />
      <div className="grid g2" style={{ gap: 12 }}><Field id="pc" label="City" icon="MapPin" value={edit.city} onChange={(v) => setEdit({ ...edit, city: v })} />
        <Field id="pe" label="Experience" icon="Clock" value={edit.experience} onChange={(v) => setEdit({ ...edit, experience: v })} /></div>
      <div className="row" style={{ gap: 10, marginTop: 6 }}><button className="btn" disabled={!edit.name.trim()} onClick={async () => { if (await save(edit, 'Profile updated')) setEdit(null); }}>Save changes</button><button className="btn ghost" onClick={() => setEdit(null)}>Cancel</button></div></>}
    </Modal>
    <Modal open={!!pw} onClose={() => setPw(null)}>{pw && <>
      <h2 style={{ marginBottom: 14 }}>Change password</h2>
      <PasswordField id="pw1" label="Current password" value={pw.current} onChange={(v) => setPw({ ...pw, current: v, err: {} })} error={pw.err.current} autoComplete="current-password" />
      <PasswordField id="pw2" label="New password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v, err: {} })} ph="At least 8 characters" error={pw.err.next} autoComplete="new-password" />
      <div className="row" style={{ gap: 10, marginTop: 6 }}><button className="btn" onClick={changePw}>Update password</button><button className="btn ghost" onClick={() => setPw(null)}>Cancel</button></div></>}
    </Modal>
    <ConfirmModal open={delOpen} onClose={() => setDelOpen(false)} onConfirm={deleteAccount} title="Delete your account?" typeToConfirm="DELETE" confirmText="Delete account"
      body="Your CVs, reports, applications and journal entries will be removed permanently. This cannot be undone." />
  </>);
}
