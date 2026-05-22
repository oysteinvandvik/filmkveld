import { fail } from '@sveltejs/kit';
import { searchTmdb, fetchTmdbDetails } from '$lib/tmdb';
import { requireAuth } from '$lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

export async function search({ request, locals: { safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const query = form.get('query') as string;
	if (!query?.trim()) return fail(400, { searchError: 'Skriv inn søketekst' });

	try {
		const results = await searchTmdb(query);
		return { searchResults: results };
	} catch {
		return fail(500, { searchError: 'Søk feilet, prøv igjen' });
	}
}

export async function add({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const tmdb_id = Number(form.get('tmdb_id'));
	const type = form.get('type') as 'movie' | 'tv';

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
}

export async function remove({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const id = form.get('id') as string;
	await supabase.from('watchlist').delete().eq('id', id);
}

export async function setStatus({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const id = form.get('id') as string;
	const status = form.get('status') as string;

	const updates: Record<string, unknown> = { status };

	if (status === 'watching') {
		const { data } = await supabase.from('watchlist').select('started_at').eq('id', id).single();
		if (!data?.started_at) updates.started_at = new Date().toISOString();
	} else if (status === 'completed') {
		updates.completed_at = new Date().toISOString();
	}

	await supabase.from('watchlist').update(updates).eq('id', id);
}

export async function toggleViewer({
	request,
	locals: { supabase, safeGetSession }
}: RequestEvent) {
	await requireAuth(safeGetSession);

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

export async function setPlatform({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const id = form.get('id') as string;
	const platform = (form.get('platform') as string) || null;
	await supabase.from('watchlist').update({ platform }).eq('id', id);
}

export async function setFamilyRating({
	request,
	locals: { supabase, safeGetSession }
}: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const id = form.get('id') as string;
	const rating = Number(form.get('rating'));
	await supabase
		.from('watchlist')
		.update({ family_rating: rating > 0 ? rating : null })
		.eq('id', id);
}

export async function setEpisodeProgress({
	request,
	locals: { supabase, safeGetSession }
}: RequestEvent) {
	await requireAuth(safeGetSession);

	const form = await request.formData();
	const id = form.get('id') as string;
	const episode_progress = (form.get('episode_progress') as string) || null;
	await supabase.from('watchlist').update({ episode_progress }).eq('id', id);
}

export async function logWatch({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);

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
