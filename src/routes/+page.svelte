<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	const open = $derived(data.sessions.filter((s: any) => s.status === 'open'));
	const closed = $derived(data.sessions.filter((s: any) => s.status === 'closed'));
</script>

<div class="max-w-2xl mx-auto p-6 space-y-8">
	<h1 class="text-3xl font-bold text-center text-purple-700 pt-4">Filmkveld</h1>

	{#if open.length === 0 && closed.length === 0}
		<p class="text-center text-gray-500 italic">Ingen avstemninger ennå. Opprett en i admin.</p>
	{/if}

	{#if open.length > 0}
		<section class="space-y-3">
			<h2 class="text-lg font-semibold text-gray-700">Åpne avstemninger</h2>
			{#each open as session}
				<button
					onclick={() => goto(`/vote/${session.id}`)}
					class="w-full text-left bg-white border rounded-xl shadow p-4 hover:bg-purple-50 transition"
				>
					<div class="flex justify-between items-center">
						<div>
							<p class="font-semibold text-gray-800">{session.title}</p>
							{#if session.date}
							<p class="text-sm text-gray-500">{session.date}</p>
						{/if}
						</div>
						<span class="text-green-600 text-sm font-medium">Stem →</span>
					</div>
				</button>
			{/each}
		</section>
	{/if}

	{#if closed.length > 0}
		<section class="space-y-3">
			<h2 class="text-lg font-semibold text-gray-700">Avsluttede</h2>
			{#each closed as session}
				<button
					onclick={() => goto(`/results/${session.id}`)}
					class="w-full text-left bg-white border rounded-xl p-4 hover:bg-gray-50 transition opacity-75"
				>
					<div class="flex justify-between items-center">
						<div>
							<p class="font-semibold text-gray-800">{session.title}</p>
							{#if session.date}
								<p class="text-sm text-gray-500">{session.date}</p>
							{/if}
						</div>
						<span class="text-gray-500 text-sm">Resultater →</span>
					</div>
				</button>
			{/each}
		</section>
	{/if}
</div>
