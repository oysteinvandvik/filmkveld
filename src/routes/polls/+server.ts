import { json } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import path from 'path';

const POLLS_FILE = path.resolve(process.cwd(), 'data/polls.json');

export async function GET() {
  const data = await readFile(POLLS_FILE, 'utf-8');
  return json(JSON.parse(data));
}