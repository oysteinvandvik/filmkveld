import { redirect, fail } from '@sveltejs/kit';
import { searchTmdb } from '$lib/tmdb';
import type { Movie, Person } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) redirect(303, '/login');

	// Fetch watchlist entries (no FK join)
	const { data: entries, error: entriesError } = await supabase
		.from('watchlist')
		.select('id, status, notes, created_at, movie_id')
		.order('created_at', { ascending: false });

	console.log('[watching] entries:', entries?.length, 'error:', entriesError?.message);

	const entryIds = (entries ?? []).map((e) => e.id as string);
	const movieIds = (entries ?? []).map((e) => e.movie_id as number);

	// Fetch movies, viewers, and people in parallel
	const [{ data: movies }, { data: viewerRows }, { data: people }] = await Promise.all([
		movieIds.length > 0
			? supabase.from('movies').select('*').in('id', movieIds)
			: Promise.resolve({ data: [] }),
		entryIds.length > 0
			? supabase.from('watchlist_viewers').select('watchlist_id, person_id').in('watchlist_id', entryIds)
			: Promise.resolve({ data: [] }),
		supabase.from('people').select('*').order('name')
	]);

	// Build lookup maps
	const movieMap = Object.fromEntries((movies ?? []).map((m) => [m.id, m as Movie]));
	const viewerMap: Record<string, string[]> = {};
	for (const row of viewerRows ?? []) {
		if (!viewerMap[row.watchlist_id]) viewerMap[row.watchlist_id] = [];
		viewerMap[row.watchlist_id].push(row.person_id);
	}

	const watchlist = (entries ?? [])
		.filter((e) => movieMap[e.movie_id])
		.map((e) => ({
			id: e.id as string,
			status: e.status as 'watching' | 'completed' | 'paused',
			notes: e.notes as string | null,
			movie: movieMap[e.movie_id],
			viewerIds: viewerMap[e.id] ?? []
		}));

	return {
		watchlist,
		people: (people ?? []) as Person[]
	};
};

export const actions: Actions = {
	search: async ({ request, locals: { safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const query = form.get('query') as string;
		if (!query?.trim()) return fail(400, { searchError: 'Skriv inn søketekst' });

		try {
			const results = await searchTmdb(query);
			return { searchResults: results };
		} catch {
			return fail(500, { searchError: 'Søk feilet, prøv igjen' });
		}
	},

	add: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const tmdb_id = Number(form.get('tmdb_id'));
		const title = form.get('title') as string;
		const type = form.get('type') as 'movie' | 'tv';
		const year = form.get('year') as string;
		const poster_url = (form.get('poster_url') as string) || null;
		const overview = (form.get('overview') as string) || null;

		// Upsert into movies cache
		const { error: movieError } = await supabase
			.from('movies')
			.upsert({ id: tmdb_id, title, type, year, poster_url, overview });
		console.log('[watching/add] movie upsert error:', movieError?.message);

		// Add to watchlist
		const { error } = await supabase.from('watchlist').insert({ movie_id: tmdb_id });
		console.log('[watching/add] watchlist insert error:', error?.message, 'code:', error?.code);
		if (error && error.code !== '23505') return fail(500, { error: error.message });
	},

	remove: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('watchlist').delete().eq('id', id);
	},

	setStatus: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const id = form.get('id') as string;
		const status = form.get('status') as string;
		await supabase.from('watchlist').update({ status }).eq('id', id);
	},

	toggleViewer: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const watchlist_id = form.get('watchlist_id') as string;
		const person_id = form.get('person_id') as string;
		const currently_watching = form.get('currently_watching') === 'true';

		if (currently_watching) {
			await supabase
				.from('watchlist_viewers')
				.delete()
				.eq('watchlist_id', watchlist_id)
				.eq('person_id', person_id);
		} else {
			await supabase.from('watchlist_viewers').insert({ watchlist_id, person_id });
		}
	}
};
