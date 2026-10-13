import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { api } from '../lib/api';

// ---------- animated number (counts up from zero)
export function Num({ v }) {
  const m = String(v).match(/^(\d+)(%?)$/);
  const [shown, setShown] = useState(m ? '0' + m[2] : String(v));
  useEffect(() => {
    if (!m) { setShown(String(v)); return undefined; }
    const end = +m[1], suf = m[2], t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 1200);
      setShown(Math.round(end * (1 - Math.pow(1 - p, 3))) + suf);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}

// ---------- progress ring
export function Ring({ pct, size, stroke, big, small, track = 'var(--peach2)', col = '#FF5B1F', bc, sc = 'var(--muted)', fs, ss = 12, count = true, live = false }) {
  const r = (size - stroke) / 2, C = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${C * Math.max(0, Math.min(1, pct))} ${C}`} style={live ? { animation: 'none', transition: 'stroke-dasharray .2s linear' } : undefined} />
      </svg>
      <div className="in">
        {big != null && <b style={{ fontSize: fs || size / 4.2, color: bc }}>{count ? <Num v={big} /> : big}</b>}
        {small && <span style={{ fontSize: ss, color: sc }}>{small}</span>}
      </div>
    </div>
  );
}

// ---------- form field
export function Field({ id, label, value, onChange, icon, type = 'text', ph, opt, area, rows = 3, error, after, autoComplete, onKeyDown, inputRef }) {
  return (
    <div className="fld">
      {label && <label className="lab" htmlFor={id}>{label}{opt && <i>Optional</i>}</label>}
      <div className={'inp' + (error ? ' bad' : '')} style={area ? { alignItems: 'flex-start' } : undefined}>
        {icon && <Icon n={icon} s={17} c="var(--muted)" />}
        {area
          ? <textarea id={id} rows={rows} placeholder={ph} value={value} onChange={(e) => onChange(e.target.value)} ref={inputRef} />
          : <input id={id} type={type} placeholder={ph} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} onKeyDown={onKeyDown} ref={inputRef} />}
        {after}
      </div>
      {error && <div className="err">{error}</div>}
    </div>
  );
}

export function PasswordField(props) {
  const [show, setShow] = useState(false);
  return <Field {...props} type={show ? 'text' : 'password'} icon="Lock"
    after={<button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon n={show ? 'EyeOff' : 'Eye'} c="var(--muted)" /></button>} />;
}

export const Toggle = ({ on, onChange, label }) => (
  <button type="button" className={'tog' + (on ? ' on' : '')} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)}><i /></button>
);

// ---------- modal
export function Modal({ open, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-wrap on" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">
        <button className="mclose" onClick={onClose} aria-label="Close"><Icon n="X" /></button>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, body, confirmText = 'Delete', typeToConfirm }) {
  const [typed, setTyped] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setTyped(''); setErr(''); } }, [open]);
  return (
    <Modal open={open} onClose={onClose}>
      <div className="mic danger"><Icon n="Trash2" s={26} c="var(--red)" /></div>
      <h2 style={{ textAlign: 'center' }}>{title}</h2>
      <p className="sub" style={{ textAlign: 'center', margin: '6px 0 16px' }}>{body}</p>
      {typeToConfirm && <Field id="confirm" label={`Type ${typeToConfirm} to confirm`} value={typed} onChange={setTyped} ph={typeToConfirm} error={err} />}
      <div className="row" style={{ gap: 10 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn" style={{ flex: 1, background: 'var(--red)', boxShadow: 'none' }}
          onClick={() => { if (typeToConfirm && typed.trim() !== typeToConfirm) { setErr(`Type ${typeToConfirm} in capitals`); return; } onConfirm(); }}>{confirmText}</button>
      </div>
    </Modal>
  );
}

// ---------- popover (closes on outside click)
export function Popover({ open, onClose, children, width = 340, align = 'right' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[data-pop-anchor]')) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  if (!open) return null;
  return <div ref={ref} className="pop on" style={{ width, top: 'calc(100% + 8px)', [align]: 0, maxWidth: 'calc(100vw - 20px)' }}>{children}</div>;
}

// ---------- toast
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [t, setT] = useState(null);
  const timer = useRef();
  const toast = useCallback((msg, icon = 'CheckCircle', col = '#7FD6A2') => {
    setT({ msg, icon, col, k: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (t ? ' show' : '')} role="status" aria-live="polite">{t && <><Icon n={t.icon} c={t.col} />{t.msg}</>}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
export const toastError = (toast, e) => toast(e?.message || 'Something went wrong', 'AlertTriangle', '#FF9A72');

// ---------- data loading
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: !!path, error: null, path });
  const load = useCallback(async () => {
    if (!path) { setState({ data: null, loading: false, error: null, path }); return; }
    setState((s) => ({ ...s, loading: true, error: null, path }));
    try { const data = await api(path); setState({ data, loading: false, error: null, path }); }
    catch (e) { setState({ data: null, loading: false, error: e, path }); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  // While a new path is being fetched, report loading so pages never render stale or empty data.
  const stale = state.path !== path;
  return {
    data: stale ? null : state.data, error: stale ? null : state.error, loading: !!path && (stale || state.loading),
    reload: load, setData: (d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })),
  };
}

export const Loading = ({ text = 'Loading…' }) => <div className="loading"><div className="spinner" /><span>{text}</span></div>;
export const ErrorBox = ({ error, retry }) => (
  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
    <div className="mic danger"><Icon n="AlertTriangle" s={26} c="var(--red)" /></div>
    <h2>Could not load this page</h2><p className="sub" style={{ margin: '6px 0 16px' }}>{error?.message}</p>
    {retry && <button className="btn" onClick={retry}><Icon n="RefreshCw" s={16} />Try again</button>}
  </div>
);
export const Tile = ({ text, bg }) => <div className="logo" style={{ background: bg }}>{text}</div>;
