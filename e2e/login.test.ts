import { test, expect } from '@playwright/test';

// These tests run without authentication
test.describe('Login page', () => {
	test('renders login form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByLabel('E-post')).toBeVisible();
		await expect(page.getByLabel('Passord')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Logg inn' })).toBeVisible();
	});

	test('shows reset password link', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByText('Glemt passord?')).toBeVisible();
	});

	test('clicking "Glemt passord" shows reset form', async ({ page }) => {
		await page.goto('/login');
		await page.getByText('Glemt passord?').click();
		await expect(page.getByRole('button', { name: /Send tilbakestillingslenke/ })).toBeVisible();
	});

	test('shows error on invalid credentials', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('E-post').fill('nobody@example.com');
		await page.getByLabel('Passord').fill('wrongpassword');
		await page.getByRole('button', { name: 'Logg inn' }).click();
		// Should stay on login page with error
		await expect(page).toHaveURL('/login');
		await expect(page.getByText(/feil|ugyldig|invalid/i)).toBeVisible();
	});
});

test.describe('Protected routes redirect to login', () => {
	test('/ redirects to /login when unauthenticated', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
	});

	test('/watching redirects to /login when unauthenticated', async ({ page }) => {
		await page.goto('/watching');
		await expect(page).toHaveURL(/\/login/);
	});

	test('/vote/[id] redirects to /login when unauthenticated', async ({ page }) => {
		await page.goto('/vote/nonexistent-id');
		await expect(page).toHaveURL(/\/login/);
	});
});
