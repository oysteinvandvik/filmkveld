<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
  
    let poll = null;
    let errorMessage = '';
  
    onMount(async () => {
      const pollId = $page.params.pollId;
      try {
        const res = await fetch('/api/polls');
        const all = await res.json();
        poll = all.find(p => p.id === pollId);
        if (!poll) {
          errorMessage = 'Avstemningen finnes ikke.';
        } else if (poll.status !== 'closed') {
          errorMessage = `Avstemningen "${poll.title}" er ikke avsluttet enda.`;
        }
      } catch (e) {
        errorMessage = 'Kunne ikke hente resultater.';
      }
    });
  </script>
  
  <main class="p-6 max-w-3xl mx-auto space-y-6">
    {#if errorMessage}
      <p class="text-red-600 text-center text-lg">
        {errorMessage}
        <br />
        <a href="/admin" class="underline text-purple-600">Til admin</a> eller
        <a href="/" class="underline text-purple-600">til forsiden</a>
      </p>
    {:else if poll}
      <h1 class="text-3xl font-bold text-center text-purple-700">Resultat: {poll.title}</h1>
      <p class="text-center text-gray-500">
        {poll.date} – {poll.status === 'closed' ? '🔒 Avsluttet' : '🟢 Åpen'}
      </p>
  
      <ul class="space-y-2 mt-4">
        {#each poll.movies
          .slice()
          .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)) as movie, i}
          <li class="p-4 border rounded-xl bg-white flex justify-between items-center">
            <span>{i === 0 ? '🏆' : ''} {movie.title}</span>
            <span class="text-gray-700">{movie.votes ?? 0} stemmer</span>
          </li>
        {/each}
      </ul>
    {/if}
  </main>
  