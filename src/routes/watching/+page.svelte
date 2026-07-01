<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import WatchEntry from '$lib/components/WatchEntry.svelte';
	import type { WatchlistEntry } from '$lib/types';
	import type { TmdbMovie } from '$lib/tmdb';

	let { data, form } = $props();

	// --- Tab ---
	let tab = $state<'sessions' | 'watchlist'>('sessions');

	// --- Søk detalj-sheet ---
	let selectedSearch = $state<TmdbMovie | null>(null);

	// --- Filmkvelder tab ---
	let showCreate = $state(false);
	let votes_per_person = $state(5);

	const active = $derived((data.sessions as any[]).filter((s) => s.status === 'suggestion' || s.status === 'voting'));
	const decided = $derived((data.sessions as any[]).filter((s) => s.status === 'decided'));

	const statusConfig: Record<string, { icon: string; color: string }> = {
		suggestion: { icon: '📋', color: 'bg-blue-100 text-blue-700' },
		voting:     { icon: '🗳️', color: 'bg-green-100 text-green-700' },
		decided:    { icon: '🏆', color: 'bg-yellow-100 text-yellow-700' }
	};

	// --- Serier tab ---
	let searchQuery = $state('');
	let showSearch = $state(false);
	let searching = $state(false);
	let addingIds = $state<Set<number>>(new Set());

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

	const watching = $derived(filtered.filter((e) => e.status === 'watching'));
	const paused = $derived(filtered.filter((e) => e.status === 'paused'));
	const completed = $derived(filtered.filter((e) => e.status === 'completed'));
	const archivedEntries = $derived(filtered.filter((e) => e.status === 'archived'));

	const hasActiveFilter = $derived(
		selectedPeopleIds.length > 0 || selectedType !== null || selectedStatus !== 'watching'
	);

	const counts = $derived({
		watching: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'watching').length,
		paused: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'paused').length,
		completed: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'completed').length,
		archived: (data.watchlist as WatchlistEntry[]).filter((e) => e.status === 'archived').length
	});
</script>

