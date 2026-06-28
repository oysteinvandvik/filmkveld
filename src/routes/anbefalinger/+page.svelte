<script lang="ts">
	import { enhance } from '$app/forms';
	import type { TmdbMovie } from '$lib/tmdb';

	let { data } = $props();

	let tab = $state<'movie' | 'tv'>('movie');
	let addingIds = $state<Set<string>>(new Set());
	let addedIds = $state<Set<number>>(new Set());
	let selected = $state<TmdbMovie | null>(null);

	function addKey(tmdbId: number, suffix: string) {
		return `${tmdbId}-${suffix}`;
	}

	function metaLine(movie: TmdbMovie) {
		const parts = [];
		if (movie.year) parts.push(movie.year);
		if (movie.type === 'tv') {
			parts.push('Serie');
			if (movie.seasons) parts.push(`${movie.seasons} sesong${movie.seasons !== 1 ? 'er' : ''}`);
		} else {
			parts.push('Film');
			if (movie.runtime) parts.push(`${movie.runtime} min`);
		}
		return parts.join(' · ');
	}
</script>

<div class="max-w-3xl mx-auto p-6 space-y-6 pb-24">
	<div class="flex items-center gap-3">
		<a href="/watching" class="text-gray-400 hover:text-gray-600 text-lg leading-none">←</a>
		<h1 class="text-2xl font-bold text-gray-800">Anbefalinger</h1>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2">
		<button
			onclick={() => (tab = 'movie')}
			class="px-4 py-2 rounded-xl text-sm font-medium transition {tab === 'movie'
				? 'bg-purple-600 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
		>🎬 Filmer</button>
		<button
			onclick={() => (tab = 'tv')}
			class="px-4 py-2 rounded-xl text-sm font-medium transition {tab === 'tv'
				? 'bg-purple-600 text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
		>📺 Serier</button>
	</div>

	<!-- Filmanbefalinger -->
	{#if tab === 'movie'}
	<section class="space-y-4">
		<p class="text-sm text-gray-500">Basert på filmer dere har stemt på</p>
		{#if data.movieRecs.length === 0}
			<p class="text-sm text-gray-400 italic">Ingen kandidater ennå — legg til filmer i en filmkveld for å få forslag.</p>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
				{#each data.movieRecs as movie (movie.tmdbId)}
					<div class="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
						<button
							onclick={() => (selected = movie)}
							class="block w-full text-left focus:outline-none"
							aria-label="Vis detaljer for {movie.title}"
						>
							{#if movie.posterUrl}
								<img src={movie.posterUrl} alt={movie.title} class="w-full aspect-[2/3] object-cover hover:opacity-90 transition" />
							{:else}
								<div class="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-300 text-4xl hover:bg-gray-200 transition">?</div>
							{/if}
							<div class="p-3">
								<p class="font-semibold text-sm leading-snug line-clamp-2">{movie.title}</p>
								<p class="text-xs text-gray-400 mt-0.5">{metaLine(movie)}</p>
							</div>
						</button>
						<div class="px-3 pb-3 mt-auto">
							{#if addedIds.has(movie.tmdbId)}
								<span class="block text-xs text-center text-green-600 font-medium py-1.5">✓ Lagt til</span>
							{:else if data.suggestionSessions.length === 0}
								<a href="/watching" class="block text-xs text-center text-purple-600 hover:text-purple-800 font-medium py-1.5">+ Opprett filmkveld</a>
							{:else}
								<div class="flex flex-col gap-1.5">
									{#each data.suggestionSessions as session}
										<form method="POST" action="?/addToSession" use:enhance={() => {
											const key = addKey(movie.tmdbId, session.id);
											addingIds = new Set([...addingIds, key]);
											return ({ update }) => {
												update();
												addingIds = new Set([...addingIds].filter((k) => k !== key));
												addedIds = new Set([...addedIds, movie.tmdbId]);
											};
										}}>
											<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
											<input type="hidden" name="type" value={movie.type} />
											<input type="hidden" name="session_id" value={session.id} />
											<button type="submit" disabled={addingIds.has(addKey(movie.tmdbId, session.id))}
												class="w-full text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition truncate"
												title="Legg til i {session.title}">
												{addingIds.has(addKey(movie.tmdbId, session.id)) ? '…' : '+ ' + session.title}
											</button>
										</form>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	{/if}

	<!-- Serieanbefalinger -->
	{#if tab === 'tv'}
	<section class="space-y-4">
		<p class="text-sm text-gray-500">Basert på serier dere ser eller har sett</p>
		{#if data.tvRecs.length === 0}
			<p class="text-sm text-gray-400 italic">Legg til noen serier i seerlisten for å få forslag.</p>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
				{#each data.tvRecs as movie (movie.tmdbId)}
					<div class="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
						<button
							onclick={() => (selected = movie)}
							class="block w-full text-left focus:outline-none"
							aria-label="Vis detaljer for {movie.title}"
						>
							{#if movie.posterUrl}
								<img src={movie.posterUrl} alt={movie.title} class="w-full aspect-[2/3] object-cover hover:opacity-90 transition" />
							{:else}
								<div class="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-300 text-4xl hover:bg-gray-200 transition">?</div>
							{/if}
							<div class="p-3">
								<p class="font-semibold text-sm leading-snug line-clamp-2">{movie.title}</p>
								<p class="text-xs text-gray-400 mt-0.5">{metaLine(movie)}</p>
							</div>
						</button>
						<div class="px-3 pb-3 mt-auto">
							{#if addedIds.has(movie.tmdbId)}
								<span class="block text-xs text-center text-green-600 font-medium py-1.5">✓ Lagt til</span>
							{:else}
								<form method="POST" action="?/addToWatchlist" use:enhance={() => {
									const key = addKey(movie.tmdbId, 'wl');
									addingIds = new Set([...addingIds, key]);
									return ({ update }) => {
										update();
										addingIds = new Set([...addingIds].filter((k) => k !== key));
										addedIds = new Set([...addedIds, movie.tmdbId]);
									};
								}}>
									<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
									<input type="hidden" name="type" value={movie.type} />
									<button type="submit" disabled={addingIds.has(addKey(movie.tmdbId, 'wl'))}
										class="w-full text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
										{addingIds.has(addKey(movie.tmdbId, 'wl')) ? '…' : '+ Legg til seerliste'}
									</button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
	{/if}
</div>

<!-- Detalj-sheet -->
{#if selected}
	<div
		class="fixed inset-0 bg-black/50 z-40"
		role="button"
		tabindex="-1"
		aria-label="Lukk"
		onclick={() => (selected = null)}
		onkeydown={(e) => e.key === 'Escape' && (selected = null)}
	></div>
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-w-lg mx-auto overflow-hidden max-h-[90dvh] flex flex-col">
		<!-- Poster + lukk -->
		<div class="relative shrink-0">
			{#if selected.posterUrl}
				<img src={selected.posterUrl} alt={selected.title} class="w-full max-h-64 object-cover object-top" />
			{:else}
				<div class="w-full h-48 bg-gray-100 flex items-center justify-center text-6xl">🎬</div>
			{/if}
			<button
				onclick={() => (selected = null)}
				class="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg leading-none hover:bg-black/70 transition"
				aria-label="Lukk"
			>×</button>
		</div>

		<!-- Innhold -->
		<div class="p-5 space-y-4 overflow-y-auto">
			<div>
				<h2 class="text-xl font-bold text-gray-900 leading-snug">{selected.title}</h2>
				<p class="text-sm text-gray-500 mt-1">{metaLine(selected)}</p>
				{#if selected.tmdbRating}
					<p class="text-sm text-yellow-500 font-semibold mt-1">★ {selected.tmdbRating} / 10</p>
				{/if}
				{#if selected.genre}
					<div class="flex flex-wrap gap-1.5 mt-2">
						{#each selected.genre.split(', ') as g}
							<span class="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{g}</span>
						{/each}
					</div>
				{/if}
			</div>

			{#if selected.overview}
				<p class="text-sm text-gray-600 leading-relaxed">{selected.overview}</p>
			{/if}

			<!-- Handlinger -->
			{#if addedIds.has(selected.tmdbId)}
				<p class="text-center text-green-600 font-medium py-1">✓ Lagt til</p>
			{:else if selected.type === 'tv'}
				<form method="POST" action="?/addToWatchlist" use:enhance={() => {
					const key = addKey(selected!.tmdbId, 'wl');
					addingIds = new Set([...addingIds, key]);
					return ({ update }) => {
						update();
						addingIds = new Set([...addingIds].filter((k) => k !== key));
						addedIds = new Set([...addedIds, selected!.tmdbId]);
						selected = null;
					};
				}}>
					<input type="hidden" name="tmdb_id" value={selected.tmdbId} />
					<input type="hidden" name="type" value={selected.type} />
					<button type="submit" disabled={addingIds.has(addKey(selected.tmdbId, 'wl'))}
						class="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
						{addingIds.has(addKey(selected.tmdbId, 'wl')) ? '…' : '+ Legg til seerliste'}
					</button>
				</form>
			{:else if data.suggestionSessions.length === 0}
				<a href="/watching" class="block text-center text-purple-600 font-medium py-2">+ Opprett filmkveld</a>
			{:else}
				<div class="space-y-2">
					<p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Legg til i filmkveld</p>
					{#each data.suggestionSessions as session}
						<form method="POST" action="?/addToSession" use:enhance={() => {
							const key = addKey(selected!.tmdbId, session.id);
							addingIds = new Set([...addingIds, key]);
							return ({ update }) => {
								update();
								addingIds = new Set([...addingIds].filter((k) => k !== key));
								addedIds = new Set([...addedIds, selected!.tmdbId]);
								selected = null;
							};
						}}>
							<input type="hidden" name="tmdb_id" value={selected.tmdbId} />
							<input type="hidden" name="type" value={selected.type} />
							<input type="hidden" name="session_id" value={session.id} />
							<button type="submit" disabled={addingIds.has(addKey(selected.tmdbId, session.id))}
								class="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition">
								{addingIds.has(addKey(selected.tmdbId, session.id)) ? '…' : '+ ' + session.title}
							</button>
						</form>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
