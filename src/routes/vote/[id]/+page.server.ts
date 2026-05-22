import { requireAuth } from '$lib/server/auth';
import { redirect, fail } from '@sveltejs/kit';
import type { Movie } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const [{ data: votingSession }, { data: candidates }, { data: participantRows }, { data: allVotes }] =
		await Promise.all([
			supabase.from('voting_sessions').select('*').eq('id', params.id).single(),
			supabase.from('session_candidates').select('id, movie:movies(*)').eq('session_id', params.id),
			supabase.from('session_participants').select('person_id').eq('session_id', params.id),
			supabase.from('votes').select('candidate_id, person_id, points').eq('session_id', params.id)
		]);

	if (!votingSession) redirect(303, '/');

	// Fetch people separately to avoid foreign key join issues
	const personIds = (participantRows ?? []).map((r) => r.person_id);
	const { data: people } = personIds.length > 0
		? await supabase.from('people').select('id, name').in('id', personIds)
		: { data: [] };

	return {
		votingSession,
		candidates: (candidates ?? []).map((c) => ({
			id: c.id as string,
			movie: c.movie as unknown as Movie
		})),
		participants: (people ?? []) as { id: string; name: string }[],
		allVotes: allVotes ?? []
	};
};

export const actions: Actions = {
	vote: async ({ request, params, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const person_id = form.get('person_id') as string;

		const { data: votingSession } = await supabase
			.from('voting_sessions')
			.select('votes_per_person, status')
			.eq('id', params.id)
			.single();

		if (!votingSession || votingSession.status !== 'open') {
			return fail(400, { error: 'Avstemningen er avsluttet' });
		}

		// Parse votes: candidateId -> points
		const voteEntries: { candidate_id: string; points: number }[] = [];
		let totalPoints = 0;

		for (const [key, value] of form.entries()) {
			if (key.startsWith('points_')) {
				const candidate_id = key.replace('points_', '');
				const points = Number(value);
				if (points > 0) {
					voteEntries.push({ candidate_id, points });
					totalPoints += points;
				}
			}
		}

		if (totalPoints > votingSession.votes_per_person) {
			return fail(400, { error: `Maks ${votingSession.votes_per_person} poeng totalt` });
		}

		// Delete existing votes for this person in this session, then insert
		await supabase.from('votes').delete().eq('session_id', params.id).eq('person_id', person_id);

		if (voteEntries.length > 0) {
			await supabase.from('votes').insert(
				voteEntries.map((v) => ({
					session_id: params.id,
					candidate_id: v.candidate_id,
					person_id,
					points: v.points
				}))
			);
		}

		return { success: true };
	}
};
