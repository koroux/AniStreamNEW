import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  const catalog = [
    { id: 'dune-part-two', title: 'Duna: Parte Dos', poster: 'https://picsum.photos/seed/dune2/300/450', type: 'Película', rating: '4.9', synopsis: 'Paul Atreides se une a Chani y a los fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.' },
    { id: 'deadpool-and-wolverine', title: 'Deadpool y Wolverine', poster: 'https://picsum.photos/seed/deadpool/300/450', type: 'Película', rating: '4.8', synopsis: 'Un apático Wade Wilson se afana en la vida civil. Sus días como el mercenario moralmente flexible, Deadpool, han quedado atrás.' },
    { id: 'the-last-of-us', title: 'The Last of Us', poster: 'https://picsum.photos/seed/tlou/300/450', type: 'Serie', rating: '4.9', synopsis: 'Veinte años después de que la civilización moderna haya sido destruida, Joel es contratado para contrabandear a Ellie fuera de una zona de cuarentena.' },
    { id: 'stranger-things', title: 'Stranger Things', poster: 'https://picsum.photos/seed/stranger/300/450', type: 'Serie', rating: '4.9', synopsis: 'Cuando un niño desaparece, un pueblo pequeño descubre un misterio que involucra experimentos secretos, fuerzas sobrenaturales aterradoras y una niña extraña.' },
    { id: 'oppenheimer', title: 'Oppenheimer', poster: 'https://picsum.photos/seed/oppenheimer/300/450', type: 'Película', rating: '4.9', synopsis: 'La historia del físico estadounidense J. Robert Oppenheimer, su papel en el Proyecto Manhattan y el desarrollo de la bomba atómica.' },
    { id: 'the-boys', title: 'The Boys', poster: 'https://picsum.photos/seed/theboys/300/450', type: 'Serie', rating: '4.8', synopsis: 'Un grupo de vigilantes se propone derribar a los Superhéroes corruptos que abusan de sus superpoderes.' }
  ];

  const results = catalog.filter(item => item.title.toLowerCase().includes(q) || item.id.includes(q));

  return NextResponse.json(results.length > 0 ? results : catalog);
}
