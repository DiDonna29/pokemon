export interface PokemonSummary {
  name: string;
  url: string;
}

export interface PokemonDetails {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
      showdown: {
        front_default: string;
      }
    };
  };
  types: {
    slot: number;
    type: {
      name: string;
    };
  }[];
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
  species: {
    url: string;
  };
}

export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: {
      name: string;
    };
  }[];
  evolution_chain: {
    url: string;
  };
}

export const fetchPokemonList = async (limit: number = 20, offset: number = 0) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
  const data = await res.json();
  return data.results as PokemonSummary[];
};

export const fetchPokemonDetails = async (nameOrId: string | number) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`);
  if (!res.ok) return null;
  return (await res.json()) as PokemonDetails;
};

export const fetchPokemonSpecies = async (url: string) => {
  const res = await fetch(url);
  return (await res.json()) as PokemonSpecies;
};

export const fetchEvolutionChain = async (url: string) => {
  const res = await fetch(url);
  return await res.json();
};

export const getTypeColorClass = (type: string) => {
  return `type-${type}`;
};
