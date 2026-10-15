# AniStream - Documentación Técnica

App de streaming con catálogo de Anime (TioAnime) + Series y Películas 
(TMDB + CineCalidad).

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (auth + favoritos)
- TMDB API (metadatos de series/películas)
- Scraping de TioAnime y CineCalidad (servidores de video)

## Variables de entorno (Vercel + .env.local)

TMDB_READ_TOKEN=eyJ...           # Bearer v4 de TMDB (NO usar NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

## Patrones críticos

### 1. TMDB tiene namespaces separados para movie y tv

Un mismo ID numérico puede existir SIMULTÁNEAMENTE en:
- /movie/{id}
- /tv/{id}

Y ser contenidos COMPLETAMENTE DISTINTOS.

Ejemplo real:
- /movie/44006 → "Otelo" (película)
- /tv/44006    → "Chicago Fire" (serie)

REGLA: TODOS los IDs internos deben llevar prefijo de tipo:

    movie-238-el-padrino
    tv-66732-stranger-things

NUNCA usar solo el ID numérico. Ver funciones:
- generateItemId() en /api/movies/home, /api/movies/browse, /api/movies/search
- fetchTMDBMeta() en /api/movies/info

### 2. TioAnime usa IDs numéricos para las portadas

Formato CORRECTO:
    https://tioanime.com/uploads/portadas/{id}.jpg

Ejemplo:
    https://tioanime.com/uploads/portadas/4498.jpg

Formato INCORRECTO (404):
    https://tioanime.com/uploads/thumbs/{slug}.jpg

El id numérico NO es el slug. Se obtiene del HTML de la página del anime.

### 3. CineCalidad - estructura de servidores

Los servidores NO están en <ul class="options"> ni en <a href>.

Estructura REAL:

    <div id="playeroptions" class="custom options">
      <ul id="playeroptionsul" class="ajax_mode">
        <li id="player-option-1" class="dooplay_player_option" 
            data-option="https://voe.sx/e/xxxxx">Voe</li>
        <li id="player-option-2" class="dooplay_player_option" 
            data-option="https://doodstream.com/e/xxxxx">Doodstream</li>
        <li class="dooplay_player_option_trailer" 
            data-option="https://youtube.com/...">Trailer</li>
      </ul>
    </div>

SELECTOR CORRECTO:
    $('#playeroptionsul li[data-option]')

- nombre: texto directo del <li> (excluir <span> anidados como "Recomendado")
- url: atributo data-option
- EXCLUIR trailers (clase "dooplay_player_option_trailer" o youtube.com)

### 4. CineCalidad - detección de tipo

Detección por URL:
- /ver-pelicula/{slug}/       → película
- /ver-serie/{slug}/          → serie (página de la serie)
- /ver-el-episodio/{slug}/    → episodio (tiene los servidores)

REGLA: para series, hay que ir a la página del EPISODIO (no la de la serie 
completa) para encontrar los servidores.

### 5. TMDB - géneros movie vs tv

TMDB tiene DOS catálogos de géneros separados:
- /genre/movie/list
- /genre/tv/list

Algunos géneros son exclusivos de un tipo:

EXCLUSIVOS DE MOVIES:
- 27    Terror
- 878   Ciencia ficción
- 10752 Bélica
- 12    Aventura
- 14    Fantasía
- 36    Historia
- 10402 Música
- 10749 Romance
- 53    Suspense
- 10770 Película de TV

EXCLUSIVOS DE TV:
- 10759 Action & Adventure
- 10762 Kids
- 10763 News
- 10764 Reality
- 10765 Sci-Fi & Fantasy
- 10766 Soap
- 10767 Talk
- 10768 War & Politics

COMPARTIDOS (mismo ID en ambos):
- 28    Acción
- 16    Animación
- 35    Comedia
- 80    Crimen
- 99    Documental
- 18    Drama
- 10751 Familia
- 9648  Misterio
- 37    Western

EQUIVALENCIAS movie ↔ tv (para filtrar "Todos" con un género exclusivo):
- 28    (Acción)          ↔ 10759 (Action & Adventure)
- 878   (Ciencia ficción) ↔ 10765 (Sci-Fi & Fantasy)
- 10752 (Bélica)         ↔ 10768 (War & Politics)

Implementado en /api/movies/browse:
- MOVIE_TO_TV_GENRE_ID
- TV_TO_MOVIE_GENRE_ID

### 6. CineCalidad - matcheo de títulos

El título en español de TMDB NO SIEMPRE coincide con el de CineCalidad.

Ejemplo real:
- TMDB dice: "El caballero oscuro"
- CineCalidad tiene: "Batman: El caballero de la noche"

REGLA: probar con varios candidatos:
1. title_es (español)
2. original_title (idioma original)
3. title_en (si es necesario)

Y aplicar SCORING POR TOKENS (no match exacto):
- Quitar stopwords (el, la, los, las, the, and, of, de, del)
- Comparar tokens compartidos
- Bonus si coincide el año de estreno
- Elegir el mejor candidato, no el primero

Implementado en /api/movies/info (searchMovieOnCineCalidad).

### 7. Popups de CineCalidad en el iframe

Los servidores (Voe, Filemoon, etc.) abren popups y deep links.

MITIGACIÓN: sandbox en el iframe:

    <iframe 
      src={url}
      sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      referrerPolicy="no-referrer"
    />

NO incluir: allow-popups, allow-top-navigation, allow-modals.

### 8. Cloudflare

CineCalidad está detrás de Cloudflare. Headers con User-Agent real:

    const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 
    AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

Aplicar a TODAS las peticiones al sitio.

## Endpoints internos

/api/movies/home              → Home (trending, estrenos, series)
/api/movies/browse            → Catálogo con filtros server-side
/api/movies/info?id={id}      → Detalle + servidores + temporadas
/api/movies/search?q={query}  → Búsqueda por texto
/api/home                     → Home de Anime (TioAnime)
/api/search?q={query}         → Búsqueda de Anime
/api/video                    → Servidores de Anime

## Formato de IDs internos

- Anime:         {slug}           ej: one-piece
- Películas:     movie-{id}-{slug} ej: movie-238-el-padrino
- Series:        tv-{id}-{slug}    ej: tv-66732-stranger-things

NUNCA usar el ID numérico solo (colisiona entre movie y tv).

## Última actualización

15 de octubre 2026
