import { PUBLIC_TMDB_API_KEY } from '$env/static/public';

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

export function posterUrl(path: string | null): string | null {
	return path ? `${IMG}${path}` : null;
}

export async function searchTmdb(query: string) {
	const res = await fetch(
		`${BASE}/search/multi?api_key=${PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=nb-NO&include_adult=false`
	);
	if (!res.ok) throw new Error('TMDB search failed');
	const data = await res.json();
	return (data.results as TmdbRawResult[])
		.filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
		.slice(0, 10)
		.map(normalizeTmdbResult);
}

export async function fetchRecommendations(tmdbId: number, type: 'movie' | 'tv'): Promise<TmdbMovie[]> {
	const res = await fetch(
		`${BASE}/${type}/${tmdbId}/recommendations?api_key=${PUBLIC_TMDB_API_KEY}&language=nb-NO`
	);
	if (!res.ok) return [];
	const data = await res.json();
	return (data.results as Omit<TmdbRawResult, 'media_type'>[])
		.slice(0, 10)
		.map((r) => normalizeTmdbResult({ ...r, media_type: type }));
}

export async function fetchTmdbDetails(tmdbId: number, type: 'movie' | 'tv'): Promise<TmdbMovie> {
	const res = await fetch(`${BASE}/${type}/${tmdbId}?api_key=${PUBLIC_TMDB_API_KEY}&language=nb-NO`);
	if (!res.ok) throw new Error('TMDB fetch failed');
	const data = await res.json();
	return normalizeTmdbResult({ ...data, media_type: type });
}

export type TmdbMovie = {
	tmdbId: number;
	type: 'movie' | 'tv';
	title: string;
	year: string;
	posterUrl: string | null;
	overview: string;
	genre: string | null;
	runtime: number | null;
	tmdbRating: number | null;
	seasons: number | null;
	originalLanguage: string | null;
};

type TmdbRawResult = {
	id: number;
	media_type: 'movie' | 'tv';
	title?: string;
	name?: string;
	release_date?: string;
	first_air_date?: string;
	poster_path: string | null;
	overview: string;
	genres?: { id: number; name: string }[];
	runtime?: number;
	episode_run_time?: number[];
	vote_average?: number;
	number_of_seasons?: number;
	original_language?: string;
};

function normalizeTmdbResult(r: TmdbRawResult): TmdbMovie {
	const genre = r.genres?.length ? r.genres.map((g) => g.name).join(', ') : null;
	const runtime =
		r.media_type === 'movie' ? (r.runtime ?? null) : (r.episode_run_time?.[0] ?? null);

	return {
		tmdbId: r.id,
		type: r.media_type,
		title: r.title ?? r.name ?? 'Ukjent',
		year: (r.release_date ?? r.first_air_date ?? '').slice(0, 4),
		posterUrl: posterUrl(r.poster_path),
		overview: r.overview ?? '',
		genre,
		runtime,
		tmdbRating: r.vote_average != null ? Math.round(r.vote_average * 10) / 10 : null,
		seasons: r.number_of_seasons ?? null,
		originalLanguage: r.original_language ?? null
	};
}
