<!-- src/routes/admin/+page.svelte -->
<script>
  let title = '', id = '', date = '', maxVotes = 3;
  let movies = [];
  function addMovie(input) {
    const imdbMatch = input.match(/tt\d{7,}/);
    const movie = {
      id: crypto.randomUUID(),
      title: input,
      imdb: imdbMatch ? imdbMatch[0] : null,
      votes: 0
    };
    movies = [...movies, movie];
  }
  async function addPoll() {
    await fetch('/api/polls', {
      method: 'POST',
      body: JSON.stringify({ id, title, date, maxVotes, movies, status: 'open' })
    });
    alert('Avstemning opprettet');
  }
  async function closePoll(pollId) {
    await fetch(`/api/polls/${pollId}`, {
      method: 'PATCH'
    });
    alert(`Avstemning '${pollId}' er nå avsluttet.`);
  }
</script>

<div class="max-w-xl mx-auto p-6 space-y-6">
  <h1 class="text-2xl font-bold text-center">Adminpanel</h1>

  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Opprett ny runde</h2>
    <input bind:value={id} placeholder="Kode (f.eks. fredag2025)" class="w-full border p-2 rounded" />
    <input bind:value={title} placeholder="Tittel" class="w-full border p-2 rounded" />
    <input bind:value={date} placeholder="Dato" type="date" class="w-full border p-2 rounded" />
    <input bind:value={maxVotes} type="number" min="1" class="w-full border p-2 rounded" />
    <input
      on:keydown={(e) => e.key === 'Enter' && addMovie(e.target.value)}
      placeholder="Filmnavn eller IMDb-lenke og Enter"
      class="w-full border p-2 rounded"
    />
    <ul class="list-disc list-inside text-sm text-gray-600">
      {#each movies as m}
        <li>{m.title}</li>
      {/each}
    </ul>
    <button on:click={addPoll} class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
      Opprett runde
    </button>
  </div>

  <hr />

  <div class="space-y-4">
    <h2 class="text-lg font-semibold">Avslutt eksisterende poll</h2>
    <input placeholder="Poll ID" bind:value={id} class="w-full border p-2 rounded" />
    <button on:click={() => closePoll(id)} class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow">
      Avslutt runde
    </button>
  </div>
</div>