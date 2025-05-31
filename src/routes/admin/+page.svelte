<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_OMDB_API_KEY } from '$env/static/public';
  import { goto } from '$app/navigation';
  import MovieCardCompact from '$lib/components/MovieCardCompact.svelte';

  let polls = [];
  let selectedPoll = null;
  let editing = false;

  let pollForm = {
    id: '',
    title: '',
    date: '',
    maxVotes:  3,
    movies: [],
    status: 'open'
  };
  let newImdb = '';
  let errorMessage = '';

  async function fetchPolls() {
    try {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('API-respons ikke OK');
      polls = await res.json();
    } catch (e) {
      console.error('Feil ved henting av polls:', e);
      errorMessage = 'Klarte ikke hente avstemninger.';
    }
  }

  function editPoll(poll) {
    selectedPoll = null;
    editing = true;
    pollForm = { ...poll };
  }

  function resetPollForm() {
    editing = false;
    selectedPoll = null;
    pollForm = {
      id: '',
      title: '',
      date: '',
      maxVotes: 3,
      movies: [],
      status: 'open'
    };
    newImdb = '';
    errorMessage = '';
  }

  async function deletePoll(pollId: string) {
    if (!confirm('Er du sikker på at du vil slette denne avstemningen?')) return;
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Sletting feilet');
      await fetchPolls();
      if (selectedPoll?.id === pollId) selectedPoll = null;
    } catch (e) {
      console.error('Feil ved sletting av poll:', e);
      errorMessage = 'Klarte ikke slette avstemning.';
    }
  }

  async function closePoll(pollId: string) {
    const confirmed = confirm('Er du sikker på at du vil avslutte denne avstemningen?');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Avslutning feilet');
      await fetchPolls();
      goto(`/resultat/${pollId}`);
    } catch (e) {
      console.error('Feil ved avslutning av poll:', e);
      errorMessage = 'Klarte ikke avslutte avstemning.';
    }
  }

  async function savePoll() {
    if (!pollForm.id || !pollForm.title || !pollForm.date || pollForm.movies.length === 0) {
      alert('Fyll ut alle felter og legg til minst én film.');
      return;
    }
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollForm)
      });
      if (!res.ok) throw new Error('Opprettelse/oppdatering feilet');
      await fetchPolls();
      resetPollForm();
    } catch (e) {
      console.error('Feil ved opprettelse/oppdatering av poll:', e);
      errorMessage = 'Klarte ikke lagre avstemning.';
    }
  }

  async function addMovie() {
    if (!newImdb.trim()) return;
    const imdb = newImdb.trim();
    if (pollForm.movies.find((m) => m.imdb === imdb)) {
      errorMessage = 'Filmen er allerede lagt til.';
      return;
    }
    try {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${PUBLIC_OMDB_API_KEY}&i=${imdb}`);
      const data = await res.json();

      if (data.Response !== 'True') {
        errorMessage = `Fant ikke film med ID ${imdb}`;
        return;
      }

      pollForm.movies = [
        ...pollForm.movies,
        {
          id: imdb,
          title: data.Title || imdb,
          imdb,
          votes: 0,
          omdb: {
            poster: data.Poster,
            plot: data.Plot,
            year: data.Year,
            genre: data.Genre,
            runtime: data.Runtime,
            actors: data.Actors
          }
        }
      ];
      errorMessage = '';
      newImdb = '';
    } catch (e) {
      console.error('Feil ved henting av OMDB-data:', e);
      errorMessage = 'Det oppsto en feil ved henting av filmdata.';
    }
  }

  function removeMovie(imdb: string) {
    pollForm.movies = pollForm.movies.filter(m => m.imdb !== imdb);
  }

  onMount(fetchPolls);
</script>

<div class="max-w-4xl mx-auto p-6 space-y-10">
  <h1 class="text-3xl font-bold text-center">Adminpanel</h1>

  <section class="space-y-6 bg-white border rounded-xl p-6 shadow">
    <h2 class="text-xl font-semibold">{editing ? 'Oppdater avstemning' : 'Opprett ny avstemning'}</h2>

    <div class="space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          bind:value={pollForm.id}
          placeholder="Kode (f.eks. fredag2025)"
          class="w-full border p-2 rounded-xl"
          readonly={editing}
        />
        <input
          bind:value={pollForm.title}
          placeholder="Tittel"
          class="w-full border p-2 rounded-xl"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          bind:value={pollForm.date}
          type="date"
          class="w-full border p-2 rounded-xl"
        />
        <input
          bind:value={pollForm.maxVotes}
          type="number"
          min="1"
          class="w-full border p-2 rounded-xl"
        />
      </div>

      <div class="flex space-x-2">
        <input bind:value={newImdb} placeholder="IMDb-ID (f.eks. tt0133093)" class="flex-1 border p-2 rounded-xl" />
        <button on:click={addMovie} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">Legg til film</button>
      </div>

      {#if errorMessage}
        <div class="text-red-600 text-sm">{errorMessage}</div>
      {/if}

      {#if pollForm.movies.length > 0}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each pollForm.movies as movie}
            <MovieCardCompact
              title={movie.title}
              year={movie.omdb.year}
              genre={movie.omdb.genre}
              runtime={movie.omdb.runtime}
              poster={movie.omdb.poster}
              plot={movie.omdb.plot}
              actors={movie.omdb.actors}
              imdb={movie.imdb}
              showRemove={true}
              on:remove={() => removeMovie(movie.imdb)}
            />
          {/each}
        </div>
      {/if}

      <div class="flex gap-2">
        <button on:click={savePoll} class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl">
          {editing ? 'Oppdater avstemning' : 'Opprett avstemning'}
        </button>

        {#if editing}
          <button
            on:click={resetPollForm}
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl border"
          >
            Avbryt
          </button>
        {/if}
      </div>
    </div>
  </section>

  <section class="space-y-4 bg-white border rounded-xl p-6 shadow">
    <h2 class="text-xl font-semibold">Filmavstemninger</h2>
    <ul class="space-y-2">
      {#each polls as poll}
        <li class="p-3 border rounded-xl hover:bg-gray-50">
          <div class="flex justify-between items-center">
            <div>
              <div class="font-semibold">{poll.title}</div>
              <div class="text-sm text-gray-500">{poll.date} – {poll.status === 'closed' ? '🔒 Avsluttet' : '🟢 Åpen'}</div>
            </div>
            <div class="flex space-x-2">
              <button on:click={() => editPoll(poll)} class="text-blue-600 hover:underline text-sm">Endre</button>
              <button on:click={() => selectedPoll = poll} class="text-gray-600 hover:underline text-sm">Vis</button>
              {#if poll.status !== 'closed'}
                <button on:click={() => closePoll(poll.id)} class="text-red-600 hover:underline text-sm">Avslutt</button>
              {/if}
              <button on:click={() => deletePoll(poll.id)} class="text-red-600 hover:underline text-sm">Slett</button>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </section>

  {#if selectedPoll}
    <section class="bg-white border rounded-xl p-6 shadow">
      <h2 class="text-xl font-semibold mb-4">{selectedPoll.title}</h2>
      <div class="space-y-3">
        {#each selectedPoll.movies as movie}
          <MovieCardCompact
            title={movie.title}
            year={movie.omdb.year}
            genre={movie.omdb.genre}
            runtime={movie.omdb.runtime}
            poster={movie.omdb.poster}
            plot={movie.omdb.plot}
            actors={movie.omdb.actors}
            imdb={movie.imdb}
          />
        {/each}
      </div>
    </section>
  {/if}
</div>