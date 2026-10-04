// ---------- App-level (trimmed) model ----------

export type StatName =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

export interface Stat {
  name: StatName;
  value: number;
}

export interface Ability {
  name: string;
  hidden: boolean;
}

export interface Pokemon {
  id: number;
  /** API slug, e.g. "mr-mime" */
  slug: string;
  /** English display name, e.g. "Mr. Mime" */
  name: string;
  genus: string;
  description: string;
  /** false if the species request failed (name/genus/description are fallbacks) */
  speciesLoaded: boolean;
  types: string[];
  /** decimetres */
  height: number;
  /** hectograms */
  weight: number;
  abilities: Ability[];
  stats: Stat[];
  /** base stat total */
  total: number;
  artwork: string;
  sprite: string;
}

// ---------- Raw PokeAPI response shapes (only the fields we use) ----------

export interface NamedResource {
  name: string;
  url: string;
}

export interface ApiNamedList {
  count: number;
  results: NamedResource[];
}

export interface ApiPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: NamedResource }[];
  abilities: { ability: NamedResource; is_hidden: boolean; slot: number }[];
  stats: { base_stat: number; stat: NamedResource }[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
    };
  };
}

export interface ApiSpecies {
  id: number;
  names: { name: string; language: NamedResource }[];
  genera: { genus: string; language: NamedResource }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedResource;
    version: NamedResource;
  }[];
}
