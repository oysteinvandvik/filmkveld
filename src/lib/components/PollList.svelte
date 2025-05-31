<script lang="ts">
  import { onMount } from 'svelte';
  import MovieList from './MovieList.svelte';

  export let polls = [];
  let details: Record<string, boolean> = {};
  let pollDetails: Record<string, any> = {};

  async function toggleDetails(pollId: string) {
    details[pollId] = !details[pollId];
    if (details[pollId] && !pollDetails[pollId]) {
      const res = await fetch(`/api/polls/${pollId}`);
      pollDetails[pollId] = await res.json();
    }
  }
</script>

<div class="space-y-6">
  {#each polls as poll}
    <div class="border p-4 rounded shadow bg-white">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">{poll.title}</h2>
          <p class="text-gray-600 text-sm">{poll.date} · {poll.status}</p>
        </div>
        <button
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
          on:click={() => toggleDetails(poll.id)}>
          {details[poll.id] ? 'Skjul' : 'Vis'} filmer
        </button>
      </div>

      {#if details[poll.id] && pollDetails[poll.id]?.movies}
        <div class="mt-4">
          <MovieList movies={pollDetails[poll.id].movies} />
        </div>
      {/if}
    </div>
  {/each}
</div>
