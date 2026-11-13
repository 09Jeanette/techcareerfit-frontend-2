// Download and delete actions for a saved CV, shared by My CV (Analyse) and Profile.
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { Modal, toastError, useToast } from './ui';
import { api, del, get, saveResponse } from '../lib/api';
import { downloadBlob } from '../lib/format';

// GET /cvs/{id} returns either the original file or the CV record as JSON (then its text is saved as .txt).
export async function downloadCv(c) {
  const res = await api(`/cvs/${c.id}`, { raw: true });
  if (!(res.headers.get('Content-Type') || '').includes('application/json')) return saveResponse(res, c.filename || 'cv');
  const data = await res.json();
  const text = data.extracted_text ?? data.text;
  if (!text) throw new Error('This CV has no saved text to download.');
  downloadBlob((c.filename || 'cv').replace(/\.[^.]+$/, '') + '.txt', text, 'text/plain;charset=utf-8');
}

export function CvButtons({ cv, onDelete }) {
  const toast = useToast();
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const download = async () => { try { await downloadCv(cv); } catch (ex) { toastError(toast, ex); } };
  return (<>
    <button className="iconmini" onClick={stop(download)} aria-label="Download CV" title="Download CV"><Icon n="Download" s={14} /></button>
    <button className="iconmini" onClick={stop(() => onDelete(cv))} aria-label="Remove CV" title="Remove CV"><Icon n="Trash2" s={14} /></button>
  </>);
}

// Deleting a CV removes the document itself. Reports scored with it keep their score, skills and evidence
// (shown as "CV deleted") unless the user also ticks "delete its reports".
export function DeleteCvModal({ cv, onClose, onDeleted }) {
  const toast = useToast();
  const [usage, setUsage] = useState(null);
  const [withReports, setWithReports] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cv) return;
    setUsage(null); setWithReports(false);
    Promise.all([get('/reports'), get('/applications')])
      .then(([reps, apps]) => setUsage({ reports: reps.filter((r) => r.cv_id === cv.id), apps: apps.filter((a) => a.cv_id === cv.id).length }))
      .catch(() => setUsage({ reports: [], apps: 0, unknown: true }));
  }, [cv]);

  const confirm = async () => {
    setBusy(true);
    try {
      if (withReports) for (const r of usage.reports) await del('/reports/' + r.id);
      await del('/cvs/' + cv.id);
      onDeleted(cv.id);
      toast(withReports && usage.reports.length ? `CV and ${usage.reports.length} report${usage.reports.length > 1 ? 's' : ''} deleted` : 'CV deleted', 'Trash2', '#FF9A72');
      onClose();
    } catch (ex) { toastError(toast, ex); } finally { setBusy(false); }
  };

  const n = usage?.reports.length || 0;
  const plural = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;
  let used = 'It is not used by any report or application.';
  if (usage?.unknown) used = 'Reports and applications that used it keep their scores.';
  else if (n || usage?.apps) used = `${[n && plural(n, 'report'), usage.apps && plural(usage.apps, 'application')].filter(Boolean).join(' and ')} used this CV. They keep their scores and skills, marked "CV deleted".`;

  return (
    <Modal open={!!cv} onClose={onClose}>{cv && <>
      <div className="mic danger"><Icon n="Trash2" s={26} c="var(--red)" /></div>
      <h2 style={{ textAlign: 'center' }}>Delete {cv.filename}?</h2>
      <p className="sub" style={{ textAlign: 'center', margin: '6px 0 16px' }}>
        {usage ? used : 'Checking where this CV is used…'} The CV file and its text are removed permanently.</p>
      {n > 0 && (
        <label className="row" style={{ gap: 10, fontSize: 13, margin: '0 0 16px', cursor: 'pointer' }}>
          <input type="checkbox" className="cbx" checked={withReports} onChange={(e) => setWithReports(e.target.checked)} />
          <span>Also delete its {plural(n, 'report')}</span></label>)}
      <div className="row" style={{ gap: 10 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn" style={{ flex: 1, background: 'var(--red)', boxShadow: 'none' }} disabled={!usage || busy} onClick={confirm}>
          {busy ? 'Deleting…' : 'Delete CV'}</button>
      </div>
    </>}</Modal>
  );
}
