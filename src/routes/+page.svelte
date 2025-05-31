<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let polls = [];
  let showAll = false;
  let errorMessage = '';

  async function fetchPolls() {
    try {
      const res = await fetch('/data/polls.json');
      if (!res.ok) throw new Error('Respons ikke OK');
      polls = await res.json();
    } catch (e) {
      errorMessage = 'Det oppsto en feil ved henting av avstemninger';
      console.error(e);
    }
  }

  $: visiblePolls = showAll ? polls : polls.filter(p => p.status === 'open');

  onMount(fetchPolls);
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
  <div class="max-w-3xl mx-auto space-y-6">
    <header class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-blue-900">🎬 Filmkveld</h1>
      <button on:click={() => goto('/admin')} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm">
        Gå til admin
      </button>
    </header>

    <div class="flex items-center space-x-2">
      <input type="checkbox" bind:checked={showAll} id="showAll" />
      <label for="showAll" class="text-sm text-gray-700">Vis også avsluttede avstemninger</label>
    </div>

    {#if errorMessage}
      <div class="text-red-600 text-sm">{errorMessage}</div>
    {/if}

    {#if visiblePolls.length === 0 && !errorMessage}
      <p class="text-gray-500 italic">Ingen avstemninger funnet.</p>
    {/if}

    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each visiblePolls as poll}
        <li class="border rounded-xl p-4 bg-white shadow hover:shadow-md transition cursor-pointer" on:click={() => goto(`/vote/${poll.id}`)}>
          <div class="text-lg font-semibold text-blue-800">{poll.title}</div>
          <div class="text-sm text-gray-500">{poll.date} • {poll.status === 'open' ? 'Åpen' : 'Avsluttet'}</div>
          <div class="mt-2 text-sm text-gray-600">{poll.movies.length} filmer i avstemningen</div>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  input[type="checkbox"]:focus {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
</style>