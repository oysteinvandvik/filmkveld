<script lang="ts">
	import { enhance } from '$app/forms';
	import WatchEntry from '$lib/components/WatchEntry.svelte';
	import type { WatchlistEntry } from '$lib/types';

	let { data, form } = $props();

	let searchQuery = $state('');
	let showSearch = $state(false);
	let searching = $state(false);
	let addingIds = $state<Set<number>>(new Set());

	// Filter-state
	let selectedPeopleIds = $state<string[]>([]);
	let selectedType = $state<string | null>(null);
	let selectedStatus = $state<'watching' | 'paused' | 'completed' | 'archived' | 'all'>('watching');

	function togglePerson(id: string) {
		selectedPeopleIds = selectedPeopleIds.includes(id)
			? selectedPeopleIds.filter((p) => p !== id)
			: [...selectedPeopleIds, id];
	}

	const statusOptions: { value: 'watching' | 'paused' | 'completed' | 'archived' | 'all'; label: string }[] = [
		{ value: 'watching', label: '▶ Ser nå' },
		{ value: 'paused', label: '⏸ Pause' },
		{ value: 'completed', label: '✓ Ferdig' },
		{ value: 'archived', label: '📦 Arkivert' },
		{ value: 'all', label: 'Alle' }
	];

	const filtered = $derived(
		(data.watchlist as WatchlistEntry[]).filter((e) => {
			if (selectedPeopleIds.length > 0) {
				const exactMatch =
					selectedPeopleIds.length === e.viewerIds.length &&
					selectedPeopleIds.every((id) => e.viewerIds.includes(id));
				if (!exactMatch) return false;
			}
			if (selectedType && e.movie.type !== selectedType) return false;
			if (selectedStatus !== 'all' && e.status !== selectedStatus) return false;
			return true;
		})
	);

	// For "alle"-visning: grupper i seksjoner
	const watching = $derived(filtered.filter((e) => e.status === 'watching'));
	const paused = $derived(filtered.filter((e) => e.status === 'paused'));
	const completed = $derived(filtered.filter((e) => e.status === 'completed'));
	const archivedEntries = $derived(filtered.filter((e) => e.status === 'archived'));

	// Nullstill-knappen er aktiv hvis noe avviker fra default
	const hasActiveFilter = $derived(
		selectedPeopleIds.length > 0 || selectedType !== null || selectedStatus !== 'watching'
	);

	// Antall per status for badges
	const counts = $derived({
		watching: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'watching').length,
		paused: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'paused').length,
		completed: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'completed').length,
		archived: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'archived').length
	});
</script>

