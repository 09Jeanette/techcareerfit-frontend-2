import { useEffect, useState } from 'react';

// Hash-based routing (works on any static host without server rewrites).
const parse = () => {
  const h = decodeURIComponent(window.location.hash.slice(1)) || 'landing';
  const [name, param] = h.split('/');
  return { name, param: param || null };
};

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (to) => {
  if (window.location.hash.slice(1) === to) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = to;
};
