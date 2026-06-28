<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	let selectedPersonId = $state('');
	let pointsMap = $state<Record<string, number>>({});
	let liveTotals = $state<Record<string, number>>({});
	let currentIndex = $state(0);
	let showSummary = $state(false);
	let submitting = $state(false);
	let touchStartX = 0;
	let touchStartY = 0;

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		// Only fire if more horizontal than vertical, and past 40px threshold
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
			if (dx < 0) goNext();
			else goPrev();
		}
	}

	const votesPerPerson = $derived(data.votingSession.votes_per_person);
	const usedPoints = $derived(Object.values(pointsMap).reduce((a, b) => a + b, 0));
	const remainingPoints = $derived(votesPerPerson - usedPoints);
	const candidates = $derived(data.candidates);

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

	$effect(() => {
		if (!selectedPersonId) {
			pointsMap = {};
			return;
		}
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

	function goNext() {
		currentIndex = (currentIndex + 1) % candidates.length;
	}

	function goPrev() {
		if (showSummary) {
			showSummary = false;
			return;
		}
		currentIndex = (currentIndex - 1 + candidates.length) % candidates.length;
	}

	// Returns inline CSS for each card based on its distance from the active card.
	// CSS transition handles animation — all cards stay in the DOM, only their
	// transforms change when currentIndex updates.
	function cardStyle(index: number): string {
		const total = candidates.length;
		const raw = index - currentIndex;
		// Wrap offset so cards "go around": offset stays in [-floor(n/2), ceil(n/2)]
		const mod = ((raw % total) + total) % total;
		const offset = mod > total / 2 ? mod - total : mod;
		const abs = Math.abs(offset);

		if (abs > 2) {
			return 'left:50%; transform:translateX(-50%); opacity:0; pointer-events:none; z-index:0;';
		}

		// Values indexed by offset+2: [-2, -1, 0, +1, +2]
		const scales = [0.7, 0.84, 1, 0.84, 0.7];
		const rotates = [-14, -8, 0, 8, 14];
		const opacities = [0, 0.65, 1, 0.65, 0];
		const zIndexes = [10, 20, 30, 20, 10];

		const clamped = Math.max(-2, Math.min(2, offset));
		const idx = clamped + 2;
		const leftPct = 50 + clamped * 38;

		const parts = [
			`left:${leftPct}%`,
			`transform:translateX(-50%) scale(${scales[idx]}) rotate(${rotates[idx]}deg)`,
			`opacity:${opacities[idx]}`,
			`z-index:${zIndexes[idx]}`,
			// offset ±1 keeps pointer-events on so the overlay button inside can receive clicks
			`pointer-events:${abs > 1 ? 'none' : 'auto'}`,
			`transition:left 0.4s cubic-bezier(0.4,0,0.2,1),transform 0.4s cubic-bezier(0.4,0,0.2,1),opacity 0.35s ease,filter 0.35s ease`
		];

		if (abs > 0 && abs <= 2) parts.push('filter:brightness(0.7)');

		return parts.join(';');
	}

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	let channel: ReturnType<typeof supabase.channel> | null = null;

	onMount(() => {
		channel = supabase
			.channel(`votes-${data.votingSession.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'votes', filter: `session_id=eq.${data.votingSession.id}` },
				() => { invalidateAll(); }
			)
			.subscribe();
	});

	onDestroy(() => { channel?.unsubscribe(); });

	const hasVoted = $derived(
		selectedPersonId ? data.allVotes.some((v: any) => v.person_id === selectedPersonId) : false
	);
</script>

<div class="max-w-lg mx-auto p-4 space-y-5">
	<!-- Header -->
	<div class="text-center space-y-1">
		<h1 class="text-2xl font-bold text-purple-700">{data.votingSession.title}</h1>
		{#if data.votingSession.date}
			<p class="text-gray-500 text-sm">{data.votingSession.date}</p>
		{/if}
	</div>

	{#if data.votingSession.status === 'suggestion'}
		<div class="text-center space-y-2 py-6">
			<p class="text-2xl">🎬</p>
			<p class="text-gray-600 font-medium">Stemming er ikke åpnet ennå</p>
			<p class="text-gray-400 text-sm">Kandidatene settes opp — sjekk tilbake snart</p>
		</div>
	{:else if data.votingSession.status === 'decided' || data.votingSession.status === 'archived'}
		<div class="text-center space-y-3 py-4">
			<p class="text-orange-600 font-medium">Denne avstemningen er avsluttet.</p>
			<a href="/results/{data.votingSession.id}" class="text-purple-600 hover:underline">Se resultater →</a>
		</div>
	{:else}
		<!-- Person selector -->
		<div class="bg-white border rounded-xl p-4 shadow-sm space-y-3">
			<p class="font-medium text-gray-700">Hvem er du?</p>
			<div class="flex flex-wrap gap-2">
				{#each data.participants as p}
					<button
						onclick={() => { selectedPersonId = p.id; currentIndex = 0; showSummary = false; }}
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
			<!-- Points banner -->
			<div class="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
				<span class="text-purple-800 font-medium text-sm">
					{usedPoints} av {votesPerPerson} stemmer fordelt
				</span>
				{#if hasVoted}
					<span class="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Har stemt</span>
				{/if}
			</div>

			<form
				method="POST"
				action="?/vote"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="person_id" value={selectedPersonId} />
				{#each candidates as c}
					<input type="hidden" name="points_{c.id}" value={pointsMap[c.id] ?? 0} />
				{/each}

				{#if !showSummary}
					<!-- Progress dots -->
					<div class="flex items-center justify-center gap-1.5 py-1">
						{#each candidates as _, i}
							<div
								class="rounded-full transition-all duration-300 {i === currentIndex
									? 'w-6 h-2 bg-purple-600'
									: i < currentIndex
										? 'w-2 h-2 bg-purple-300'
										: 'w-2 h-2 bg-gray-200'}"
							></div>
						{/each}
					</div>

					<!-- Carousel: swipe or click the side zones to navigate. -->
					<div
						class="relative"
						style="overflow-x:clip; min-height: 560px;"
						ontouchstart={onTouchStart}
						ontouchend={onTouchEnd}
					>
						<!-- Left click zone (z:25, behind center card z:30) -->
						<button
							type="button"
							onclick={goPrev}
							class="absolute inset-y-0 left-0 w-[28%] bg-transparent cursor-w-resize"
							style="z-index:25;"
							aria-label="Forrige"
						></button>
						<!-- Right click zone -->
						<button
							type="button"
							onclick={goNext}
							class="absolute inset-y-0 right-0 w-[28%] bg-transparent cursor-e-resize"
							style="z-index:25;"
							aria-label="Neste"
						></button>
						{#each candidates as c, i}
							{@const offset = i - currentIndex}
							{@const myPoints = pointsMap[c.id] ?? 0}
							<div
								class="absolute top-0 w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
								style={cardStyle(i)}
							>
								<!-- Transparent click overlay for side cards.
								     z-index:10 within the card captures clicks on the peeking
								     portion; the center card (z:30 in the container) wins where
								     the two cards overlap, so +/- buttons are never blocked. -->
								{#if offset === -1}
									<button
										type="button"
										onclick={goPrev}
										class="absolute inset-0 cursor-w-resize bg-transparent"
										style="z-index:10;"
										aria-label="Forrige"
									></button>
								{:else if offset === 1}
									<button
										type="button"
										onclick={goNext}
										class="absolute inset-0 cursor-e-resize bg-transparent"
										style="z-index:10;"
										aria-label="Neste"
									></button>
								{/if}

								<!-- Poster -->
								{#if c.movie.poster_url}
									<img
										src={c.movie.poster_url}
										alt={c.movie.title}
										class="w-full object-cover object-top transition-all duration-400"
										style="height: {offset === 0 ? '260px' : '220px'};"
									/>
								{:else}
									<div
										class="w-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-5xl transition-all duration-400"
										style="height: {offset === 0 ? '260px' : '220px'};"
									>
										🎬
									</div>
								{/if}

								<div class="p-4 space-y-3">
									<!-- Title + meta -->
									<div>
										<p class="font-bold leading-tight {offset === 0 ? 'text-lg' : 'text-base'}">{c.movie.title}</p>
										<p class="text-xs text-gray-400 mt-0.5">
											{c.movie.year ?? ''}{c.movie.year ? ' · ' : ''}{c.movie.type === 'tv' ? 'Serie' : 'Film'}
											{#if c.movie.tmdb_rating}
												· ★ {c.movie.tmdb_rating}
											{/if}
										</p>
									</div>

									{#if offset === 0}
										<!-- Center card: full voting UI -->
										{#if c.movie.overview}
											<p class="text-xs text-gray-500 line-clamp-2">{c.movie.overview}</p>
										{/if}

										<div class="pt-1 pb-2 space-y-4">
											<!-- Point count -->
											<div class="text-center">
												<p class="text-6xl font-bold text-purple-700 tabular-nums leading-none">{myPoints}</p>
												<p class="text-xs text-gray-400 mt-2">Stemmer avgitt på dette kortet</p>
											</div>

											<!-- +/- buttons -->
											<div class="flex items-center justify-center gap-10">
												<button
													type="button"
													onclick={() => decrement(c.id)}
													disabled={myPoints <= 0}
													class="w-16 h-16 rounded-full bg-gray-100 text-gray-700 text-3xl font-bold shadow-sm
														   hover:bg-gray-200 active:scale-95 transition
														   disabled:opacity-30 disabled:cursor-not-allowed
														   flex items-center justify-center select-none"
													aria-label="Fjern en stemme"
												>−</button>
												<button
													type="button"
													onclick={() => increment(c.id)}
													disabled={remainingPoints <= 0}
													class="w-16 h-16 rounded-full bg-gray-100 text-gray-700 text-3xl font-bold shadow-sm
														   hover:bg-gray-200 active:scale-95 transition
														   disabled:opacity-30 disabled:cursor-not-allowed
														   flex items-center justify-center select-none"
													aria-label="Legg til en stemme"
												>+</button>
											</div>

											<!-- Remaining total -->
											<p class="text-center text-xs text-gray-400">
												{remainingPoints} av {votesPerPerson} stemmer gjenstår totalt
											</p>
										</div>
									{:else}
										<!-- Side card: just show allocated points if any -->
										{#if myPoints > 0}
											<p class="text-sm font-semibold text-purple-600">★ {myPoints} poeng</p>
										{:else}
											<p class="text-xs text-gray-300 italic">Ingen stemmer</p>
										{/if}
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<!-- Navigation -->
					<div class="flex items-center justify-between gap-3">
						<button
							type="button"
							onclick={goPrev}
							class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium
								   hover:bg-gray-50 transition"
						>
							← Forrige
						</button>
						<button
							type="button"
							onclick={goNext}
							class="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold
								   hover:bg-purple-700 active:scale-95 transition"
						>
							Neste →
						</button>
					</div>

					<div class="text-center">
						<button
							type="button"
							onclick={() => (showSummary = true)}
							class="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition"
						>
							Gå til oppsummering
						</button>
					</div>
				{:else}
					<!-- Summary view — fly transition on mount/unmount -->
					<div in:fly={{ y: 30, duration: 350 }} out:fly={{ y: -20, duration: 200 }} class="space-y-4">
						<div class="text-center space-y-1">
							<h2 class="text-lg font-bold text-gray-800">Oppsummering</h2>
							<p class="text-sm text-gray-400">Slik fordelte du stemmene dine</p>
						</div>

						<div class="space-y-2">
							{#each [...candidates].sort((a, b) => (pointsMap[b.id] ?? 0) - (pointsMap[a.id] ?? 0)) as c}
								{@const pts = pointsMap[c.id] ?? 0}
								<div
									class="flex items-center gap-3 bg-white rounded-xl p-3 border transition
										{pts > 0 ? 'border-purple-200 shadow-sm' : 'border-gray-100 opacity-60'}"
								>
									{#if c.movie.poster_url}
										<img
											src={c.movie.poster_url}
											alt={c.movie.title}
											class="w-12 h-16 object-cover rounded-lg shrink-0"
										/>
									{:else}
										<div
											class="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xl shrink-0"
										>🎬</div>
									{/if}
									<div class="flex-1 min-w-0">
										<p class="font-semibold text-sm truncate">{c.movie.title}</p>
										<p class="text-xs text-gray-400">{c.movie.year ?? ''}</p>
									</div>
									<div class="text-right shrink-0">
										<p class="text-3xl font-bold tabular-nums {pts > 0 ? 'text-purple-700' : 'text-gray-200'}">{pts}</p>
										<p class="text-xs text-gray-400">poeng</p>
									</div>
								</div>
							{/each}
						</div>

						{#if remainingPoints > 0}
							<p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
								Du har {remainingPoints} ubrukte stemmer.
								<button
									type="button"
									onclick={() => (showSummary = false)}
									class="underline hover:text-amber-900"
								>Gå tilbake</button> og fordel dem.
							</p>
						{/if}

						{#if form?.error}
							<p class="text-red-600 text-sm text-center">{form.error}</p>
						{/if}

						<div class="space-y-2 pt-1">
							<button
								type="submit"
								disabled={submitting}
								class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-xl
									   transition active:scale-95 disabled:opacity-50"
							>
								{submitting ? 'Sender…' : hasVoted ? 'Oppdater stemmer' : 'Send inn stemmer'}
							</button>
							<button
								type="button"
								onclick={() => (showSummary = false)}
								class="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition"
							>
								← Tilbake til kortene
							</button>
						</div>
					</div>
				{/if}
			</form>
		{/if}
	{/if}
</div>
