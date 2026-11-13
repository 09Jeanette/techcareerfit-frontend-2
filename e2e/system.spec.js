// ST-01 style end-to-end system test of TechCareerFit on the live system.
// Every test runs, and a failure does not stop the tests after it. One fresh test account is used for the run
// (its id comes from playwright.config.js) and e2e/global-teardown.js deletes it at the end.
import { test, expect } from '@playwright/test';
import path from 'node:path';

const API = process.env.API_URL || 'https://techcareerfit-backend-2.onrender.com';
const CV = path.join(import.meta.dirname, 'fixtures', 'test-cv.txt');
const user = { name: 'Test Candidate', email: `tcf.e2e.${process.env.E2E_RUN_ID}@example.com`, password: 'E2e-Test-2026!' };

let page;
test.beforeAll(async ({ browser }) => { page = await (await browser.newContext({ acceptDownloads: true })).newPage(); });
test.afterAll(async () => { await page?.context().close(); });
// After a failure Playwright starts a fresh browser for the next test, so log back in when needed.
test.beforeEach(async ({}, info) => {
  if (/TC-01/.test(info.title)) return;
  await page.goto('/#home');
  if (await token()) return;
  await page.goto('/#login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: /^Log in/ }).click();
  await expect(page).toHaveURL(/#home/);
});

const token = () => page.evaluate(() => localStorage.getItem('tcf_token'));
const toast = (re) => expect(page.getByText(re).first()).toBeVisible();
const visible = (loc) => loc.filter({ visible: true }).first();

async function analyse(title) {
  await page.goto('/#analyse');
  await page.locator('.pick').first().click();
  await page.getByRole('button', { name: /Next: the job/ }).click();
  await page.locator('#jTitle').fill(title);
  await page.getByText('Use a sample ad').click();
  await page.getByRole('button', { name: 'Analyse CV' }).click();
  await expect(page).toHaveURL(/#report\/.+/);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

test('TC-01 FR-01 registration validation and sign-up', async () => {
  await page.goto('/#register');
  await page.getByRole('button', { name: /Create account/ }).click();
  for (const msg of ['Enter your name', 'Enter a valid email', 'Use at least 8 characters', 'Please accept to continue']) {
    await expect(page.getByText(msg)).toBeVisible();
  }
  await page.locator('#name').fill(user.name);
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('input.cbx').check();
  await page.getByRole('button', { name: /Create account/ }).click();
  await expect(page).toHaveURL(/#home/);
  await expect(page.getByRole('heading', { level: 1, name: /Welcome back, Test/ })).toBeVisible();
});

test('TC-02 FR-02 log out, wrong password rejected, log in', async () => {
  await visible(page.getByText('Log out', { exact: true })).click();
  await page.goto('/#login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill('wrong-password-123');
  await page.getByRole('button', { name: /^Log in/ }).click();
  await expect(page.locator('.alert')).toBeVisible();
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: /^Log in/ }).click();
  await expect(page).toHaveURL(/#home/);
});

test('TC-03 FR-03 CV upload with skill extraction; short pasted text rejected', async () => {
  await page.goto('/#analyse');
  await page.getByRole('button', { name: /Paste CV text instead/ }).click();
  await page.getByPlaceholder('Paste your CV text here').fill('too short');
  await page.getByRole('button', { name: 'Use this CV' }).click();
  await toast(/Paste at least a few lines of your CV/);
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();
  await page.locator('#cvFile').setInputFiles(CV);
  await toast(/CV uploaded · \d+ skills found/);
  await expect(page.getByText('test-cv.txt').first()).toBeVisible();
});

test('TC-04 FR-04/FR-05 ET-03 explainable ATS analysis, input validation, PDF report', async () => {
  await page.goto('/#analyse');
  await page.locator('.pick').first().click();
  await page.getByRole('button', { name: /Next: the job/ }).click();
  await page.locator('#jTitle').fill('Junior Python Developer');
  await page.locator('#jAd').fill('Too short');
  await page.getByRole('button', { name: 'Analyse CV' }).click();
  await expect(page.getByText(/Paste the full job description/)).toBeVisible();
  await page.getByText('Use a sample ad').click();
  await page.getByRole('button', { name: 'Analyse CV' }).click();
  await expect(page).toHaveURL(/#report\/.+/);
  await expect(page.getByText('Guidance only. This is not a hiring decision.')).toBeVisible();
  for (const part of ['Keywords', 'Experience', 'Certifications', 'How this score was reached']) {
    await expect(page.getByText(part, { exact: true }).first()).toBeVisible();
  }
  await expect(page.locator('.calc')).toContainText('%');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download PDF/ }).click();
  expect((await dl).suggestedFilename()).toMatch(/\.pdf$/);
});

test('TC-05 FR-07 learning roadmap for the missing skills', async () => {
  await page.goto('/#report');
  await page.getByRole('button', { name: 'Open roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Learning roadmap' })).toBeVisible();
  await expect(page.getByText(/docker/i).first()).toBeVisible();
});

test('TC-06 FR-08/FR-12 add an application with validation and the Other source', async () => {
  await page.goto('/#report');
  await page.getByRole('button', { name: /Add to applications/ }).click();
  await expect(page).toHaveURL(/#apply/);
  await expect(page.locator('#t')).toHaveValue('Junior Python Developer');
  const save = () => visible(page.getByRole('button', { name: /Save application/ })).click();
  await save();
  await expect(page.getByText('Add the company')).toBeVisible();
  await page.locator('#c').fill('Example Labs');
  await page.getByRole('button', { name: 'Other', exact: true }).click();
  await save();
  await expect(page.getByText('Tell us where you found it')).toBeVisible();
  await page.locator('#src').fill('Indeed');
  await save();
  await expect(page).toHaveURL(/#applications/);
  await page.getByText('Example Labs').first().click();
  await expect(page.getByText(/via Indeed/)).toBeVisible();
});

test('TC-07 FR-06/FR-11 delete one report, then clear report history', async () => {
  await analyse('Backend Developer');      // three reports, so two remain for Clear history after one is deleted
  await analyse('Data Engineer');
  await analyse('Cloud Engineer');
  await page.getByRole('button', { name: /Delete report/ }).click();
  await page.locator('.modal').getByRole('button', { name: 'Delete report' }).click();
  await toast(/Report deleted/);
  await expect(page.locator('.rtab', { hasText: 'Cloud Engineer' })).toHaveCount(0);
  await page.getByRole('button', { name: /Clear history/ }).click();
  await page.locator('#confirm').fill('DELETE');
  await page.locator('.modal').getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByRole('heading', { name: 'No reports yet' })).toBeVisible();
});

test('TC-08 NFR-04 access control and no secrets in API responses', async ({ request }) => {
  const auth = { Authorization: `Bearer ${await token()}` };
  expect((await request.get(`${API}/reports`)).status()).toBe(401);
  expect((await request.get(`${API}/admin/users`, { headers: auth })).status()).toBe(403);
  const me = await request.get(`${API}/me`, { headers: auth });
  expect(me.ok()).toBeTruthy();
  expect((await me.text()).toLowerCase()).not.toContain('password');
  await page.goto('/#admin');
  await page.waitForTimeout(1500);
  await expect(page.getByRole('heading', { name: 'Admin overview' })).toHaveCount(0);
});

test('TC-09 NFR-01 no sideways scrolling at 375px', async () => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ['home', 'analyse', 'report', 'roadmap', 'applications', 'journal', 'market', 'profile']) {
    await page.goto(`/#${route}`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `#${route} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
});

test('TC-10 FR-03/FR-06 deleting a CV keeps the reports scored with it', async () => {
  await analyse('QA Engineer');
  await page.goto('/#profile');
  await page.getByRole('button', { name: 'Remove CV', exact: true }).first().click();
  const modal = page.locator('.modal');
  await expect(modal.getByText(/1 report used this CV/)).toBeVisible();
  await modal.getByRole('button', { name: 'Delete CV' }).click();
  await toast(/CV deleted/);
  await page.goto('/#report');
  await expect(page.getByRole('heading', { level: 1, name: 'QA Engineer' })).toBeVisible();
  await expect(page.getByText(/· CV deleted/)).toBeVisible();
});

test('TC-11 POPIA delete account removes access', async () => {
  await page.goto('/#profile');
  await page.getByText('Delete my account').click();
  await page.locator('#confirm').fill('DELETE');
  await page.locator('.modal').getByRole('button', { name: 'Delete account' }).click();
  await toast(/Account deleted/);
  await page.goto('/#login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: /^Log in/ }).click();
  await expect(page.locator('.alert')).toBeVisible();
});
