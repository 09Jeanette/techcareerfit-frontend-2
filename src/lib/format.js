const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtDate = (d) => {
  if (!d) return '';
  const x = new Date(d.length <= 10 ? d + 'T00:00:00' : d);
  return `${x.getDate()} ${MONTHS[x.getMonth()]}`;
};
export const daysFrom = (d) => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(d + 'T00:00:00') - t) / 864e5);
};
export const initials = (s = '') => s.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
const COLORS = ['#2F4A8A', '#1F9D5A', '#7B5BD6', '#D98A12', '#C2410C', '#0E7490', '#9D174D'];
export const colorFor = (s = '') => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
export const statusChip = (s) => ({ Applied: 'c-m', Interview: 'c-o', Rejected: 'c-r', Hired: 'c-g' }[s] || 'c-m');
export const STATUSES = ['Applied', 'Interview', 'Rejected', 'Hired'];
export const isClosed = (a) => a.status === 'Rejected' || a.status === 'Hired';
export const isOverdue = (a) => !isClosed(a) && a.follow_up_on && daysFrom(a.follow_up_on) < 0;
export const matchLabel = (score) => (score >= 70 ? ['Good match', 'var(--green)'] : score >= 55 ? ['Fair match', 'var(--amber)'] : ['Needs work', 'var(--red)']);
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
export const todayLong = () => new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

export function downloadBlob(filename, data, type = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
