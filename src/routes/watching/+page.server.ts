import { redirect, fail } from '@sveltejs/kit';
import { searchTmdb, fetchTmdbDetails } from '$lib/tmdb';
import type { Movie, Person, WatchLogEntry, WatchlistEntry } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) redirect(303, '/login');

	const { data: entries, error: entriesError } = await supabase
		.from('watchlist')
		.select('id, status, notes, created_at, movie_id, platform, started_at, completed_at, family_rating, episode_progress')
		.order('created_at', { ascending: false });


	const entryIds = (entries ?? []).map((e) => e.id as string);
	const movieIds = (entries ?? []).map((e) => e.movie_id as number);

	const [{ data: movies }, { data: viewerRows }, { data: people }, { data: watchLogs }] =
		await Promise.all([
			movieIds.length > 0
				? supabase.from('movies').select('*').in('id', movieIds)
				: Promise.resolve({ data: [] }),
			entryIds.length > 0
				? supabase
						.from('watchlist_viewers')
						.select('watchlist_id, person_id')
						.in('watchlist_id', entryIds)
				: Promise.resolve({ data: [] }),
			supabase.from('people').select('*').order('name'),
			entryIds.length > 0
				? supabase
						.from('watch_log')
						.select('id, watchlist_id, watched_at, notes')
						.in('watchlist_id', entryIds)
						.order('watched_at', { ascending: false })
				: Promise.resolve({ data: [] })
		]);

	// Hent hvem som var til stede på hver seanse
	const watchLogIds = (watchLogs ?? []).map((l: any) => l.id as string);
	const { data: watchLogViewers } =
		watchLogIds.length > 0
			? await supabase
					.from('watch_log_viewers')
					.select('watch_log_id, person_id')
					.in('watch_log_id', watchLogIds)
			: { data: [] as any[] };

	// Bygg lookup-maps
	const movieMap = Object.fromEntries((movies ?? []).map((m) => [m.id, m as Movie]));

	const viewerMap: Record<string, string[]> = {};
	for (const row of viewerRows ?? []) {
		if (!viewerMap[row.watchlist_id]) viewerMap[row.watchlist_id] = [];
		viewerMap[row.watchlist_id].push(row.person_id);
	}

	const watchLogMap: Record<string, WatchLogEntry[]> = {};
	for (const log of watchLogs ?? []) {
		if (!watchLogMap[log.watchlist_id]) watchLogMap[log.watchlist_id] = [];
		watchLogMap[log.watchlist_id].push({
			id: log.id,
			watchlist_id: log.watchlist_id,
			watched_at: log.watched_at,
			notes: log.notes,
			viewerIds: (watchLogViewers ?? [])
				.filter((v: any) => v.watch_log_id === log.id)
				.map((v: any) => v.person_id)
		});
	}

	const watchlist: WatchlistEntry[] = (entries ?? [])
		.filter((e) => movieMap[e.movie_id])
		.map((e) => ({
			id: e.id as string,
			status: e.status as 'watching' | 'completed' | 'paused',
			notes: e.notes as string | null,
			platform: e.platform as string | null,
			started_at: e.started_at as string | null,
			completed_at: e.completed_at as string | null,
			family_rating: e.family_rating as number | null,
			episode_progress: e.episode_progress as string | null,
			movie: movieMap[e.movie_id],
			viewerIds: viewerMap[e.id] ?? [],
			watchLogs: watchLogMap[e.id] ?? []
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
		const type = form.get('type') as 'movie' | 'tv';

		// Hent full info fra TMDB
		let details;
		try {
			details = await fetchTmdbDetails(tmdb_id, type);
		} catch {
			details = null;
		}

		const title = details?.title ?? (form.get('title') as string);
		const year = details?.year ?? (form.get('year') as string);
		const poster_url = (details?.posterUrl ?? (form.get('poster_url') as string)) || null;
		const overview = (details?.overview ?? (form.get('overview') as string)) || null;

		await supabase.from('movies').upsert({
			id: tmdb_id,
			title,
			type,
			year,
			poster_url,
			overview,
			genre: details?.genre ?? null,
			runtime: details?.runtime ?? null,
			tmdb_rating: details?.tmdbRating ?? null,
			seasons: details?.seasons ?? null,
			original_language: details?.originalLanguage ?? null
		});

		const { error } = await supabase.from('watchlist').insert({ movie_id: tmdb_id });
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

		const updates: Record<string, unknown> = { status };

		if (status === 'watching') {
			const { data } = await supabase
				.from('watchlist')
				.select('started_at')
				.eq('id', id)
				.single();
			if (!data?.started_at) updates.started_at = new Date().toISOString();
		} else if (status === 'completed') {
			updates.completed_at = new Date().toISOString();
		}

		await supabase.from('watchlist').update(updates).eq('id', id);
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
	},

	setPlatform: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const id = form.get('id') as string;
		const platform = (form.get('platform') as string) || null;
		await supabase.from('watchlist').update({ platform }).eq('id', id);
	},

	setFamilyRating: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const id = form.get('id') as string;
		const rating = Number(form.get('rating'));
		await supabase
			.from('watchlist')
			.update({ family_rating: rating > 0 ? rating : null })
			.eq('id', id);
	},

	setEpisodeProgress: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const id = form.get('id') as string;
		const episode_progress = (form.get('episode_progress') as string) || null;
		await supabase.from('watchlist').update({ episode_progress }).eq('id', id);
	},

	logWatch: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const watchlist_id = form.get('watchlist_id') as string;
		const watched_at = form.get('watched_at') as string;
		const notes = (form.get('notes') as string) || null;
		const viewer_ids = form.getAll('viewer_ids[]') as string[];

		const { data: log, error } = await supabase
			.from('watch_log')
			.insert({ watchlist_id, watched_at, notes })
			.select('id')
			.single();

		if (error) return fail(500, { error: error.message });

		if (viewer_ids.length > 0 && log) {
			await supabase
				.from('watch_log_viewers')
				.insert(viewer_ids.map((person_id) => ({ watch_log_id: log.id, person_id })));
		}
	}
};
