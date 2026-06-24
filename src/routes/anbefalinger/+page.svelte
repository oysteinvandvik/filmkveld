<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();

	let addingIds = $state<Set<number>>(new Set());
	let addedIds = $state<Set<number>>(new Set());
</script>

<div class="max-w-3xl mx-auto p-6 space-y-6 pb-24">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-gray-600 text-lg leading-none">←</a>
		<h1 class="text-2xl font-bold text-gray-800">Anbefalinger</h1>
	</div>

	{#if data.recommendations.length === 0}
		<p class="text-center text-gray-400 italic pt-12">
			Ingen anbefalinger ennå.<br />
			Fullfør en filmkveld for å få forslag basert på det dere har stemt på.
		</p>
	{:else}
		<p class="text-sm text-gray-500">Basert på filmkvelder dere har hatt</p>
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
			{#each data.recommendations as movie (movie.tmdbId)}
				<div class="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
					{#if movie.posterUrl}
						<img
							src={movie.posterUrl}
							alt={movie.title}
							class="w-full aspect-[2/3] object-cover"
						/>
					{:else}
						<div
							class="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-gray-300 text-4xl"
						>
							?
						</div>
					{/if}
					<div class="p-3 flex flex-col gap-2 flex-1">
						<p class="font-semibold text-sm leading-snug line-clamp-2 flex-1">{movie.title}</p>
						<div class="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
							{#if movie.year}<span>{movie.year}</span><span>·</span>{/if}
							<span>{movie.type === 'tv' ? 'Serie' : 'Film'}</span>
							{#if movie.tmdbRating}
								<span class="text-yellow-500 font-medium">★ {movie.tmdbRating}</span>
							{/if}
						</div>
						{#if addedIds.has(movie.tmdbId)}
							<span class="text-xs text-center text-green-600 font-medium py-1.5">✓ Lagt til</span>
						{:else}
							<form
								method="POST"
								action="?/add"
								use:enhance={() => {
									addingIds = new Set([...addingIds, movie.tmdbId]);
									return ({ update }) => {
										update();
										addingIds = new Set([...addingIds].filter((id) => id !== movie.tmdbId));
										addedIds = new Set([...addedIds, movie.tmdbId]);
									};
								}}
							>
								<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
								<input type="hidden" name="type" value={movie.type} />
								<button
									type="submit"
									disabled={addingIds.has(movie.tmdbId)}
									class="w-full text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
								>
									{addingIds.has(movie.tmdbId) ? '…' : '+ Legg til seerliste'}
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
