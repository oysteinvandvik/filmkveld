<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { form } = $props();
	let showReset = $state(false);

	const urlError = $derived($page.url.searchParams.get('error'));
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-6">
		<h1 class="text-3xl font-bold text-center text-purple-700">🎬 Filmkveld</h1>

		{#if form?.resetSent}
			<div class="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm text-center">
				✓ Sjekk innboksen — vi har sendt en lenke for å nullstille passordet
			</div>
			<button
				onclick={() => (showReset = false)}
				class="w-full text-sm text-gray-400 hover:text-gray-600 underline text-center"
			>
				Tilbake til innlogging
			</button>
		{:else if showReset}
			<!-- Glemt passord -->
			<p class="text-sm text-gray-500 text-center">Skriv inn e-posten din så sender vi en lenke</p>

			{#if form?.resetError}
				<p class="text-red-600 text-sm text-center">{form.resetError}</p>
			{/if}

			<form method="POST" action="?/resetPassword" use:enhance class="space-y-4">
				<input
					name="email"
					type="email"
					placeholder="E-post"
					required
					class="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
				/>
				<button
					type="submit"
					class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-xl"
				>
					Send tilbakestillingslenke
				</button>
			</form>

			<button
				onclick={() => (showReset = false)}
				class="w-full text-sm text-gray-400 hover:text-gray-600 underline text-center"
			>
				Tilbake til innlogging
			</button>
		{:else}
			<!-- Innlogging -->
			{#if form?.error || urlError}
				<p class="text-red-600 text-sm text-center">{form?.error ?? urlError}</p>
			{/if}

			<form method="POST" action="?/login" use:enhance class="space-y-4">
				<input
					name="email"
					type="email"
					placeholder="E-post"
					required
					class="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
				/>
				<input
					name="password"
					type="password"
					placeholder="Passord"
					required
					class="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
				/>
				<button
					type="submit"
					class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-xl"
				>
					Logg inn
				</button>
			</form>

			<button
				onclick={() => (showReset = true)}
				class="w-full text-sm text-gray-400 hover:text-gray-600 underline text-center"
			>
				Glemt passord?
			</button>
		{/if}
	</div>
</div>
