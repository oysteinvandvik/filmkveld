import { PUBLIC_OMDB_API_KEY } from '$env/static/public';

export async function fetchOMDBData(imdbID: string) {
  const res = await fetch(`https://www.omdbapi.com/?apikey=${PUBLIC_OMDB_API_KEY}&i=${imdbID}`);
  if (!res.ok) throw new Error('Failed to fetch OMDB');
  return await res.json();
}