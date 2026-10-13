import { useEffect, useState } from 'react';
import hero from '../assets/hero.png';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { Field, PasswordField, useToast } from '../components/ui';
import { post } from '../lib/api';
import { navigate } from '../lib/router';

const validEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
let lastEmail = '';

function Strength({ pw }) {
  const sc = (pw.length >= 8) + /\d/.test(pw) + /[A-Z]/.test(pw) + /[^\w]/.test(pw);
  return <><div className="meter"><i style={{ width: (sc / 4) * 100 + '%', background: ['#D9433A', '#D9433A', '#D98A12', '#1F9D5A', '#1F9D5A'][sc] }} /></div>
    <div className="sub" style={{ fontSize: 11.5 }}>{pw ? ['Too short', 'Weak', 'Okay', 'Strong', 'Very strong'][sc] : 'Use 8+ characters with a number.'}</div></>;
}

export default function AuthPage({ view }) {
  const { login, register } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: lastEmail, password: '', consent: false });
  const [err, setErr] = useState({});
  const [alert, setAlert] = useState('');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(30);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (view !== 'sent') return undefined;
    setCount(30);
    const t = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [view]);

  const doLogin = async (e) => {
    e?.preventDefault();
    if (!validEmail(f.email) || !f.password) { setAlert(!f.password ? 'Enter your password.' : 'Enter a valid email address.'); return; }
    setBusy(true); setAlert('');
    try { const u = await login(f.email, f.password); navigate('home'); toast(`Welcome back, ${u.name.split(' ')[0]}`); }
    catch (ex) { setAlert(ex.message); }
    finally { setBusy(false); }
  };
  const doRegister = async (e) => {
    e?.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Enter your name';
    if (!validEmail(f.email)) er.email = 'Enter a valid email';
    if (f.password.length < 8) er.password = 'Use at least 8 characters';
    if (!f.consent) er.consent = 'Please accept to continue';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await register(f.name.trim(), f.email, f.password); navigate('home'); toast('Account created. Welcome!'); }
    catch (ex) { setErr({ email: ex.message }); }
    finally { setBusy(false); }
  };
  const doForgot = async (e) => {
    e?.preventDefault();
    if (!validEmail(f.email)) { setErr({ email: 'Enter a valid email' }); return; }
    setBusy(true);
    try { await post('/forgot-password', { email: f.email }); lastEmail = f.email; navigate('sent'); }
    catch (ex) { setErr({ email: ex.message }); }
    finally { setBusy(false); }
  };

  const brandM = <div className="mtop" style={{ marginBottom: 22 }}><div className="brand" onClick={() => navigate('landing')} style={{ color: 'var(--ink)', margin: 0, cursor: 'pointer' }}><span className="mark">tc</span><span>TechCareer<b>Fit</b></span></div></div>;
  let form;
  if (view === 'login') form = (
    <form onSubmit={doLogin} noValidate>{brandM}
      <h1>Welcome back</h1><p className="sub" style={{ margin: '6px 0 22px' }}>Log in to pick up where you left off.</p>
      {alert && <div className="alert on"><Icon n="AlertTriangle" s={17} />{alert}</div>}
      <Field id="email" label="Email" icon="Mail" type="email" value={f.email} onChange={set('email')} autoComplete="email" />
      <div className="lab" style={{ marginTop: 2 }}><span /> <a className="link" onClick={() => navigate('forgot')}>Forgot password?</a></div>
      <PasswordField id="password" label="Password" value={f.password} onChange={set('password')} autoComplete="current-password" />
      <button className="btn lg" style={{ width: '100%', marginTop: 6 }} disabled={busy}>{busy ? 'Logging in…' : <>Log in <Icon n="ArrowRight" s={17} /></>}</button>
      <div className="row" style={{ margin: '20px 0', gap: 12, color: 'var(--muted)', fontSize: 12 }}><span style={{ flex: 1, height: 1, background: 'var(--line)' }} />or<span style={{ flex: 1, height: 1, background: 'var(--line)' }} /></div>
      <button type="button" className="btn ghost lg" style={{ width: '100%' }} onClick={() => navigate('register')}>Create a free account</button>
    </form>);
  else if (view === 'register') form = (
    <form onSubmit={doRegister} noValidate>{brandM}
      <h1>Create your account</h1><p className="sub" style={{ margin: '6px 0 22px' }}>Free for students. Takes about a minute.</p>
      <Field id="name" label="Full name" icon="User" value={f.name} onChange={set('name')} ph="e.g. Jeanette Kgabe" error={err.name} autoComplete="name" />
      <Field id="email" label="Email" icon="Mail" type="email" value={f.email} onChange={set('email')} ph="you@email.com" error={err.email} autoComplete="email" />
      <PasswordField id="password" label="Password" value={f.password} onChange={set('password')} ph="At least 8 characters" error={err.password} autoComplete="new-password" />
      <Strength pw={f.password} />
      <label className="row" style={{ gap: 10, fontSize: 12.5, margin: '12px 0 4px', alignItems: 'flex-start', cursor: 'pointer' }}>
        <input type="checkbox" className="cbx" checked={f.consent} onChange={(e) => set('consent')(e.target.checked)} style={{ marginTop: 3 }} />
        <span>I agree that my CV is processed to analyse my job matches. It is never sold or shared.</span></label>
      {err.consent && <div className="err">{err.consent}</div>}
      <button className="btn lg" style={{ width: '100%', marginTop: 14 }} disabled={busy}>{busy ? 'Creating account…' : <>Create account <Icon n="ArrowRight" s={17} /></>}</button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 16 }}>Already have an account? <a className="link" onClick={() => navigate('login')}>Log in</a></p>
    </form>);
  else if (view === 'forgot') form = (
    <form onSubmit={doForgot} noValidate>{brandM}
      <a className="link" onClick={() => navigate('login')} style={{ marginBottom: 16 }}><Icon n="ChevronLeft" s={15} />Back to log in</a>
      <h1>Reset your password</h1><p className="sub" style={{ margin: '6px 0 22px' }}>Enter your email and we will send you a reset link.</p>
      <Field id="email" label="Email" icon="Mail" type="email" value={f.email} onChange={set('email')} error={err.email} />
      <button className="btn lg" style={{ width: '100%', marginTop: 6 }} disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
    </form>);
  else form = (<>{brandM}
      <div className="sent-ic"><Icon n="Mail" s={30} c="#fff" /></div>
      <h1 style={{ textAlign: 'center' }}>Check your email</h1>
      <p className="sub" style={{ textAlign: 'center', margin: '8px 0 22px' }}>If an account exists for <b style={{ color: 'var(--ink)' }}>{lastEmail || 'your email'}</b>, we sent a reset link.</p>
      <button className="btn lg" style={{ width: '100%' }} onClick={() => navigate('login')}>Back to log in</button>
      <p className="sub" style={{ textAlign: 'center', marginTop: 16 }}>Didn't get it?{' '}
        {count > 0 ? <span>Resend in 0:{String(count).padStart(2, '0')}</span>
          : <a className="link" onClick={async () => { try { await post('/forgot-password', { email: lastEmail }); toast('Reset link sent again'); setCount(30); } catch (e) { toast(e.message, 'AlertTriangle', '#FF9A72'); } }}>Resend link</a>}</p></>);

  return (
    <section className="screen lgn">
      <div className="lights" aria-hidden="true"><i className="l1" /><i className="l2" /></div>
      <div className="lgn-wrap">
        <div className="lgn-art">
          <div className="brand" onClick={() => navigate('landing')} style={{ color: 'var(--ink)', margin: 0, cursor: 'pointer' }}><span className="mark">tc</span><span>TechCareer<b>Fit</b></span></div>
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center', margin: '20px 0' }}><div className="halo" style={{ width: 400, height: 400 }} /><img src={hero} alt="" className="lp-img" style={{ width: 400 }} /></div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, textAlign: 'center' }}>Know your match before you apply</h2>
          <p className="sub" style={{ textAlign: 'center', marginTop: 6 }}>Your reports, roadmap and applications in one place.</p>
        </div>
        <div className="lgn-form card anim">{form}</div>
      </div>
    </section>
  );
}
