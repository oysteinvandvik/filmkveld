import { OMDB_API_KEY } from '$env/static/private';

export async function fetchOMDBData(imdbID: string) {
  const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbID}`);
  if (!res.ok) throw new Error('Failed to fetch OMDB');
  return await res.json();
}