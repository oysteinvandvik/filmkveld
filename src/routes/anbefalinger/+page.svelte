<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let addingIds = $state<Set<string>>(new Set());
	let addedIds = $state<Set<number>>(new Set());

	function addKey(tmdbId: number, suffix: string) {
		return `${tmdbId}-${suffix}`;
	}
</script>

<div class="max-w-3xl mx-auto p-6 space-y-10 pb-24">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-gray-600 text-lg leading-none">←</a>
		<h1 class="text-2xl font-bold text-gray-800">Anbefalinger</h1>
	</div>

	<!-- Filmanbefalinger -->
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-semibold text-gray-800">🎬 Filmer</h2>
			<p class="text-sm text-gray-500">Basert på filmkvelder dere har hatt</p>
		</div>

		{#if data.movieRecs.length === 0}
			<p class="text-sm text-gray-400 italic">
				Ingen filmkvelder avgjort ennå — fullfør en filmkveld for å få forslag.
			</p>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
				{#each data.movieRecs as movie (movie.tmdbId)}
					<div class="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
						{#if movie.posterUrl}
							<img src={movie.posterUrl} alt={movie.title} class="w-full aspect-[2/3] object-cover" />
						{:else}
							<div class="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">?</div>
						{/if}
						<div class="p-3 flex flex-col gap-2 flex-1">
							<p class="font-semibold text-sm leading-snug line-clamp-2 flex-1">{movie.title}</p>
							<div class="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
								{#if movie.year}<span>{movie.year}</span><span>·</span>{/if}
								{#if movie.tmdbRating}<span class="text-yellow-500 font-medium">★ {movie.tmdbRating}</span>{/if}
							</div>

							{#if addedIds.has(movie.tmdbId)}
								<span class="text-xs text-center text-green-600 font-medium py-1.5">✓ Lagt til</span>
							{:else if data.suggestionSessions.length === 0}
								<a href="/" class="text-xs text-center text-purple-600 hover:text-purple-800 font-medium py-1.5">
									+ Opprett filmkveld
								</a>
							{:else}
								<div class="flex flex-col gap-1.5">
									{#each data.suggestionSessions as session}
										<form
											method="POST"
											action="?/addToSession"
											use:enhance={() => {
												const key = addKey(movie.tmdbId, session.id);
												addingIds = new Set([...addingIds, key]);
												return ({ update }) => {
													update();
													addingIds = new Set([...addingIds].filter((k) => k !== key));
													addedIds = new Set([...addedIds, movie.tmdbId]);
												};
											}}
										>
											<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
											<input type="hidden" name="type" value={movie.type} />
											<input type="hidden" name="session_id" value={session.id} />
											<button
												type="submit"
												disabled={addingIds.has(addKey(movie.tmdbId, session.id))}
												class="w-full text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition truncate"
												title="Legg til i {session.title}"
											>
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

	<!-- Serieanbefalinger -->
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-semibold text-gray-800">📺 Serier</h2>
			<p class="text-sm text-gray-500">Basert på serier dere ser eller har sett</p>
		</div>

		{#if data.tvRecs.length === 0}
			<p class="text-sm text-gray-400 italic">
				Legg til noen serier i seerlisten for å få forslag.
			</p>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
				{#each data.tvRecs as movie (movie.tmdbId)}
					<div class="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
						{#if movie.posterUrl}
							<img src={movie.posterUrl} alt={movie.title} class="w-full aspect-[2/3] object-cover" />
						{:else}
							<div class="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">?</div>
						{/if}
						<div class="p-3 flex flex-col gap-2 flex-1">
							<p class="font-semibold text-sm leading-snug line-clamp-2 flex-1">{movie.title}</p>
							<div class="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
								{#if movie.year}<span>{movie.year}</span><span>·</span>{/if}
								{#if movie.tmdbRating}<span class="text-yellow-500 font-medium">★ {movie.tmdbRating}</span>{/if}
							</div>

							{#if addedIds.has(movie.tmdbId)}
								<span class="text-xs text-center text-green-600 font-medium py-1.5">✓ Lagt til</span>
							{:else}
								<form
									method="POST"
									action="?/addToWatchlist"
									use:enhance={() => {
										const key = addKey(movie.tmdbId, 'wl');
										addingIds = new Set([...addingIds, key]);
										return ({ update }) => {
											update();
											addingIds = new Set([...addingIds].filter((k) => k !== key));
											addedIds = new Set([...addedIds, movie.tmdbId]);
										};
									}}
								>
									<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
									<input type="hidden" name="type" value={movie.type} />
									<button
										type="submit"
										disabled={addingIds.has(addKey(movie.tmdbId, 'wl'))}
										class="w-full text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
									>
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
</div>
