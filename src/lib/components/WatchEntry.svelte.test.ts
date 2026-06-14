import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WatchEntry from './WatchEntry.svelte';
import type { WatchlistEntry, Person } from '$lib/types';

vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy: () => {} })
}));

const people: Person[] = [
	{ id: 'p1', name: 'Øystein', avatar_url: null },
	{ id: 'p2', name: 'Kari', avatar_url: null }
];

function baseMovie() {
	return {
		id: 1,
		title: 'Interstellar',
		type: 'movie' as const,
		year: '2014',
		poster_url: null,
		overview: 'Romferd gjennom et ormehull.',
		genre: 'Sci-Fi, Drama',
		runtime: 169,
		tmdb_rating: 8.4,
		seasons: null,
		original_language: 'en'
	};
}

function baseEntry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
	return {
		id: 'entry-1',
		status: 'watching',
		notes: null,
		platform: null,
		started_at: null,
		completed_at: null,
		family_rating: null,
		episode_progress: null,
		viewerIds: [],
		watchLogs: [],
		movie: baseMovie(),
		...overrides
	};
}

describe('WatchEntry — rendering', () => {
	test('renders movie title', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText('Interstellar')).toBeInTheDocument();
	});

	test('shows year and Film/Serie label', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText(/2014/)).toBeInTheDocument();
		expect(screen.getByText(/Film/)).toBeInTheDocument();
	});

	test('shows Serie label for TV entries', () => {
		const entry = baseEntry({ movie: { ...baseMovie(), type: 'tv', seasons: 4 } });
		render(WatchEntry, { entry, people });
		expect(screen.getByText(/Serie/)).toBeInTheDocument();
	});

	test('shows placeholder when no poster URL', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText('?')).toBeInTheDocument();
	});

	test('renders poster img when URL is provided', () => {
		const entry = baseEntry({
			movie: { ...baseMovie(), poster_url: 'https://example.com/poster.jpg' }
		});
		render(WatchEntry, { entry, people });
		const img = screen.getByAltText('Interstellar');
		expect(img).toHaveAttribute('src', 'https://example.com/poster.jpg');
	});

	test('renders TMDB rating', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText('★ 8.4')).toBeInTheDocument();
	});

	test('renders genre tags (max 3)', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
		expect(screen.getByText('Drama')).toBeInTheDocument();
	});
});

describe('WatchEntry — status buttons', () => {
	test('shows all four status buttons', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText('▶ Ser nå')).toBeInTheDocument();
		expect(screen.getByText('⏸ Pause')).toBeInTheDocument();
		expect(screen.getByText('✓ Ferdig')).toBeInTheDocument();
		expect(screen.getByText('📦 Arkivert')).toBeInTheDocument();
	});

	test('active status button has font-semibold class', () => {
		render(WatchEntry, { entry: baseEntry({ status: 'paused' }), people });
		expect(screen.getByText('⏸ Pause')).toHaveClass('font-semibold');
	});

	test('inactive status buttons do not have font-semibold', () => {
		render(WatchEntry, { entry: baseEntry({ status: 'watching' }), people });
		expect(screen.getByText('⏸ Pause')).not.toHaveClass('font-semibold');
		expect(screen.getByText('✓ Ferdig')).not.toHaveClass('font-semibold');
	});
});

describe('WatchEntry — viewers', () => {
	test('renders all people buttons', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.getByText('+ Øystein')).toBeInTheDocument();
		expect(screen.getByText('+ Kari')).toBeInTheDocument();
	});

	test('active viewer shown with checkmark prefix', () => {
		const entry = baseEntry({ viewerIds: ['p1'] });
		render(WatchEntry, { entry, people });
		expect(screen.getByText('✓ Øystein')).toBeInTheDocument();
		expect(screen.getByText('+ Kari')).toBeInTheDocument();
	});

	test('multiple active viewers shown with checkmarks', () => {
		const entry = baseEntry({ viewerIds: ['p1', 'p2'] });
		render(WatchEntry, { entry, people });
		expect(screen.getByText('✓ Øystein')).toBeInTheDocument();
		expect(screen.getByText('✓ Kari')).toBeInTheDocument();
	});
});

