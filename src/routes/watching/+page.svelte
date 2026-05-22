<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let searchQuery = $state('');
	let showSearch = $state(false);

	const statusLabel: Record<string, string> = {
		watching: '▶ Ser nå',
		paused: '⏸ Pause',
		completed: '✓ Ferdig'
	};

	const statusColor: Record<string, string> = {
		watching: 'bg-green-100 text-green-700',
		paused: 'bg-yellow-100 text-yellow-700',
		completed: 'bg-gray-100 text-gray-500'
	};

	const watching = $derived(data.watchlist.filter((e: any) => e.status === 'watching'));
	const paused = $derived(data.watchlist.filter((e: any) => e.status === 'paused'));
	const completed = $derived(data.watchlist.filter((e: any) => e.status === 'completed'));
</script>

<div class="max-w-3xl mx-auto p-6 space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Vi ser på</h1>
		<button
			onclick={() => showSearch = !showSearch}
			class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
		>
			{showSearch ? 'Lukk' : '+ Legg til'}
		</button>
	</div>

	<!-- Søk og legg til -->
	{#if showSearch}
		<section class="bg-white border rounded-xl p-5 shadow space-y-4">
			<h2 class="font-semibold">Søk etter film eller serie</h2>
			<form method="POST" action="?/search" use:enhance class="flex gap-2">
				<input
					name="query"
					bind:value={searchQuery}
					placeholder="Søk..."
					class="flex-1 border rounded-xl px-4 py-2"
				/>
				<button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700">
					Søk
				</button>
			</form>

			{#if form?.searchError}
				<p class="text-red-600 text-sm">{form.searchError}</p>
			{/if}

			{#if form?.searchResults}
				<div class="space-y-2">
					{#each form.searchResults as movie}
						<div class="flex items-center gap-3 border rounded-xl p-3 bg-gray-50">
							{#if movie.posterUrl}
								<img src={movie.posterUrl} alt={movie.title} class="w-12 h-auto rounded shadow" />
							{:else}
								<div class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">?</div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="font-medium text-sm truncate">{movie.title}</p>
								<p class="text-xs text-gray-500">{movie.year} · {movie.type === 'tv' ? 'Serie' : 'Film'}</p>
							</div>
							<form method="POST" action="?/add" use:enhance>
								<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
								<input type="hidden" name="title" value={movie.title} />
								<input type="hidden" name="type" value={movie.type} />
								<input type="hidden" name="year" value={movie.year} />
								<input type="hidden" name="poster_url" value={movie.posterUrl ?? ''} />
								<input type="hidden" name="overview" value={movie.overview} />
								<button type="submit" class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full hover:bg-purple-700">
									Legg til
								</button>
							</form>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	<!-- Ser nå -->
	{#if watching.length > 0}
		<section class="space-y-3">
			<h2 class="text-base font-semibold text-gray-700">▶ Ser nå</h2>
			{#each watching as entry}
				{@render WatchEntry({ entry, people: data.people, statusLabel, statusColor })}
			{/each}
		</section>
	{/if}

	<!-- Pause -->
	{#if paused.length > 0}
		<section class="space-y-3">
			<h2 class="text-base font-semibold text-gray-700">⏸ Pause</h2>
			{#each paused as entry}
				{@render WatchEntry({ entry, people: data.people, statusLabel, statusColor })}
			{/each}
		</section>
	{/if}

	<!-- Ferdig -->
	{#if completed.length > 0}
		<section class="space-y-3">
			<h2 class="text-base font-semibold text-gray-700">✓ Ferdig</h2>
			{#each completed as entry}
				{@render WatchEntry({ entry, people: data.people, statusLabel, statusColor })}
			{/each}
		</section>
	{/if}

	{#if data.watchlist.length === 0 && !showSearch}
		<p class="text-center text-gray-400 italic">Ingen filmer eller serier lagt til ennå.</p>
	{/if}
</div>

<!-- Inline component for each watchlist entry -->
{#snippet WatchEntry({ entry, people, statusLabel, statusColor }: any)}
	<div class="bg-white border rounded-xl shadow overflow-hidden">
		<div class="flex gap-4 p-4">
			{#if entry.movie.poster_url}
				<img src={entry.movie.poster_url} alt={entry.movie.title} class="w-16 h-auto rounded-lg object-cover shadow" />
			{:else}
				<div class="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-2xl">?</div>
			{/if}

			<div class="flex-1 min-w-0 space-y-2">
				<div class="flex items-start justify-between gap-2">
					<div>
						<p class="font-semibold">{entry.movie.title}</p>
						<p class="text-xs text-gray-500">{entry.movie.year ?? ''} · {entry.movie.type === 'tv' ? 'Serie' : 'Film'}</p>
					</div>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={entry.id} />
						<button
							type="submit"
							class="text-gray-300 hover:text-red-400 text-lg leading-none"
							onclick={(e: MouseEvent) => { if (!confirm('Fjerne?')) e.preventDefault(); }}
						>×</button>
					</form>
				</div>

				<!-- Status -->
				<div class="flex gap-2 flex-wrap">
					{#each ['watching', 'paused', 'completed'] as s}
						<form method="POST" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={entry.id} />
							<input type="hidden" name="status" value={s} />
							<button
								type="submit"
								class="text-xs px-2.5 py-1 rounded-full transition {entry.status === s
									? statusColor[s] + ' font-semibold'
									: 'bg-gray-50 text-gray-400 hover:bg-gray-100'}"
							>
								{statusLabel[s]}
							</button>
						</form>
					{/each}
				</div>

				<!-- Hvem ser -->
				<div class="flex flex-wrap gap-2 pt-1">
					{#each people as person}
						{@const isViewer = entry.viewerIds.includes(person.id)}
						<form method="POST" action="?/toggleViewer" use:enhance>
							<input type="hidden" name="watchlist_id" value={entry.id} />
							<input type="hidden" name="person_id" value={person.id} />
							<input type="hidden" name="currently_watching" value={String(isViewer)} />
							<button
								type="submit"
								class="text-xs px-3 py-1 rounded-full transition {isViewer
									? 'bg-purple-600 text-white'
									: 'bg-gray-100 text-gray-500 hover:bg-gray-200'}"
							>
								{isViewer ? '✓ ' : '+ '}{person.name}
							</button>
						</form>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/snippet}
