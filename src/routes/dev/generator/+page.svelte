<script>
    let imdbIds = 'tt0133093,tt1375666,tt0816692';
    let apiKey = 'bca81e9b';
    let output = '';
    let isLoading = false;
  
    async function fetchOMDB(id) {
      const res = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`);
      return res.json();
    }
  
    async function generate() {
      isLoading = true;
      output = '';
      const ids = imdbIds.split(',').map(id => id.trim()).filter(Boolean);
      const movies = [];
  
      for (const id of ids) {
        const data = await fetchOMDB(id);
        if (data.Response === 'True') {
          movies.push({
            id,
            title: data.Title,
            imdb: id,
            votes: 0,
            omdb: {
              poster: data.Poster,
              plot: data.Plot,
              year: data.Year,
              genre: data.Genre,
              runtime: data.Runtime
            }
          });
        }
      }
  
      const poll = {
        id: 'testpoll',
        title: 'Filmkveld',
        date: new Date().toISOString().split('T')[0],
        maxVotes: 3,
        status: 'open',
        movies
      };
  
      output = JSON.stringify([poll], null, 2);
      isLoading = false;
    }
  
    function download() {
      const blob = new Blob([output], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'polls.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
  
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <h1 class="text-xl font-bold">Generer polls.json</h1>
  
    <label class="block">
      IMDb-IDer (kommaseparert):
      <textarea bind:value={imdbIds} class="w-full p-2 border rounded mt-1" rows="3"></textarea>
    </label>
  
    <label class="block">
      OMDB API-nøkkel:
      <input type="text" bind:value={apiKey} class="w-full p-2 border rounded mt-1" />
    </label>
  
    <button
      on:click={generate}
      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      disabled={isLoading}
    >
      {isLoading ? 'Henter data...' : 'Generer'}
    </button>
  
    {#if output}
      <div class="space-y-2">
        <pre class="bg-gray-100 p-4 rounded overflow-auto text-sm max-h-96">{output}</pre>
        <button
          on:click={download}
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Last ned polls.json
        </button>
      </div>
    {/if}
  </div>
  