<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let searchQuery = $state('');
	let showCopyPanel = $state(false);

	const participantIds = $derived(new Set(data.participantIds));
</script>

<div class="max-w-3xl mx-auto p-6 space-y-8">
	<div class="flex items-center gap-3">
		<button onclick={() => goto('/admin')} class="text-gray-500 hover:text-gray-700 text-sm">← Admin</button>
		<h1 class="text-xl font-bold text-gray-800">{data.votingSession.title}</h1>
		<span class="text-xs px-2 py-0.5 rounded-full {data.votingSession.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
			{data.votingSession.status === 'open' ? 'Åpen' : 'Avsluttet'}
		</span>
	</div>

	<!-- Søk TMDB -->
	<section class="bg-white border rounded-xl p-5 shadow space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold">Legg til filmer/serier</h2>
			<button
				onclick={() => showCopyPanel = !showCopyPanel}
				class="text-sm text-purple-600 hover:underline"
			>
				Kopier fra tidligere
			</button>
		</div>

		{#if showCopyPanel}
			<div class="border rounded-xl p-4 bg-gray-50 space-y-2">
				<p class="text-sm font-medium text-gray-700">Kopier kandidater fra en tidligere avstemning:</p>
				{#each data.allSessions as s}
					<form method="POST" action="?/copyFromSession" use:enhance class="flex items-center justify-between gap-2">
						<input type="hidden" name="source_session_id" value={s.id} />
						<span class="text-sm">{s.title} ({s.count} filmer)</span>
						<button type="submit" class="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200">
							Kopier inn
						</button>
					</form>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/searchMovies" use:enhance class="flex gap-2">
			<input
				name="query"
				bind:value={searchQuery}
				placeholder="Søk etter film eller serie..."
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
							<div class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">?</div>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium text-sm truncate">{movie.title}</p>
							<p class="text-xs text-gray-500">{movie.year} · {movie.type === 'tv' ? 'Serie' : 'Film'}</p>
						</div>
						<form method="POST" action="?/addCandidate" use:enhance>
							<input type="hidden" name="tmdb_id" value={movie.tmdbId} />
							<input type="hidden" name="title" value={movie.title} />
							<input type="hidden" name="type" value={movie.type} />
							<input type="hidden" name="year" value={movie.year} />
							<input type="hidden" name="poster_url" value={movie.posterUrl ?? ''} />
							<input type="hidden" name="overview" value={movie.overview} />
							<button type="submit" class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full hover:bg-purple-700 whitespace-nowrap">
								Legg til
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Kandidater -->
	<section class="bg-white border rounded-xl p-5 shadow space-y-3">
		<h2 class="font-semibold">Kandidater ({data.candidates.length})</h2>

		{#if data.candidates.length === 0}
			<p class="text-gray-400 text-sm italic">Ingen filmer lagt til ennå.</p>
		{/if}

		{#each data.candidates as c}
			<div class="flex items-center gap-3 border rounded-xl p-3">
				{#if c.movie.poster_url}
					<img src={c.movie.poster_url} alt={c.movie.title} class="w-10 h-auto rounded" />
				{/if}
				<div class="flex-1 min-w-0">
					<p class="font-medium text-sm truncate">{c.movie.title}</p>
					<p class="text-xs text-gray-500">{c.movie.year ?? ''} · {c.movie.type === 'tv' ? 'Serie' : 'Film'}</p>
				</div>
				<form method="POST" action="?/removeCandidate" use:enhance>
					<input type="hidden" name="candidate_id" value={c.id} />
					<button type="submit" class="text-red-500 hover:text-red-700 text-xs">Fjern</button>
				</form>
			</div>
		{/each}
	</section>

	<!-- Deltakere -->
	<section class="bg-white border rounded-xl p-5 shadow space-y-3">
		<h2 class="font-semibold">Deltakere</h2>

		<div class="flex flex-wrap gap-2">
			{#each data.people as person}
				{#if participantIds.has(person.id)}
					<form method="POST" action="?/removeParticipant" use:enhance>
						<input type="hidden" name="person_id" value={person.id} />
						<button
							type="submit"
							class="px-3 py-1.5 rounded-full text-sm bg-purple-600 text-white flex items-center gap-1 hover:bg-purple-700"
						>
							{person.name} ✕
						</button>
					</form>
				{:else}
					<form method="POST" action="?/addParticipant" use:enhance>
						<input type="hidden" name="person_id" value={person.id} />
						<button
							type="submit"
							class="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
						>
							+ {person.name}
						</button>
					</form>
				{/if}
			{/each}
		</div>

		{#if data.people.length === 0}
			<p class="text-sm text-gray-400 italic">
				Ingen deltakere ennå.
				<a href="/admin/people" class="text-purple-600 hover:underline">Legg til deltakere</a>
			</p>
		{/if}
	</section>

	<div class="flex gap-3">
		<button
			onclick={() => goto(`/vote/${data.votingSession.id}`)}
			class="bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 font-medium"
		>
			Gå til avstemning →
		</button>
	</div>
</div>
