<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    export let movie;
    export let compact = false;
    export let showRemove = false;
  
    const dispatch = createEventDispatcher();
  </script>
  
  <div class="rounded-xl border p-4 flex gap-4 items-start shadow bg-white">
    {#if movie.omdb?.poster && movie.omdb.poster !== 'N/A'}
      <img src={movie.omdb.poster} alt="Poster" class="w-16 rounded-md shadow" />
    {/if}
    <div class="flex-1">
      <h3 class="font-semibold text-lg">{movie.title}</h3>
      {#if movie.omdb}
        <p class="text-sm text-gray-600">{movie.omdb.year} • {movie.omdb.genre} • {movie.omdb.runtime}</p>
        <p class="text-sm mt-1">{movie.omdb.plot}</p>
      {/if}
    </div>
    {#if showRemove}
      <button on:click={() => dispatch('remove', movie.imdb)} class="text-red-600 text-sm hover:underline">
        Fjern
      </button>
    {/if}
  </div>