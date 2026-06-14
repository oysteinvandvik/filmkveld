import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const authFile = path.join(import.meta.dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
	const email = process.env.PLAYWRIGHT_TEST_EMAIL;
	const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

	if (!email || !password) {
		console.warn(
			'Skipping auth setup: PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD not set.\n' +
				'Set them in a .env.test file to run authenticated tests.'
		);
		// Write empty storage state so dependent tests can still run (and will be skipped individually)
		await page.context().storageState({ path: authFile });
		return;
	}

	await page.goto('/login');
	await page.getByLabel('E-post').fill(email);
	await page.getByLabel('Passord').fill(password);
	await page.getByRole('button', { name: 'Logg inn' }).click();

	// Verify login succeeded by checking for the header
	await expect(page.getByRole('link', { name: /Filmkveld/ })).toBeVisible({ timeout: 10000 });

	await page.context().storageState({ path: authFile });
});
