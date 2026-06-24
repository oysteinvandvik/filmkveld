import { requireAuth } from '$lib/server/auth';
import { fetchRecommendations, fetchTmdbDetails } from '$lib/tmdb';
import { add } from '$lib/server/watchingActions';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const [watchlistRes, suggestionSessionsRes, allCandidatesRes] = await Promise.all([
		supabase.from('watchlist').select('movie_id, movie:movies(id, type)'),
		supabase
			.from('voting_sessions')
			.select('id, title, status')
			.in('status', ['suggestion', 'voting'])
			.order('created_at', { ascending: false }),
		supabase.from('session_candidates').select('movie:movies(id, type)')
	]);

	// TV sources: watchlist (tv type) + candidates (tv type)
	const tvSources: { id: number; type: 'tv' }[] = [];
	const seenTvSources = new Set<number>();
	for (const entry of watchlistRes.data ?? []) {
		const movie = (entry as any).movie as { id: number; type: string } | null;
		if (movie?.type === 'tv' && !seenTvSources.has(movie.id)) {
			seenTvSources.add(movie.id);
			tvSources.push({ id: movie.id, type: 'tv' });
		}
	}
	for (const c of allCandidatesRes.data ?? []) {
		const movie = (c as any).movie as { id: number; type: string } | null;
		if (movie?.type === 'tv' && !seenTvSources.has(movie.id)) {
			seenTvSources.add(movie.id);
			tvSources.push({ id: movie.id, type: 'tv' });
		}
	}

	// Movie sources: all candidates of movie type
	const movieSources: { id: number; type: 'movie' }[] = [];
	const seenMovieSources = new Set<number>();
	for (const c of allCandidatesRes.data ?? []) {
		const movie = (c as any).movie as { id: number; type: string } | null;
		if (movie?.type === 'movie' && !seenMovieSources.has(movie.id)) {
			seenMovieSources.add(movie.id);
			movieSources.push({ id: movie.id, type: 'movie' });
		}
	}

	// IDs to exclude from recs (already on watchlist or candidate)
	const watchlistIds = new Set<number>(
		(watchlistRes.data ?? []).map((w) => w.movie_id as number).filter(Boolean)
	);
	const candidateIds = new Set<number>(
		(allCandidatesRes.data ?? [])
			.map((c) => (c as any).movie?.id)
			.filter((id): id is number => typeof id === 'number')
	);
	const excludeIds = new Set<number>([...watchlistIds, ...candidateIds]);

	// Fetch recs in parallel
	const [movieRecLists, tvRecLists] = await Promise.all([
		Promise.all(movieSources.slice(0, 8).map((s) => fetchRecommendations(s.id, s.type))),
		Promise.all(tvSources.slice(0, 8).map((s) => fetchRecommendations(s.id, s.type)))
	]);

	function aggregate(lists: Awaited<ReturnType<typeof fetchRecommendations>>[], exclude: Set<number>) {
		const seen = new Set<number>(exclude);
		const out = [];
		for (const list of lists) {
			for (const m of list) {
				if (!seen.has(m.tmdbId)) {
					seen.add(m.tmdbId);
					out.push(m);
				}
			}
		}
		return out.slice(0, 24);
	}

	return {
		movieRecs: aggregate(movieRecLists, excludeIds),
		tvRecs: aggregate(tvRecLists, excludeIds),
		suggestionSessions: (suggestionSessionsRes.data ?? []) as { id: string; title: string; status: string }[]
	};
};

export const actions: Actions = {
	addToWatchlist: add,

	addToSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const tmdb_id = Number(form.get('tmdb_id'));
		const type = form.get('type') as 'movie' | 'tv';
		const session_id = form.get('session_id') as string;

		if (!session_id) return fail(400, { error: 'Velg en filmkveld' });

		let details;
		try {
			details = await fetchTmdbDetails(tmdb_id, type);
		} catch {
			details = null;
		}

		await supabase.from('movies').upsert({
			id: tmdb_id,
			title: details?.title ?? '',
			type,
			year: details?.year ?? null,
			poster_url: details?.posterUrl ?? null,
			overview: details?.overview ?? null,
			genre: details?.genre ?? null,
			runtime: details?.runtime ?? null,
			tmdb_rating: details?.tmdbRating ?? null,
			seasons: details?.seasons ?? null,
			original_language: details?.originalLanguage ?? null
		});

		const { error } = await supabase
			.from('session_candidates')
			.insert({ session_id, movie_id: tmdb_id });

		if (error && error.code !== '23505') return fail(500, { error: error.message });
	}
};
