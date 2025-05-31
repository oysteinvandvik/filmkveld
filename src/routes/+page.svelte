<!-- src/routes/+page.svelte -->
<script>
    // valgfritt: logg aktiv rute
    import { page } from '$app/stores';
    $: console.log('Rute:', $page.url.pathname);
  </script>
  
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
    <h1 class="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
      Velkommen til <span class="text-purple-600">Filmkveld 🎬</span>
    </h1>
    <p class="text-lg text-gray-600 mb-8 max-w-md">
      Stem frem kveldens filmvalg med dot-voting! Opprett en runde eller bli med i en eksisterende.
    </p>
    <div class="flex flex-col gap-4 sm:flex-row">
      <a href="/admin" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow transition">
        Opprett en ny avstemning
      </a>
      <a href="/vote/test2025" class="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg transition">
        Gå til stemmeside
      </a>
    </div>
  </div>
  