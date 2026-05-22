import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Handles all Supabase auth callbacks: invites, password recovery, magic links.
 *
 * Supabase may use two formats depending on flow:
 *   - PKCE:  ?code=XXX  (exchangeCodeForSession)
 *   - OTP:   ?token_hash=XXX&type=YYY  (verifyOtp)
 *
 * Both invite and recovery land on /auth/set-password.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;

	const needsPasswordSet = type === 'invite' || type === 'recovery';

	// PKCE flow — used by resetPasswordForEmail and newer Supabase projects
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, needsPasswordSet ? '/auth/set-password' : '/');
		}
	}

	// OTP / token-hash flow — used by inviteUserByEmail and some Supabase configs
	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });
		if (!error) {
			redirect(303, needsPasswordSet ? '/auth/set-password' : '/');
		}
	}

	redirect(303, '/login?error=Ugyldig+eller+utløpt+lenke');
};
