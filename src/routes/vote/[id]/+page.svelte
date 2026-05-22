<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	// Who is currently voting
	let selectedPersonId = $state('');

	// Points distribution: candidateId -> points
	let pointsMap = $state<Record<string, number>>({});

	// Live vote totals per candidate
	let liveTotals = $state<Record<string, number>>({});

	const votesPerPerson = $derived(data.votingSession.votes_per_person);
	const usedPoints = $derived(Object.values(pointsMap).reduce((a, b) => a + b, 0));
	const remainingPoints = $derived(votesPerPerson - usedPoints);

	function computeTotals(votes: any[]) {
		const totals: Record<string, number> = {};
		for (const v of votes) {
			totals[v.candidate_id] = (totals[v.candidate_id] ?? 0) + v.points;
		}
		return totals;
	}

	$effect(() => {
		liveTotals = computeTotals(data.allVotes);
	});

	// Load saved votes when person changes
	$effect(() => {
		if (!selectedPersonId) { pointsMap = {}; return; }
		const myVotes = data.allVotes.filter((v: any) => v.person_id === selectedPersonId);
		const map: Record<string, number> = {};
		for (const v of myVotes) map[v.candidate_id] = v.points;
		pointsMap = map;
	});

	function increment(candidateId: string) {
		if (remainingPoints <= 0) return;
		pointsMap = { ...pointsMap, [candidateId]: (pointsMap[candidateId] ?? 0) + 1 };
	}

	function decrement(candidateId: string) {
		const cur = pointsMap[candidateId] ?? 0;
		if (cur <= 0) return;
		const next = { ...pointsMap, [candidateId]: cur - 1 };
		if (next[candidateId] === 0) delete next[candidateId];
		pointsMap = next;
	}

	// Supabase Realtime subscription
	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	let channel: ReturnType<typeof supabase.channel> | null = null;

	onMount(() => {
		channel = supabase
			.channel(`votes-${data.votingSession.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'votes',
					filter: `session_id=eq.${data.votingSession.id}`
				},
				() => { invalidateAll(); }
			)
			.subscribe();
	});

	onDestroy(() => {
		channel?.unsubscribe();
	});

	const hasVoted = $derived(
		selectedPersonId
			? data.allVotes.some((v: any) => v.person_id === selectedPersonId)
			: false
	);
</script>

<div class="max-w-2xl mx-auto p-6 space-y-6">
	<div class="text-center space-y-1">
		<h1 class="text-2xl font-bold text-purple-700">{data.votingSession.title}</h1>
		{#if data.votingSession.date}
			<p class="text-gray-500 text-sm">{data.votingSession.date}</p>
		{/if}
	</div>

	{#if data.votingSession.status === 'closed'}
		<p class="text-center text-orange-600 font-medium">Denne avstemningen er avsluttet.</p>
		<div class="text-center">
			<a href="/results/{data.votingSession.id}" class="text-purple-600 hover:underline">Se resultater →</a>
		</div>
	{:else}
		<!-- Velg person -->
		<div class="bg-white border rounded-xl p-4 shadow space-y-3">
			<p class="font-medium text-gray-700">Hvem er du?</p>
			<div class="flex flex-wrap gap-2">
				{#each data.participants as p}
					<button
						onclick={() => selectedPersonId = p.id}
						class="px-4 py-2 rounded-full text-sm font-medium transition
							{selectedPersonId === p.id
								? 'bg-purple-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					>
						{p.name}
					</button>
				{/each}
			</div>
		</div>

		{#if selectedPersonId}
			<form
				method="POST"
				action="?/vote"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="person_id" value={selectedPersonId} />

				<div class="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center justify-between">
					<span class="text-purple-800 font-medium">
						{remainingPoints} av {votesPerPerson} poeng gjenstår
					</span>
					{#if hasVoted}
						<span class="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Har stemt</span>
					{/if}
				</div>

				{#each data.candidates as c}
					{@const myPoints = pointsMap[c.id] ?? 0}
					{@const totalForThis = liveTotals[c.id] ?? 0}

					<input type="hidden" name="points_{c.id}" value={myPoints} />

					<div class="bg-white border rounded-xl shadow p-4 flex gap-4">
						{#if c.movie.poster_url}
							<img src={c.movie.poster_url} alt={c.movie.title} class="w-20 h-auto rounded-lg shadow object-cover" />
						{:else}
							<div class="w-20 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-2xl">?</div>
						{/if}

						<div class="flex-1 space-y-1 min-w-0">
							<p class="font-semibold">{c.movie.title}</p>
							<p class="text-xs text-gray-500">{c.movie.year ?? ''} · {c.movie.type === 'tv' ? 'Serie' : 'Film'}</p>
							{#if c.movie.overview}
								<p class="text-xs text-gray-600 line-clamp-2">{c.movie.overview}</p>
							{/if}
							<p class="text-xs text-purple-600 font-medium">{totalForThis} poeng totalt</p>
						</div>

						<div class="flex flex-col items-center justify-center gap-2 min-w-[60px]">
							<button
								type="button"
								onclick={() => increment(c.id)}
								disabled={remainingPoints <= 0}
								class="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-lg hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed"
							>+</button>
							<span class="font-bold text-lg text-purple-700 w-6 text-center">{myPoints}</span>
							<button
								type="button"
								onclick={() => decrement(c.id)}
								disabled={myPoints <= 0}
								class="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
							>−</button>
						</div>
					</div>
				{/each}

				{#if form?.error}
					<p class="text-red-600 text-sm">{form.error}</p>
				{/if}

				<button
					type="submit"
					class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
				>
					{hasVoted ? 'Oppdater stemmer' : 'Send inn stemmer'}
				</button>
			</form>
		{/if}
	{/if}
</div>
