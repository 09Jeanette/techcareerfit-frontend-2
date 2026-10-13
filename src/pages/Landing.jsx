import { useEffect, useRef, useState } from 'react';
import hero from '../assets/hero.png';
import Icon from '../components/Icon';
import { Modal, Num, Ring } from '../components/ui';
import { navigate } from '../lib/router';

const SKILLS = ['Python', 'SQL', 'React', 'Docker', 'Java', 'AWS', 'Power BI', 'Linux', 'Git', 'Kubernetes', 'C#', 'Excel', 'FastAPI', 'Node.js', 'Azure', 'Figma'];
const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function Reveal({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setIn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`rv ${inView ? 'in' : ''} ${className}`} style={{ '--d': `${delay}s` }} {...rest}>{inView ? children : children}</Tag>;
}

const Bar = ({ label, v }) => (
  <div style={{ marginBottom: 10 }}>
    <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>{label}</span><b>{v}%</b></div>
    <div className="bar"><i style={{ width: v + '%' }} /></div>
  </div>
);

export default function Landing() {
  const [sample, setSample] = useState(false);
  const [terms, setTerms] = useState(false);
  return (
    <section className="screen lp">
      <div className="lights" aria-hidden="true"><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /></div>
      <div className="gridfx" aria-hidden="true" />
      <header className="lp-nav">
        <div className="brand" style={{ color: 'var(--ink)', margin: 0 }}><span className="mark">tc</span><span>TechCareer<b>Fit</b></span></div>
        <nav className="lp-links">
          <a onClick={() => scrollTo('features')}>Features</a><a onClick={() => scrollTo('how')}>How it works</a>
          <a onClick={() => scrollTo('students')}>For students</a><a onClick={() => scrollTo('privacy')}>Privacy</a>
        </nav>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn ghost sm hide-m" onClick={() => navigate('login')}>Log in</button>
          <button className="btn sm" onClick={() => navigate('register')}>Get started</button>
        </div>
      </header>

      <div className="lp-hero">
        <div className="lp-copy">
          <span className="lp-pill"><span className="dotlive" />New: learning roadmaps for every missing skill</span>
          <h1 className="lp-h1">Get hired faster<br />with <span className="glowtext">smarter CVs.</span></h1>
          <p className="lp-sub">Upload your CV, paste a real job ad and see exactly why you match. TechCareerFit shows the skills you are missing and builds a plan to close the gap.</p>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <button className="btn lg glow" onClick={() => navigate('register')}>Analyse my CV free <Icon n="ArrowRight" /></button>
            <button className="btn ghost lg" onClick={() => setSample(true)}><Icon n="PlayCircle" />See a sample report</button>
          </div>
          <div className="lp-proof">
            <div className="avs">{[['TM', '#FFB08A,#FF5B1F'], ['LS', '#9BB7FF,#3E6BE0'], ['NK', '#8FE3B4,#1F9D5A'], ['+', '#C9B5FF,#7B5BD6']].map(([t, g]) =>
              <span key={t} className="av sm" style={{ background: `linear-gradient(135deg,${g})` }}>{t}</span>)}</div>
            <span>Built for ICT students, graduates and early-career developers in South Africa</span>
          </div>
        </div>
        <div className="lp-visual">
          <div className="halo" aria-hidden="true" /><div className="halo2" aria-hidden="true" />
          <div className="stage">
            <img src={hero} alt="Student analysing her CV on a laptop" className="lp-img" />
            <div className="glass f1"><Ring pct={0.71} size={70} stroke={7} big="71%" fs={16} /><div><b>ATS score</b><span>Junior Python Dev</span></div></div>
            <div className="glass f2"><span className="ico" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}><Icon n="XCircle" s={16} /></span><div><b>1 skill missing</b><span className="chip c-r" style={{ padding: '2px 8px', fontSize: 11 }}>docker</span></div></div>
            <div className="glass f3"><span className="ico" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}><Icon n="Calendar" s={16} /></span><div><b>Interview booked</b><span>TUT · Tue 10:00</span></div></div>
            <div className="glass f4"><span className="ico" style={{ background: 'var(--peach)', color: 'var(--o)' }}><Icon n="TrendingUp" s={16} /></span><div><b>+25% score</b><span>since first analysis</span></div></div>
            <span className="spark s1" /><span className="spark s2" /><span className="spark s3" />
          </div>
        </div>
      </div>

      <Reveal className="marquee"><div className="mq-label">Skills we recognise in job ads</div>
        <div className="mq"><div className="mq-track">{[...SKILLS, ...SKILLS].map((s, i) => <span key={i}>{s}</span>)}</div></div></Reveal>

      <div className="lp-sec" id="how">
        <Reveal className="lp-head"><span className="lp-kick">How it works</span><h2>From CV to plan in about a minute</h2></Reveal>
        <div className="steps3">
          {[['Upload', 'Add your CV', 'PDF, DOCX or pasted text. We read it in seconds.'], ['FileText', 'Paste the job ad', 'Use the full advert, including requirements.'], ['Target', 'Get your score and plan', 'See the evidence, the gaps and what to learn next.']].map((s, i) => (
            <div key={s[1]} style={{ display: 'contents' }}>
              {i > 0 && <Reveal className="connector" aria-hidden="true" />}
              <Reveal className="step" delay={i * 0.12}><div className="num"><Icon n={s[0]} s={22} /></div><h3>{s[1]}</h3><p>{s[2]}</p></Reveal>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-sec" id="features">
        <Reveal className="lp-head"><span className="lp-kick">Features</span><h2>Everything for your job search, in one place</h2></Reveal>
        <div className="bento">
          <Reveal className="bx big"><div className="bx-t"><h3>Explainable ATS score</h3><p>Every point is traced to words in your CV.</p></div>
            <div className="mini-report"><Ring pct={0.71} size={120} stroke={12} big="71%" small="Good match" fs={28} sc="var(--green)" />
              <div style={{ flex: 1 }}><Bar label="Keywords" v={75} /><Bar label="Experience" v={76} /><Bar label="Certifications" v={55} />
                <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{['python', 'react', 'sql'].map((k) => <span key={k} className="chip c-g">{k}</span>)}<span className="chip c-r">docker</span></div></div></div>
            <div className="row" style={{ marginTop: 16, gap: 12, background: 'var(--card)', borderRadius: 16, padding: '14px 16px', boxShadow: '0 10px 30px rgba(120,60,20,.08)' }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--peach)', display: 'grid', placeItems: 'center', color: 'var(--o)' }}><Icon n="Zap" s={19} /></span>
              <div style={{ flex: 1 }}><b style={{ fontSize: 13.5 }}>Learn Docker to reach about 84%</b><div className="sub" style={{ fontSize: 12 }}>(75 × 50%) + (76 × 30%) + (55 × 20%) = 71%</div></div></div></Reveal>
          <Reveal className="bx"><div className="bx-t"><h3>Learning roadmap</h3><p>A resource for every missing skill.</p></div>
            {[['Docker get started guide', 1], ['Containerise a FastAPI app', 0], ['pytest basics', 0]].map(([t, d]) => <div key={t} className="row mini-it"><span className={'ck' + (d ? ' on' : '')}>{d ? <Icon n="Check" s={12} c="#fff" w={3} /> : null}</span>{t}</div>)}</Reveal>
          <Reveal className="bx"><div className="bx-t"><h3>Application tracker</h3><p>Statuses, dates and reminders.</p></div>
            <div className="row" style={{ gap: 8 }}>{[['Applied', 2, '#86807A'], ['Interview', 1, '#FF5B1F'], ['Hired', 0, '#1F9D5A']].map(([l, n, c]) => (
              <div key={l} className="kcol"><span className="row" style={{ gap: 6, fontSize: 11.5, fontWeight: 600 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}</span>
                {n ? Array.from({ length: n }).map((_, i) => <div key={i} className="kcard" />) : <div className="kcard empty" />}</div>))}</div></Reveal>
          <Reveal className="bx"><div className="bx-t"><h3>Market insights</h3><p>Demand and salaries for your role.</p></div>
            <div className="minibars">{[40, 52, 47, 61, 70, 84, 92].map((v, i) => <i key={i} style={{ height: v + '%', animationDelay: i * 0.07 + 's', background: i === 6 ? 'var(--o)' : undefined }} />)}</div></Reveal>
          <Reveal className="bx dark"><div className="bx-t"><h3 style={{ color: '#fff' }}>Private by design</h3><p style={{ color: '#BDB8B2' }}>Your CV is only used for your analysis. Download or delete your data at any time (POPIA).</p></div><span className="shield"><Icon n="Shield" s={28} c="#fff" /></span></Reveal>
        </div>
      </div>

      <div className="lp-sec" id="students">
        <Reveal className="lp-head"><span className="lp-kick">For students</span><h2>Made for your first tech job</h2></Reveal>
        <div className="grid g3">{[['Award', 'Free while you study', 'Every feature is free for students and recent graduates. No card needed.'], ['MapPin', 'Built for South Africa', 'Market data, salaries and job boards that match the local ICT market.'], ['Zap', 'Works on your phone', 'Analyse a CV and track applications from anywhere, even on a slow connection.']].map((c, i) =>
          <Reveal key={c[1]} className="step" delay={i * 0.1}><div className="num"><Icon n={c[0]} s={22} /></div><h3>{c[1]}</h3><p>{c[2]}</p></Reveal>)}</div>
      </div>

      <div className="lp-sec" id="privacy">
        <Reveal className="privacy"><div className="pv-ic"><Icon n="Shield" s={30} c="#fff" /></div><div style={{ flex: 1 }}>
          <span className="lp-kick" style={{ background: 'rgba(255,255,255,.12)', color: '#FFB896' }}>Privacy</span>
          <h2 style={{ fontSize: 32, color: '#fff', letterSpacing: -0.8, margin: '6px 0 10px' }}>Your CV stays yours</h2>
          <div className="grid g3" style={{ gap: 16, marginTop: 16 }}>{[['Lock', 'Encrypted and private', 'Passwords are hashed and every connection uses HTTPS.'], ['Eye', 'Only used for you', 'Your CV is used for your analysis and nothing else. It is never sold or shared.'], ['Trash2', 'Delete any time', 'Download your data or delete your account from Settings, in line with POPIA.']].map((p) =>
            <div key={p[1]}><div className="row" style={{ gap: 8, color: '#fff', fontWeight: 600, marginBottom: 4 }}><Icon n={p[0]} s={17} c="#FF8A55" />{p[1]}</div><p style={{ color: '#BDB8B2', fontSize: 13.5 }}>{p[2]}</p></div>)}</div></div></Reveal>
      </div>

      <Reveal className="lp-stats">{[['34', '+', 'skills recognised per ad'], ['3', 's', 'typical analysis time'], ['100', '%', 'free for students']].map(([n, u, l]) =>
        <div key={l}><b><Num v={n} /></b><em>{u}</em><span>{l}</span></div>)}</Reveal>

      <Reveal className="lp-cta"><div className="rays" aria-hidden="true" /><h2>Know your match before you apply.</h2><p>Free for students. Your first report takes about a minute.</p>
        <button className="btn lg" onClick={() => navigate('register')} style={{ background: '#fff', color: 'var(--o-deep)', boxShadow: '0 14px 34px rgba(0,0,0,.18)' }}>Create free account <Icon n="ArrowRight" /></button></Reveal>

      <footer className="lp-foot">
        <div className="brand" style={{ color: 'var(--ink)', margin: 0, fontSize: 15 }}><span className="mark" style={{ width: 28, height: 28, fontSize: 12 }}>tc</span><span>TechCareer<b>Fit</b></span></div>
        <div className="row" style={{ gap: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a onClick={() => scrollTo('privacy')}>Privacy</a><a onClick={() => setTerms(true)}>Terms</a><a onClick={() => scrollTo('how')}>Help</a>
          <span>© {new Date().getFullYear()} TechCareerFit. All rights reserved.</span>
        </div>
      </footer>

      <Modal open={sample} onClose={() => setSample(false)}>
        <span className="chip c-o" style={{ marginBottom: 10 }}><Icon n="Eye" s={12} />Sample report</span>
        <h2 style={{ fontSize: 22 }}>Junior Python Developer</h2>
        <p className="sub" style={{ marginBottom: 18 }}>This is what you get after analysing a CV against a job ad.</p>
        <div className="row" style={{ gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <Ring pct={0.71} size={150} stroke={15} big="71%" small="Good match" fs={36} sc="var(--green)" />
          <div style={{ flex: 1, minWidth: 220 }}><Bar label="Keywords · 50%" v={75} /><Bar label="Experience · 30%" v={76} /><Bar label="Certifications · 20%" v={55} />
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{['python', 'react', 'sql'].map((k) => <span key={k} className="chip c-g">{k}</span>)}<span className="chip c-r">docker</span></div></div>
        </div>
        <div className="calc">(75 × 50%) + (76 × 30%) + (55 × 20%) = 71%</div>
        <div className="row" style={{ gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate('register')}>Analyse my own CV <Icon n="ArrowRight" s={16} /></button>
          <button className="btn ghost" onClick={() => setSample(false)}>Close</button>
        </div>
      </Modal>
      <Modal open={terms} onClose={() => setTerms(false)}>
        <h2 style={{ fontSize: 20, marginBottom: 10 }}>Terms and privacy</h2>
        <p className="sub" style={{ marginBottom: 10 }}>TechCareerFit analyses your CV only to compare it with the job ads you provide. We do not sell or share your data.</p>
        <p className="sub" style={{ marginBottom: 14 }}>Scores are guidance only and are not hiring decisions. You can download or delete your data at any time from Settings, in line with POPIA.</p>
        <button className="btn" onClick={() => setTerms(false)}>Got it</button>
      </Modal>
    </section>
  );
}
