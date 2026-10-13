import { jsPDF } from 'jspdf';
import { fmtDate, matchLabel } from './format';

const ORANGE = [255, 91, 31], INK = [23, 22, 26], MUTED = [134, 128, 122], PEACH = [255, 241, 234], WHITE = [255, 255, 255];

// Two-page A4 ATS report that matches the app design.
export function buildReportPdf({ report: r, user, cvName, items = [], history = [] }) {
  const d = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595, M = 48;
  const date = new Date(r.created_at || Date.now()).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  const head = () => {
    d.setFillColor(...ORANGE); d.roundedRect(M, 40, 26, 26, 6, 6, 'F');
    d.setTextColor(...WHITE); d.setFont('helvetica', 'bold'); d.setFontSize(11); d.text('tc', M + 13, 57, { align: 'center' });
    d.setTextColor(...INK); d.setFontSize(13); d.text('TechCareer', M + 34, 58);
    d.setTextColor(...ORANGE); d.text('Fit', M + 34 + d.getTextWidth('TechCareer'), 58);
    d.setTextColor(...MUTED); d.setFont('helvetica', 'normal'); d.setFontSize(9); d.text(date, W - M, 58, { align: 'right' });
  };
  const foot = (n, txt) => {
    d.setDrawColor(236, 231, 226); d.setLineWidth(1); d.line(M, 800, W - M, 800);
    d.setFontSize(8.5); d.setTextColor(...MUTED); d.setFont('helvetica', 'normal');
    d.text(txt, M, 815); d.text(`Page ${n} of 2`, W - M, 815, { align: 'right' });
  };

  // ---- page 1
  head();
  d.setFillColor(...ORANGE); d.roundedRect(M, 84, W - 2 * M, 118, 14, 14, 'F');
  d.setDrawColor(255, 200, 175); d.setLineWidth(9); d.circle(M + 64, 143, 38, 'S');
  d.setDrawColor(...WHITE);
  const a0 = -Math.PI / 2, a1 = a0 + (2 * Math.PI * r.score) / 100;
  for (let t = a0; t < a1; t += 0.05) {
    const t2 = Math.min(a1, t + 0.05);
    d.line(M + 64 + 38 * Math.cos(t), 143 + 38 * Math.sin(t), M + 64 + 38 * Math.cos(t2), 143 + 38 * Math.sin(t2));
  }
  d.setTextColor(...WHITE); d.setFont('helvetica', 'bold'); d.setFontSize(20); d.text(`${r.score}%`, M + 64, 150, { align: 'center' });
  d.setFont('helvetica', 'normal'); d.setFontSize(10); d.text('ATS compatibility report', M + 124, 118);
  d.setFont('helvetica', 'bold'); d.setFontSize(19); d.text(d.splitTextToSize(r.job_title, 330)[0], M + 124, 142);
  d.setFont('helvetica', 'normal'); d.setFontSize(10);
  d.text(`Prepared for ${user.name}  ·  CV: ${cvName || 'CV'}`, M + 124, 162);
  d.text(matchLabel(r.score)[0], M + 124, 180);

  d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Score breakdown', M, 236);
  [['Keyword match', r.keywords, 50], ['Experience match', r.experience, 30], ['Certifications', r.certifications, 20]].forEach(([label, v, w], i) => {
    const y = 262 + i * 36;
    d.setFontSize(10); d.setFont('helvetica', 'bold'); d.setTextColor(...INK); d.text(label, M, y);
    d.setFont('helvetica', 'normal'); d.setTextColor(...MUTED); d.text(`weight ${w}%`, M + 105, y);
    d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.text(`${v}%`, W - M, y, { align: 'right' });
    d.setFillColor(240, 236, 231); d.roundedRect(M, y + 7, W - 2 * M, 7, 3.5, 3.5, 'F');
    d.setFillColor(...ORANGE); d.roundedRect(M, y + 7, Math.max(7, ((W - 2 * M) * v) / 100), 7, 3.5, 3.5, 'F');
  });
  d.setFillColor(...PEACH); d.roundedRect(M, 368, W - 2 * M, 30, 8, 8, 'F');
  d.setTextColor(224, 74, 16); d.setFontSize(10.5);
  d.text(`Calculation: (${r.keywords} x 50%) + (${r.experience} x 30%) + (${r.certifications} x 20%) = ${r.score}%`, M + 14, 387);

  const chips = (label, arr, x, y, bg, fg) => {
    d.setTextColor(...INK); d.setFontSize(12); d.setFont('helvetica', 'bold'); d.text(label, x, y);
    let cx = x;
    arr.forEach((s) => {
      d.setFontSize(9.5); const w = d.getTextWidth(s) + 18;
      if (cx + w > x + 240) return;
      d.setFillColor(...bg); d.roundedRect(cx, y + 10, w, 20, 10, 10, 'F');
      d.setTextColor(...fg); d.text(s, cx + 9, y + 24); cx += w + 6;
    });
    if (!arr.length) { d.setTextColor(...MUTED); d.setFont('helvetica', 'normal'); d.setFontSize(10); d.text('None', x, y + 24); }
  };
  chips('Matched skills', r.matched_skills, M, 430, [226, 245, 234], [31, 157, 90]);
  chips('Missing skills', r.missing_skills, M + 260, 430, [253, 231, 229], [217, 67, 58]);

  d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.setFontSize(13); d.text('Your progress', M, 500);
  history.slice(-5).forEach((h, i) => {
    const x = M + i * 100, bh = Math.max(6, h.score * 1.6);
    d.setFillColor(...(h.id === r.id ? ORANGE : [255, 217, 199])); d.roundedRect(x, 690 - bh, 80, bh, 6, 6, 'F');
    d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.setFontSize(10); d.text(`${h.score}%`, x + 40, 684 - bh, { align: 'center' });
    d.setTextColor(...MUTED); d.setFont('helvetica', 'normal'); d.setFontSize(8.5); d.text(fmtDate(h.created_at), x + 40, 704, { align: 'center' });
  });
  foot(1, 'This score is guidance only. It is not a hiring decision.');

  // ---- page 2
  d.addPage(); head();
  d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.setFontSize(14); d.text('Evidence', M, 100);
  const det = r.details || {};
  const rows = [
    ['Keywords', `Found: ${r.matched_skills.join(', ') || 'none'}. Missing: ${r.missing_skills.join(', ') || 'none'}.`, r.keywords],
    ['Experience', `Signals: ${(det.experience_match?.signals || []).join(', ') || 'none found'}.`, r.experience],
    ['Certifications', (det.certifications?.signals || []).length ? `Found: ${det.certifications.signals.join(', ')}.` : 'No certificates found in the CV.', r.certifications],
  ];
  d.setFillColor(250, 248, 246); d.rect(M, 112, W - 2 * M, 22, 'F');
  d.setFontSize(9); d.setTextColor(...MUTED); d.text('AREA', M + 8, 127); d.text('WHAT WAS FOUND IN YOUR CV', M + 110, 127); d.text('SCORE', W - M - 8, 127, { align: 'right' });
  rows.forEach(([a, b, c], i) => {
    const y = 154 + i * 40;
    d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.setFontSize(10); d.text(a, M + 8, y);
    d.setFont('helvetica', 'normal'); d.text(d.splitTextToSize(b, 330).slice(0, 2), M + 110, y);
    d.setFont('helvetica', 'bold'); d.text(`${c}%`, W - M - 8, y, { align: 'right' });
    d.setDrawColor(236, 231, 226); d.line(M, y + 22, W - M, y + 22);
  });

  d.setFontSize(14); d.setTextColor(...INK); d.text('Your learning roadmap', M, 300);
  items.slice(0, 5).forEach((it, i) => {
    const y = 316 + i * 46;
    d.setFillColor(250, 248, 246); d.roundedRect(M, y, W - 2 * M, 38, 8, 8, 'F');
    d.setTextColor(...INK); d.setFontSize(10.5); d.setFont('helvetica', 'bold'); d.text(it.title, M + 14, y + 16);
    d.setFont('helvetica', 'normal'); d.setFontSize(9); d.setTextColor(...MUTED);
    d.text(`${it.provider} · ${it.minutes} min · ${it.level}${it.state === 'done' ? '  ·  done' : ''}`, M + 14, y + 30);
    d.setTextColor(217, 67, 58); d.text(it.skill, W - M - 14, y + 23, { align: 'right' });
  });
  if (!items.length) { d.setFontSize(10); d.setTextColor(...MUTED); d.setFont('helvetica', 'normal'); d.text('No missing skills. Nothing to learn for this role.', M, 330); }

  d.setTextColor(...INK); d.setFont('helvetica', 'bold'); d.setFontSize(14); d.text('Next steps', M, 570);
  [`Add ${r.missing_skills[0] || 'your newest project'} to your CV, then analyse again.`, "Use the job ad's own words for skills you already have.", 'Track this application and set a follow-up date.'].forEach((n, i) => {
    const y = 596 + i * 26;
    d.setFillColor(...ORANGE); d.circle(M + 9, y - 4, 9, 'F');
    d.setTextColor(...WHITE); d.setFont('helvetica', 'bold'); d.setFontSize(9.5); d.text(String(i + 1), M + 9, y - 0.5, { align: 'center' });
    d.setTextColor(...INK); d.setFont('helvetica', 'normal'); d.setFontSize(10.5); d.text(n, M + 26, y);
  });
  d.setDrawColor(236, 231, 226); d.roundedRect(M, 690, W - 2 * M, 44, 8, 8, 'S');
  d.setFontSize(9.5); d.setTextColor(58, 56, 54);
  d.text(d.splitTextToSize('Your CV and this report are processed under POPIA. They are only used for your analysis and you can delete them from Settings at any time.', W - 2 * M - 28), M + 14, 708);
  foot(2, '© ' + new Date().getFullYear() + ' TechCareerFit');
  return d.output('blob');
}
