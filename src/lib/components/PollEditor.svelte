<script lang="ts">
  import type { Poll } from '$lib/types';
  export let poll: Poll;

  let newImdbId = '';
  const apiKey = import.meta.env.PUBLIC_OMDB_API_KEY;

  async function fetchOMDB(id: string) {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`);
    return await res.json();
  }

  async function addMovieById(id: string) {
    const trimmedId = id.trim();
    if (!trimmedId.startsWith('tt')) {
      alert('IMDb-ID må starte med tt...');
      return;
    }

    const exists = poll.movies.some((m) => m.imdb === trimmedId);
    if (exists) {
      alert('Denne filmen er allerede lagt til.');
      return;
    }

    const data = await fetchOMDB(trimmedId);
    if (data.Response === 'True') {
      poll.movies.push({
        id: trimmedId,
        title: data.Title,
        imdb: trimmedId,
        votes: 0,
        omdb: {
          poster: data.Poster,
          plot: data.Plot,
          year: data.Year,
          genre: data.Genre,
          runtime: data.Runtime
        }
      });
      newImdbId = '';
    } else {
      alert(`Fant ikke film med ID ${trimmedId}`);
    }
  }

  function removeMovie(imdbId: string) {
    poll.movies = poll.movies.filter((m) => m.imdb !== imdbId);
  }
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-semibold">Rediger filmvalg</h2>

  <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
    <input
      type="text"
      bind:value={newImdbId}
      placeholder="IMDb-ID (f.eks. tt0468569)"
      class="p-2 border rounded w-full sm:w-80"
    />
    <button
      on:click={() => addMovieById(newImdbId)}
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Legg til film
    </button>
  </div>

  {#if poll.movies.length === 0}
    <p class="text-gray-500 italic">Ingen filmer lagt til enda.</p>
  {/if}

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each poll.movies as movie}
      <div class="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
        {#if movie.omdb?.poster && movie.omdb.poster !== 'N/A'}
          <img
            src={movie.omdb.poster}
            alt={movie.title}
            class="w-full h-64 object-cover"
            on:error={(e) => (e.target.style.display = 'none')}
          />
        {/if}
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-semibold">{movie.title} ({movie.omdb?.year})</h3>
            <p class="text-sm text-gray-600 italic">{movie.omdb?.genre} • {movie.omdb?.runtime}</p>
            <p class="text-sm text-gray-700 mt-2 line-clamp-4">{movie.omdb?.plot || 'Ingen beskrivelse tilgjengelig.'}</p>
          </div>
          <button
            class="mt-4 text-xs text-red-600 hover:underline self-start"
            on:click={() => removeMovie(movie.imdb)}
          >
            Fjern film
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
