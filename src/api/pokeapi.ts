import axios from 'axios';
import type {
  ApiNamedList,
  ApiPokemon,
  ApiSpecies,
  Pokemon,
  StatName,
} from '../types/pokemon';
import { titleCase } from '../utils/format';

export const GEN1_COUNT = 151;

/** Gen 1 is a fixed range, so this is the full set we expect to load. */
const GEN1_IDS = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1);

const CACHE_KEY = 'pokedex:gen1:v2';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CONCURRENCY = 12;

const client = axios.create({
  baseURL: 'https://pokeapi.co/api/v2/',
  timeout: 15000,
});

export interface PokedexLoadResult {
  /** Successfully loaded Pokémon, in Pokédex order (may be partial) */
  pokemon: Pokemon[];
  /** Ids that are missing or only partially loaded; retrying fetches just these */
  failedIds: number[];
  /** First error encountered, for messaging when nothing loaded */
  firstError?: unknown;
}

interface CacheEntry {
  savedAt: number;
  pokemon: Pokemon[];
}

/** An entry is "complete" once both its pokemon and species data loaded. */
function failedIdsFor(pokemon: Pokemon[]): number[] {
  const complete = new Set(pokemon.filter((p) => p.speciesLoaded).map((p) => p.id));
  return GEN1_IDS.filter((id) => !complete.has(id));
}

/**
 * Returns cached Pokémon synchronously (possibly partial), or null if the
 * cache is absent, stale, or unreadable.
 */
export function readCache(): PokedexLoadResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (
      !Array.isArray(entry.pokemon) ||
      entry.pokemon.length === 0 ||
      Date.now() - entry.savedAt > CACHE_TTL_MS
    ) {
      return null;
    }
    return { pokemon: entry.pokemon, failedIds: failedIdsFor(entry.pokemon) };
  } catch {
    return null;
  }
}

function writeCache(pokemon: Pokemon[]): void {
  try {
    const entry: CacheEntry = { savedAt: Date.now(), pokemon };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable (private mode) — the app still works uncached.
  }
}

async function getWithRetry<T>(url: string, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const { data } = await client.get<T>(url);
      return data;
    } catch (err) {
      lastError = err;
      // Don't retry a definitive "not found"
      if (axios.isAxiosError(err) && err.response?.status === 404) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError;
}

/** Runs `fn` over `items` with at most `limit` promises in flight. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : NaN;
}

function cleanFlavorText(text: string): string {
  return text
    .replace(/[\f\n\r­]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function describeFailure(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response ? `HTTP ${err.response.status}` : err.message;
  return String(err);
}

/** Builds the app model; species data is optional so a species failure doesn't drop the Pokémon. */
function toPokemon(p: ApiPokemon, s: ApiSpecies | null): Pokemon {
  const english = <T extends { language: { name: string } }>(arr: T[]) =>
    arr.filter((e) => e.language.name === 'en');

  const stats = p.stats.map((st) => ({
    name: st.stat.name as StatName,
    value: st.base_stat,
  }));

  // Prefer the classic Red/Blue entry, otherwise any English entry
  const flavors = s ? english(s.flavor_text_entries) : [];
  const flavor =
    flavors.find((f) => f.version.name === 'red') ??
    flavors.find((f) => f.version.name === 'yellow') ??
    flavors[0];

  return {
    id: p.id,
    slug: p.name,
    name: (s && english(s.names)[0]?.name) || titleCase(p.name),
    genus: (s && english(s.genera)[0]?.genus) || '',
    description: flavor ? cleanFlavorText(flavor.flavor_text) : '',
    speciesLoaded: s !== null,
    types: [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    height: p.height,
    weight: p.weight,
    abilities: [...p.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats,
    total: stats.reduce((sum, st) => sum + st.value, 0),
    artwork: p.sprites.other?.['official-artwork']?.front_default ?? artworkUrl(p.id),
    sprite: p.sprites.front_default ?? artworkUrl(p.id),
  };
}

/** Ids from the list endpoint; falls back to the known Gen 1 range if it fails. */
async function fetchGen1Ids(): Promise<number[]> {
  try {
    const list = await getWithRetry<ApiNamedList>(`pokemon?limit=${GEN1_COUNT}&offset=0`);
    const ids = list.results.map((r) => idFromUrl(r.url)).filter((id) => !Number.isNaN(id));
    return ids.length ? ids : GEN1_IDS;
  } catch (err) {
    console.warn('[pokeapi] list request failed, using ids 1–151:', describeFailure(err));
    return GEN1_IDS;
  }
}

type ProgressListener = (done: number, total: number) => void;

/**
 * Fetches every id not already complete in `cached`. Individual failures are
 * logged and skipped rather than failing the whole batch.
 */
async function fetchMissing(
  cached: Pokemon[],
  onProgress: ProgressListener,
): Promise<PokedexLoadResult> {
  const byId = new Map(cached.map((p) => [p.id, p]));
  const allIds = await fetchGen1Ids();
  const toFetch = allIds.filter((id) => !byId.get(id)?.speciesLoaded);

  let done = 0;
  let firstError: unknown;
  onProgress(0, toFetch.length);

  await mapWithConcurrency(toFetch, CONCURRENCY, async (id) => {
    const [pokemonResult, speciesResult] = await Promise.allSettled([
      getWithRetry<ApiPokemon>(`pokemon/${id}`),
      getWithRetry<ApiSpecies>(`pokemon-species/${id}`),
    ]);

    if (pokemonResult.status === 'fulfilled') {
      if (speciesResult.status === 'rejected') {
        firstError ??= speciesResult.reason;
        console.warn(`[pokeapi] species #${id} failed:`, describeFailure(speciesResult.reason));
      }
      const species = speciesResult.status === 'fulfilled' ? speciesResult.value : null;
      // Never downgrade an existing entry that already had species data
      const previous = byId.get(id);
      if (!previous || species || !previous.speciesLoaded) {
        byId.set(id, toPokemon(pokemonResult.value, species));
      }
    } else {
      firstError ??= pokemonResult.reason;
      console.warn(`[pokeapi] pokemon #${id} failed:`, describeFailure(pokemonResult.reason));
    }

    done += 1;
    onProgress(done, toFetch.length);
  });

  const pokemon = [...byId.values()].sort((a, b) => a.id - b.id);
  return { pokemon, failedIds: failedIdsFor(pokemon), firstError };
}

let inflight: Promise<PokedexLoadResult> | null = null;
const progressListeners = new Set<ProgressListener>();

/**
 * Loads all Gen 1 Pokémon (list + details + species). Uses the localStorage
 * cache and only fetches what is missing from it; partial results are cached
 * so a later retry picks up where this one left off. Concurrent callers share
 * one set of requests.
 */
export function loadPokedex(onProgress?: ProgressListener): Promise<PokedexLoadResult> {
  const cached = readCache();
  if (cached && cached.failedIds.length === 0) return Promise.resolve(cached);

  if (onProgress) progressListeners.add(onProgress);

  if (!inflight) {
    inflight = fetchMissing(cached?.pokemon ?? [], (done, total) => {
      progressListeners.forEach((listener) => listener(done, total));
    })
      .then((result) => {
        if (result.pokemon.length > 0) writeCache(result.pokemon);
        return result;
      })
      .finally(() => {
        inflight = null;
        progressListeners.clear();
      });
  }
  return inflight;
}
