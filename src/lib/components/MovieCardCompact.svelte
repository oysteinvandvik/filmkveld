<script lang="ts">
  export let title: string;
  export let year: string;
  export let genre: string;
  export let runtime: string;
  export let poster: string;
  export let plot: string;
  export let actors: string;
  export let imdb: string;
  export let showRemove = false;

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="flex border rounded-xl overflow-hidden shadow bg-white">
  {#if poster && poster !== 'N/A'}
    <img src={poster} alt={title} class="w-24 h-auto object-cover" />
  {/if}
  <div class="p-3 flex-1">
    <div class="font-semibold text-sm">{title} ({year})</div>
    <div class="text-xs text-gray-500 italic">{genre} – {runtime}</div>
    <div class="text-xs mt-1 text-gray-700 line-clamp-3">{plot}</div>
    <div class="text-xs text-gray-600 mt-1">{actors}</div>
    {#if showRemove}
      <button
        on:click={() => dispatch('remove', imdb)}
        class="mt-2 text-red-600 hover:underline text-xs">
        Fjern
      </button>
    {/if}
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
