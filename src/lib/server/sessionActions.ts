import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';

export async function createSession({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
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
	return { created: data.id };
}

export async function openVoting({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);
	const form = await request.formData();
	await supabase.from('voting_sessions').update({ status: 'voting' }).eq('id', form.get('id'));
}

export async function backToSuggestion({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);
	const form = await request.formData();
	await supabase.from('voting_sessions').update({ status: 'suggestion' }).eq('id', form.get('id'));
}

export async function closeVoting({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);
	const form = await request.formData();
	await supabase
		.from('voting_sessions')
		.update({ status: 'decided', closed_at: new Date().toISOString() })
		.eq('id', form.get('id'));
}

export async function reopenVoting({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);
	const form = await request.formData();
	await supabase
		.from('voting_sessions')
		.update({ status: 'voting', closed_at: null })
		.eq('id', form.get('id'));
}

export async function archiveSession({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);
	const form = await request.formData();
	await supabase.from('voting_sessions').update({ status: 'archived' }).eq('id', form.get('id'));
}

export async function deleteSession({ request, locals: { supabase, safeGetSession } }: RequestEvent) {
	await requireAuth(safeGetSession);
	const form = await request.formData();
	await supabase.from('voting_sessions').delete().eq('id', form.get('id') as string);
}