<div class="max-w-3xl mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-800">Vi ser på</h1>
		<button
			onclick={() => (showSearch = !showSearch)}
			class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
		>
			{showSearch ? 'Lukk' : '+ Legg til'}
		</button>
	</div>

	<!-- Filter -->
	<section class="bg-white border rounded-xl p-4 shadow-sm space-y-3">
		<!-- Status -->
		<div>
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</p>
			<div class="flex flex-wrap gap-2">
				{#each statusOptions as opt}
					{@const active = selectedStatus === opt.value}
					{@const count = opt.value !== 'all' ? counts[opt.value] : null}
					<button
						onclick={() => (selectedStatus = opt.value)}
						class="text-sm px-3 py-1.5 rounded-full transition font-medium flex items-center gap-1.5 {active
							? 'bg-purple-600 text-white'
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					>
						{opt.label}
						{#if count !== null && count > 0}
							<span
								class="text-xs rounded-full px-1.5 py-0.5 leading-none {active
									? 'bg-white/25 text-white'
									: 'bg-gray-200 text-gray-500'}"
							>{count}</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Hvem ser -->
		{#if data.people.length > 0}
			<div>
				<p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Hvem ser</p>
				<div class="flex flex-wrap gap-2">
					{#each data.people as person}
						{@const active = selectedPeopleIds.includes(person.id)}
						<button
							onclick={() => togglePerson(person.id)}
							class="text-sm px-3 py-1.5 rounded-full transition font-medium {active
								? 'bg-purple-600 text-white'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						>
							{person.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Type -->
		<div>
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Type</p>
			<div class="flex gap-2">
				{#each [{ value: null, label: 'Alle' }, { value: 'movie', label: 'Film' }, { value: 'tv', label: 'Serie' }] as t}
					{@const active = selectedType === t.value}
					<button
						onclick={() => (selectedType = t.value)}
						class="text-sm px-3 py-1.5 rounded-full transition font-medium {active
							? 'bg-purple-600 text-white'
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					>
						{t.label}
					</button>
				{/each}
			</div>
		</div>

		{#if hasActiveFilter}
			<button
				onclick={() => {
					selectedPeopleIds = [];
					selectedType = null;
					selectedStatus = 'watching';
				}}
				class="text-xs text-gray-400 hover:text-gray-600 underline"
			>
				Nullstill filter
			</button>
		{/if}
	</section>

	<!-- Søk og legg til -->
	{#if showSearch}
		<section class="bg-white border rounded-xl p-5 shadow space-y-4">
			<h2 class="font-semibold">Søk etter film eller serie</h2>
			<form
				method="POST"
				action="?/search"
				use:enhance={() => {
					searching = true;
					return ({ update }) => {
						update();
						searching = false;
					};
				}}
				class="flex gap-2"
			>
				<input
					name="query"
					bind:value={searchQuery}
					placeholder="Søk..."
					class="flex-1 border rounded-xl px-4 py-2"
				/>
				<button
					type="submit"
					disabled={searching}
					class="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-50 min-w-[64px]"
				>
					{searching ? '…' : 'Søk'}
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
								<div
									class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm"
								>
									?
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="font-medium text-sm truncate">{movie.title}</p>
								<p class="text-xs text-gray-500">
									{movie.year} · {movie.type === 'tv' ? 'Serie' : 'Film'}
								</p>
							</div>
							<form
								method="POST"
								action="?/add"
								use:enhance={() => {
									const id = movie.tmdbId;
									addingIds = new Set([...addingIds, id]);
									return ({ update }) => {
										update();
										const next = new Set(addingIds);
										next.delete(id);
										addingIds = next;
									};
								}}
							>
								<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
								<input type="hidden" name="title" value={movie.title} />
								<input type="hidden" name="type" value={movie.type} />
								<input type="hidden" name="year" value={movie.year} />
								<input type="hidden" name="poster_url" value={movie.posterUrl ?? ''} />
								<input type="hidden" name="overview" value={movie.overview} />
								<button
									type="submit"
									disabled={addingIds.has(movie.tmdbId)}
									class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full hover:bg-purple-700 disabled:opacity-50 min-w-[64px]"
								>
									{addingIds.has(movie.tmdbId) ? '…' : 'Legg til'}
								</button>
							</form>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	<!-- Innhold -->
	{#if selectedStatus === 'all'}
		{#if watching.length > 0}
			<section class="space-y-3">
				<h2 class="text-base font-semibold text-gray-700">▶ Ser nå</h2>
				{#each watching as entry}
					<WatchEntry {entry} people={data.people} />
				{/each}
			</section>
		{/if}
		{#if paused.length > 0}
			<section class="space-y-3">
				<h2 class="text-base font-semibold text-gray-700">⏸ Pause</h2>
				{#each paused as entry}
					<WatchEntry {entry} people={data.people} />
				{/each}
			</section>
		{/if}
		{#if completed.length > 0}
			<section class="space-y-3">
				<h2 class="text-base font-semibold text-gray-700">✓ Ferdig</h2>
				{#each completed as entry}
					<WatchEntry {entry} people={data.people} />
				{/each}
			</section>
		{/if}
		{#if archivedEntries.length > 0}
			<section class="space-y-3">
				<h2 class="text-base font-semibold text-gray-500">📦 Arkivert</h2>
				{#each archivedEntries as entry}
					<WatchEntry {entry} people={data.people} />
				{/each}
			</section>
		{/if}
	{:else}
		{#if filtered.length > 0}
			<section class="space-y-3">
				{#each filtered as entry}
					<WatchEntry {entry} people={data.people} />
				{/each}
			</section>
		{/if}
	{/if}

	{#if filtered.length === 0}
		<p class="text-center text-gray-400 italic">
			{hasActiveFilter
				? 'Ingen treff for valgte filter.'
				: 'Ingen filmer eller serier lagt til ennå.'}
		</p>
	{/if}
</div>
