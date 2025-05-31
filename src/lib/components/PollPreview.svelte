<script lang="ts">
    import MovieCard from '$lib/components/MovieCard.svelte';
    import { createEventDispatcher } from 'svelte';
    export let movies = [];
    export let compact = false;
    export let showRemove = false;
  
    const dispatch = createEventDispatcher();
  
    function handleRemove(imdb: string) {
      dispatch('remove', imdb);
    }
  </script>
  
  <div class="space-y-4">
    {#each movies as movie (movie.imdb)}
      <MovieCard {movie} {compact} {showRemove} on:remove={handleRemove} />
    {/each}
  </div>
  