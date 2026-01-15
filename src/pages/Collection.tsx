import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameCard } from "@/components/GameCard";
import { FilterHeader } from "@/components/FilterHeader";
import { Footer } from "@/components/Footer";
import { GameModal } from "@/components/GameModal";
import { FilterState, SortOption, SortDirection, Game } from "@/types/game";
import { useUserCollection, useGamesInfo, useValidateUsername, useUserPlays } from "@/hooks/use-bgg-api";
import { mapCollectionToGames, mergeGamesInfo, mergePlays } from "@/lib/game-mapper";
import { pickWeightedRandomGame } from "@/lib/weighted-random";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

const Collection = () => {
  const navigate = useNavigate();
  const { username: urlUsername } = useParams();

  // Get initial sortBy from localStorage with migration for old sort options
  const getInitialSortBy = (): SortOption => {
    const stored = localStorage.getItem("bgg-sortBy") as SortOption;
    if (!stored) return "user-rating";

    // Migrate old sort options to new directional ones
    const migrations: Record<string, { option: SortOption; direction: SortDirection }> = {
      "rating-high": { option: "rating", direction: "desc" },
      "name-asc": { option: "name", direction: "asc" },
      "name-desc": { option: "name", direction: "desc" },
      "year-new": { option: "year", direction: "desc" },
      "year-old": { option: "year", direction: "asc" },
      "complexity-low": { option: "complexity", direction: "asc" },
      "complexity-high": { option: "complexity", direction: "desc" },
      "plays-high": { option: "plays", direction: "desc" },
      "plays-low": { option: "plays", direction: "asc" },
      "played-recently": { option: "last-played", direction: "desc" },
      "played-long-ago": { option: "last-played", direction: "asc" },
    };

    const migration = migrations[stored];
    if (migration) {
      // Update localStorage with new values
      localStorage.setItem("bgg-sortBy", migration.option);
      localStorage.setItem("bgg-sortDirection", migration.direction);
      return migration.option;
    }

    return stored;
  };

  const initialSortBy = getInitialSortBy();

  // Detect if this is a page refresh (vs navigation)
  const isPageRefresh = (
    window.performance.getEntriesByType &&
    window.performance.getEntriesByType('navigation').length > 0 &&
    (window.performance.getEntriesByType('navigation')[0] as any)?.type === 'reload'
  ) || false;

  // Random seed state - persists in localStorage to maintain shuffle during navigation
  // But regenerates on page refresh
  const [randomSeed, setRandomSeed] = useState<number>(() => {
    const stored = localStorage.getItem("bgg-random-seed");
    const sessionOriginKey = "bgg-time-origin";
    const timeOrigin = Math.floor(window.performance.timeOrigin || 0);
    const storedOrigin = sessionStorage.getItem(sessionOriginKey);
    const isNewOrigin = storedOrigin !== String(timeOrigin);
    // If page refresh, generate a new seed once per reload (timeOrigin changes on reload)
    if (isPageRefresh && isNewOrigin) {
      const newSeed = Date.now();
      localStorage.setItem("bgg-random-seed", String(newSeed));
      sessionStorage.setItem(sessionOriginKey, String(timeOrigin));
      return newSeed;
    }
    // Otherwise use stored seed if available, or generate and save new one
    if (stored) {
      if (isNewOrigin) {
        sessionStorage.setItem(sessionOriginKey, String(timeOrigin));
      }
      return parseInt(stored, 10);
    }
    const newSeed = Date.now();
    localStorage.setItem("bgg-random-seed", String(newSeed));
    sessionStorage.setItem(sessionOriginKey, String(timeOrigin));
    return newSeed;
  });

  const [username, setUsername] = useState<string>("");
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem("bgg-filters");
    return saved
      ? JSON.parse(saved)
      : {
          playerCount: null,
          minPlaytime: null,
          maxPlaytime: null,
          category: null,
          searchQuery: null,
        };
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => initialSortBy);
  const [pickedGame, setPickedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sort direction for directional sorts (defaults based on sort option)
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const saved = localStorage.getItem("bgg-sortDirection");
    if (saved) return saved === 'desc' ? 'desc' : 'asc';

    // Set default direction based on sort option
    const defaults: Record<SortOption, SortDirection> = {
      'user-rating': 'desc',
      'rating': 'desc',
      'name': 'asc',
      'year': 'desc',
      'complexity': 'asc',
      'plays': 'desc',
      'last-played': 'desc',
      'random': 'desc', // fallback, not used
    };

    return defaults[initialSortBy] || 'desc';
  });

  // Fetch collection from BGG API
  const {
    data: bggCollection,
    isLoading: isLoadingCollection,
    error: collectionError,
    refetch: refetchCollection,
  } = useUserCollection(username, !!username);

  // Fetch detailed game info for better data (categories, mechanics, weight, etc.)
  const gameIds = useMemo(() => {
    return bggCollection?.map((game) => game.objectid) || [];
  }, [bggCollection]);

  const { data: gamesInfo, isLoading: isLoadingGamesInfo } = useGamesInfo(gameIds, gameIds.length > 0);

  // Fetch user plays to get lastPlayed dates
  const { data: plays } = useUserPlays(username, !!username);

  // Convert BGG collection to our Game format and merge with detailed info
  const games = useMemo(() => {
    if (!bggCollection) return [];

    let games = mapCollectionToGames(bggCollection);

    if (gamesInfo && gamesInfo.length > 0) {
      games = mergeGamesInfo(games, gamesInfo);
    }

    if (plays && plays.length > 0) {
      games = mergePlays(games, plays);
    }

    return games;
  }, [bggCollection, gamesInfo, plays]);

  const randomSortKey = useMemo(() => {
    const keyMap = new Map<string, number>();
    if (games.length === 0) return keyMap;
    const seed = randomSeed;
    const hashId = (id: string) => {
      let h = seed;
      for (let i = 0; i < id.length; i++) {
        h = Math.imul(31, h) + id.charCodeAt(i);
        h |= 0;
      }
      h ^= h >>> 16;
      h = Math.imul(h, 0x85ebca6b);
      h ^= h >>> 13;
      return h >>> 0;
    };

    games.forEach((game) => {
      keyMap.set(game.id, hashId(game.id));
    });

    return keyMap;
  }, [games, randomSeed]);

  // Extract all unique categories from games
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    games.forEach((game) => {
      game.categories?.forEach((cat) => categorySet.add(cat));
    });
    return Array.from(categorySet).sort();
  }, [games]);

  // Handle category click from game card
  const handleCategoryClick = (category: string) => {
    setFilters({
      ...filters,
      category: filters.category === category ? null : category,
    });
  };

  // Handle reshuffle for random sort
  const handleReshuffle = () => {
    const newSeed = Date.now();
    localStorage.setItem("bgg-random-seed", String(newSeed));
    setRandomSeed(newSeed);
  };

  const handleRefreshCollection = () => {
    handleReshuffle();
    refetchCollection();
  };

  // Handle sort direction toggle
  const handleSortDirectionToggle = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handlePickRandom = () => {
    if (filteredAndSortedGames.length === 0) return;

    const game = pickWeightedRandomGame(filteredAndSortedGames);
    setPickedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePickAnother = () => {
    if (filteredAndSortedGames.length === 0) return;

    // If there's only 1 game, we can't avoid picking it again
    if (filteredAndSortedGames.length === 1) {
      setPickedGame(filteredAndSortedGames[0]);
      return;
    }

    // Filter out the current game by collectionId so we don't pick it again
    // (use collectionId instead of id because multiple collection entries can share the same game id)
    const availableGames = filteredAndSortedGames.filter(g => g.collectionId !== pickedGame?.collectionId);

    // Pick from the filtered list
    const game = pickWeightedRandomGame(availableGames);
    setPickedGame(game);
  };

  // Validate username from URL - always validate when URL username is present
  const { data: userInfo, error: validationError } = useValidateUsername(
    urlUsername || "",
    !!(urlUsername)
  );

  // Redirect to home if validation fails
  useEffect(() => {
    if (validationError && urlUsername) {
      navigate(`/?username=${urlUsername}`);
    }
  }, [validationError, urlUsername, navigate]);

  // Store user info if validation succeeds
  useEffect(() => {
    if (userInfo && urlUsername) {
      localStorage.setItem("bgg-username", urlUsername);
      localStorage.setItem("bgg-user-id", userInfo.id);
    }
  }, [userInfo, urlUsername]);

  useEffect(() => {
    // Prioritize URL username, fall back to localStorage
    const targetUsername = urlUsername || localStorage.getItem("bgg-username");

    if (!targetUsername) {
      navigate("/");
      return;
    }

    // Sync localStorage and state
    localStorage.setItem("bgg-username", targetUsername);
    setUsername(targetUsername);
  }, [urlUsername, navigate]);

  useEffect(() => {
    localStorage.setItem("bgg-filters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem("bgg-sortBy", sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem("bgg-sortDirection", sortDirection);
  }, [sortDirection]);

  // Redirect to home with username if collection fails to load
  useEffect(() => {
    if (collectionError && username) {
      // Check if error is a 404 or indicates user not found
      const errorMessage = collectionError instanceof Error ? collectionError.message : String(collectionError);
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        navigate(`/?username=${username}`);
      }
    }
  }, [collectionError, username, navigate]);

  const filteredAndSortedGames = useMemo(() => {
    let gamesList = [...games];

    // Apply filters
    if (filters.playerCount !== null) {
      gamesList = gamesList.filter((game) => {
        return (
          game.players.min <= filters.playerCount! &&
          game.players.max >= filters.playerCount!
        );
      });
    }

    if (filters.minPlaytime !== null) {
      gamesList = gamesList.filter(
        (game) => game.playtime.max >= filters.minPlaytime!
      );
    }

    if (filters.maxPlaytime !== null) {
      gamesList = gamesList.filter(
        (game) => game.playtime.min <= filters.maxPlaytime!
      );
    }

    // Filter by category
    if (filters.category) {
      gamesList = gamesList.filter((game) => {
        return game.categories?.includes(filters.category!);
      });
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      gamesList = gamesList.filter((game) => {
        return game.name.toLowerCase().includes(query);
      });
    }

    // Apply sorting
    const sortFunctions: Record<
      SortOption,
      (a: Game, b: Game) => number
    > = {
      "rating": (a, b) => {
        const comparison = b.rating.average - a.rating.average;
        return sortDirection === 'desc' ? comparison : -comparison;
      },
      "name": (a, b) => {
        const comparison = b.name.localeCompare(a.name);
        return sortDirection === 'desc' ? comparison : -comparison;
      },
      "year": (a, b) => {
        const comparison = b.yearPublished - a.yearPublished;
        return sortDirection === 'desc' ? comparison : -comparison;
      },
      "complexity": (a, b) => {
        const comparison = (a.weight || 0) - (b.weight || 0);
        return sortDirection === 'asc' ? comparison : -comparison;
      },
      "plays": (a, b) => {
        const comparison = b.numPlays - a.numPlays;
        if (comparison !== 0) return sortDirection === 'desc' ? comparison : -comparison;
        // Tiebreaker: sort by last played (respects direction)
        // desc: most, least, never (newest -> oldest)
        // asc: never, least, most (oldest -> newest)
        if (!a.lastPlayed && !b.lastPlayed) return 0;
        if (!a.lastPlayed) return sortDirection === 'desc' ? 1 : -1;
        if (!b.lastPlayed) return sortDirection === 'desc' ? -1 : 1;
        const lastPlayedComparison = b.lastPlayed.getTime() - a.lastPlayed.getTime();
        return sortDirection === 'desc' ? lastPlayedComparison : -lastPlayedComparison;
      },
      "user-rating": (a, b) => {
        const comparison = (b.userRating || 0) - (a.userRating || 0);
        return sortDirection === 'desc' ? comparison : -comparison;
      },
      "last-played": (a, b) => {
        // Sort by lastPlayed date with direction support
        // desc: recent, least recent, never
        // asc: never, least recent, recent
        if (!a.lastPlayed && !b.lastPlayed) return 0;
        if (!a.lastPlayed) return sortDirection === 'desc' ? 1 : -1;
        if (!b.lastPlayed) return sortDirection === 'desc' ? -1 : 1;
        const comparison = b.lastPlayed.getTime() - a.lastPlayed.getTime();
        return sortDirection === 'desc' ? comparison : -comparison;
      },
      "random": (a, b) => {
        const aKey = randomSortKey.get(a.id) ?? 0;
        const bKey = randomSortKey.get(b.id) ?? 0;
        // If games have the same random key (same objectid), sort by collectionId for consistency
        if (aKey === bKey) {
          return a.collectionId.localeCompare(b.collectionId);
        }
        return aKey - bKey;
      },
    };

    // Only sort if we have a valid sort function, otherwise keep original order
    const sortFn = sortFunctions[sortBy];
    if (sortFn) {
      gamesList = [...gamesList].sort(sortFn);
    }

    return gamesList;
  }, [games, filters, sortBy, sortDirection, randomSeed, randomSortKey]);

  // Loading state
  if (!username) {
    return null; // Will redirect in useEffect
  }

  // Show loading if we're fetching collection OR if we have a category filter and gamesInfo is still loading
  // (because we need categories to properly filter)
  const isLoadingRequiredData = isLoadingCollection || (filters.category && isLoadingGamesInfo && bggCollection);

  if (isLoadingRequiredData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-xl text-muted-foreground font-display">
            {isLoadingCollection ? 'Loading your collection...' : 'Loading game details...'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isLoadingCollection ? 'This may take a moment for large collections' : 'Fetching categories and mechanics'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (collectionError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-xl text-destructive font-display mb-4">
            Failed to load collection
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {collectionError instanceof Error
              ? collectionError.message
              : "An error occurred while fetching your collection from BoardGameGeek"}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleRefreshCollection}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/?username=${username}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty collection state
  if (games.length === 0) {
    // Show loading state while fetching
    if (isLoadingCollection || isLoadingGamesInfo) {
      return (
        <div className="min-h-screen bg-background">
          <FilterHeader
            username={username}
            filters={filters}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onFiltersChange={setFilters}
            onSortChange={setSortBy}
            onSortDirectionToggle={handleSortDirectionToggle}
            totalGames={0}
            filteredCount={0}
            onPickRandom={handlePickRandom}
          />
          <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
            <div className="text-center max-w-md">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-xl text-muted-foreground font-display mb-4">
                Loading your collection...
              </p>
              <p className="text-sm text-muted-foreground">
                This may take a moment for large collections
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Show empty state after loading is complete
    return (
      <div className="min-h-screen bg-background">
        <FilterHeader
          username={username}
          filters={filters}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onFiltersChange={setFilters}
          onSortChange={setSortBy}
          onSortDirectionToggle={handleSortDirectionToggle}
          totalGames={0}
          filteredCount={0}
          onPickRandom={handlePickRandom}
        />
        <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
          <div className="text-center max-w-md">
            <p className="text-xl text-muted-foreground font-display mb-4">
              No games found in your collection
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Make sure you have marked games as "owned" on BoardGameGeek.
              Expansions are automatically excluded.
            </p>
            <Button
              onClick={handleRefreshCollection}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Collection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FilterHeader
        username={username}
        filters={filters}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onFiltersChange={setFilters}
        onSortChange={setSortBy}
        onSortDirectionToggle={handleSortDirectionToggle}
        totalGames={games.length}
        filteredCount={filteredAndSortedGames.length}
        availableCategories={availableCategories}
        onReshuffle={sortBy === "random" ? handleReshuffle : undefined}
        onPickRandom={handlePickRandom}
      />

      <main className="w-full px-4 py-8">
        {filteredAndSortedGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {filteredAndSortedGames.map((game, index) => (
              <GameCard
                key={game.collectionId}
                game={game}
                index={index}
                sortBy={sortBy}
                onCategoryClick={handleCategoryClick}
                selectedCategory={filters.category}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground font-display">
              No games match your filters
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </main>

      <Footer />

      <GameModal
        game={pickedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onPickAnother={handlePickAnother}
        bggUsername={username}
      />
    </div>
  );
};

export default Collection;
