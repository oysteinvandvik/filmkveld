import { json } from '@sveltejs/kit';
import { readFile, writeFile } from 'fs/promises';
import { fetchOMDBData } from '$lib/omdb';

import path from 'path';
const POLLS_FILE = path.resolve('static/data/polls.json');

export async function GET({ params }) {
  const polls = JSON.parse(await readFile(POLLS_FILE, 'utf-8'));
  const poll = polls.find((p) => p.id === params.pollId);

  if (!poll) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  let updated = false;

  // Hent og lagre OMDB-data dersom det mangler
  for (const movie of poll.movies) {
    if (movie.imdb && !movie.omdb) {
      try {
        const meta = await fetchOMDBData(movie.imdb);
        movie.omdb = {
          poster: meta.Poster,
          plot: meta.Plot,
          year: meta.Year,
          genre: meta.Genre,
          runtime: meta.Runtime
        };
        updated = true;
      } catch (e) {
        console.warn(`Klarte ikke hente OMDB-data for ${movie.imdb}:`, e);
      }
    }
  }

  // Lagre tilbake til fil hvis vi beriket noe
  if (updated) {
    await writeFile(POLLS_FILE, JSON.stringify(polls, null, 2));
  }

  return json(poll);
}

export async function POST({ params, request }) {
  const { votes } = await request.json();
  const polls = JSON.parse(await readFile(POLLS_FILE, 'utf-8'));
  const poll = polls.find((p) => p.id === params.pollId);

  if (!poll) return json({ error: 'Not found' }, { status: 404 });

  for (const vote of votes) {
    const movie = poll.movies.find((m) => m.id === vote);
    if (movie) movie.votes += 1;
  }

  await writeFile(POLLS_FILE, JSON.stringify(polls, null, 2));
  return json({ success: true });
}

export async function PATCH({ params }) {
  const polls = JSON.parse(await readFile(POLLS_FILE, 'utf-8'));
  const poll = polls.find((p) => p.id === params.pollId);

  if (!poll) return json({ error: 'Not found' }, { status: 404 });

  poll.status = 'closed';
  await writeFile(POLLS_FILE, JSON.stringify(polls, null, 2));
  return json({ success: true });
}

export async function DELETE({ params }) {
  const polls = JSON.parse(await readFile(POLLS_FILE, 'utf-8'));
  const updated = polls.filter((p) => p.id !== params.pollId);
  await writeFile(POLLS_FILE, JSON.stringify(updated, null, 2));
  return json({ success: true });
}
