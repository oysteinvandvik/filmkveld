import { requireAuth } from '$lib/server/auth';
import type { Movie, Person, WatchLogEntry, WatchlistEntry } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';
import * as watchingActions from '$lib/server/watchingActions';
import * as sessionActions from '$lib/server/sessionActions';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const { data: sessions } = await supabase
		.from('voting_sessions')
		.select('*')
		.neq('status', 'archived')
		.order('created_at', { ascending: false });

	const { data: entries } = await supabase
		.from('watchlist')
		.select(
			'id, status, notes, created_at, movie_id, platform, started_at, completed_at, family_rating, episode_progress'
		)
		.order('created_at', { ascending: false });

	const entryIds = (entries ?? []).map((e) => e.id as string);
	const movieIds = (entries ?? []).map((e) => e.movie_id as number);

	const [{ data: movies }, { data: viewerRows }, { data: people }, { data: watchLogs }] =
		await Promise.all([
			movieIds.length > 0
				? supabase.from('movies').select('*').in('id', movieIds)
				: Promise.resolve({ data: [] }),
			entryIds.length > 0
				? supabase.from('watchlist_viewers').select('watchlist_id, person_id').in('watchlist_id', entryIds)
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

	const watchLogIds = (watchLogs ?? []).map((l: any) => l.id as string);
	const { data: watchLogViewers } =
		watchLogIds.length > 0
			? await supabase
					.from('watch_log_viewers')
					.select('watch_log_id, person_id')
					.in('watch_log_id', watchLogIds)
			: { data: [] as any[] };

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
		sessions: sessions ?? [],
		watchlist,
		people: (people ?? []) as Person[]
	};
};

export const actions: Actions = { ...watchingActions, ...sessionActions };
