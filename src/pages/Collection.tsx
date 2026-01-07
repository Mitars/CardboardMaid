import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameCard } from "@/components/GameCard";
import { FilterHeader } from "@/components/FilterHeader";
import { Footer } from "@/components/Footer";
import { FilterState, SortOption, Game } from "@/types/game";
import { useUserCollection, useGamesInfo, useValidateUsername } from "@/hooks/use-bgg-api";
import { mapCollectionToGames, mergeGamesInfo } from "@/lib/game-mapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

const Collection = () => {
  const navigate = useNavigate();
  const { username: urlUsername } = useParams();
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
        };
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    return (localStorage.getItem("bgg-sortBy") as SortOption) || "rating-high";
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

  // Convert BGG collection to our Game format and merge with detailed info
  const games = useMemo(() => {
    if (!bggCollection) return [];

    let games = mapCollectionToGames(bggCollection);

    if (gamesInfo && gamesInfo.length > 0) {
      games = mergeGamesInfo(games, gamesInfo);
    }

    return games;
  }, [bggCollection, gamesInfo]);

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

  // Handle clearing category filter
  const handleClearCategory = () => {
    setFilters({
      ...filters,
      category: null,
    });
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

    // Apply sorting
    const sortFunctions: Record<
      SortOption,
      (a: Game, b: Game) => number
    > = {
      "rating-high": (a, b) => b.rating.average - a.rating.average,
      "rating-low": (a, b) => a.rating.average - b.rating.average,
      "name-asc": (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
      "year-new": (a, b) => b.yearPublished - a.yearPublished,
      "year-old": (a, b) => a.yearPublished - b.yearPublished,
      "complexity-high": (a, b) => (b.weight || 0) - (a.weight || 0),
      "complexity-low": (a, b) => (a.weight || 5) - (b.weight || 5),
      "plays-high": (a, b) => b.numPlays - a.numPlays,
      "plays-low": (a, b) => a.numPlays - b.numPlays,
      "user-rating": (a, b) => (b.userRating || 0) - (a.userRating || 0),
    };

    gamesList.sort(sortFunctions[sortBy]);

    return gamesList;
  }, [games, filters, sortBy]);

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
              onClick={() => refetchCollection()}
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
            onFiltersChange={setFilters}
            onSortChange={setSortBy}
            totalGames={0}
            filteredCount={0}
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
          onFiltersChange={setFilters}
          onSortChange={setSortBy}
          totalGames={0}
          filteredCount={0}
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
              onClick={() => refetchCollection()}
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
        onFiltersChange={setFilters}
        onSortChange={setSortBy}
        totalGames={games.length}
        filteredCount={filteredAndSortedGames.length}
        availableCategories={availableCategories}
      />

      <main className="w-full px-4 py-8">
        {filteredAndSortedGames.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {filteredAndSortedGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
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
    </div>
  );
};

export default Collection;
