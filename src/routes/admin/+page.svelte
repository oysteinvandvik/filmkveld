<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let title = $state('');
	let date = $state('');
	let votes_per_person = $state(5);

	const statusConfig: Record<string, { label: string; color: string }> = {
		suggestion: { label: '📋 Forslag',        color: 'bg-blue-100 text-blue-700' },
		voting:     { label: '🗳️ Stemming åpen',  color: 'bg-green-100 text-green-700' },
		decided:    { label: '🏆 Bestemt',         color: 'bg-yellow-100 text-yellow-700' },
		archived:   { label: '📦 Arkivert',        color: 'bg-gray-100 text-gray-500' }
	};
</script>

<div class="max-w-3xl mx-auto p-6 space-y-10">
	<h1 class="text-2xl font-bold text-gray-800">Admin</h1>

	<!-- Ny avstemning -->
	<section class="bg-white border rounded-xl p-6 shadow space-y-4">
		<h2 class="text-lg font-semibold">Opprett ny filmkveld</h2>
		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}
		<form method="POST" action="?/createSession" use:enhance class="space-y-3">
			<input
				name="title"
				bind:value={title}
				placeholder="Tittel, f.eks. Fredagsfilm 23. mai"
				required
				class="w-full border rounded-xl px-4 py-2"
			/>
			<div class="flex flex-col sm:flex-row gap-3">
				<input
					name="date"
					type="date"
					bind:value={date}
					class="flex-1 border rounded-xl px-4 py-2"
				/>
				<div class="flex items-center gap-2 flex-1">
					<label for="votes_per_person" class="text-sm text-gray-600 whitespace-nowrap">Stemmer per person:</label>
					<input
						id="votes_per_person"
						name="votes_per_person"
						type="number"
						min="1"
						max="20"
						bind:value={votes_per_person}
						class="w-20 border rounded-xl px-3 py-2"
					/>
				</div>
			</div>
			<button
				type="submit"
				class="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-medium"
			>
				Opprett og legg til filmer →
			</button>
		</form>
	</section>

	<!-- Liste over filmkvelder -->
	<section class="bg-white border rounded-xl p-6 shadow space-y-3">
		<h2 class="text-lg font-semibold">Alle filmkvelder</h2>

		{#if data.sessions.length === 0}
			<p class="text-gray-500 italic text-sm">Ingen filmkvelder ennå.</p>
		{/if}

		{#each data.sessions as s}
			{@const cfg = statusConfig[s.status] ?? statusConfig.archived}
			<div class="border rounded-xl p-4 hover:bg-gray-50 space-y-3">
				<!-- Tittel + status -->
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="font-medium">{s.title}</p>
						{#if s.date}
							<p class="text-xs text-gray-500 mt-0.5">{s.date}</p>
						{/if}
					</div>
					<span class="text-xs font-medium px-2.5 py-1 rounded-full shrink-0 {cfg.color}">{cfg.label}</span>
				</div>

				<!-- Handlinger per tilstand -->
				<div class="flex flex-wrap gap-2 text-sm items-center">
					<button onclick={() => goto(`/admin/sessions/${s.id}`)} class="text-blue-600 hover:underline">
						Rediger
					</button>

					{#if s.status === 'suggestion'}
						<form method="POST" action="?/openVoting" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-green-600 hover:underline font-medium">
								→ Åpne stemming
							</button>
						</form>

					{:else if s.status === 'voting'}
						<form method="POST" action="?/backToSuggestion" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-400 hover:underline">← Forslag</button>
						</form>
						<button onclick={() => goto(`/vote/${s.id}`)} class="text-purple-600 hover:underline">Stem</button>
						<button onclick={() => goto(`/results/${s.id}`)} class="text-gray-600 hover:underline">Live</button>
						<form method="POST" action="?/closeVoting" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-orange-600 hover:underline font-medium">→ Avslutt</button>
						</form>

					{:else if s.status === 'decided'}
						<form method="POST" action="?/reopenVoting" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-400 hover:underline">← Gjenåpne</button>
						</form>
						<button onclick={() => goto(`/results/${s.id}`)} class="text-yellow-700 hover:underline font-medium">Resultat</button>
						<form method="POST" action="?/archiveSession" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-500 hover:underline">→ Arkiver</button>
						</form>

					{:else if s.status === 'archived'}
						<form method="POST" action="?/unarchiveSession" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-400 hover:underline">← Hent opp</button>
						</form>
						<button onclick={() => goto(`/results/${s.id}`)} class="text-gray-500 hover:underline">Resultater</button>
					{/if}

					<form method="POST" action="?/deleteSession" use:enhance>
						<input type="hidden" name="id" value={s.id} />
						<button
							type="submit"
							class="text-red-400 hover:underline"
							onclick={(e) => { if (!confirm('Sikker?')) e.preventDefault(); }}
						>
							Slett
						</button>
					</form>
				</div>
			</div>
		{/each}
	</section>
</div>
