import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) redirect(303, '/login');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const password = form.get('password') as string;
		const confirm = form.get('confirm') as string;

		if (!password || password.length < 8) {
			return fail(400, { error: 'Passord må være minst 8 tegn' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passordene stemmer ikke overens' });
		}

		const { error } = await supabase.auth.updateUser({ password });
		if (error) return fail(500, { error: error.message });

		redirect(303, '/');
	}
};
