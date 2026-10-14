import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('https://pelisplus.to/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch movies site');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const items: any[] = [];

    $('.item, article, .Post').each((_, element) => {
      const $el = $(element);
      const href = $el.find('a').attr('href') || '';
      const id = href.split('/').filter(Boolean).pop() || 'item';
      const title = $el.find('.title, h3, h2').text().trim();
      let poster = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
      if (poster && !poster.startsWith('http')) poster = 'https://pelisplus.to' + poster;
      const type = $el.find('.type, .badge').text().includes('Serie') ? 'Serie' : 'Película';

      if (id && title) {
        items.push({ id, title, poster: poster || `https://picsum.photos/seed/${id}/300/450`, type, rating: '4.8', synopsis: 'Disfruta de este gran título en alta definición con audio latino y subtitulados.' });
      }
    });

    if (items.length === 0) {
      throw new Error('No items parsed');
    }

    return NextResponse.json({
      trending: items.slice(0, 10),
      movies: items.filter(i => i.type === 'Película'),
      series: items.filter(i => i.type === 'Serie')
    });
  } catch (error) {
    // Fallback robusto con títulos reales de Cine y TV
    const fallbackItems = [
      { id: 'dune-part-two', title: 'Duna: Parte Dos', poster: 'https://picsum.photos/seed/dune2/300/450', type: 'Película', rating: '4.9', synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.' },
      { id: 'deadpool-and-wolverine', title: 'Deadpool y Wolverine', poster: 'https://picsum.photos/seed/deadpool/300/450', type: 'Película', rating: '4.8', synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible, Deadpool, han quedado atrás.' },
      { id: 'the-last-of-us', title: 'The Last of Us', poster: 'https://picsum.photos/seed/tlou/300/450', type: 'Serie', rating: '4.9', synopsis: 'Veinte años después de que la civilización moderna haya sido destruida, Joel es contratado para contrabandear a Ellie fuera de una zona de cuarentena.' },
      { id: 'stranger-things', title: 'Stranger Things', poster: 'https://picsum.photos/seed/stranger/300/450', type: 'Serie', rating: '4.9', synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio que involucra experimentos secretos, fuerzas sobrenaturales aterradoras y una niña extraña.' },
      { id: 'oppenheimer', title: 'Oppenheimer', poster: 'https://picsum.photos/seed/oppenheimer/300/450', type: 'Película', rating: '4.9', synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer, su papel en el Proyecto Manhattan y el desarrollo de la bomba atómica.' },
      { id: 'the-boys', title: 'The Boys', poster: 'https://picsum.photos/seed/theboys/300/450', type: 'Serie', rating: '4.8', synopsis: 'Un grupo de vigilantes se propone derribar a los Superhéroes corruptos que abusan de sus superpoderes.' }
    ];

    return NextResponse.json({
      trending: fallbackItems,
      movies: fallbackItems.filter(i => i.type === 'Película'),
      series: fallbackItems.filter(i => i.type === 'Serie')
    });
  }
}
