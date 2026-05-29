<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	const suggestion = $derived(data.sessions.filter((s: any) => s.status === 'suggestion'));
	const voting     = $derived(data.sessions.filter((s: any) => s.status === 'voting'));
	const decided    = $derived(data.sessions.filter((s: any) => s.status === 'decided'));
	// archived vises ikke på forsiden
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-3xl font-bold text-center text-purple-700 pt-4">🎬 Filmkveld</h1>

	{#if suggestion.length === 0 && voting.length === 0 && decided.length === 0}
		<p class="text-center text-gray-500 italic">Ingen aktive filmkvelder. Opprett en i admin.</p>
	{/if}

	<!-- Stemming åpen -->
	{#if voting.length > 0}
		<section class="space-y-3">
			<h2 class="text-lg font-semibold text-gray-700">🗳️ Stem nå</h2>
			{#each voting as session}
				<button
					onclick={() => goto(`/vote/${session.id}`)}
					class="w-full text-left bg-white border-2 border-purple-300 rounded-xl shadow p-4 hover:bg-purple-50 transition"
				>
					<div class="flex justify-between items-center">
						<div>
							<p class="font-semibold text-gray-800">{session.title}</p>
							{#if session.date}
								<p class="text-sm text-gray-500">{session.date}</p>
							{/if}
						</div>
						<span class="text-purple-600 font-medium text-sm">Stem →</span>
					</div>
				</button>
			{/each}
		</section>
	{/if}

	<!-- Planlegges -->
	{#if suggestion.length > 0}
		<section class="space-y-3">
			<h2 class="text-lg font-semibold text-gray-700">📋 Planlegges</h2>
			{#each suggestion as session}
				<div class="w-full text-left bg-white border rounded-xl p-4 opacity-75">
					<div class="flex justify-between items-center">
						<div>
							<p class="font-semibold text-gray-700">{session.title}</p>
							{#if session.date}
								<p class="text-sm text-gray-400">{session.date}</p>
							{/if}
						</div>
						<span class="text-blue-500 text-sm">Kandidater settes opp…</span>
					</div>
				</div>
			{/each}
		</section>
	{/if}

	<!-- Bestemt -->
	{#if decided.length > 0}
		<section class="space-y-3">
			<h2 class="text-lg font-semibold text-gray-700">🏆 Bestemt</h2>
			{#each decided as session}
				<button
					onclick={() => goto(`/results/${session.id}`)}
					class="w-full text-left bg-white border rounded-xl p-4 hover:bg-yellow-50 transition"
				>
					<div class="flex justify-between items-center">
						<div>
							<p class="font-semibold text-gray-800">{session.title}</p>
							{#if session.date}
								<p class="text-sm text-gray-500">{session.date}</p>
							{/if}
						</div>
						<span class="text-yellow-600 text-sm font-medium">Se resultat →</span>
					</div>
				</button>
			{/each}
		</section>
	{/if}
</div>
