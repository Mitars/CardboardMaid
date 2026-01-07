/**
 * BoardGameGeek XMLAPI2 Service
 * Handles all BGG API interactions with XML parsing
 */

import {
  parseUserInfo,
  parseCollection,
  isBggProcessing,
} from "@/lib/xml-parser";
import { parseXmlToJson } from "@/lib/xml-parser";

// Use Vite proxy in development, Vercel Edge Function in production
const BGG_API_BASE = import.meta.env.DEV
  ? "/xmlapi2"
  : "/api/bgg?endpoint=";

/**
 * BGG API response types
 */
export type BggApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; retryLater?: boolean; backoff?: number };

export type UserInfo = {
  id: string;
  name: string;
  yearregistered?: number;
  lastmodified?: string;
};

export type CollectionGame = {
  objectid: string;
  objecttype: string;
  subtype: string;
  collid: string;
  name: string;
  yearpublished?: number;
  image?: string;
  thumbnail?: string;
  stats: {
    minplayers: number;
    maxplayers: number;
    minplaytime: number;
    maxplaytime: number;
    playingtime: number;
    numowned: number;
    rating?: {
      value: string;
      usersrated: number;
      average: number;
      bayesaverage: number;
      stddev: number;
      median: number;
      ranks?: any;
    };
  };
  status: {
    own: string;
    prevowned: string;
    fortrade: string;
    want: string;
    wanttoplay: string;
    wanttobuy: string;
    wishlist: string;
    preordered: string;
    lastmodified: string;
  };
  numplays: number | string;
};

export type GameInfo = {
  objectid: string;
  objecttype: string;
  name: string;
  sortindex?: number;
  description?: string;
  yearpublished?: number;
  image?: string;
  thumbnail?: string;
  minplayers?: number;
  maxplayers?: number;
  playtime?: number;
  minplaytime?: number;
  maxplaytime?: number;
  minage?: number;
  links?: Array<{
    type: string;
    id: string;
    value: string;
  }>;
  polls?: Array<{
    name: string;
    title: string;
    totalvotes: string;
  }>;
  statistics?: {
    ratings: {
      usersrated: number;
      average: number;
      bayesaverage: number;
      stddev: number;
      median: number;
      ranks?: any;
      averageweight: number;
    };
  };
};

/**
 * Retry configuration for BGG API
 * BGG often returns 202 when processing requests, requiring retries
 */
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

