import { requireAuth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { Movie } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const [{ data: votingSession }, { data: candidates }, { data: votes }, { data: participants }] =
		await Promise.all([
			supabase.from('voting_sessions').select('*').eq('id', params.id).single(),
			supabase
				.from('session_candidates')
				.select('id, movie:movies(*)')
				.eq('session_id', params.id),
			supabase.from('votes').select('candidate_id, person_id, points').eq('session_id', params.id),
			supabase
				.from('session_participants')
				.select('person:people(*)')
				.eq('session_id', params.id)
		]);

	if (!votingSession) redirect(303, '/');

	// Aggregate: total points per candidate
	const totals: Record<string, number> = {};
	const voterSet = new Set<string>();
	for (const v of votes ?? []) {
		totals[v.candidate_id] = (totals[v.candidate_id] ?? 0) + v.points;
		voterSet.add(v.person_id);
	}

	const ranked = (candidates ?? [])
		.map((c) => ({
			id: c.id as string,
			movie: c.movie as unknown as Movie,
			totalPoints: totals[c.id as string] ?? 0
		}))
		.sort((a, b) => b.totalPoints - a.totalPoints);

	return {
		votingSession,
		ranked,
		voterCount: voterSet.size,
		participantCount: (participants ?? []).length
	};
};
