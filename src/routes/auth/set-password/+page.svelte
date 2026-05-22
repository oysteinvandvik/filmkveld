<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-6">
		<div class="text-center space-y-1">
			<h1 class="text-3xl font-bold text-purple-700">🎬 Filmkveld</h1>
			<p class="text-gray-600 font-medium">Velkommen!</p>
			<p class="text-gray-400 text-sm">Velg et passord for å komme i gang</p>
		</div>

		{#if form?.error}
			<p class="text-red-600 text-sm text-center bg-red-50 rounded-xl px-4 py-2">{form.error}</p>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<input
				name="password"
				type="password"
				placeholder="Passord (minst 8 tegn)"
				required
				class="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
			/>
			<input
				name="confirm"
				type="password"
				placeholder="Gjenta passord"
				required
				class="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
			/>
			<button
				type="submit"
				class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl"
			>
				Sett passord og kom i gang →
			</button>
		</form>
	</div>
</div>