describe('WatchEntry — settings panel', () => {
	test('settings panel is collapsed by default when no data', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.queryByText('Plattform')).not.toBeInTheDocument();
	});

	test('settings panel auto-opens when entry has a platform', () => {
		render(WatchEntry, { entry: baseEntry({ platform: 'Netflix' }), people });
		expect(screen.getByText('Plattform')).toBeInTheDocument();
	});

	test('settings panel auto-opens when entry has a family rating', () => {
		render(WatchEntry, { entry: baseEntry({ family_rating: 3 }), people });
		expect(screen.getByText('Familiens vurdering')).toBeInTheDocument();
	});

	test('clicking toggle opens the settings panel', async () => {
		render(WatchEntry, { entry: baseEntry(), people });
		await fireEvent.click(screen.getByRole('button', { name: /Innstillinger/ }));
		expect(screen.getByText('Plattform')).toBeInTheDocument();
	});

	test('clicking toggle twice opens then closes the panel', async () => {
		render(WatchEntry, { entry: baseEntry(), people });
		const toggle = screen.getByRole('button', { name: /Innstillinger/ });
		await fireEvent.click(toggle);
		expect(screen.getByText('Plattform')).toBeInTheDocument();
		await fireEvent.click(toggle);
		expect(screen.queryByText('Plattform')).not.toBeInTheDocument();
	});

	test('shows settings summary in toggle when panel is collapsed', async () => {
		const entry = baseEntry({ platform: 'Netflix', family_rating: 3 });
		render(WatchEntry, { entry, people });
		// Panel is open (platform is set) — click to collapse
		await fireEvent.click(screen.getByRole('button', { name: /Innstillinger/ }));
		expect(screen.getByText('Netflix · ★★★')).toBeInTheDocument();
	});

	test('episode progress shown for TV series not completed', () => {
		const entry = baseEntry({
			movie: { ...baseMovie(), type: 'tv', seasons: 3, runtime: null },
			status: 'watching',
			platform: 'NRK' // auto-opens settings panel
		});
		render(WatchEntry, { entry, people });
		expect(screen.getByPlaceholderText('S01E01')).toBeInTheDocument();
	});

	test('episode progress hidden for completed TV series', () => {
		const entry = baseEntry({
			movie: { ...baseMovie(), type: 'tv', seasons: 3, runtime: null },
			status: 'completed',
			platform: 'NRK'
		});
		render(WatchEntry, { entry, people });
		expect(screen.queryByPlaceholderText('S01E01')).not.toBeInTheDocument();
	});

	test('episode progress field hidden for movies', () => {
		const entry = baseEntry({ platform: 'Netflix' }); // type: 'movie'
		render(WatchEntry, { entry, people });
		expect(screen.queryByPlaceholderText('S01E01')).not.toBeInTheDocument();
	});
});

describe('WatchEntry — watch log', () => {
	test('log button not shown when no logs exist', () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.queryByText(/seanser logget/)).not.toBeInTheDocument();
	});

	test('shows log count when logs exist', () => {
		const entry = baseEntry({
			watchLogs: [
				{ id: 'l1', watchlist_id: 'entry-1', watched_at: '2024-01-15', notes: null, viewerIds: [] },
				{ id: 'l2', watchlist_id: 'entry-1', watched_at: '2024-01-22', notes: 'Bra!', viewerIds: ['p1'] }
			]
		});
		render(WatchEntry, { entry, people });
		expect(screen.getByText(/2 seanser logget/)).toBeInTheDocument();
	});

	test('singular form for single log entry', () => {
		const entry = baseEntry({
			watchLogs: [
				{ id: 'l1', watchlist_id: 'entry-1', watched_at: '2024-01-15', notes: null, viewerIds: [] }
			]
		});
		render(WatchEntry, { entry, people });
		expect(screen.getByText(/1 seanse logget/)).toBeInTheDocument();
	});

	test('log form toggles on button click', async () => {
		render(WatchEntry, { entry: baseEntry(), people });
		expect(screen.queryByText('Lagre seanse')).not.toBeInTheDocument();

		await fireEvent.click(screen.getByText('+ Logg seanse'));
		expect(screen.getByText('Lagre seanse')).toBeInTheDocument();

		await fireEvent.click(screen.getByText('Avbryt'));
		expect(screen.queryByText('Lagre seanse')).not.toBeInTheDocument();
	});

	test('log form shows people checkboxes', async () => {
		render(WatchEntry, { entry: baseEntry(), people });
		await fireEvent.click(screen.getByText('+ Logg seanse'));
		// People are shown as checkboxes in the log form
		const checkboxes = screen.getAllByRole('checkbox');
		expect(checkboxes).toHaveLength(people.length);
	});
});
