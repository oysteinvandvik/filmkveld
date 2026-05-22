export type Person = {
	id: string;
	name: string;
	avatar_url: string | null;
};

export type Movie = {
	id: number; // TMDB ID
	title: string;
	type: 'movie' | 'tv';
	year: string | null;
	poster_url: string | null;
	overview: string | null;
	genre: string | null;
	runtime: number | null;
	tmdb_rating: number | null;
	seasons: number | null;
	original_language: string | null;
};

export type WatchLogEntry = {
	id: string;
	watchlist_id: string;
	watched_at: string;
	notes: string | null;
	viewerIds: string[];
};

export type VotingSession = {
	id: string;
	title: string;
	date: string | null;
	status: 'open' | 'closed';
	votes_per_person: number;
	created_at: string;
};

export type Candidate = {
	id: string;
	session_id: string;
	movie: Movie;
};

export type Vote = {
	candidate_id: string;
	person_id: string;
	points: number;
};
