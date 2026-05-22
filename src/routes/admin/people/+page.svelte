<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let name = $state('');
</script>

<div class="max-w-xl mx-auto p-6 space-y-8">
	<h1 class="text-2xl font-bold text-gray-800">Deltakere</h1>

	<!-- Legg til -->
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

	<!-- Liste -->
	<section class="bg-white border rounded-xl p-5 shadow space-y-3">
		<h2 class="font-semibold">Familiemedlemmer ({data.people.length})</h2>

		{#if data.people.length === 0}
			<p class="text-gray-400 text-sm italic">Ingen deltakere ennå.</p>
		{/if}

		{#each data.people as person}
			{@const justInvited = form?.inviteSent && form?.inviteId === person.id}
			{@const inviteError = form?.inviteError && form?.inviteId === person.id ? form.inviteError : null}

			<div class="border rounded-xl p-4 space-y-3">
				<!-- Navn + slett -->
				<div class="flex items-center justify-between">
					<span class="font-medium">{person.name}</span>
					<form method="POST" action="?/delete" use:enhance>
						<input type="hidden" name="id" value={person.id} />
						<button
							type="submit"
							class="text-red-400 hover:text-red-600 text-sm"
							onclick={(e) => { if (!confirm(`Fjerne ${person.name}?`)) e.preventDefault(); }}
						>
							Fjern
						</button>
					</form>
				</div>

				<!-- Invitasjon -->
				<form
					method="POST"
					action="?/invite"
					use:enhance
					class="flex gap-2 items-center"
				>
					<input type="hidden" name="id" value={person.id} />
					<input
						name="email"
						type="email"
						value={person.email ?? ''}
						placeholder="e-post for invitasjon"
						class="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 {person.email ? 'text-gray-700' : 'text-gray-400'}"
					/>
					<button
						type="submit"
						class="text-xs px-3 py-1.5 rounded-lg font-medium transition
							{person.email
								? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
								: 'bg-gray-100 text-gray-500 hover:bg-gray-200'}"
					>
						{person.email ? 'Send på nytt' : 'Inviter'}
					</button>
				</form>

				{#if justInvited}
					<p class="text-xs text-green-600">✓ Invitasjon sendt til {person.email}</p>
				{:else if inviteError}
					<p class="text-xs text-red-600">{inviteError}</p>
				{:else if person.email}
					<p class="text-xs text-gray-400">Invitert: {person.email}</p>
				{/if}
			</div>
		{/each}
	</section>
</div>