// Token is now handled server-side by Vercel Edge Function

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make a request to BGG API with retry logic for processing status
 * Returns Response object, or throws for non-retryable errors
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY
): Promise<Response> {
  let attempt = 0;
  let delay = initialDelay;
  let lastError: Error | null = null;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url);

      // If ready, return the response
      if (response.status === 200) {
        return response;
      }

      // If processing (202), wait and retry
      if (response.status === 202) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error("BGG API is still processing the request after maximum retries");
        }
        await sleep(delay);
        delay *= 2; // Exponential backoff
        continue;
      }

      // For 404 and other client errors, return the response so the caller can handle it
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Other error statuses (5xx) - retry
      if (response.status >= 500) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`BGG API returned status ${response.status} after ${maxRetries} retries`);
        }
        await sleep(delay);
        delay *= 2;
        continue;
      }

      // Unknown status - throw
      throw new Error(`BGG API returned status ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // For fetch failures (network errors, CORS), retry
      attempt++;
      if (attempt >= maxRetries) {
        throw lastError;
      }
      await sleep(delay);
      delay *= 2;
    }
  }

  throw lastError || new Error("Maximum retries exceeded");
}

/**
 * Validate BGG username
 * GET /xmlapi2/user?name={username}
 *
 * Returns user info if valid, error if invalid
 */
export async function validateUsername(
  username: string
): Promise<BggApiResult<UserInfo>> {
  try {
    if (!username || username.trim().length === 0) {
      return {
        success: false,
        error: "Username cannot be empty",
      };
    }

    // Construct URL differently for dev vs production
    let url: string;
    if (import.meta.env.DEV) {
      url = `${BGG_API_BASE}/user?name=${encodeURIComponent(username)}`;
    } else {
      // In production, pass endpoint and query params separately
      const params = new URLSearchParams({
        name: username,
      });
      url = `${BGG_API_BASE}user&${params.toString()}`;
    }

    const response = await fetchWithRetry(url);

    // Handle 404 - user not found
    if (response.status === 404) {
      return {
        success: false,
        error: `User "${username}" not found on BoardGameGeek`,
      };
    }

    // Handle other client errors (4xx)
    if (response.status >= 400 && response.status < 500) {
      return {
        success: false,
        error: `BGG API error: ${response.statusText} (${response.status})`,
      };
    }

    const xmlText = await response.text();

    // Check if still processing (shouldn't happen with fetchWithRetry, but just in case)
    if (isBggProcessing(xmlText)) {
      return {
        success: false,
        error: "BGG API is still processing",
        retryLater: true,
        backoff: 2,
      };
    }

    const userInfo = parseUserInfo(xmlText);

    if (!userInfo) {
      return {
        success: false,
        error: `User "${username}" not found on BoardGameGeek`,
      };
    }

    return {
      success: true,
      data: userInfo,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to validate username";

    // Don't retry for fetch failures (CORS, network issues) - these are usually permanent
    const isFetchFailure = errorMessage.includes("Failed to fetch") ||
                           errorMessage.includes("fetch") ||
                           errorMessage.includes("Network") ||
                           errorMessage.includes("CORS");

    return {
      success: false,
      error: errorMessage,
      retryLater: !isFetchFailure, // Only retry if it's not a fetch/CORS error
    };
  }
}

/**
 * Get user's collection
 * GET /xmlapi2/collection?username={username}&own=1&stats=1&excludesubtype=boardgameexpansion
 *
 * Returns all games owned by the user with stats
 */
export async function getUserCollection(
  username: string
): Promise<BggApiResult<CollectionGame[]>> {
  try {
    if (!username || username.trim().length === 0) {
      return {
        success: false,
        error: "Username cannot be empty",
      };
    }

    // Construct URL differently for dev vs production
    // Dev: /xmlapi2/collection?username=X&own=1&stats=1...
    // Prod: /api/bgg?endpoint=collection&username=X&own=1&stats=1...
    let url: string;
    if (import.meta.env.DEV) {
      url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(
        username
      )}&own=1&stats=1&excludesubtype=boardgameexpansion`;
    } else {
      // In production, pass endpoint and query params separately
      const params = new URLSearchParams({
        username,
        own: "1",
        stats: "1",
        excludesubtype: "boardgameexpansion",
      });
      url = `${BGG_API_BASE}collection&${params.toString()}`;
    }

    const response = await fetchWithRetry(url);
    const xmlText = await response.text();

    // Check if still processing
    if (isBggProcessing(xmlText)) {
      return {
        success: false,
        error: "BGG API is still processing",
        retryLater: true,
        backoff: 2,
      };
    }

    const collection = parseCollection(xmlText);

    return {
      success: true,
      data: collection,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch user collection",
      retryLater: true,
    };
  }
}

/**
 * Get detailed info for multiple games
 * GET /xmlapi2/thing?id={id1,id2,id3}&stats=1
 *
 * Returns detailed information for the specified games
 * Note: BGG limits requests to ~20 IDs per request when using stats=1
 */
