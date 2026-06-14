import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		// Reuse a running dev/preview server locally to skip the build step
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e',
	projects: [
		// 1. Auth setup — runs first, logs in and saves cookies
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/
		},
		// 2. Public tests — no auth needed (login page, redirects)
		{
			name: 'public',
			testMatch: /login\.test\.ts/,
			use: { ...devices['Desktop Chrome'] }
		},
		// 3. Authenticated tests — depends on setup project
		{
			name: 'authenticated',
			testMatch: /app\.test\.ts/,
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				storageState: 'e2e/.auth/user.json'
			}
		}
	]
});
