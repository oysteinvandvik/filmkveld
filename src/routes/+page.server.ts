import { requireAuth } from '$lib/server/auth';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const { data: sessions } = await supabase
		.from('voting_sessions')
		.select('*')
		.neq('status', 'archived')
		.order('created_at', { ascending: false });

	return { sessions: sessions ?? [] };
};

export const actions: Actions = {
	createSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const title = form.get('title') as string;
		const date = (form.get('date') as string) || null;
		const votes_per_person = Number(form.get('votes_per_person')) || 5;

		if (!title) return fail(400, { error: 'Tittel er påkrevd' });

		const { data, error } = await supabase
			.from('voting_sessions')
			.insert({ title, date, votes_per_person })
			.select()
			.single();

		if (error) return fail(500, { error: error.message });
		redirect(303, `/admin/sessions/${data.id}`);
	},

	openVoting: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase.from('voting_sessions').update({ status: 'voting' }).eq('id', form.get('id'));
	},

	backToSuggestion: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase.from('voting_sessions').update({ status: 'suggestion' }).eq('id', form.get('id'));
	},

	closeVoting: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase
			.from('voting_sessions')
			.update({ status: 'decided', closed_at: new Date().toISOString() })
			.eq('id', form.get('id'));
	},

	reopenVoting: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase
			.from('voting_sessions')
			.update({ status: 'voting', closed_at: null })
			.eq('id', form.get('id'));
	},

	archiveSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase.from('voting_sessions').update({ status: 'archived' }).eq('id', form.get('id'));
	},

	deleteSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		await supabase.from('voting_sessions').delete().eq('id', form.get('id') as string);
	}
};