export async function getGamesInfo(
  gameIds: string[]
): Promise<BggApiResult<GameInfo[]>> {
  try {
    if (!gameIds || gameIds.length === 0) {
      return {
        success: false,
        error: "No game IDs provided",
      };
    }

    // BGG limits to ~20 IDs per request when using stats=1
    const BATCH_SIZE = 20;
    const allGames: GameInfo[] = [];

    // Process in batches
    for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
      const batch = gameIds.slice(i, i + BATCH_SIZE);
      const ids = batch.join(",");

      // Construct URL differently for dev vs production
      let url: string;
      if (import.meta.env.DEV) {
        url = `${BGG_API_BASE}/thing?id=${ids}&stats=1`;
      } else {
        // In production, pass endpoint and query params separately
        const params = new URLSearchParams({
          id: ids,
          stats: "1",
        });
        url = `${BGG_API_BASE}thing&${params.toString()}`;
      }

      const response = await fetchWithRetry(url);
      const xmlText = await response.text();

      // Check if still processing
      if (isBggProcessing(xmlText)) {
        return {
          success: false,
          error: "BGG API is still processing",
          retryLater: true,
          backoff: 2,
        };
      }

      const json = parseXmlToJson(xmlText);
      // The root element is <items>, so we access json.item directly (not json.items.item)
      const items = json?.item || json?.items?.item;

      if (!items) {
        continue;
      }

      // Handle single item or array
      const itemsArray = Array.isArray(items) ? items : [items];

      // Parse each game
      const games: GameInfo[] = itemsArray.map((item: any) => {
        // Parse name (get primary name)
        // Our XML parser stores attributes directly, so item.name is an object with type, value, sortindex props
        let name = "";
        let sortindex = undefined;
        if (Array.isArray(item.name)) {
          const primary = item.name.find((n: any) => n.type === "primary");
          name = primary?.value || item.name[0]?.value || "";
        } else if (item.name) {
          name = item.name.value || item.name._text || item.name;
          sortindex = item.name.sortindex;
        }

        // Parse links (categories, mechanics, etc.)
        // Our XML parser stores attributes directly: type, id, value
        const links = item.link
          ? (Array.isArray(item.link)
              ? item.link
              : [item.link]
            ).map((l: any) => ({
              type: l.type,
              id: l.id,
              value: l.value,
            }))
          : undefined;

        // Helper to get value from element (handles both direct value and _text)
        const getValue = (elem: any) => elem?._text ?? elem?.value ?? elem;

        return {
          objectid: item.id,
          objecttype: item.type,
          name,
          sortindex,
          description: item.description?._text ?? item.description,
          yearpublished: getValue(item.yearpublished),
          image: item.image?._text ?? item.image,
          thumbnail: item.thumbnail?._text ?? item.thumbnail,
          minplayers: getValue(item.minplayers),
          maxplayers: getValue(item.maxplayers),
          playtime: getValue(item.playtime),
          minplaytime: getValue(item.minplaytime),
          maxplaytime: getValue(item.maxplaytime),
          minage: getValue(item.minage),
          links,
          polls: item.poll
            ? (Array.isArray(item.poll) ? item.poll : [item.poll]).map(
                (p: any) => ({
                  name: p.name,
                  title: p.title,
                  totalvotes: p.totalvotes,
                })
              )
            : undefined,
          statistics: {
            ratings: {
              usersrated: getValue(item.statistics?.ratings?.usersrated),
              average: getValue(item.statistics?.ratings?.average),
              bayesaverage: getValue(item.statistics?.ratings?.bayesaverage),
              stddev: getValue(item.statistics?.ratings?.stddev),
              median: getValue(item.statistics?.ratings?.median),
              ranks: item.statistics?.ratings?.ranks?.rank,
              averageweight: getValue(item.statistics?.ratings?.averageweight),
            },
          },
        };
      });

      allGames.push(...games);

      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < gameIds.length) {
        await sleep(500);
      }
    }

    return {
      success: true,
      data: allGames,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch game details",
      retryLater: true,
    };
  }
}

/**
 * Get detailed info for a single game
 * GET /xmlapi2/thing?id={gameId}&stats=1
 */
export async function getGameInfo(
  gameId: string
): Promise<BggApiResult<GameInfo>> {
  const result = await getGamesInfo([gameId]);

  if (!result.success) {
    return result as BggApiResult<never>;
  }

  if (result.data.length === 0) {
    return {
      success: false,
      error: `Game with ID ${gameId} not found`,
    };
  }

  return {
    success: true,
    data: result.data[0],
  };
}

