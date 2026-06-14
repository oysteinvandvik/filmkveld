import { test, expect } from '@playwright/test';

function requireAuth() {
	if (!process.env.PLAYWRIGHT_TEST_EMAIL || !process.env.PLAYWRIGHT_TEST_PASSWORD) {
		test.skip(true, 'PLAYWRIGHT_TEST_EMAIL og PLAYWRIGHT_TEST_PASSWORD ikke satt');
	}
}

test.describe('Hjemside (Filmkveld)', () => {
	test.beforeEach(requireAuth);

	test('viser Filmkveld-header etter innlogging', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /Filmkveld/ })).toBeVisible();
	});

	test('har lenke til Vi ser på', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: 'Vi ser på' })).toBeVisible();
	});

	test('viser FAB-knapp for å opprette filmkveld', async ({ page }) => {
		await page.goto('/');
		// FAB is a button with + symbol
		await expect(page.getByRole('button', { name: '+' })).toBeVisible();
	});

	test('lenke til arkiv finnes på siden', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('link', { name: /arkiv/i })).toBeVisible();
	});
});

test.describe('Vi ser på-siden', () => {
	test.beforeEach(requireAuth);

	test('laster siden uten feil', async ({ page }) => {
		await page.goto('/watching');
		await expect(page).toHaveURL('/watching');
		// No error page
		await expect(page.getByText(/500|feil|error/i)).not.toBeVisible();
	});

	test('viser statusfiltre', async ({ page }) => {
		await page.goto('/watching');
		await expect(page.getByRole('button', { name: /Ser nå/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Ferdig/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Arkivert/ })).toBeVisible();
		await expect(page.getByRole('button', { name: /Alle/ })).toBeVisible();
	});

	test('"Ser nå" er aktiv som standard', async ({ page }) => {
		await page.goto('/watching');
		const serNaaBtn = page.getByRole('button', { name: /Ser nå/ });
		await expect(serNaaBtn).toHaveClass(/font-semibold/);
	});

	test('klikk på Pause-filter endrer aktiv knapp', async ({ page }) => {
		await page.goto('/watching');
		await page.getByRole('button', { name: /Pause/ }).click();
		await expect(page.getByRole('button', { name: /Pause/ })).toHaveClass(/font-semibold/);
		await expect(page.getByRole('button', { name: /Ser nå/ })).not.toHaveClass(/font-semibold/);
	});
});

test.describe('Voting-side', () => {
	test.beforeEach(requireAuth);

	test('åpner stemming-siden for kjent session-id', async ({ page }) => {
		// We just check that /vote/* renders without crashing.
		// The page redirects to / for nonexistent sessions.
		await page.goto('/vote/00000000-0000-0000-0000-000000000000');
		// Either the voting page or a redirect to home — no 500 error
		await expect(page.getByText(/500|Internal Server Error/i)).not.toBeVisible();
	});
});

test.describe('Navigasjon', () => {
	test.beforeEach(requireAuth);

	test('/admin redirecter til /', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL('/');
	});

	test('arkiv-siden laster', async ({ page }) => {
		await page.goto('/arkiv');
		await expect(page).toHaveURL('/arkiv');
		await expect(page.getByText(/500/)).not.toBeVisible();
	});

	test('Deltakere-siden laster', async ({ page }) => {
		await page.goto('/admin/people');
		await expect(page).toHaveURL('/admin/people');
		await expect(page.getByText(/500/)).not.toBeVisible();
	});
});
