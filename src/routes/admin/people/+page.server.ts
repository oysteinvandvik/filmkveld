import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) redirect(303, '/login');

	const { data: people } = await supabase.from('people').select('*').order('name');
	return { people: people ?? [] };
};

export const actions: Actions = {
	add: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Navn er påkrevd' });

		const { error } = await supabase.from('people').insert({ name });
		if (error) return fail(500, { error: error.message });
	},

	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) redirect(303, '/login');

		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('people').delete().eq('id', id);
	}
};
