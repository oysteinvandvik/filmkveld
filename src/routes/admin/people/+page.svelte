<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let name = $state('');
</script>

<div class="max-w-xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800">Deltakere</h1>

	<section class="bg-white border rounded-xl p-5 shadow space-y-4">
		<h2 class="font-semibold">Legg til person</h2>
		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}
		<form method="POST" action="?/add" use:enhance class="flex gap-2">
			<input
				name="name"
				bind:value={name}
				placeholder="Navn"
				required
				class="flex-1 border rounded-xl px-4 py-2"
			/>
			<button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700">
				Legg til
			</button>
		</form>
	</section>

	<section class="bg-white border rounded-xl p-5 shadow space-y-2">
		<h2 class="font-semibold">Familiemedlemmer ({data.people.length})</h2>

		{#if data.people.length === 0}
			<p class="text-gray-400 text-sm italic">Ingen deltakere ennå.</p>
		{/if}

		{#each data.people as person}
			<div class="flex items-center justify-between border rounded-xl px-4 py-2">
				<span class="font-medium">{person.name}</span>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={person.id} />
					<button
						type="submit"
						class="text-red-500 hover:text-red-700 text-sm"
						onclick={(e) => { if (!confirm(`Fjerne ${person.name}?`)) e.preventDefault(); }}
					>
						Fjern
					</button>
				</form>
			</div>
		{/each}
	</section>
</div>
