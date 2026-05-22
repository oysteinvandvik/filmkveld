<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let title = $state('');
	let date = $state('');
	let votes_per_person = $state(5);
</script>

<div class="max-w-3xl mx-auto p-6 space-y-10">
	<h1 class="text-2xl font-bold text-gray-800">Admin</h1>

	<!-- Ny avstemning -->
	<section class="bg-white border rounded-xl p-6 shadow space-y-4">
		<h2 class="text-lg font-semibold">Opprett ny avstemning</h2>
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
			<div class="flex gap-3">
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

	<!-- Liste over avstemninger -->
	<section class="bg-white border rounded-xl p-6 shadow space-y-3">
		<h2 class="text-lg font-semibold">Alle avstemninger</h2>

		{#if data.sessions.length === 0}
			<p class="text-gray-500 italic text-sm">Ingen avstemninger ennå.</p>
		{/if}

		{#each data.sessions as s}
			<div class="flex items-center justify-between border rounded-xl p-3 hover:bg-gray-50">
				<div>
					<p class="font-medium">{s.title}</p>
					<p class="text-xs text-gray-500">
						{s.date ?? ''}
						{s.status === 'open' ? '· Åpen' : '· Avsluttet'}
					</p>
				</div>
				<div class="flex gap-2 text-sm">
					<button
						onclick={() => goto(`/admin/sessions/${s.id}`)}
						class="text-blue-600 hover:underline"
					>
						Rediger
					</button>
					<button
						onclick={() => goto(`/vote/${s.id}`)}
						class="text-purple-600 hover:underline"
					>
						Stem
					</button>
					{#if s.status === 'open'}
						<form method="POST" action="?/closeSession" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-orange-600 hover:underline">Avslutt</button>
						</form>
					{:else}
						<button
							onclick={() => goto(`/results/${s.id}`)}
							class="text-gray-600 hover:underline"
						>
							Resultater
						</button>
					{/if}
					<form method="POST" action="?/deleteSession" use:enhance>
						<input type="hidden" name="id" value={s.id} />
						<button
							type="submit"
							class="text-red-600 hover:underline"
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
