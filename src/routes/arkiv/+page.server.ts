import { requireAuth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const { data: sessions } = await supabase
		.from('voting_sessions')
		.select('*')
		.eq('status', 'archived')
		.order('closed_at', { ascending: false });

	return { sessions: sessions ?? [] };
};

export const actions: Actions = {
	unarchive: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase
			.from('voting_sessions')
			.update({ status: 'decided' })
			.eq('id', form.get('id') as string);
	}
};
