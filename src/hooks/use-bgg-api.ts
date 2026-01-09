/**
 * React Query hooks for BGG API calls
 * Provides type-safe, cached, and optimized data fetching
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  validateUsername,
  getUserCollection,
  getGamesInfo,
  getGameInfo,
  getAllUserPlays,
  getGamePlays,
  type UserInfo,
  type CollectionGame,
  type GameInfo,
  type PlayInfo,
  type BggApiResult,
} from "@/services/bgg-api";

/**
 * Query keys for BGG API
 */
export const bggQueryKeys = {
  user: (username: string) => ["bgg", "user", username] as const,
  collection: (username: string) => ["bgg", "collection", username] as const,
  games: (gameIds: string[]) => ["bgg", "games", gameIds] as const,
  game: (gameId: string) => ["bgg", "game", gameId] as const,
  plays: (username: string) => ["bgg", "plays", username] as const,
  gamePlays: (username: string, gameId: string) => ["bgg", "gamePlays", username, gameId] as const,
};

/**
 * Hook to validate BGG username
 * Returns user info if valid, error if invalid
 */
export function useValidateUsername(username: string, enabled: boolean = true) {
  return useQuery({
    queryKey: bggQueryKeys.user(username),
    queryFn: async () => {
      const result = await validateUsername(username);

      if (!result.success) {
        // Don't retry for 404/not found errors
        const error = new Error(result.error);
        (error as any).isNotFound = result.error.includes("not found");
        throw error;
      }

      return result.data;
    },
    enabled: enabled && username.length > 0,
    retry: (failureCount, error) => {
      // Don't retry if user not found or other 4xx errors (permanent errors)
      if (error instanceof Error) {
        const err = error as any;
        // Never retry not found errors
        if (err.isNotFound || err.message.includes("not found") || err.message.includes("404")) {
          return false;
        }
        // Never retry fetch failures (CORS, network errors) - these are usually permanent
        if (err.message.includes("Failed to fetch") ||
            err.message.includes("fetch") ||
            err.message.includes("Network") ||
            err.message.includes("CORS")) {
          return false;
        }
        // Retry up to 1 time for other transient errors
        return failureCount < 1;
      }
      return false;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get user's collection
 * Returns all games owned by the user
 */
export function useUserCollection(username: string, enabled: boolean = true) {
  return useQuery({
    queryKey: bggQueryKeys.collection(username),
    queryFn: async () => {
      const result = await getUserCollection(username);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && username.length > 0,
    retry: 2, // BGG API may need retries
    staleTime: 10 * 60 * 1000, // 10 minutes - collections don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to get detailed info for multiple games
 */
export function useGamesInfo(gameIds: string[], enabled: boolean = true) {
  return useQuery({
    queryKey: bggQueryKeys.games(gameIds),
    queryFn: async () => {
      const result = await getGamesInfo(gameIds);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && gameIds.length > 0,
    retry: 2,
    staleTime: 60 * 60 * 1000, // 1 hour - game details rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to get detailed info for a single game
 */
export function useGameInfo(gameId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: bggQueryKeys.game(gameId),
    queryFn: async () => {
      const result = await getGameInfo(gameId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && !!gameId,
    retry: 2,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to prefetch user collection
 * Useful for preloading data when user hovers or when navigating
 */
export function usePrefetchCollection() {
  const queryClient = useQueryClient();

  return (username: string) => {
    queryClient.prefetchQuery({
      queryKey: bggQueryKeys.collection(username),
      queryFn: async () => {
        const result = await getUserCollection(username);

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to prefetch game details
 */
export function usePrefetchGameInfo() {
  const queryClient = useQueryClient();

  return (gameId: string) => {
    queryClient.prefetchQuery({
      queryKey: bggQueryKeys.game(gameId),
      queryFn: async () => {
        const result = await getGameInfo(gameId);

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      staleTime: 60 * 60 * 1000,
    });
  };
}

/**
 * Invalidate and refetch user-related queries
 */
export function useInvalidateUser() {
  const queryClient = useQueryClient();

  return (username: string) => {
    queryClient.invalidateQueries({
      queryKey: ["bgg", "user", username],
    });
    queryClient.invalidateQueries({
      queryKey: ["bgg", "collection", username],
    });
    queryClient.invalidateQueries({
      queryKey: ["bgg", "plays", username],
    });
  };
}

/**
 * Hook to get user's plays
 * Returns all plays for the user with pagination
 */
export function useUserPlays(username: string, enabled: boolean = true) {
  return useQuery({
    queryKey: bggQueryKeys.plays(username),
    queryFn: async () => {
      const result = await getAllUserPlays(username);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && username.length > 0,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes - plays can change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to get plays for a specific game
 * Returns all plays for the user and game combination
 */
export function useGamePlays(username: string, gameId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: bggQueryKeys.gamePlays(username, gameId),
    queryFn: async () => {
      const result = await getGamePlays(username, gameId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && username.length > 0 && gameId.length > 0,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes - plays can change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Invalidate all BGG queries
 */
export function useInvalidateBgg() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: ["bgg"],
    });
  };
}
