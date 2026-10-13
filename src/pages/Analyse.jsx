import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { ErrorBox, Field, Loading, Modal, Ring, toastError, useApi, useToast } from '../components/ui';
import { del, post, upload } from '../lib/api';
import { fmtDate } from '../lib/format';
import { navigate } from '../lib/router';

// Mirrors the backend alias list closely enough for a live preview of detected skills.
const PREVIEW_SKILLS = ['python', 'fastapi', 'django', 'sql', 'react', 'javascript', 'typescript', 'docker', 'kubernetes', 'git', 'unit testing',
  'java', 'c#', 'aws', 'azure', 'linux', 'networking', 'excel', 'power bi', 'figma', 'node.js', 'rest api'];
const detect = (t) => PREVIEW_SKILLS.filter((k) => new RegExp('(^|[^a-z0-9])' + k.replace(/[.+#]/g, (m) => '\\' + m) + '([^a-z0-9]|$)', 'i').test(t));
const SAMPLE_AD = 'We are looking for a junior developer to join our platform team. You will build APIs in Python and FastAPI, work with SQL databases, ship features in React and package services with Docker. Experience with Git and unit testing is a plus.';
const CHECKS = ['Extracting text', 'Matching skills', 'Scoring experience', 'Building your report'];

export default function Analyse() {
  const toast = useToast();
  const cvs = useApi('/cvs');
  const [step, setStep] = useState(1);
  const [cvId, setCvId] = useState(null);
  const [title, setTitle] = useState(sessionStorage.getItem('tcf_role') || 'Junior Python Developer');
  const [ad, setAd] = useState(sessionStorage.getItem('tcf_ad') || '');
  const [adErr, setAdErr] = useState('');
  const [paste, setPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const detected = useMemo(() => detect(title + ' ' + ad), [title, ad]);

  useEffect(() => { sessionStorage.removeItem('tcf_role'); sessionStorage.removeItem('tcf_ad'); }, []);
  useEffect(() => { if (cvs.data && !cvId && cvs.data.length) setCvId(cvs.data[0].id); }, [cvs.data, cvId]);

  if (cvs.loading) return <Loading />;
  if (cvs.error) return <ErrorBox error={cvs.error} retry={cvs.reload} />;
  const list = cvs.data;
  const cv = list.find((c) => c.id === cvId);

  const onFile = async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!/\.(pdf|docx|txt)$/i.test(f.name)) { toast('Only PDF, DOCX or TXT files', 'AlertTriangle', '#FF9A72'); return; }
    setBusy(true);
    try { const c = await upload('/cvs/upload', f); cvs.setData((d) => [c, ...d]); setCvId(c.id); toast(`CV uploaded · ${c.skills.length} skills found`); }
    catch (ex) { toastError(toast, ex); } finally { setBusy(false); }
  };
  const savePaste = async () => {
    if (pasteText.trim().length < 20) { toast('Paste at least a few lines of your CV', 'AlertTriangle', '#FF9A72'); return; }
    try { const c = await post('/cvs/text', { text: pasteText }); cvs.setData((d) => [c, ...d]); setCvId(c.id); setPaste(false); setPasteText(''); toast(`CV saved · ${c.skills.length} skills found`); }
    catch (ex) { toastError(toast, ex); }
  };
  const removeCv = async (id) => {
    try { await del('/cvs/' + id); cvs.setData((d) => d.filter((c) => c.id !== id)); if (cvId === id) setCvId(null); toast('CV removed', 'Trash2', '#FF9A72'); }
    catch (ex) { toastError(toast, ex); }
  };
  const run = async () => {
    if (ad.trim().length < 40) { setAdErr('Paste the full job description (at least a few sentences)'); return; }
    setStep(3); setProgress(0);
    const t0 = performance.now();
    let raf;
    const tick = (now) => { setProgress(Math.min(0.92, (now - t0) / 2600)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    try {
      const [rep] = await Promise.all([post('/ats/score', { cv_id: cvId, job_title: title || 'Untitled role', job_description: ad }), new Promise((r) => setTimeout(r, 2200))]);
      cancelAnimationFrame(raf); setProgress(1);
      setTimeout(() => { navigate('report/' + rep.id); toast(`Analysis complete: ${rep.score}%`); }, 400);
    } catch (ex) { cancelAnimationFrame(raf); setStep(2); toastError(toast, ex); }
  };

  const stepper = (
    <div className="card" style={{ padding: '16px 22px', marginBottom: 18 }}><div className="row" style={{ gap: 0 }}>
      {['Your CV', 'The job', 'Your results'].map((s, i) => {
        const st = i + 1 < step ? 'done' : i + 1 === step ? 'on' : '';
        return (<div key={s} className="row" style={{ flex: 1, gap: 10 }}>
          <span className={'stepn ' + st}>{st === 'done' ? <Icon n="Check" s={16} c="#fff" w={3} /> : i + 1}</span>
          <b style={{ fontSize: 13.5, color: st ? 'var(--ink)' : 'var(--muted)' }}>{s}</b>
          {i < 2 && <span className="hide-m" style={{ flex: 1, height: 3, borderRadius: 3, margin: '0 16px', background: i + 1 < step ? 'var(--o)' : 'var(--track)' }} />}
        </div>);
      })}</div></div>
  );

  return (<>
    <div className="head"><div><h1>Analyse your CV</h1><div className="sub">Compare your CV with a real job ad in three steps.</div></div></div>
    {stepper}
    {step === 1 && (
      <div className="card"><div className="ch"><h2>Choose your CV</h2><span className="sub" style={{ fontSize: 12 }}>Step 1 of 3</span></div>
        <label className="drop" htmlFor="cvFile"><div className="dz-ic"><Icon n="Upload" s={24} c="#fff" /></div>
          <b>{busy ? 'Uploading…' : 'Drop a PDF or DOCX here, or click to browse'}</b><div className="sub" style={{ fontSize: 12 }}>Max 5 MB</div>
          <input type="file" id="cvFile" ref={fileRef} accept=".pdf,.docx,.txt" hidden onChange={onFile} /></label>
        <button className="btn ghost" style={{ width: '100%', margin: '12px 0 16px' }} onClick={() => setPaste(true)}><Icon n="FileText" s={16} />Paste CV text instead</button>
        {list.length > 0 && <><div className="lab">Saved CVs</div>
          <div className="grid g2" style={{ gap: 12 }}>{list.map((c) => (
            <div key={c.id} className={'pick' + (c.id === cvId ? ' on' : '')} onClick={() => setCvId(c.id)} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
              <Ring pct={(c.best_score || 0) / 100} size={50} stroke={6} big={c.best_score != null ? String(c.best_score) : '–'} fs={14} col={c.id === cvId ? '#FF5B1F' : '#C9C1B9'} />
              <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.filename}</b>
                <div className="sub" style={{ fontSize: 12 }}>Added {fmtDate(c.created_at)} · {c.skills.length} skills</div></div>
              <button className="iconmini" onClick={(e) => { e.stopPropagation(); removeCv(c.id); }} aria-label="Remove CV"><Icon n="Trash2" s={14} /></button>
            </div>))}</div></>}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn" disabled={!cv} onClick={() => setStep(2)}>Next: the job <Icon n="ArrowRight" s={16} /></button></div>
      </div>)}
    {step === 2 && cv && (
      <div className="grid g12">
        <div className="card"><div className="ch"><h2>Your CV</h2><a className="link" onClick={() => setStep(1)}>Change</a></div>
          <div className="pick on"><Icon n="FileText" s={22} c="var(--o)" /><div style={{ flex: 1 }}><b>{cv.filename}</b><div className="sub" style={{ fontSize: 12 }}>{cv.skills.length} skills found in this CV</div></div></div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 14 }}>{cv.skills.map((s) => <span key={s} className="chip c-m">{s}</span>)}</div></div>
        <div className="card"><div className="ch"><h2>The job</h2><span className={'chip ' + (detected.length ? 'c-g' : 'c-m')}><Icon n="CheckCircle" s={13} />{detected.length} skills detected</span></div>
          <Field id="jTitle" label="Job title" icon="Briefcase" value={title} onChange={setTitle} ph="e.g. Junior Python Developer" />
          <div className="fld"><div className="lab"><label htmlFor="jAd">Job description</label><a className="link" onClick={() => { setAd(SAMPLE_AD); setAdErr(''); }}>Use a sample ad</a></div>
            <div className={'inp' + (adErr ? ' bad' : '')} style={{ alignItems: 'flex-start' }}><textarea id="jAd" rows={7} placeholder="Paste the full job ad here" value={ad} onChange={(e) => { setAd(e.target.value); setAdErr(''); }} /></div>
            {adErr && <div className="err">{adErr}</div>}</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{detected.map((k) => <span key={k} className="chip c-o">{k}</span>)}</div>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 18 }}>
            <span className="sub" style={{ fontSize: 12 }}>{ad.length.toLocaleString()} / 50,000 characters</span>
            <button className="btn" onClick={run}><Icon n="Zap" s={16} />Analyse CV</button></div></div>
      </div>)}
    {step === 3 && (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ display: 'grid', placeItems: 'center' }}><Ring pct={progress} size={170} stroke={14} big={Math.round(progress * 100) + '%'} small="Scoring" fs={38} count={false} live /></div>
        <h2 style={{ fontSize: 20, marginTop: 18 }}>Reading your CV</h2><p className="sub">This usually takes a few seconds.</p>
        <div className="checks">{CHECKS.map((s, i) => <div key={s} className={'row ck-row' + (progress > (i + 1) / 4.3 ? ' done' : '')}><span className="ck"><Icon n="Check" s={12} c="#fff" w={3} /></span>{s}</div>)}</div>
      </div>)}
    <Modal open={paste} onClose={() => setPaste(false)}>
      <h2 style={{ marginBottom: 6 }}>Paste your CV</h2><p className="sub" style={{ marginBottom: 14 }}>Plain text works best. We will save it as a CV you can reuse.</p>
      <div className="inp" style={{ alignItems: 'flex-start' }}><textarea rows={8} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your CV text here" autoFocus /></div>
      <div className="row" style={{ gap: 10, marginTop: 14 }}><button className="btn" onClick={savePaste}>Use this CV</button><button className="btn ghost" onClick={() => setPaste(false)}>Cancel</button></div>
    </Modal>
  </>);
}
