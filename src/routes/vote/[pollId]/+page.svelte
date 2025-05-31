<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { writable, derived, get } from 'svelte/store';

  let poll = null;
  const usedVotes = writable([]);
  const remaining = derived(usedVotes, ($usedVotes) =>
    poll ? poll.maxVotes - $usedVotes.length : 0
  );

  onMount(async () => {
    const pollId = get(page).params.pollId;
    const res = await fetch(`/api/polls/${pollId}`);
    poll = await res.json();

    const saved = localStorage.getItem(`votes-${poll.id}`);
    if (saved) {
      usedVotes.set(JSON.parse(saved));
    }
  });

  function incrementVote(movieId) {
    usedVotes.update((current) => {
      if (poll && current.length < poll.maxVotes) return [...current, movieId];
      return current;
    });
  }

  function decrementVote(movieId) {
    usedVotes.update((current) => {
      const index = current.lastIndexOf(movieId);
      if (index !== -1) {
        const copy = [...current];
        copy.splice(index, 1);
        return copy;
      }
      return current;
    });
  }

  async function submitVotes() {
    const $votes = get(usedVotes);
    await fetch(`/api/polls/${poll.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes: $votes })
    });
    alert('Takk for stemmen!');
  }

  $: if (poll) {
    usedVotes.subscribe((v) => {
      localStorage.setItem(`votes-${poll.id}`, JSON.stringify(v));
    });
  }
</script>

{#if poll}
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-center">{poll.title}</h1>
    <p class="text-center text-gray-600">{poll.date}</p>

    {#if poll.status === 'open'}
      <div class="space-y-4">
        {#each poll.movies as movie}
          <div class="bg-white rounded shadow p-4 space-y-3">
            <div class="flex justify-between items-center">
              <h2 class="font-semibold text-lg">{movie.title}</h2>
              <div class="flex space-x-2 items-center">
                <button on:click={() => decrementVote(movie.id)} class="bg-gray-200 px-2 rounded">−</button>
                <span class="font-mono">{$usedVotes.filter(v => v === movie.id).length}</span>
                <button on:click={() => incrementVote(movie.id)} class="bg-gray-200 px-2 rounded">+</button>
              </div>
            </div>

            {#if movie.omdb}
              <div class="flex space-x-4">
                {#if movie.omdb.poster && movie.omdb.poster !== 'N/A'}
                  <img src={movie.omdb.poster} alt="Poster" class="w-24 h-auto rounded shadow" />
                {:else}
                  <div class="w-24 h-36 bg-gray-100 border flex items-center justify-center rounded shadow text-gray-400 text-xs text-center px-2">
                    🎮<br />Ingen plakat
                  </div>
                {/if}
                <div class="text-sm text-gray-700 space-y-1">
                  <p>{movie.omdb.plot}</p>
                  <p class="text-xs text-gray-500 italic">{movie.omdb.year} · {movie.omdb.genre} · {movie.omdb.runtime}</p>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="text-center text-gray-700 pt-4">
        Du har {$remaining} {$remaining === 1 ? 'stemme' : 'stemmer'} igjen
      </div>

      <div class="flex justify-center pt-4">
        <button
          class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded shadow disabled:opacity-50"
          on:click={submitVotes}
          disabled={$remaining !== 0}
        >
          Send inn stemmer
        </button>
      </div>
    {:else}
      <h2 class="text-lg font-semibold text-center text-gray-700 mb-4">Resultat</h2>
      <ul class="space-y-4">
        {#each poll.movies.slice().sort((a, b) => b.votes - a.votes) as movie, i}
          <li class="bg-white p-4 rounded shadow space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium">{i + 1}. {movie.title}</span>
              <span class="text-purple-700 font-semibold">{movie.votes} stemmer</span>
            </div>
            {#if movie.omdb}
              <div class="flex space-x-4 pt-2">
                {#if movie.omdb.poster && movie.omdb.poster !== 'N/A'}
                  <img src={movie.omdb.poster} alt="Poster" class="w-20 rounded shadow" />
                {:else}
                  <div class="w-20 h-28 bg-gray-100 border flex items-center justify-center rounded shadow text-gray-400 text-xs text-center px-2">
                    🎮<br />Ingen plakat
                  </div>
                {/if}
                <div class="text-sm text-gray-700">
                  <div class="mb-1">{movie.omdb.plot}</div>
                  <div class="text-xs italic text-gray-500">
                    {movie.omdb.year} · {movie.omdb.genre} · {movie.omdb.runtime}
                  </div>
                </div>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{:else}
  <p class="text-red-600 text-center mt-10">
    ❗ Klarte ikke hente avstemning. Er du sikker på at pollId <strong>{get(page).params.pollId}</strong> finnes i <code>polls.json</code>?
  </p>
{/if}
