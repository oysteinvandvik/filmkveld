<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="bg-white rounded-2xl shadow p-8 w-full max-w-sm space-y-6">
		<h1 class="text-3xl font-bold text-center text-purple-700">🎬 Filmkveld</h1>

		{#if form?.error}
			<p class="text-red-600 text-sm text-center">{form.error}</p>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
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
	</div>
</div>
