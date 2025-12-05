import { base64, inflate } from "@chr33s/pdf-common";
import { StateMachine, type StateMachineConfig } from "@chr33s/pdf-dfa";
import createUnicodeProperties from "@chr33s/pdf-unicode-properties";
import UnicodeTrie from "@chr33s/pdf-unicode-trie";

// Base64 encoded trie data imports
import base64DeflatedIndicMachine from "./indic-gen-data.js";
import base64DeflatedArabicTrie from "./trie-data.js";
import base64DeflatedIndicTrie from "./trie-indic-data.js";
import base64DeflatedUseTrie from "./trie-use-data.js";
import base64DeflatedUseData from "./use-data.js";

type UniversalShapingData = StateMachineConfig & {
  categories: Record<number | string, string>;
  decompositions: Record<number | string, number[]>;
};

export type ShaperData = {
  arabicTrie: UnicodeTrie;
  indicTrie: UnicodeTrie;
  useTrie: UnicodeTrie;
  indicMachine: StateMachine;
  useMachine: StateMachine;
  useCategories: Record<number | string, string>;
  useDecompositions: Record<number | string, number[]>;
  indicDecompositions: Record<number | string, number[]>;
};

// Singleton state
let shaperData: ShaperData | null = null;
let initPromise: Promise<ShaperData> | null = null;

const textDecoder = new TextDecoder();
const decodeBase64 = (encoded: string): Uint8Array => new Uint8Array(base64.decode(encoded));

const inflateBase64 = async (encoded: string): Promise<Uint8Array> =>
  inflate(decodeBase64(encoded));

const inflateBase64Json = async <T>(encoded: string): Promise<T> =>
  JSON.parse(textDecoder.decode(await inflateBase64(encoded)));

/**
 * Initialize all shaper data asynchronously.
 * This must be called before using fontkit for text shaping.
 * Safe to call multiple times - will return cached data after first init.
 */
export async function initShapers(): Promise<ShaperData> {
  if (shaperData) return shaperData;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Initialize unicode-properties first
    await createUnicodeProperties();

    // Load all compressed data in parallel
    const [arabicTrieData, indicTrieData, useTrieData, indicMachineData, useData] =
      await Promise.all([
        inflateBase64(base64DeflatedArabicTrie),
        inflateBase64(base64DeflatedIndicTrie),
        inflateBase64(base64DeflatedUseTrie),
        inflateBase64Json<StateMachineConfig>(base64DeflatedIndicMachine),
        inflateBase64Json<UniversalShapingData>(base64DeflatedUseData),
      ]);

    // Create tries
    const [arabicTrie, indicTrie, useTrie] = await Promise.all([
      UnicodeTrie.create(arabicTrieData),
      UnicodeTrie.create(indicTrieData),
      UnicodeTrie.create(useTrieData),
    ]);

    shaperData = {
      arabicTrie,
      indicTrie,
      useTrie,
      indicMachine: new StateMachine(indicMachineData),
      useMachine: new StateMachine(useData),
      useCategories: useData.categories,
      useDecompositions: useData.decompositions,
      indicDecompositions: useData.decompositions,
    };

    return shaperData;
  })();

  return initPromise;
}

/**
 * Get the initialized shaper data.
 * Throws if initShapers() hasn't been called and awaited.
 */
export function getShaperData(): ShaperData {
  if (!shaperData) {
    throw new Error("Shapers not initialized. Call initShapers() first and await its result.");
  }
  return shaperData;
}

/**
 * Check if shapers have been initialized.
 */
export function isInitialized(): boolean {
  return shaperData !== null;
}
