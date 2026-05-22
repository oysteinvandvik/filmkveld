import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Handles invite and magic-link confirmations from Supabase.
 * Supabase redirects here with ?token_hash=xxx&type=invite after the user clicks the email link.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });
		if (!error) {
			// First-time invite: send to password-setup page
			if (type === 'invite') redirect(303, '/auth/set-password');
			redirect(303, '/');
		}
	}

	redirect(303, '/login?error=Ugyldig+eller+utløpt+invitasjonslenke');
};
