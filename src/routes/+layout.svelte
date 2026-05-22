<script lang="ts">
	import '../app.css';
	import { goto, invalidate } from '$app/navigation';
	import { createBrowserClient, isBrowser } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_, session) => {
			if (session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

{#if data.session}
	<header class="bg-purple-700 text-white px-6 py-3 flex items-center justify-between shadow">
		<a href="/" class="text-lg font-bold tracking-tight">🎬 Filmkveld</a>
		<nav class="flex items-center gap-4 text-sm">
			<a href="/watching" class="hover:underline">Vi ser på</a>
			<a href="/admin" class="hover:underline">Admin</a>
			<a href="/admin/people" class="hover:underline">Deltakere</a>
			<button onclick={signOut} class="hover:underline opacity-75">Logg ut</button>
		</nav>
	</header>
{/if}

<main class="min-h-screen bg-gray-50">
	{@render children()}
</main>
