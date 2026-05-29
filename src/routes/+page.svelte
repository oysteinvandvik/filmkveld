<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { data, form } = $props();

	let showCreate = $state(false);
	let votes_per_person = $state(5);

	const active = $derived(data.sessions.filter((s: any) => s.status === 'suggestion' || s.status === 'voting'));
	const decided = $derived(data.sessions.filter((s: any) => s.status === 'decided'));
	const archivedCount = $derived((data as any).archivedCount ?? 0);

	const statusConfig: Record<string, { icon: string; color: string }> = {
		suggestion: { icon: '📋', color: 'bg-blue-100 text-blue-700' },
		voting:     { icon: '🗳️', color: 'bg-green-100 text-green-700' },
		decided:    { icon: '🏆', color: 'bg-yellow-100 text-yellow-700' }
	};
</script>

<div class="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
	<h1 class="text-2xl font-bold text-gray-800 pt-2">Filmkveld</h1>

	<!-- Aktive kvelder -->
	{#if active.length > 0}
		<section class="space-y-3">
			{#each active as s}
				{@const cfg = statusConfig[s.status]}
				<div class="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="flex items-center gap-2 mb-0.5">
								<span class="text-xs font-medium px-2 py-0.5 rounded-full {cfg.color}">{cfg.icon} {s.status === 'suggestion' ? 'Forslag' : 'Stemming åpen'}</span>
							</div>
							<p class="font-semibold text-gray-800">{s.title}</p>
							{#if s.date}<p class="text-xs text-gray-400 mt-0.5">{s.date}</p>{/if}
						</div>
					</div>

					<div class="flex flex-wrap gap-2 text-sm">
						{#if s.status === 'suggestion'}
							<button onclick={() => goto(`/admin/sessions/${s.id}`)} class="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700">
								Legg til filmer →
							</button>
							<form method="POST" action="?/openVoting" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-200">
									→ Åpne stemming
								</button>
							</form>

						{:else if s.status === 'voting'}
							<button onclick={() => goto(`/vote/${s.id}`)} class="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700">
								Stem →
							</button>
							<button onclick={() => goto(`/results/${s.id}`)} class="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200">
								Live
							</button>
							<form method="POST" action="?/backToSuggestion" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">← Forslag</button>
							</form>
							<form method="POST" action="?/closeVoting" use:enhance>
								<input type="hidden" name="id" value={s.id} />
								<button type="submit" class="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-200">→ Avslutt</button>
							</form>
						{/if}

						<form method="POST" action="?/deleteSession" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-red-400 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50"
								onclick={(e) => { if (!confirm('Slette?')) e.preventDefault(); }}>
								Slett
							</button>
						</form>
					</div>
				</div>
			{/each}
		</section>
	{/if}

	<!-- Avgjorte -->
	{#if decided.length > 0}
		<section class="space-y-3">
			<h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avgjort</h2>
			{#each decided as s}
				<div class="bg-white border rounded-2xl shadow-sm p-4 space-y-3">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold text-gray-800">{s.title}</p>
							{#if s.date}<p class="text-xs text-gray-400 mt-0.5">{s.date}</p>{/if}
						</div>
						<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">🏆 Bestemt</span>
					</div>
					<div class="flex flex-wrap gap-2 text-sm">
						<button onclick={() => goto(`/results/${s.id}`)} class="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-200">
							Se resultat
						</button>
						<form method="POST" action="?/reopenVoting" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">← Gjenåpne</button>
						</form>
						<form method="POST" action="?/archiveSession" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-gray-400 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-100">→ Arkiver</button>
						</form>
						<form method="POST" action="?/deleteSession" use:enhance>
							<input type="hidden" name="id" value={s.id} />
							<button type="submit" class="text-red-400 px-2 py-1.5 rounded-lg text-xs hover:bg-red-50"
								onclick={(e) => { if (!confirm('Slette?')) e.preventDefault(); }}>
								Slett
							</button>
						</form>
					</div>
				</div>
			{/each}
		</section>
	{/if}

	{#if active.length === 0 && decided.length === 0}
		<p class="text-center text-gray-400 italic pt-12">Ingen aktive filmkvelder ennå.<br/>Trykk + for å opprette en.</p>
	{/if}

	<!-- Arkiv-lenke -->
	<div class="text-center pt-2">
		<a href="/arkiv" class="text-sm text-gray-400 hover:text-gray-600">📦 Arkiv</a>
	</div>
</div>

<!-- FAB -->
<button
	onclick={() => (showCreate = true)}
	class="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-full shadow-xl flex items-center justify-center text-3xl z-40 transition"
	aria-label="Ny filmkveld"
>+</button>

<!-- Create sheet -->
{#if showCreate}
	<div
		class="fixed inset-0 bg-black/40 z-40"
		role="button"
		tabindex="-1"
		aria-label="Lukk"
		onclick={() => (showCreate = false)}
		onkeydown={(e) => e.key === 'Escape' && (showCreate = false)}
	></div>
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-6 space-y-4 max-w-lg mx-auto">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold">Ny filmkveld</h2>
			<button onclick={() => (showCreate = false)} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
		</div>

		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}

		<form
			method="POST"
			action="?/createSession"
			use:enhance={() => {
				return ({ result, update }) => {
					if (result.type !== 'redirect') update();
				};
			}}
			class="space-y-3"
		>
			<input
				name="title"
				placeholder="Tittel, f.eks. Fredagsfilm 23. mai"
				required
				class="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
			/>
			<div class="flex gap-3">
				<input name="date" type="date" class="flex-1 border rounded-xl px-3 py-2.5" />
				<div class="flex items-center gap-2">
					<label for="vpp" class="text-sm text-gray-500 whitespace-nowrap">Stemmer:</label>
					<input id="vpp" name="votes_per_person" type="number" min="1" max="20"
						bind:value={votes_per_person}
						class="w-16 border rounded-xl px-3 py-2.5 text-center" />
				</div>
			</div>
			<button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl">
				Opprett og legg til filmer →
			</button>
		</form>
	</div>
{/if}
