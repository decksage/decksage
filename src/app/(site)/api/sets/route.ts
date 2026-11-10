import { NextResponse } from 'next/server';
import { searchScryfallSets } from '@/app/lib/scryfall';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') ?? '';
    const sets = await searchScryfallSets(query);
    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Erro ao buscar edições:', error);
    return NextResponse.json({ error: 'Não foi possível buscar edições no Scryfall.' }, { status: 502 });
  }
}
