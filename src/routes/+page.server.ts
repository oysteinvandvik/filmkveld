import { requireAuth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const { data: sessions } = await supabase
		.from('voting_sessions')
		.select('*')
		.order('created_at', { ascending: false });

	return { sessions: sessions ?? [] };
};
