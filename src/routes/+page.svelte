<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let polls = [];
  let showClosed = false;
  let errorMessage = '';

  async function fetchPolls() {
    try {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('Kunne ikke hente avstemninger');
      polls = await res.json();
    } catch (e) {
      console.error(e);
      errorMessage = 'Det oppsto en feil ved henting av avstemninger';
    }
  }

  onMount(fetchPolls);
</script>

<main class="p-6 max-w-3xl mx-auto space-y-8">
  <h1 class="text-4xl font-bold text-center text-purple-700 flex items-center justify-center gap-2">
    🎬 Filmkveld
  </h1>

  <div class="flex justify-between items-center">
    <button on:click={() => goto('/admin')} class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow">
      Gå til admin
    </button>

    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={showClosed} class="accent-purple-600" />
      Vis også avsluttede avstemninger
    </label>
  </div>

  {#if errorMessage}
    <p class="text-red-600 text-center">{errorMessage}</p>
  {:else if polls.length === 0}
    <p class="text-center text-gray-600 italic">Ingen avstemninger funnet.</p>
  {:else}
    <ul class="space-y-4">
      {#each polls.filter(p => showClosed || p.status !== 'closed') as poll}
        <li
          class="bg-white border rounded-xl shadow p-4 flex flex-col gap-2 cursor-pointer hover:bg-purple-50 transition"
          on:click={() => goto(`/vote/${poll.id}`)}
        >
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">{poll.title}</h2>
              <p class="text-sm text-gray-500">
                {poll.date} • {poll.status === 'closed' ? '🔒 Avsluttet' : '🟢 Åpen'} • {poll.movies.length} filmer
              </p>
            </div>
            <span class="text-purple-600 hover:underline text-sm">Gå til avstemning →</span>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
  }
</style>
