import { useParams, Link, useSearchParams } from "react-router-dom";
import { useGameInfo, useGamePlays } from "@/hooks/use-bgg-api";
import { gameInfoToGame } from "@/lib/game-mapper";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Star, Users, Clock, BarChart3, Trophy, Calendar, Hash, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

const GameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const bggUsername = searchParams.get('username') || localStorage.getItem('bgg-username') || '';

  const { data: gameInfo, isLoading, error } = useGameInfo(id || "", !!id);
  const { data: plays } = useGamePlays(bggUsername, id || "", !!bggUsername && !!id);

  // Merge game info with plays data
  const game = useMemo(() => {
    if (!gameInfo) return undefined;

    const baseGame = gameInfoToGame(gameInfo);

    if (!plays || plays.length === 0) {
      return baseGame;
    }

    // Calculate total plays from quantity
    const totalPlays = plays.reduce((sum, play) => sum + play.quantity, 0);

    // Find most recent play date
    const mostRecentPlay = plays.reduce((latest, play) => {
      return play.date > latest ? play.date : latest;
    }, new Date(0));

    return {
      ...baseGame,
      numPlays: totalPlays,
      lastPlayed: mostRecentPlay.getTime() > 0 ? mostRecentPlay : undefined,
    };
  }, [gameInfo, plays]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-xl text-muted-foreground font-display">
            Loading game details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Game Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "The game you're looking for doesn't exist."}
          </p>
          <Link to="/collection">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collection
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const formatPlaytime = (min: number, max: number) => {
    if (min === max) return `${min} min`;
    return `${min}-${max} min`;
  };

  const formatPlayers = (min: number, max: number) => {
    if (min === max) return `${min} player${min > 1 ? "s" : ""}`;
    return `${min}-${max} players`;
  };

  const getComplexityLabel = (weight: number) => {
    if (weight < 2) return "Light";
    if (weight < 3) return "Medium Light";
    if (weight < 3.5) return "Medium";
    if (weight < 4) return "Medium Heavy";
    return "Heavy";
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link to="/collection" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border-0 rounded-full shadow-none text-primary font-medium text-base hover:bg-secondary/80 transition-colors focus:ring-0 focus:ring-offset-0 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-sm">Back to Collection</span>
        </Link>

        <div className="grid lg:grid-cols-[400px_1fr] gap-8 animate-fade-in">
          {/* Game Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary border border-border">
              <img
                src={game.image}
                alt={game.name}
                className="w-full h-full object-cover"
              />
              {game.rating.rank && game.rating.rank <= 100 && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  #{game.rating.rank} Overall
                </div>
              )}
            </div>

            {/* User Stats Card */}
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-semibold text-base mb-3">Your Stats</h3>
              <div className="space-y-3">
                {game.userRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      <span className="font-semibold">{game.userRating}/10</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Times Played</span>
                  <span className="font-semibold">{game.numPlays}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Played</span>
                  <span className="font-semibold text-sm">
                    {formatDate(game.lastPlayed)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="space-y-6">
            {/* Title Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {game.name}
                </h1>
                <p className="text-xl text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {game.yearPublished}
                  {game.designers && game.designers.length > 0 && (
                    <>
                      <span className="text-border">•</span>
                      <span>by {game.designers.join(", ")}</span>
                    </>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                asChild
              >
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Board Game Geek
                </a>
              </Button>
            </div>

            {/* Rating Section */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 bg-card px-4 py-3 rounded-xl border border-border">
                <Star className="w-6 h-6 fill-gold text-gold" />
                <div>
                  <div className="text-2xl font-bold">{game.rating.average.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    {game.rating.usersRated.toLocaleString()} ratings
                  </div>
                </div>
              </div>
              {game.rating.rank && (
                <div className="flex items-center gap-2 bg-card px-4 py-3 rounded-xl border border-border">
                  <Hash className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">#{game.rating.rank}</div>
                    <div className="text-xs text-muted-foreground">Overall Rank</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{formatPlayers(game.players.min, game.players.max)}</div>
                <div className="text-xs text-muted-foreground">Players</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{formatPlaytime(game.playtime.min, game.playtime.max)}</div>
                <div className="text-xs text-muted-foreground">Playtime</div>
              </div>
              {game.weight && (
                <div className="bg-card rounded-xl p-4 border border-border text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="font-semibold">{game.weight.toFixed(2)}/5</div>
                  <div className="text-xs text-muted-foreground">{getComplexityLabel(game.weight)}</div>
                </div>
              )}
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{game.numOwned.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Owners</div>
              </div>
            </div>

            {/* Description */}
            {game.description && (
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{game.description}</p>
              </div>
            )}

            {/* Categories & Mechanics */}
            <div className="grid sm:grid-cols-2 gap-6">
              {game.categories && game.categories.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.categories.map((category) => (
                      <Link
                        key={category}
                        to="/collection"
                        state={{ category }}
                        onClick={() => {
                          // Set the filter in localStorage
                          const currentFilters = JSON.parse(localStorage.getItem('bgg-filters') || '{}');
                          localStorage.setItem('bgg-filters', JSON.stringify({
                            ...currentFilters,
                            category: category
                          }));
                        }}
                      >
                        <Badge
                          variant="secondary"
                          className="font-normal rounded-full cursor-pointer hover:bg-pink-500 hover:text-white transition-colors"
                        >
                          {category}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {game.mechanics && game.mechanics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Mechanics</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.mechanics.map((mechanic) => (
                      <Badge key={mechanic} variant="outline" className="font-normal rounded-full">
                        {mechanic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GameDetail;
