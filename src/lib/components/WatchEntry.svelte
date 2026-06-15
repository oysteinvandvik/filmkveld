<script lang="ts">
	import { enhance } from '$app/forms';
	import { platforms, statusLabel, statusColor } from '$lib/constants';
	import type { WatchlistEntry, Person } from '$lib/types';

	let { entry, people }: { entry: WatchlistEntry; people: Person[] } = $props();

	let showLogs = $state(false);
	let showLogForm = $state(false);
	let showSettings = $state(!!(entry.platform || entry.family_rating || entry.episode_progress));
	let savingLog = $state(false);

	const today = new Date().toISOString().split('T')[0];

	function formatDate(dateStr: string | null) {
		if (!dateStr) return null;
		return new Date(dateStr).toLocaleDateString('nb-NO', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	// Summary shown in the settings toggle when collapsed
	const settingsSummary = $derived(
		[
			entry.platform,
			entry.family_rating ? '★'.repeat(entry.family_rating) : null,
			entry.movie.type === 'tv' && entry.status !== 'completed' && entry.episode_progress
				? entry.episode_progress
				: null
		]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<div class="bg-white border rounded-xl shadow overflow-hidden">
	<!-- Øverste seksjon: poster + info -->
	<div class="flex items-stretch">
		<!-- Poster fyller full høyde -->
		<div class="shrink-0 w-24 bg-gray-100 flex items-center justify-center">
			{#if entry.movie.poster_url}
				<img
					src={entry.movie.poster_url}
					alt={entry.movie.title}
					class="w-full h-full object-cover"
				/>
			{:else}
				<span class="text-gray-300 text-3xl">?</span>
			{/if}
		</div>

		<!-- Info -->
		<div class="flex-1 min-w-0 p-4">
			<!-- Tittel + slett -->
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<p class="font-semibold text-base leading-snug truncate">{entry.movie.title}</p>
					<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
						<span class="text-xs text-gray-500">
							{entry.movie.year ?? ''}{entry.movie.year ? ' · ' : ''}{entry.movie.type === 'tv' ? 'Serie' : 'Film'}{#if entry.movie.type === 'tv' && entry.movie.seasons}, {entry.movie.seasons}s{:else if entry.movie.type === 'movie' && entry.movie.runtime}, {entry.movie.runtime} min{/if}
						</span>
						{#if entry.movie.tmdb_rating}
							<span class="text-xs text-yellow-500 font-medium">★ {entry.movie.tmdb_rating}</span>
						{/if}
					</div>
					{#if entry.movie.genre}
						<div class="flex flex-wrap gap-1 mt-1.5">
							{#each entry.movie.genre.split(', ').slice(0, 3) as g}
								<span class="text-xs bg-purple-50 text-purple-500 px-2 py-0.5 rounded-full">{g}</span>
							{/each}
						</div>
					{/if}
				</div>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={entry.id} />
					<button
						type="submit"
						class="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0 mt-0.5"
						onclick={(e: MouseEvent) => {
							if (!confirm('Fjerne?')) e.preventDefault();
						}}
						aria-label="Fjern"
					>×</button>
				</form>
			</div>

			<!-- Status -->
			<div class="flex gap-1.5 flex-wrap mt-2">
				{#each ['watching', 'paused', 'completed', 'archived'] as s}
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
			<div class="mt-2">
				<p class="text-xs text-gray-400 mb-1.5">Hvem ser</p>
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
		</div>
	</div>

	<!-- Innstillinger toggle -->
	<div class="border-t px-4 py-2">
				<button
					onclick={() => (showSettings = !showSettings)}
					class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
				>
					<span>{showSettings ? '▾' : '▸'} Innstillinger</span>
					{#if !showSettings && settingsSummary}
						<span class="text-gray-500 font-medium">{settingsSummary}</span>
					{/if}
				</button>

				{#if showSettings}
					<div class="mt-3 space-y-3">
						<!-- Platform -->
						<div>
							<p class="text-xs text-gray-400 mb-1.5">Plattform</p>
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
								<p class="text-xs text-gray-400 mb-1.5">Fremdrift</p>
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

						<!-- Familievurdering -->
						<div>
							<p class="text-xs text-gray-400 mb-1.5">Familiens vurdering</p>
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
					</div>
				{/if}
			</div>

	<!-- Seanselogg -->
	<div class="border-t px-4 py-2">
				<div class="flex items-center gap-3">
					{#if entry.watchLogs.length > 0}
						<button
							onclick={() => (showLogs = !showLogs)}
							class="text-xs text-gray-500 hover:text-gray-700"
						>
							📋 {entry.watchLogs.length} seanse{entry.watchLogs.length !== 1 ? 'r' : ''} logget
							{showLogs ? '▲' : '▼'}
						</button>
					{/if}
					<button
						onclick={() => (showLogForm = !showLogForm)}
						class="text-xs text-purple-600 hover:text-purple-800 font-medium"
					>
						{showLogForm ? 'Avbryt' : '+ Logg seanse'}
					</button>
				</div>

				<!-- Logg-form -->
				{#if showLogForm}
					<form
						method="POST"
						action="?/logWatch"
						use:enhance={() => {
							savingLog = true;
							return ({ update }) => {
								update();
								savingLog = false;
								showLogForm = false;
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
								<label for="log-notes-{entry.id}" class="text-xs text-gray-500 block mb-1"
									>Notis (valgfritt)</label
								>
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
							disabled={savingLog}
							class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
						>
							{savingLog ? 'Lagrer…' : 'Lagre seanse'}
						</button>
					</form>
				{/if}

				<!-- Logg-liste -->
				{#if showLogs && entry.watchLogs.length > 0}
					<div class="mt-2 space-y-1.5">
						{#each entry.watchLogs as log}
							<div class="text-xs bg-gray-50 rounded-lg px-3 py-2">
								<div class="flex items-center justify-between">
									<span class="font-medium text-gray-700">
										{new Date(log.watched_at).toLocaleDateString('nb-NO', {
											day: 'numeric',
											month: 'short',
											year: 'numeric'
										})}
									</span>
									{#if log.viewerIds.length > 0}
										<span class="text-gray-400">
											{people
												.filter((p) => log.viewerIds.includes(p.id))
												.map((p) => p.name)
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