<div class="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
	<h1 class="text-2xl font-bold text-gray-800 pt-2">Vi ser på</h1>

	<!-- Tabs -->
	<div class="flex gap-2">
		<button
			onclick={() => (tab = 'sessions')}
			class="px-4 py-2 rounded-xl text-sm font-medium transition {tab === 'sessions'
				? 'bg-purple-600 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
		>
			🎬 Filmkvelder
		</button>
		<button
			onclick={() => (tab = 'watchlist')}
			class="px-4 py-2 rounded-xl text-sm font-medium transition {tab === 'watchlist'
				? 'bg-purple-600 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
		>
			📺 Serier
		</button>
	</div>

	<!-- ── Filmkvelder-tab ── -->
	{#if tab === 'sessions'}
		{#if active.length > 0}
			<section class="space-y-3">
				{#each active as s}
					{@const cfg = statusConfig[s.status]}
					<div class="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
						<div class="flex items-start justify-between gap-3">
							<div>
								<div class="flex items-center gap-2 mb-0.5">
									<span class="text-xs font-medium px-2 py-0.5 rounded-full {cfg.color}">{cfg.icon} {s.status === 'suggestion' ? 'Forslag' : 'Stemming åpen'}</span>
								</div>
								<p class="font-semibold text-gray-800">{s.title}</p>
								{#if s.date}<p class="text-xs text-gray-400 mt-0.5">{s.date}</p>{/if}
							</div>
						</div>
						<div class="flex flex-wrap gap-2 text-sm">
							{#if s.status === 'suggestion'}
								<button onclick={() => goto(`/admin/sessions/${s.id}`)} class="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700">
									Legg til filmer →
								</button>
								<form method="POST" action="?/openVoting" use:enhance>
									<input type="hidden" name="id" value={s.id} />
									<button type="submit" class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-200">→ Åpne stemming</button>
								</form>
							{:else if s.status === 'voting'}
								<button onclick={() => goto(`/vote/${s.id}`)} class="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700">Stem →</button>
								<button onclick={() => goto(`/results/${s.id}`)} class="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200">Live</button>
								<form method="POST" action="?/backToSuggestion" use:enhance>
									<input type="hidden" name="id" value={s.id} />
									<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">← Forslag</button>
								</form>
								<form method="POST" action="?/closeVoting" use:enhance>
									<input type="hidden" name="id" value={s.id} />
									<button type="submit" class="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-200">→ Avslutt</button>
								</form>
							{/if}
							<form method="POST" action="?/deleteSession" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="text-red-400 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50"
									onclick={(e) => { if (!confirm('Slette?')) e.preventDefault(); }}>Slett</button>
							</form>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		{#if decided.length > 0}
			<section class="space-y-3">
				<h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avgjort</h2>
				{#each decided as s}
					<div class="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="font-semibold text-gray-800">{s.title}</p>
								{#if s.date}<p class="text-xs text-gray-400 mt-0.5">{s.date}</p>{/if}
							</div>
							<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">🏆 Bestemt</span>
						</div>
						<div class="flex flex-wrap gap-2 text-sm">
							<button onclick={() => goto(`/results/${s.id}`)} class="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-200">Se resultat</button>
							<form method="POST" action="?/reopenVoting" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">← Gjenåpne</button>
							</form>
							<form method="POST" action="?/archiveSession" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">→ Arkiver</button>
							</form>
							<form method="POST" action="?/deleteSession" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="text-red-400 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50"
									onclick={(e) => { if (!confirm('Slette?')) e.preventDefault(); }}>Slett</button>
							</form>
						</div>
					</div>
				{/each}
			</section>
		{/if}

		{#if active.length === 0 && decided.length === 0}
			<p class="text-center text-gray-400 italic pt-12">Ingen aktive filmkvelder ennå.<br/>Trykk + for å opprette en.</p>
		{/if}

		<div class="text-center pt-2">
			<a href="/arkiv" class="text-sm text-gray-400 hover:text-gray-600">📦 Arkiv</a>
		</div>
	{/if}

	<!-- ── Serier-tab ── -->
	{#if tab === 'watchlist'}
		<div class="flex items-center justify-between">
			<span></span>
			<button
				onclick={() => (showSearch = !showSearch)}
				class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
			>
				{showSearch ? 'Lukk' : '+ Legg til'}
			</button>
		</div>

		<!-- Filter -->
		<section class="bg-white border rounded-xl p-4 shadow-sm space-y-3">
			<div>
				<p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</p>
				<div class="flex flex-wrap gap-2">
					{#each statusOptions as opt}
						{@const isActive = selectedStatus === opt.value}
						{@const count = opt.value !== 'all' ? counts[opt.value] : null}
						<button
							onclick={() => (selectedStatus = opt.value)}
							class="text-sm px-3 py-1.5 rounded-full transition font-medium flex items-center gap-1.5 {isActive
								? 'bg-purple-600 text-white'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						>
							{opt.label}
							{#if count !== null && count > 0}
								<span class="text-xs rounded-full px-1.5 py-0.5 leading-none {isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'}">{count}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			{#if data.people.length > 0}
				<div>
					<p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Hvem ser</p>
					<div class="flex flex-wrap gap-2">
						{#each data.people as person}
							{@const isActive = selectedPeopleIds.includes(person.id)}
							<button
								onclick={() => togglePerson(person.id)}
								class="text-sm px-3 py-1.5 rounded-full transition font-medium {isActive
									? 'bg-purple-600 text-white'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
							>
								{person.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div>
				<p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Type</p>
				<div class="flex gap-2">
					{#each [{ value: null, label: 'Alle' }, { value: 'movie', label: 'Film' }, { value: 'tv', label: 'Serie' }] as t}
						{@const isActive = selectedType === t.value}
						<button
							onclick={() => (selectedType = t.value)}
							class="text-sm px-3 py-1.5 rounded-full transition font-medium {isActive
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
					onclick={() => { selectedPeopleIds = []; selectedType = null; selectedStatus = 'watching'; }}
					class="text-xs text-gray-400 hover:text-gray-600 underline"
				>Nullstill filter</button>
			{/if}
		</section>

		<!-- Søk og legg til -->
		{#if showSearch}
			<section class="bg-white border rounded-xl p-5 shadow space-y-4">
				<h2 class="font-semibold">Søk etter film eller serie</h2>
				<form method="POST" action="?/search" use:enhance={() => {
					searching = true;
					return ({ update }) => { update(); searching = false; };
				}} class="flex gap-2">
					<input name="query" bind:value={searchQuery} placeholder="Søk..." class="flex-1 border rounded-xl px-4 py-2" />
					<button type="submit" disabled={searching} class="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-50 min-w-[64px]">
						{searching ? '…' : 'Søk'}
					</button>
				</form>

				{#if form?.searchError}
					<p class="text-red-600 text-sm">{form.searchError}</p>
				{/if}

				{#if form?.searchResults}
					<div class="space-y-3">
						{#each form.searchResults as movie}
							<div class="border rounded-xl bg-gray-50 overflow-hidden">
								<button
									onclick={() => (selectedSearch = movie)}
									class="flex gap-3 p-3 w-full text-left hover:bg-gray-100 transition focus:outline-none"
									aria-label="Vis detaljer for {movie.title}"
								>
									<!-- Poster -->
									{#if movie.posterUrl}
										<img src={movie.posterUrl} alt={movie.title} class="w-16 h-24 object-cover object-top rounded-lg shadow shrink-0" />
									{:else}
										<div class="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">?</div>
									{/if}

									<!-- Info -->
									<div class="flex-1 min-w-0 flex flex-col gap-1">
										<p class="font-semibold text-sm leading-snug">{movie.title}</p>
										<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
											{#if movie.year}<span>{movie.year}</span>{/if}
											<span>·</span>
											<span>{movie.type === 'tv' ? 'Serie' : 'Film'}</span>
											{#if movie.type === 'movie' && movie.runtime}
												<span>· {movie.runtime} min</span>
											{:else if movie.type === 'tv' && movie.seasons}
												<span>· {movie.seasons} sesong{movie.seasons !== 1 ? 'er' : ''}</span>
											{/if}
											{#if movie.tmdbRating}
												<span class="text-yellow-500 font-medium">★ {movie.tmdbRating}</span>
											{/if}
										</div>
										{#if movie.genre}
											<div class="flex flex-wrap gap-1 mt-0.5">
												{#each movie.genre.split(', ').slice(0, 3) as g}
													<span class="text-xs bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded-full">{g}</span>
												{/each}
											</div>
										{/if}
										{#if movie.overview}
											<p class="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">{movie.overview}</p>
										{/if}
									</div>
								</button>

								<!-- Legg til-knapp -->
								<div class="px-3 pb-3">
									<form method="POST" action="?/add" use:enhance={() => {
										const id = movie.tmdbId;
										addingIds = new Set([...addingIds, id]);
										return ({ update }) => { update(); const next = new Set(addingIds); next.delete(id); addingIds = next; };
									}}>
										<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
										<input type="hidden" name="title" value={movie.title} />
										<input type="hidden" name="type" value={movie.type} />
										<input type="hidden" name="year" value={movie.year} />
										<input type="hidden" name="poster_url" value={movie.posterUrl ?? ''} />
										<input type="hidden" name="overview" value={movie.overview} />
										<button type="submit" disabled={addingIds.has(movie.tmdbId)}
											class="w-full text-xs bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium">
											{addingIds.has(movie.tmdbId) ? '…' : '+ Legg til seerlisten'}
										</button>
									</form>
								</div>
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
					{#each watching as entry}<WatchEntry {entry} people={data.people} />{/each}
				</section>
			{/if}
			{#if paused.length > 0}
				<section class="space-y-3">
					<h2 class="text-base font-semibold text-gray-700">⏸ Pause</h2>
					{#each paused as entry}<WatchEntry {entry} people={data.people} />{/each}
				</section>
			{/if}
			{#if completed.length > 0}
				<section class="space-y-3">
					<h2 class="text-base font-semibold text-gray-700">✓ Ferdig</h2>
					{#each completed as entry}<WatchEntry {entry} people={data.people} />{/each}
				</section>
			{/if}
			{#if archivedEntries.length > 0}
				<section class="space-y-3">
					<h2 class="text-base font-semibold text-gray-500">📦 Arkivert</h2>
					{#each archivedEntries as entry}<WatchEntry {entry} people={data.people} />{/each}
				</section>
			{/if}
		{:else}
			{#if filtered.length > 0}
				<section class="space-y-3">
					{#each filtered as entry}<WatchEntry {entry} people={data.people} />{/each}
				</section>
			{/if}
		{/if}

		{#if filtered.length === 0}
			<p class="text-center text-gray-400 italic">
				{hasActiveFilter ? 'Ingen treff for valgte filter.' : 'Ingen filmer eller serier lagt til ennå.'}
			</p>
		{/if}
	{/if}
</div>

<!-- FAB: kun på filmkvelder-tab -->
{#if tab === 'sessions'}
	<button
		onclick={() => (showCreate = true)}
		class="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-full shadow-xl flex items-center justify-center text-3xl z-40 transition"
		aria-label="Ny filmkveld"
	>+</button>
{/if}

<!-- Create sheet -->
{#if showCreate}
	<div class="fixed inset-0 bg-black/40 z-40" role="button" tabindex="-1" aria-label="Lukk"
		onclick={() => (showCreate = false)} onkeydown={(e) => e.key === 'Escape' && (showCreate = false)}></div>
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 space-y-4 max-w-lg mx-auto">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold">Ny filmkveld</h2>
			<button onclick={() => (showCreate = false)} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
		</div>

		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}

		<form method="POST" action="?/createSession"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') showCreate = false;
				};
			}}
			class="space-y-3"
		>
			<input name="title" placeholder="Tittel, f.eks. Fredagsfilm 23. mai" required
				class="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400" />
			<div class="flex gap-3">
				<input name="date" type="date" class="flex-1 border rounded-xl px-3 py-2.5" />
				<div class="flex items-center gap-2">
					<label for="vpp" class="text-sm text-gray-500 whitespace-nowrap">Stemmer:</label>
					<input id="vpp" name="votes_per_person" type="number" min="1" max="20"
						bind:value={votes_per_person}
						class="w-16 border rounded-xl px-3 py-2.5 text-center" />
				</div>
			</div>
			<button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl">
				Opprett og legg til filmer →
			</button>
		</form>
	</div>
{/if}

<!-- Søk detalj-sheet -->
{#if selectedSearch}
	<div
		class="fixed inset-0 bg-black/50 z-40"
		role="button"
		tabindex="-1"
		aria-label="Lukk"
		onclick={() => (selectedSearch = null)}
		onkeydown={(e) => e.key === 'Escape' && (selectedSearch = null)}
	></div>
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-w-lg mx-auto overflow-hidden max-h-[90dvh] flex flex-col">
		<div class="relative shrink-0">
			{#if selectedSearch.posterUrl}
				<img src={selectedSearch.posterUrl} alt={selectedSearch.title} class="w-full max-h-64 object-cover object-top" />
			{:else}
				<div class="w-full h-48 bg-gray-100 flex items-center justify-center text-6xl">🎬</div>
			{/if}
			<button
				onclick={() => (selectedSearch = null)}
				class="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg leading-none hover:bg-black/70 transition"
			>×</button>
		</div>
		<div class="p-5 space-y-4 overflow-y-auto">
			<div>
				<h2 class="text-xl font-bold text-gray-900 leading-snug">{selectedSearch.title}</h2>
				<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500 mt-1">
					{#if selectedSearch.year}<span>{selectedSearch.year}</span>{/if}
					<span>·</span>
					<span>{selectedSearch.type === 'tv' ? 'Serie' : 'Film'}</span>
					{#if selectedSearch.type === 'movie' && selectedSearch.runtime}
						<span>· {selectedSearch.runtime} min</span>
					{:else if selectedSearch.type === 'tv' && selectedSearch.seasons}
						<span>· {selectedSearch.seasons} sesong{selectedSearch.seasons !== 1 ? 'er' : ''}</span>
					{/if}
				</div>
				{#if selectedSearch.tmdbRating}
					<p class="text-sm text-yellow-500 font-semibold mt-1">★ {selectedSearch.tmdbRating} / 10</p>
				{/if}
				{#if selectedSearch.genre}
					<div class="flex flex-wrap gap-1.5 mt-2">
						{#each selectedSearch.genre.split(', ') as g}
							<span class="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{g}</span>
						{/each}
					</div>
				{/if}
			</div>
			{#if selectedSearch.overview}
				<p class="text-sm text-gray-600 leading-relaxed">{selectedSearch.overview}</p>
			{/if}
			<form method="POST" action="?/add" use:enhance={() => {
				const id = selectedSearch!.tmdbId;
				addingIds = new Set([...addingIds, id]);
				return ({ update }) => {
					update();
					const next = new Set(addingIds);
					next.delete(id);
					addingIds = next;
					selectedSearch = null;
				};
			}}>
				<input type="hidden" name="tmdb_id" value={selectedSearch.tmdbId} />
				<input type="hidden" name="title" value={selectedSearch.title} />
				<input type="hidden" name="type" value={selectedSearch.type} />
				<input type="hidden" name="year" value={selectedSearch.year} />
				<input type="hidden" name="poster_url" value={selectedSearch.posterUrl ?? ''} />
				<input type="hidden" name="overview" value={selectedSearch.overview} />
				<button type="submit" disabled={addingIds.has(selectedSearch.tmdbId)}
					class="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition">
					{addingIds.has(selectedSearch.tmdbId) ? '…' : '+ Legg til seerlisten'}
				</button>
			</form>
		</div>
	</div>
{/if}
