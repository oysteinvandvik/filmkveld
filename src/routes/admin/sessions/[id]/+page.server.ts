import { requireAuth } from '$lib/server/auth';
import { redirect, fail } from '@sveltejs/kit';
import { searchTmdb } from '$lib/tmdb';
import type { Movie, Person } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const [{ data: votingSession }, { data: candidates }, { data: participantRows }, { data: people }, { data: allSessions }] =
		await Promise.all([
			supabase.from('voting_sessions').select('*').eq('id', params.id).single(),
			supabase.from('session_candidates').select('id, movie:movies(*)').eq('session_id', params.id),
			supabase.from('session_participants').select('person_id').eq('session_id', params.id),
			supabase.from('people').select('*').order('name'),
			supabase
				.from('voting_sessions')
				.select('id, title, session_candidates(count)')
				.neq('id', params.id)
				.order('created_at', { ascending: false })
				.limit(10)
		]);

	if (!votingSession) redirect(303, '/admin');

	const participantIds = new Set((participantRows ?? []).map((r) => r.person_id));

	return {
		votingSession,
		candidates: (candidates ?? []).map((c) => ({
			id: c.id as string,
			movie: c.movie as unknown as Movie
		})),
		participantIds: [...participantIds] as string[],
		people: (people ?? []) as Person[],
		allSessions: (allSessions ?? []).map((s: any) => ({
			id: s.id as string,
			title: s.title as string,
			count: s.session_candidates?.[0]?.count ?? 0
		}))
	};
};

export const actions: Actions = {
	searchMovies: async ({ request, locals: { safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const query = form.get('query') as string;
		if (!query) return fail(400, { searchError: 'Skriv inn søketekst' });

		try {
			const results = await searchTmdb(query);
			return { searchResults: results };
		} catch {
			return fail(500, { searchError: 'Søk feilet, prøv igjen' });
		}
	},

	addCandidate: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const tmdb_id = Number(form.get('tmdb_id'));
		const title = form.get('title') as string;
		const type = form.get('type') as 'movie' | 'tv';
		const year = form.get('year') as string;
		const poster_url = form.get('poster_url') as string || null;
		const overview = form.get('overview') as string || null;

		// Upsert movie into cache
		await supabase.from('movies').upsert({ id: tmdb_id, title, type, year, poster_url, overview });

		// Add as candidate
		const { error } = await supabase
			.from('session_candidates')
			.insert({ session_id: params.id, movie_id: tmdb_id });

		if (error && error.code !== '23505') {
			// 23505 = unique violation (already added)
			return fail(500, { error: error.message });
		}
	},

	removeCandidate: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const candidate_id = form.get('candidate_id') as string;
		await supabase.from('session_candidates').delete().eq('id', candidate_id);
	},

	addParticipant: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const person_id = form.get('person_id') as string;
		const { error } = await supabase
			.from('session_participants')
			.insert({ session_id: params.id, person_id });
		if (error && error.code !== '23505') return fail(500, { error: error.message });
	},

	removeParticipant: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const person_id = form.get('person_id') as string;
		await supabase
			.from('session_participants')
			.delete()
			.eq('session_id', params.id)
			.eq('person_id', person_id);
	},

	copyFromSession: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const source_session_id = form.get('source_session_id') as string;

		const { data: sourceCandidates } = await supabase
			.from('session_candidates')
			.select('movie_id')
			.eq('session_id', source_session_id);

		if (sourceCandidates && sourceCandidates.length > 0) {
			await supabase.from('session_candidates').upsert(
				sourceCandidates.map((c) => ({ session_id: params.id, movie_id: c.movie_id }))
			);
		}
	}
};
