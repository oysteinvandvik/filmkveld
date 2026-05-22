import { redirect } from '@sveltejs/kit';
import type { Session, User } from '@supabase/supabase-js';

type SafeGetSession = () => Promise<{ session: Session | null; user: User | null }>;

export async function requireAuth(safeGetSession: SafeGetSession): Promise<void> {
	const { session } = await safeGetSession();
	if (!session) redirect(303, '/login');
}
