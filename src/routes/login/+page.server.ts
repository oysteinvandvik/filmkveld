import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (session) redirect(303, '/');
};

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const email = form.get('email') as string;
		const password = form.get('password') as string;

		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { error: error.message });

		redirect(303, '/');
	},

	resetPassword: async ({ request, url, locals: { supabase } }) => {
		const form = await request.formData();
		const email = (form.get('email') as string)?.trim();

		if (!email) return fail(400, { resetError: 'Skriv inn e-postadressen din' });

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/auth/confirm`
		});

		if (error) return fail(500, { resetError: error.message });

		return { resetSent: true };
	}
};
