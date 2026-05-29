<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data } = $props();
</script>

<div class="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-gray-600 text-lg">←</a>
		<h1 class="text-2xl font-bold text-gray-800">Arkiv</h1>
	</div>

	{#if data.sessions.length === 0}
		<p class="text-center text-gray-400 italic pt-12">Ingen arkiverte filmkvelder ennå.</p>
	{:else}
		<section class="space-y-3">
			{#each data.sessions as s}
				<div class="bg-white border rounded-2xl shadow-sm p-4 space-y-3 opacity-80">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold text-gray-700">{s.title}</p>
							{#if s.date}<p class="text-xs text-gray-400 mt-0.5">{s.date}</p>{/if}
						</div>
						<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">📦 Arkivert</span>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							onclick={() => goto(`/results/${s.id}`)}
							class="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200"
						>
							Se resultat
						</button>
						<form method="POST" action="?/unarchive" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">
								← Hent opp igjen
							</button>
						</form>
					</div>
				</div>
			{/each}
		</section>
	{/if}
</div>
