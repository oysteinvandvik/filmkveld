<script lang="ts">
	import { enhance } from '$app/forms';
	import { platforms, statusLabel, statusColor } from '$lib/constants';
	import type { WatchlistEntry, Person } from '$lib/types';

	let { data, form } = $props();

	let searchQuery = $state('');
	let showSearch = $state(false);
	const today = new Date().toISOString().split('T')[0];

	// Filter-state
	let selectedPeopleIds = $state<string[]>([]);
	let selectedType = $state<string | null>(null);

	function togglePerson(id: string) {
		selectedPeopleIds = selectedPeopleIds.includes(id)
			? selectedPeopleIds.filter((p) => p !== id)
			: [...selectedPeopleIds, id];
	}

	// Seanselogg-state (hvilke kort er utvidet / har åpen logg-form)
	let expandedLogs = $state<Set<string>>(new Set());
	let openLogForms = $state<Set<string>>(new Set());

	function toggleLogs(id: string) {
		const next = new Set(expandedLogs);
		next.has(id) ? next.delete(id) : next.add(id);
		expandedLogs = next;
	}

	function toggleLogForm(id: string) {
		const next = new Set(openLogForms);
		next.has(id) ? next.delete(id) : next.add(id);
		openLogForms = next;
	}

	const filtered = $derived(
		(data.watchlist as WatchlistEntry[]).filter((e) => {
			if (selectedPeopleIds.length > 0) {
				if (!selectedPeopleIds.every((id) => e.viewerIds.includes(id))) return false;
			}
			if (selectedType && e.movie.type !== selectedType) return false;
			return true;
		})
	);

	const watching = $derived(filtered.filter((e) => e.status === 'watching'));
	const paused = $derived(filtered.filter((e) => e.status === 'paused'));
	const completed = $derived(filtered.filter((e) => e.status === 'completed'));
	const hasActiveFilter = $derived(selectedPeopleIds.length > 0 || selectedType !== null);

	function formatDate(dateStr: string | null) {
		if (!dateStr) return null;
		return new Date(dateStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' });
	}
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
			<form method="POST" action="?/search" use:enhance class="flex gap-2">
				<input
					name="query"
					bind:value={searchQuery}
					placeholder="Søk..."
					class="flex-1 border rounded-xl px-4 py-2"
				/>
				<button
					type="submit"
					class="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700"
				>
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
							<form method="POST" action="?/add" use:enhance>
								<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
								<input type="hidden" name="title" value={movie.title} />
								<input type="hidden" name="type" value={movie.type} />
								<input type="hidden" name="year" value={movie.year} />
								<input type="hidden" name="poster_url" value={movie.posterUrl ?? ''} />
								<input type="hidden" name="overview" value={movie.overview} />
								<button
									type="submit"
									class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full hover:bg-purple-700"
								>
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
				{@render WatchEntry({ entry, people: data.people })}
			{/each}
		</section>
	{/if}

	<!-- Pause -->
	{#if paused.length > 0}
		<section class="space-y-3">
			<h2 class="text-base font-semibold text-gray-700">⏸ Pause</h2>
			{#each paused as entry}
				{@render WatchEntry({ entry, people: data.people })}
			{/each}
		</section>
	{/if}

	<!-- Ferdig -->
	{#if completed.length > 0}
		<section class="space-y-3">
			<h2 class="text-base font-semibold text-gray-700">✓ Ferdig</h2>
			{#each completed as entry}
				{@render WatchEntry({ entry, people: data.people })}
			{/each}
		</section>
	{/if}

	{#if filtered.length === 0}
		<p class="text-center text-gray-400 italic">
			{hasActiveFilter ? 'Ingen treff for valgte filter.' : 'Ingen filmer eller serier lagt til ennå.'}
		</p>
	{/if}
</div>

{#snippet WatchEntry({ entry, people }: { entry: WatchlistEntry; people: Person[] })}
	<div class="bg-white border rounded-xl shadow overflow-hidden">
		<div class="flex gap-4 p-4">
			<!-- Poster -->
			{#if entry.movie.poster_url}
				<img
					src={entry.movie.poster_url}
					alt={entry.movie.title}
					class="w-16 h-auto rounded-lg object-cover shadow shrink-0"
				/>
			{:else}
				<div
					class="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-2xl shrink-0"
				>
					?
				</div>
			{/if}

			<div class="flex-1 min-w-0 space-y-2.5">
				<!-- Tittel + slett -->
				<div class="flex items-start justify-between gap-2">
					<div>
						<p class="font-semibold leading-snug">{entry.movie.title}</p>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
							<p class="text-xs text-gray-500">
								{entry.movie.year ?? ''} · {entry.movie.type === 'tv' ? 'Serie' : 'Film'}
								{#if entry.movie.type === 'tv' && entry.movie.seasons}
									· {entry.movie.seasons} sesong{entry.movie.seasons !== 1 ? 'er' : ''}
								{:else if entry.movie.type === 'movie' && entry.movie.runtime}
									· {entry.movie.runtime} min
								{/if}
							</p>
							{#if entry.movie.tmdb_rating}
								<span class="text-xs text-yellow-600 font-medium">★ {entry.movie.tmdb_rating}</span>
							{/if}
						</div>
						<!-- Sjangertagger -->
						{#if entry.movie.genre}
							<div class="flex flex-wrap gap-1 mt-1">
								{#each entry.movie.genre.split(', ') as g}
									<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{g}</span>
								{/each}
							</div>
						{/if}
					</div>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={entry.id} />
						<button
							type="submit"
							class="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
							onclick={(e: MouseEvent) => {
								if (!confirm('Fjerne?')) e.preventDefault();
							}}
						>×</button>
					</form>
				</div>

				<!-- Status -->
				<div class="flex gap-1.5 flex-wrap">
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

				<!-- Platform -->
				<div>
					<p class="text-xs text-gray-400 mb-1">Plattform</p>
					<div class="flex flex-wrap gap-1.5">
						{#each platforms as p}
							{@const active = entry.platform === p}
							<form method="POST" action="?/setPlatform" use:enhance>
								<input type="hidden" name="id" value={entry.id} />
								<input type="hidden" name="platform" value={active ? '' : p} />
								<button
									type="submit"
									class="text-xs px-2.5 py-1 rounded-full transition {active
										? 'bg-blue-600 text-white'
										: 'bg-gray-50 text-gray-400 hover:bg-gray-100'}"
								>
									{p}
								</button>
							</form>
						{/each}
					</div>
				</div>

				<!-- Fremdrift (TV, ikke ferdig) -->
				{#if entry.movie.type === 'tv' && entry.status !== 'completed'}
					<div>
						<p class="text-xs text-gray-400 mb-1">Fremdrift</p>
						<form method="POST" action="?/setEpisodeProgress" use:enhance>
							<input type="hidden" name="id" value={entry.id} />
							<input
								type="text"
								name="episode_progress"
								value={entry.episode_progress ?? ''}
								placeholder="S01E01"
								class="text-xs border rounded-lg px-2.5 py-1.5 w-28 focus:outline-none focus:ring-1 focus:ring-purple-400"
								onblur={(e) => e.currentTarget.form?.requestSubmit()}
							/>
						</form>
					</div>
				{/if}

				<!-- Hvem ser -->
				<div>
					<p class="text-xs text-gray-400 mb-1">Hvem ser</p>
					<div class="flex flex-wrap gap-1.5">
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

				<!-- Familievurdering -->
				<div>
					<p class="text-xs text-gray-400 mb-1">Familiens vurdering</p>
					<div class="flex gap-0.5">
						{#each [1, 2, 3, 4, 5] as star}
							<form method="POST" action="?/setFamilyRating" use:enhance>
								<input type="hidden" name="id" value={entry.id} />
								<input
									type="hidden"
									name="rating"
									value={entry.family_rating === star ? 0 : star}
								/>
								<button
									type="submit"
									class="text-xl leading-none transition {star <= (entry.family_rating ?? 0)
										? 'text-yellow-400 hover:text-yellow-300'
										: 'text-gray-200 hover:text-yellow-300'}"
								>
									★
								</button>
							</form>
						{/each}
					</div>
				</div>

				<!-- Datoer -->
				{#if entry.started_at || entry.completed_at}
					<div class="flex gap-4 text-xs text-gray-400">
						{#if entry.started_at}
							<span>Startet: {formatDate(entry.started_at)}</span>
						{/if}
						{#if entry.completed_at}
							<span>Ferdig: {formatDate(entry.completed_at)}</span>
						{/if}
					</div>
				{/if}

				<!-- Seanselogg -->
				<div class="border-t pt-2 mt-1">
					<div class="flex items-center gap-3">
						{#if entry.watchLogs.length > 0}
							<button
								onclick={() => toggleLogs(entry.id)}
								class="text-xs text-gray-500 hover:text-gray-700"
							>
								📋 {entry.watchLogs.length} seanse{entry.watchLogs.length !== 1 ? 'r' : ''} logget
								{expandedLogs.has(entry.id) ? '▲' : '▼'}
							</button>
						{/if}
						<button
							onclick={() => toggleLogForm(entry.id)}
							class="text-xs text-purple-600 hover:text-purple-800 font-medium"
						>
							{openLogForms.has(entry.id) ? 'Avbryt' : '+ Logg seanse'}
						</button>
					</div>

					<!-- Logg-form -->
					{#if openLogForms.has(entry.id)}
						<form
							method="POST"
							action="?/logWatch"
							use:enhance={() => {
								return ({ update }) => {
									update();
									const next = new Set(openLogForms);
									next.delete(entry.id);
									openLogForms = next;
								};
							}}
							class="mt-3 space-y-2 bg-gray-50 rounded-xl p-3"
						>
							<input type="hidden" name="watchlist_id" value={entry.id} />
							<div class="flex gap-3 items-center">
								<div>
									<label for="log-date-{entry.id}" class="text-xs text-gray-500 block mb-1">Dato</label>
									<input
										id="log-date-{entry.id}"
										type="date"
										name="watched_at"
										value={today}
										class="text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
									/>
								</div>
								<div class="flex-1">
									<label for="log-notes-{entry.id}" class="text-xs text-gray-500 block mb-1">Notis (valgfritt)</label>
									<input
										id="log-notes-{entry.id}"
										type="text"
										name="notes"
										placeholder="f.eks. sesongfinale!"
										class="text-xs border rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-purple-400"
									/>
								</div>
							</div>
							<div>
								<p class="text-xs text-gray-500 mb-1">Hvem var til stede</p>
								<div class="flex flex-wrap gap-2">
									{#each people as person}
										<label class="flex items-center gap-1.5 text-xs cursor-pointer">
											<input
												type="checkbox"
												name="viewer_ids[]"
												value={person.id}
												checked={entry.viewerIds.includes(person.id)}
												class="accent-purple-600"
											/>
											{person.name}
										</label>
									{/each}
								</div>
							</div>
							<button
								type="submit"
								class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700"
							>
								Lagre seanse
							</button>
						</form>
					{/if}

					<!-- Logg-liste -->
					{#if expandedLogs.has(entry.id) && entry.watchLogs.length > 0}
						<div class="mt-2 space-y-1.5">
							{#each entry.watchLogs as log}
								<div class="text-xs bg-gray-50 rounded-lg px-3 py-2">
									<div class="flex items-center justify-between">
										<span class="font-medium text-gray-700"
											>{new Date(log.watched_at).toLocaleDateString('nb-NO', {
												day: 'numeric',
												month: 'short',
												year: 'numeric'
											})}</span
										>
										{#if log.viewerIds.length > 0}
											<span class="text-gray-400">
												{people
													.filter((p: any) => log.viewerIds.includes(p.id))
													.map((p: any) => p.name)
													.join(', ')}
											</span>
										{/if}
									</div>
									{#if log.notes}
										<p class="text-gray-500 mt-0.5">{log.notes}</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/snippet}
