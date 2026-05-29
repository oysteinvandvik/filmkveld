import { requireAuth } from '$lib/server/auth';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const [{ data: sessions }, { data: people }] = await Promise.all([
		supabase.from('voting_sessions').select('*').order('created_at', { ascending: false }),
		supabase.from('people').select('*').order('name')
	]);

	return { sessions: sessions ?? [], people: people ?? [] };
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

	// suggestion → voting
	openVoting: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('voting_sessions').update({ status: 'voting' }).eq('id', id);
	},

	// voting → suggestion
	backToSuggestion: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('voting_sessions').update({ status: 'suggestion' }).eq('id', id);
	},

	// voting → decided
	closeVoting: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase
			.from('voting_sessions')
			.update({ status: 'decided', closed_at: new Date().toISOString() })
			.eq('id', id);
	},

	// decided → voting
	reopenVoting: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase
			.from('voting_sessions')
			.update({ status: 'voting', closed_at: null })
			.eq('id', id);
	},

	// decided → archived
	archiveSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('voting_sessions').update({ status: 'archived' }).eq('id', id);
	},

	// archived → decided
	unarchiveSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('voting_sessions').update({ status: 'decided' }).eq('id', id);
	},

	deleteSession: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);
		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('voting_sessions').delete().eq('id', id);
	}
};
