import { Game, SortOption } from "@/types/game";
import { Star, Users, Clock, Heart, TrendingUp, Calendar, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface GameCardProps {
  game: Game;
  index: number;
  sortBy?: SortOption;
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string | null;
}

export function GameCard({ game, index, sortBy, onCategoryClick, selectedCategory }: GameCardProps) {
  const formatPlaytime = (min: number, max: number) => {
    if (min === max) return `${min}m`;
    return `${min}-${max}m`;
  };

  const formatPlayers = (min: number, max: number) => {
    if (min === max) return `${min}`;
    return `${min}-${max}`;
  };

  // Determine what to show in the top-right badge based on current sort
  const getSortBadge = () => {
    switch (sortBy) {
      case 'rating':
        return {
          icon: <Star className="w-3 h-3 fill-gold text-gold" />,
          value: game.rating.average.toFixed(1),
        };
      case 'user-rating':
        if (game.userRating) {
          return {
            icon: <Heart className="w-3 h-3 fill-red-500 text-red-500" />,
            value: game.userRating.toFixed(1),
          };
        }
        break;
      case 'complexity':
        if (game.weight) {
          return {
            icon: <TrendingUp className="w-3 h-3" />,
            value: game.weight.toFixed(1),
          };
        }
        break;
      case 'plays':
        if (game.numPlays > 0) {
          return {
            icon: <RotateCcw className="w-3 h-3" />,
            value: `${game.numPlays}×`,
          };
        }
        break;
      case 'last-played':
        if (game.lastPlayed) {
          const daysAgo = Math.floor((Date.now() - game.lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo === 0) {
            return { icon: <Calendar className="w-3 h-3" />, value: 'Today' };
          } else if (daysAgo === 1) {
            return { icon: <Calendar className="w-3 h-3" />, value: 'Yesterday' };
          } else if (daysAgo < 7) {
            return { icon: <Calendar className="w-3 h-3" />, value: `${daysAgo}d ago` };
          } else if (daysAgo < 30) {
            const weeks = Math.floor(daysAgo / 7);
            return { icon: <Calendar className="w-3 h-3" />, value: `${weeks}w ago` };
          } else {
            const months = Math.floor(daysAgo / 30);
            return { icon: <Calendar className="w-3 h-3" />, value: `${months}mo ago` };
          }
        }
        break;
    }
    // For 'name', 'year', 'random' - no badge shown
    return null;
  };

  const badge = getSortBadge();

  return (
    <Link
      to={`/game/${game.id}`}
      state={{ collectionGame: game }}
      className="group block"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <article className="relative bg-card rounded-sm overflow-hidden border-[3px] border-[transparent] shadow-card hover:shadow-card-hover hover:border-primary/90 transition-all duration-300 animate-slide-up aspect-[2/1] sm:aspect-[4/3] lg:aspect-square">
        {/* Image Container - Full height */}
        <div className="absolute inset-0 overflow-hidden bg-secondary">
          <img
            src={game.image}
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            style={{ objectPosition: 'center center' }}
          />
        </div>

        {/* Sort Badge - shows based on current sort */}
        {badge && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white dark:bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 z-10">
            {badge.icon}
            <span className="text-xs font-semibold text-card-foreground dark:text-white">
              {badge.value}
            </span>
          </div>
        )}

        {/* Rank Badge */}
        {game.rating.rank && game.rating.rank <= 100 && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full z-10">
            #{game.rating.rank}
          </div>
        )}

        {/* Semi-transparent overlay at bottom for content */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-black/95 dark:via-black/70 dark:to-transparent z-10">
          {/* Title in dark pill */}
          <div className="inline-block bg-black/80 backdrop-blur-sm rounded-r-full pl-0 pr-4 py-2 mb-2 -ml-4 group-hover:bg-primary/90 transition-colors dark:bg-black/80 bg-white dark:text-white text-card-foreground">
            <h3 className="font-semibold text-base leading-tight line-clamp-1 pl-4 dark:text-white text-card-foreground">
              {game.name}
            </h3>
          </div>

          {/* Meta Info - Year, Players, and Playtime in same row */}
          <div className="flex items-center gap-3 text-sm dark:text-white/90 text-black mb-2">
            <span>{game.yearPublished}</span>
            <span className="w-1 h-1 rounded-full dark:bg-white/40 bg-card-foreground/40" />
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{formatPlayers(game.players.min, game.players.max)}</span>
            </div>
            <span className="w-1 h-1 rounded-full dark:bg-white/40 bg-card-foreground/40" />
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatPlaytime(game.playtime.min, game.playtime.max)}</span>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1 min-h-[20px]">
            {game.categories && game.categories.length > 0 && (
              <>
                {game.categories.slice(0, 3).map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onCategoryClick) onCategoryClick(category);
                      }}
                      style={{
                        fontSize: '10px',
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        paddingTop: '2px',
                        paddingBottom: '2px',
                        borderRadius: '9999px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        backgroundColor: isSelected ? 'rgb(236 72 153)' : undefined,
                        color: isSelected ? 'white' : 'inherit',
                      }}
                      className="bg-white/40 dark:bg-black/40"
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgb(236 72 153)';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.color = '';
                        }
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
                {game.categories.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                    +{game.categories.length - 3}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
