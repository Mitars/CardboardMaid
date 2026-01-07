/**
 * Convert BGG API collection data to the app's Game format
 * Maps between BGG XMLAPI2 response structure and our internal Game type
 */

import type { Game } from "@/types/game";
import type { CollectionGame, GameInfo } from "@/services/bgg-api";

/**
 * Convert a BGG collection game to our Game format
 */
export function collectionGameToGame(bggGame: CollectionGame): Game {
  // Extract rank from ratings
  let rank: number | null = null;
  let strategyRank: number | null = null;

  if (bggGame.stats?.rating?.ranks) {
    const ranks = Array.isArray(bggGame.stats.rating.ranks)
      ? bggGame.stats.rating.ranks
      : [bggGame.stats.rating.ranks];

    const boardGameRank = ranks.find((r: any) => r.name === "boardgame" || r["@attributes"]?.name === "boardgame");
    const strategyGameRank = ranks.find((r: any) => r.name === "strategygames" || r["@attributes"]?.name === "strategygames");

    const rankValue = boardGameRank?.value || boardGameRank?.["@attributes"]?.value;
    const strategyRankValue = strategyGameRank?.value || strategyGameRank?.["@attributes"]?.value;

    rank = rankValue
      ? (rankValue === "Not Ranked" ? null : parseInt(String(rankValue), 10))
      : null;
    strategyRank = strategyRankValue
      ? (strategyRankValue === "Not Ranked" ? null : parseInt(String(strategyRankValue), 10))
      : null;
  }

  return {
    id: String(bggGame.objectid),
    collectionId: String(bggGame.collid),
    name: bggGame.name || "",
    yearPublished: bggGame.yearpublished || 0,
    image: bggGame.image || "",
    thumbnail: bggGame.thumbnail || "",
    players: {
      min: parseInt(String(bggGame.stats?.minplayers || 0), 10),
      max: parseInt(String(bggGame.stats?.maxplayers || 0), 10),
    },
    playtime: {
      min: parseInt(String(bggGame.stats?.minplaytime || 0), 10),
      max: parseInt(String(bggGame.stats?.maxplaytime || 0), 10),
    },
    numOwned: parseInt(String(bggGame.stats?.numowned || 0), 10),
    rating: {
      average: parseFloat(String(bggGame.stats?.rating?.average || 0)),
      bayesAverage: parseFloat(String(bggGame.stats?.rating?.bayesaverage || 0)),
      usersRated: parseInt(String(bggGame.stats?.rating?.usersrated || 0), 10),
      rank,
      strategyRank,
    },
    status: {
      owned: bggGame.status?.own === 1 || bggGame.status?.own === "1",
      previouslyOwned: bggGame.status?.prevowned === 1 || bggGame.status?.prevowned === "1",
      forTrade: bggGame.status?.fortrade === 1 || bggGame.status?.fortrade === "1",
      want: bggGame.status?.want === 1 || bggGame.status?.want === "1",
      wantToPlay: bggGame.status?.wanttoplay === 1 || bggGame.status?.wanttoplay === "1",
      wantToBuy: bggGame.status?.wanttobuy === 1 || bggGame.status?.wanttobuy === "1",
      wishlist: bggGame.status?.wishlist === 1 || bggGame.status?.wishlist === "1",
      preordered: bggGame.status?.preordered === 1 || bggGame.status?.preordered === "1",
      lastModified: bggGame.status?.lastmodified || "",
    },
    numPlays: typeof bggGame.numplays === "number" ? bggGame.numplays : parseInt(String(bggGame.numplays || "0"), 10),
  };
}

/**
 * Merge detailed game info with collection data
 * Adds description, weight, categories, mechanics, designers
 */
export function mergeGameInfo(game: Game, gameInfo: GameInfo): Game {
  // Extract categories from links
  const categories = gameInfo.links
    ?.filter((link) => link.type === "boardgamecategory")
    .map((link) => link.value);

  // Extract mechanics from links
  const mechanics = gameInfo.links
    ?.filter((link) => link.type === "boardgamemechanic")
    .map((link) => link.value);

  // Extract designers from links
  const designers = gameInfo.links
    ?.filter((link) => link.type === "boardgamedesigner")
    .map((link) => link.value);

  // Get weight (complexity) from statistics
  const weight = gameInfo.statistics?.ratings?.averageweight
    ? parseFloat(gameInfo.statistics.ratings.averageweight.toString())
    : undefined;

  return {
    ...game,
    description: gameInfo.description,
    weight,
    categories,
    mechanics,
    designers,
  };
}

