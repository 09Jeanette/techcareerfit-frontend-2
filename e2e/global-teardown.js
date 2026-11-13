// Deletes the run's test account through the API, whatever happened in the tests.
import { request } from '@playwright/test';

export default async function globalTeardown() {
  const API = process.env.API_URL || 'https://techcareerfit-backend-2.onrender.com';
  const email = `tcf.e2e.${process.env.E2E_RUN_ID}@example.com`;
  const api = await request.newContext();
  const login = await api.post(`${API}/login`, { data: { email, password: 'E2e-Test-2026!' } });
  if (login.ok()) {
    const { access_token: t } = await login.json();
    const del = await api.delete(`${API}/me`, { headers: { Authorization: `Bearer ${t}` } });
    console.log(`Teardown: deleted test account ${email} (status ${del.status()})`);
  } else {
    console.log(`Teardown: test account ${email} already removed (login status ${login.status()})`);
  }
  await api.dispose();
}
