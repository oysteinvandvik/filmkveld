<script lang="ts">
	let { data } = $props();

	const maxPoints = $derived(Math.max(...data.ranked.map((c: any) => c.totalPoints), 1));
</script>

<div class="max-w-2xl mx-auto p-6 space-y-6">
	<div class="text-center space-y-1">
		<h1 class="text-2xl font-bold text-gray-800">{data.votingSession.title}</h1>
		{#if data.votingSession.date}
			<p class="text-gray-500 text-sm">{data.votingSession.date}</p>
		{/if}
		<p class="text-sm text-gray-500">
			{data.voterCount} av {data.participantCount} har stemt
		</p>
	</div>

	{#if data.ranked.length === 0}
		<p class="text-center text-gray-400 italic">Ingen kandidater.</p>
	{/if}

	{#each data.ranked as candidate, i}
		<div class="bg-white border rounded-xl shadow p-4 flex gap-4 {i === 0 && candidate.totalPoints > 0 ? 'border-yellow-300 bg-yellow-50' : ''}">
			<div class="flex-shrink-0 w-8 text-center">
				{#if i === 0 && candidate.totalPoints > 0}
					<span class="text-2xl">🏆</span>
				{:else}
					<span class="text-gray-400 font-bold">{i + 1}</span>
				{/if}
			</div>

			{#if candidate.movie.poster_url}
				<img
					src={candidate.movie.poster_url}
					alt={candidate.movie.title}
					class="w-16 h-auto rounded-lg shadow object-cover"
				/>
			{:else}
				<div class="w-16 h-22 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-2xl">?</div>
			{/if}

			<div class="flex-1 space-y-2 min-w-0">
				<div class="flex items-start justify-between gap-2">
					<div>
						<p class="font-semibold">{candidate.movie.title}</p>
						<p class="text-xs text-gray-500">{candidate.movie.year ?? ''} · {candidate.movie.type === 'tv' ? 'Serie' : 'Film'}</p>
					</div>
					<span class="text-purple-700 font-bold text-lg whitespace-nowrap">{candidate.totalPoints}p</span>
				</div>

				<!-- Visual bar -->
				<div class="h-2 bg-gray-100 rounded-full overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-500 {i === 0 && candidate.totalPoints > 0 ? 'bg-yellow-400' : 'bg-purple-400'}"
						style="width: {candidate.totalPoints > 0 ? (candidate.totalPoints / maxPoints) * 100 : 0}%"
					></div>
				</div>
			</div>
		</div>
	{/each}

	<div class="text-center">
		<a href="/" class="text-purple-600 hover:underline text-sm">← Tilbake</a>
	</div>
</div>
