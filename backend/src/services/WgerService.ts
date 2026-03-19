import axios from 'axios';

// Simple in-memory cache to avoid redundant API calls for the same name in one run
const cache = new Map<string, string | null>();

/**
 * Compute a simple word-overlap similarity between two strings.
 * Returns a score between 0 and 1. Used to reject poor wger name matches.
 */
function nameSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean));

  // Ignore very common/stop words that appear everywhere
  const stopWords = new Set(['with', 'and', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for']);
  stopWords.forEach(w => { wordsA.delete(w); wordsB.delete(w); });

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });

  // Jaccard similarity
  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}

/**
 * WgerService
 *
 * Provides a fallback for exercise media (images/photos) using the open-source
 * wger.de API. This is used when ExerciseDB does not provide a gifUrl.
 *
 * Only accepts an image if the returned wger exercise name is sufficiently
 * similar to the search query, preventing mismatched images.
 */
export const WgerService = {
  /**
   * Search for an exercise by name on Wger and return the first image URL if found.
   * Uses multi-result scanning and requires a minimum name similarity threshold.
   */
  async getImageUrl(name: string): Promise<string | null> {
    if (!name) return null;

    // Check cache first
    const normalizedName = name.toLowerCase().trim();
    if (cache.has(normalizedName)) return cache.get(normalizedName) ?? null;

    try {
      const imageUrl = await this.performSearch(normalizedName, name);

      cache.set(normalizedName, imageUrl);
      return imageUrl;
    } catch (error) {
      console.warn(`Wger image lookup failed for "${name}":`, error instanceof Error ? error.message : String(error));
      cache.set(normalizedName, null);
      return null;
    }
  },

  /**
   * Internal search logic that scans results and verifies name similarity
   * before accepting an image. Rejects any result whose wger exercise name
   * does not share enough keywords with the search query.
   *
   * Minimum similarity threshold: 0.25 (Jaccard word overlap).
   * This is intentionally lenient to allow e.g. "Bench Press" to match
   * "Barbell Bench Press", but strict enough to reject exercise 822
   * showing up for "Dumbbell Triceps Extension".
   */
  async performSearch(query: string, originalName: string): Promise<string | null> {
    const response = await axios.get('https://wger.de/api/v2/exerciseinfo/', {
      params: { name: query, language: 2, format: 'json' },
      timeout: 10000,
    });

    const results = response.data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    for (const exercise of results) {
      // Collect all English name translations for this wger exercise
      const translations: string[] = [];
      if (exercise.translations) {
        for (const t of exercise.translations) {
          if (t.language === 2 && t.name) translations.push(t.name);
        }
      }
      if (exercise.name) translations.push(exercise.name);

      // Check name similarity against any available translation
      const matchesSomeName = translations.some(
        (wgerName) => nameSimilarity(originalName, wgerName) >= 0.25,
      );

      if (!matchesSomeName) continue;

      // Accept the first image from this sufficiently-named exercise
      if (exercise.images && exercise.images.length > 0) {
        const main = exercise.images.find((img: any) => img.is_main);
        return main ? main.image : exercise.images[0].image;
      }
    }

    return null;
  },

  /** Clear in-memory cache (useful between import runs). */
  clearCache(): void {
    cache.clear();
  },
};
