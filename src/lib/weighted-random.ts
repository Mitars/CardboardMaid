import { Game } from "@/types/game";

/**
 * Picks a random game from a list using exponential decay weighting.
 * Games at the beginning of the list have higher probability of being selected,
 * but all games have a non-zero chance.
 *
 * Weight formula: Math.pow(0.85, index)
 * - Index 0: weight = 1.0 (highest)
 * - Index 5: weight ≈ 0.44
 * - Index 10: weight ≈ 0.20
 * - Index 20: weight ≈ 0.04
 *
 * @param games - Array of games to pick from (should be pre-sorted by desired criteria)
 * @returns A randomly selected game with weighted probability
 */
export function pickWeightedRandomGame(games: Game[]): Game {
  if (games.length === 0) {
    throw new Error("Cannot pick from empty game list");
  }

  if (games.length === 1) {
    return games[0];
  }

  // Calculate weights using exponential decay
  const DECAY_FACTOR = 0.85;
  const weights = games.map((game, index) => ({
    game,
    weight: Math.pow(DECAY_FACTOR, index),
  }));

  // Calculate total weight
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  // Pick a random number between 0 and totalWeight
  const random = Math.random() * totalWeight;

  // Find which game corresponds to that random number
  let cumulativeWeight = 0;
  for (const { game, weight } of weights) {
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      return game;
    }
  }

  // Fallback (should rarely happen due to floating point)
  return games[0];
}
