import { requireAuth } from '$lib/server/auth';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	await requireAuth(safeGetSession);

	const { data: people } = await supabase.from('people').select('*').order('name');
	return { people: people ?? [] };
};

export const actions: Actions = {
	add: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Navn er påkrevd' });

		const { error } = await supabase.from('people').insert({ name });
		if (error) return fail(500, { error: error.message });
	},

	invite: async ({ request, url, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const id = form.get('id') as string;
		const email = (form.get('email') as string)?.trim().toLowerCase();

		if (!email) return fail(400, { inviteError: 'E-post er påkrevd', inviteId: id });

		// Store email on person record
		const { error: updateError } = await supabase
			.from('people')
			.update({ email })
			.eq('id', id);
		if (updateError) return fail(500, { inviteError: updateError.message, inviteId: id });

		// Send invite email via Supabase Admin API
		const redirectTo = `${url.origin}/auth/confirm`;
		console.log('[invite] sending to:', email, 'redirectTo:', redirectTo);

		const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
			redirectTo
		});

		console.log('[invite] result:', JSON.stringify({ data: inviteData?.user?.email, error: inviteError?.message }));

		if (inviteError) {
			// Always show the full error so we can debug
			return fail(500, { inviteError: inviteError.message, inviteId: id });
		}

		return { inviteSent: true, inviteId: id };
	},

	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		await requireAuth(safeGetSession);

		const form = await request.formData();
		const id = form.get('id') as string;
		await supabase.from('people').delete().eq('id', id);
	}
};
