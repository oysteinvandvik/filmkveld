import { requireAuth } from '$lib/server/auth';
import { fetchRecommendations } from '$lib/tmdb';
import { add } from '$lib/server/watchingActions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const { data: sessions } = await supabase
		.from('voting_sessions')
		.select('id')
		.eq('status', 'decided');

	const sessionIds = (sessions ?? []).map((s) => s.id);

	const [candidateRes, watchlistRes, allCandidateRes] = await Promise.all([
		sessionIds.length
			? supabase
					.from('session_candidates')
					.select('movie:movies(id, type)')
					.in('session_id', sessionIds)
			: Promise.resolve({ data: [] as { movie: { id: number; type: string } | null }[] }),
		supabase.from('watchlist').select('movie_id'),
		supabase.from('session_candidates').select('movie:movies(id)')
	]);

	const seenSources = new Set<number>();
	const sources: { id: number; type: 'movie' | 'tv' }[] = [];
	for (const c of candidateRes.data ?? []) {
		const movie = c.movie as { id: number; type: 'movie' | 'tv' } | null;
		if (movie?.id && !seenSources.has(movie.id)) {
			seenSources.add(movie.id);
			sources.push({ id: movie.id, type: movie.type });
		}
	}

	const excludeIds = new Set<number>([
		...(watchlistRes.data ?? []).map((w) => w.movie_id as number),
		...(allCandidateRes.data ?? [])
			.map((c) => (c as any).movie?.id)
			.filter((id): id is number => typeof id === 'number')
	]);

	const results = await Promise.all(
		sources.slice(0, 8).map((s) => fetchRecommendations(s.id, s.type))
	);

	const seen = new Set<number>(excludeIds);
	const recommendations = [];
	for (const list of results) {
		for (const movie of list) {
			if (!seen.has(movie.tmdbId)) {
				seen.add(movie.tmdbId);
				recommendations.push(movie);
			}
		}
	}

	return { recommendations: recommendations.slice(0, 24) };
};

export const actions: Actions = { add };