/**
 * Convert an array of BGG collection games to our Game format
 */
export function mapCollectionToGames(bggGames: CollectionGame[]): Game[] {
  return bggGames.map(collectionGameToGame);
}

/**
 * Merge detailed game info into an array of games
 * @param games Base games from collection
 * @param gameInfos Detailed game info from BGG API
 * @returns Games with merged detailed info
 */
export function mergeGamesInfo(
  games: Game[],
  gameInfos: GameInfo[]
): Game[] {
  const gameInfoMap = new Map<string, GameInfo>();
  gameInfos.forEach((info) => {
    // Normalize objectid to string for consistent lookup
    gameInfoMap.set(String(info.objectid), info);
  });

  return games.map((game) => {
    const info = gameInfoMap.get(game.id);
    return info ? mergeGameInfo(game, info) : game;
  });
}

/**
 * Convert BGG GameInfo directly to our Game format
 * Used when fetching a single game's details
 */
export function gameInfoToGame(gameInfo: GameInfo): Game {
  // Extract rank from ratings
  let rank: number | null = null;
  let strategyRank: number | null = null;

  if (gameInfo.statistics?.ratings?.ranks) {
    const ranks = Array.isArray(gameInfo.statistics.ratings.ranks)
      ? gameInfo.statistics.ratings.ranks
      : [gameInfo.statistics.ratings.ranks];

    const boardGameRank = ranks.find((r: any) => r.name === "boardgame" || r["@attributes"]?.name === "boardgame");
    const strategyGameRank = ranks.find((r: any) => r.name === "strategygames" || r["@attributes"]?.name === "strategygames");

    const rankValue = boardGameRank?.value || boardGameRank?.["@attributes"]?.value;
    const strategyRankValue = strategyGameRank?.value || strategyGameRank?.["@attributes"]?.value;

    rank = rankValue
      ? (rankValue === "Not Ranked" ? null : parseInt(String(rankValue), 10))
      : null;
    strategyRank = strategyRankValue
      ? (strategyRankValue === "Not Ranked" ? null : parseInt(String(strategyRankValue), 10))
      : null;
  }

  // Extract categories from links
  const categories = gameInfo.links
    ?.filter((link) => link.type === "boardgamecategory")
    .map((link) => link.value);

  // Extract mechanics from links
  const mechanics = gameInfo.links
    ?.filter((link) => link.type === "boardgamemechanic")
    .map((link) => link.value);

  // Extract designers from links
  const designers = gameInfo.links
    ?.filter((link) => link.type === "boardgamedesigner")
    .map((link) => link.value);

  // Get weight (complexity) from statistics
  const weight = gameInfo.statistics?.ratings?.averageweight
    ? parseFloat(gameInfo.statistics.ratings.averageweight.toString())
    : undefined;

  return {
    id: gameInfo.objectid,
    collectionId: gameInfo.objectid,
    name: gameInfo.name || "",
    yearPublished: gameInfo.yearpublished || 0,
    image: gameInfo.image || "",
    thumbnail: gameInfo.thumbnail || "",
    players: {
      min: parseInt(String(gameInfo.minplayers || 0), 10),
      max: parseInt(String(gameInfo.maxplayers || 0), 10),
    },
    playtime: {
      min: parseInt(String(gameInfo.minplaytime || 0), 10),
      max: parseInt(String(gameInfo.maxplaytime || 0), 10),
    },
    numOwned: parseInt(String(gameInfo.statistics?.ratings?.usersrated || 0), 10),
    rating: {
      average: parseFloat(String(gameInfo.statistics?.ratings?.average || 0)),
      bayesAverage: parseFloat(String(gameInfo.statistics?.ratings?.bayesaverage || 0)),
      usersRated: parseInt(String(gameInfo.statistics?.ratings?.usersrated || 0), 10),
      rank,
      strategyRank,
    },
    status: {
      owned: false,
      previouslyOwned: false,
      forTrade: false,
      want: false,
      wantToPlay: false,
      wantToBuy: false,
      wishlist: false,
      preordered: false,
      lastModified: "",
    },
    numPlays: 0,
    description: gameInfo.description,
    weight,
    categories,
    mechanics,
    designers,
  };
}
