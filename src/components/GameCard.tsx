import { Game } from "@/types/game";
import { Star, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface GameCardProps {
  game: Game;
  index: number;
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string | null;
}

export function GameCard({ game, index, onCategoryClick, selectedCategory }: GameCardProps) {
  const formatPlaytime = (min: number, max: number) => {
    if (min === max) return `${min}m`;
    return `${min}-${max}m`;
  };

  const formatPlayers = (min: number, max: number) => {
    if (min === max) return `${min}`;
    return `${min}-${max}`;
  };

  return (
    <Link
      to={`/game/${game.id}`}
      className="group block"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <article className="relative bg-card rounded-sm overflow-hidden border-[3px] border-[transparent] shadow-card hover:shadow-card-hover hover:border-primary/90 transition-all duration-300 animate-slide-up aspect-square">
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

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white dark:bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 z-10">
          <Star className="w-3 h-3 fill-gold text-gold" />
          <span className="text-xs font-semibold text-card-foreground dark:text-white">
            {game.rating.average.toFixed(1)}
          </span>
        </div>

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
            {game.numPlays > 0 && (
              <div className="ml-auto">
                <span className="text-primary font-medium">{game.numPlays}×</span>
              </div>
            )}
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
