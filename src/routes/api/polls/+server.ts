// src/routes/api/polls/+server.ts
import { json } from '@sveltejs/kit';
import { readFile, writeFile } from 'fs/promises';
const POLLS_FILE = 'data/polls.json';

export async function GET() {
  const data = await readFile(POLLS_FILE, 'utf-8');
  return json(JSON.parse(data));
}

export async function POST({ request }) {
  const poll = await request.json();
  const data = JSON.parse(await readFile(POLLS_FILE, 'utf-8'));
  data.push(poll);
  await writeFile(POLLS_FILE, JSON.stringify(data, null, 2));
  return json({ success: true });
}